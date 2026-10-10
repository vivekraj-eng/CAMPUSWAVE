import { Room, RoomEvent, createLocalAudioTrack, Track } from 'livekit-client';
import { supabase } from './supabase';
import { radioService } from './radio-service';

/**
 * CampusWave Live Audio Service (LiveKit WebRTC Integration)
 * 
 * Manages:
 * 1. Broadcaster (RJ) microphone capture, live publishing, and VU metering
 * 2. Listener WebRTC audio subscribing, playback, and live waveform analysis
 * 3. Real broadcast state synchronization with Supabase radio_now_playing
 */
class LiveAudioService {
  constructor() {
    this.publisherRoom = null;
    this.localAudioTrack = null;
    this.subscriberRoom = null;
    this.subscribedTrack = null;
    this.audioElement = null;

    // Web Audio for VU meters & visualizers
    this.audioCtx = null;
    this.micAnalyser = null;
    this.rxAnalyser = null;
    this.micSourceNode = null;
    this.rxSourceNode = null;
    this.dataArray = new Uint8Array(32);

    // Broadcaster states: 'idle' | 'requesting_mic' | 'mic_ready' | 'connecting' | 'live' | 'error'
    this.broadcasterState = 'idle';
    this.isMuted = false;
    this.broadcastStartTime = null;
    this.broadcasterError = null;
    this.connectionStatus = 'standby';
    this.listenerCount = null;

    // Listener states: 'idle' | 'connecting' | 'waiting_for_broadcaster' | 'listening' | 'autoplay_blocked' | 'offline' | 'error'
    this.listenerState = 'idle';
    this.listenerError = null;
    this.isConnectingListener = false;
    this.volume = 0.8;
    this.isListenerMuted = false;

    this.listeners = new Set();

    // Clean disconnect on tab close/unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        if (this.broadcasterState === 'live') {
          this.stopBroadcast();
        }
      });
    }
  }

  subscribe(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  notify() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.getSnapshot());
      } catch (e) {
        console.warn('LiveAudioService listener notification error:', e);
      }
    });
  }

  getSnapshot() {
    return {
      broadcasterState: this.broadcasterState,
      isMuted: this.isMuted,
      broadcastStartTime: this.broadcastStartTime,
      broadcasterError: this.broadcasterError,
      connectionStatus: this.connectionStatus,
      listenerCount: this.listenerCount,
      listenerState: this.listenerState,
      listenerError: this.listenerError,
      volume: this.volume,
      isListenerMuted: this.isListenerMuted,
      isConnectingListener: this.isConnectingListener,
      isLivePublishing: this.broadcasterState === 'live',
      isLiveListening: this.listenerState === 'listening'
    };
  }

  // =========================================================================
  // Token Generation Client Helper
  // =========================================================================
  async fetchLiveKitToken(action, sessionToken = null, showTitle = '') {
    const headers = { 'Content-Type': 'application/json' };
    if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`;
    }

    try {
      const response = await fetch('/.netlify/functions/livekit-token', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action, showTitle })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Token generation failed (${response.status})`);
      }
      return data;
    } catch (err) {
      // In local development or before Netlify function is deployed, handle gracefully
      throw err;
    }
  }

  // =========================================================================
  // Broadcaster (RJ) Lifecycle
  // =========================================================================

  /**
   * Request microphone permission and prepare local preview VU meter
   */
  async requestMicrophone() {
    this.broadcasterState = 'requesting_mic';
    this.broadcasterError = null;
    this.notify();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported by your browser or environment (requires HTTPS).');
      }

      // Create high-quality radio track with echo cancellation & noise suppression
      this.localAudioTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });

      // Hook up Web Audio for live microphone meter
      this.setupMicAnalyser(this.localAudioTrack.mediaStreamTrack);

      this.broadcasterState = 'mic_ready';
      this.isMuted = false;
      this.notify();
      return { success: true };
    } catch (err) {
      console.error('Microphone request error:', err);
      this.broadcasterState = 'error';
      this.broadcasterError = err.message || 'Microphone access denied or unavailable.';
      this.notify();
      return { success: false, error: this.broadcasterError };
    }
  }

  setupMicAnalyser(mediaStreamTrack) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const stream = new MediaStream([mediaStreamTrack]);
      this.micSourceNode = this.audioCtx.createMediaStreamSource(stream);
      this.micAnalyser = this.audioCtx.createAnalyser();
      this.micAnalyser.fftSize = 64;
      this.micSourceNode.connect(this.micAnalyser);
    } catch (err) {
      console.warn('Web Audio mic analyser setup error:', err);
    }
  }

  /**
   * Get current microphone input level (0 to 100) from physical audio
   */
  getMicLevel() {
    if (!this.micAnalyser || this.isMuted || !this.localAudioTrack) return 0;
    try {
      const freqData = new Uint8Array(this.micAnalyser.frequencyBinCount);
      this.micAnalyser.getByteFrequencyData(freqData);
      let sum = 0;
      for (let i = 0; i < freqData.length; i++) {
        sum += freqData[i];
      }
      const avg = sum / freqData.length;
      return Math.min(100, Math.round((avg / 255) * 100 * 1.5));
    } catch {
      return 0;
    }
  }

  /**
   * Start Live Broadcaster Session
   * Publishes RJ microphone to LiveKit Cloud & updates Supabase radio_now_playing
   */
  async startBroadcast({ user, profile, showTitle = 'Live Session' }) {
    if (!this.localAudioTrack) {
      const micRes = await this.requestMicrophone();
      if (!micRes.success) return micRes;
    }

    this.broadcasterState = 'connecting';
    this.broadcasterError = null;
    this.notify();

    try {
      // 1. Check if another broadcast is already active in database
      const currentLive = await radioService.getNowPlaying();
      if (currentLive?.is_live) {
        const activeRj = currentLive.current_rj || 'Another RJ';
        const isSelf = currentLive.current_rj === (profile?.full_name || '');
        if (!isSelf) {
          throw new Error(`Broadcast is currently in progress by ${activeRj}. CampusWave supports one active live studio session at a time.`);
        }
      }

      // 2. Obtain Broadcaster Token from secure Netlify function
      const { data: { session } } = await supabase.auth.getSession();
      const tokenData = await this.fetchLiveKitToken('publish', session?.access_token, showTitle);

      // 3. Connect to LiveKit Room
      this.publisherRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      this.publisherRoom.on(RoomEvent.Connected, () => {
        this.connectionStatus = 'connected';
        this.listenerCount = this.publisherRoom.remoteParticipants.size;
        this.notify();
      });

      this.publisherRoom.on(RoomEvent.Reconnecting, () => {
        this.connectionStatus = 'reconnecting';
        this.notify();
      });

      this.publisherRoom.on(RoomEvent.Reconnected, () => {
        this.connectionStatus = 'connected';
        this.listenerCount = this.publisherRoom.remoteParticipants.size;
        this.notify();
      });

      this.publisherRoom.on(RoomEvent.ParticipantConnected, () => {
        this.listenerCount = this.publisherRoom.remoteParticipants.size;
        this.notify();
        radioService.updateNowPlaying({ listener_count: Math.max(1, this.listenerCount + 1) }).catch(() => {});
      });

      this.publisherRoom.on(RoomEvent.ParticipantDisconnected, () => {
        this.listenerCount = this.publisherRoom.remoteParticipants.size;
        this.notify();
        radioService.updateNowPlaying({ listener_count: Math.max(1, this.listenerCount + 1) }).catch(() => {});
      });

      this.publisherRoom.on(RoomEvent.Disconnected, () => {
        this.connectionStatus = 'disconnected';
        if (this.broadcasterState === 'live') {
          this.stopBroadcast();
        }
      });

      await this.publisherRoom.connect(tokenData.url, tokenData.token);

      // 4. Publish real microphone track to room
      await this.publisherRoom.localParticipant.publishTrack(this.localAudioTrack);

      // 5. Update station metadata in database
      const rjName = profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'CampusWave RJ');
      await radioService.updateNowPlaying({
        is_live: true,
        current_rj: rjName,
        current_show_title: showTitle || 'Live Radio Broadcast',
        stream_url: 'livekit',
        listener_count: 1
      });

      this.broadcasterState = 'live';
      this.connectionStatus = 'connected';
      this.listenerCount = this.publisherRoom.remoteParticipants.size;
      this.broadcastStartTime = Date.now();
      this.notify();

      return { success: true };
    } catch (err) {
      console.error('Failed to start broadcast:', err);
      this.broadcasterState = 'error';
      this.connectionStatus = 'error';
      this.broadcasterError = err.message || 'Could not connect to broadcast room.';
      this.notify();
      return { success: false, error: this.broadcasterError };
    }
  }

  /**
   * Toggle hardware microphone mute/unmute
   */
  toggleMute() {
    if (!this.localAudioTrack) return;
    if (this.isMuted) {
      this.localAudioTrack.unmute();
      this.isMuted = false;
    } else {
      this.localAudioTrack.mute();
      this.isMuted = true;
    }
    this.notify();
    return this.isMuted;
  }

  /**
   * Stop Broadcaster Session
   */
  async stopBroadcast() {
    try {
      if (this.localAudioTrack) {
        if (this.publisherRoom) {
          await this.publisherRoom.localParticipant.unpublishTrack(this.localAudioTrack).catch(() => {});
        }
        this.localAudioTrack.stop();
        this.localAudioTrack = null;
      }

      if (this.publisherRoom) {
        await this.publisherRoom.disconnect();
        this.publisherRoom = null;
      }

      // Reset station metadata in database
      await radioService.updateNowPlaying({
        is_live: false,
        stream_url: null,
        current_track: null,
        current_artist: null,
        listener_count: 0
      }).catch(() => {});
    } catch (err) {
      console.warn('Error during stopBroadcast cleanup:', err);
    } finally {
      this.broadcasterState = 'idle';
      this.connectionStatus = 'standby';
      this.listenerCount = null;
      this.broadcastStartTime = null;
      this.isMuted = false;
      this.broadcasterError = null;
      this.notify();
    }
  }

  // =========================================================================
  // Listener Lifecycle
  // =========================================================================

  /**
   * Connect listener to LiveKit Room and play live RJ audio
   */
  async startListening() {
    if (this.isConnectingListener) return;
    if (this.subscriberRoom && (this.listenerState === 'listening' || this.listenerState === 'waiting_for_broadcaster')) {
      return;
    }

    this.isConnectingListener = true;
    this.listenerState = 'connecting';
    this.listenerError = null;
    this.notify();

    // 1. Prime Audio Element and Web Audio Context synchronously in user gesture
    try {
      if (!this.audioElement) {
        this.audioElement = new Audio();
        this.audioElement.autoplay = true;
        document.body.appendChild(this.audioElement);
      }
      this.audioElement.volume = this.volume !== undefined ? this.volume : 0.8;
      this.audioElement.muted = Boolean(this.isListenerMuted);

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioCtx) this.audioCtx = new AudioCtx();
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
      }
      // Prime playback permission
      this.audioElement.play().catch(() => {});
    } catch (e) {
      console.warn('Audio priming warning:', e);
    }

    try {
      if (this.subscriberRoom) {
        await this.stopListening();
      }

      // 2. Fetch Subscriber-only token
      const tokenData = await this.fetchLiveKitToken('subscribe');

      // 3. Connect to LiveKit Room as subscriber
      this.subscriberRoom = new Room({
        adaptiveStream: true,
        dynacast: true
      });

      this.subscriberRoom.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          this.attachListenerAudio(track);
        }
      });

      this.subscriberRoom.on(RoomEvent.TrackUnsubscribed, (track) => {
        if (this.audioElement) {
          track.detach(this.audioElement);
        }
        this.subscribedTrack = null;
        this.checkRemainingAudioTracks();
      });

      this.subscriberRoom.on(RoomEvent.ParticipantDisconnected, () => {
        this.checkRemainingAudioTracks();
      });

      this.subscriberRoom.on(RoomEvent.Disconnected, () => {
        this.listenerState = 'idle';
        this.subscribedTrack = null;
        this.notify();
      });

      await this.subscriberRoom.connect(tokenData.url, tokenData.token);

      // 4. Check if an audio track is already published
      let foundAudio = false;
      if (this.subscriberRoom.remoteParticipants) {
        for (const participant of this.subscriberRoom.remoteParticipants.values()) {
          for (const publication of participant.trackPublications.values()) {
            if (publication.track && publication.track.kind === Track.Kind.Audio) {
              this.attachListenerAudio(publication.track);
              foundAudio = true;
              break;
            }
          }
          if (foundAudio) break;
        }
      }

      if (!foundAudio) {
        this.listenerState = 'waiting_for_broadcaster';
        this.notify();
      }

      this.isConnectingListener = false;
      return { success: true };
    } catch (err) {
      console.error('Failed to connect listener to LiveKit room:', err);
      this.isConnectingListener = false;
      this.listenerState = 'error';
      this.listenerError = err.message || 'Live radio audio stream currently unavailable.';
      this.notify();
      return { success: false, error: this.listenerError };
    }
  }

  checkRemainingAudioTracks() {
    if (!this.subscriberRoom) {
      this.listenerState = 'idle';
      this.notify();
      return;
    }
    let found = false;
    if (this.subscriberRoom.remoteParticipants) {
      for (const p of this.subscriberRoom.remoteParticipants.values()) {
        for (const pub of p.trackPublications.values()) {
          if (pub.track && pub.track.kind === Track.Kind.Audio) {
            this.attachListenerAudio(pub.track);
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }
    if (!found) {
      this.listenerState = 'waiting_for_broadcaster';
      this.notify();
    }
  }

  attachListenerAudio(track) {
    this.subscribedTrack = track;

    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.autoplay = true;
      document.body.appendChild(this.audioElement);
    }

    this.audioElement.volume = this.volume !== undefined ? this.volume : 0.8;
    this.audioElement.muted = Boolean(this.isListenerMuted);
    track.attach(this.audioElement);

    // Setup Web Audio analyser on incoming track for real listener waveform
    this.setupRxAnalyser(track.mediaStreamTrack);

    // Test for browser autoplay policy block
    const playPromise = this.audioElement.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.listenerState = 'listening';
          this.listenerError = null;
          this.notify();
        })
        .catch((err) => {
          if (err.name === 'NotAllowedError') {
            this.listenerState = 'autoplay_blocked';
          } else {
            this.listenerState = 'listening';
          }
          this.notify();
        });
    } else {
      this.listenerState = 'listening';
      this.listenerError = null;
      this.notify();
    }
  }

  setupRxAnalyser(mediaStreamTrack) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const stream = new MediaStream([mediaStreamTrack]);
      this.rxSourceNode = this.audioCtx.createMediaStreamSource(stream);
      this.rxAnalyser = this.audioCtx.createAnalyser();
      this.rxAnalyser.fftSize = 64;
      this.rxSourceNode.connect(this.rxAnalyser);
    } catch (err) {
      console.warn('Web Audio rx analyser setup error:', err);
    }
  }

  /**
   * Set volume on live playback
   */
  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
    this.notify();
  }

  /**
   * Toggle mute on live playback
   */
  toggleMute() {
    this.isListenerMuted = !this.isListenerMuted;
    if (this.audioElement) {
      this.audioElement.muted = this.isListenerMuted;
    }
    this.notify();
    return this.isListenerMuted;
  }

  /**
   * Manually unlock audio on user gesture if autoplay was blocked
   */
  async unlockAudioPlayback() {
    if (this.audioElement) {
      try {
        await this.audioElement.play();
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          await this.audioCtx.resume();
        }
        this.listenerState = 'listening';
        this.notify();
        return true;
      } catch (err) {
        console.warn('Audio playback unlock error:', err);
        return false;
      }
    }
    return false;
  }

  /**
   * Get real incoming audio waveform data (array of values 0 to 1) for visualizer
   */
  getWaveformData() {
    const analyser = this.rxAnalyser || this.micAnalyser;
    if (!analyser || (this.listenerState !== 'listening' && this.broadcasterState !== 'live')) {
      return new Array(24).fill(0.05);
    }
    try {
      const buffer = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(buffer);
      const bars = 24;
      const step = Math.max(1, Math.floor(buffer.length / bars));
      const result = [];
      for (let i = 0; i < bars; i++) {
        const val = buffer[i * step] || 0;
        result.push(Math.max(0.05, Math.min(1.0, val / 255)));
      }
      return result;
    } catch {
      return new Array(24).fill(0.05);
    }
  }

  /**
   * Disconnect listener
   */
  async stopListening() {
    this.isConnectingListener = false;
    try {
      if (this.subscribedTrack && this.audioElement) {
        this.subscribedTrack.detach(this.audioElement);
        this.subscribedTrack = null;
      }
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.src = '';
        this.audioElement.srcObject = null;
      }
      if (this.subscriberRoom) {
        await this.subscriberRoom.disconnect();
        this.subscriberRoom = null;
      }
    } catch (err) {
      console.warn('Error disconnecting listener:', err);
    } finally {
      this.listenerState = 'idle';
      this.listenerError = null;
      this.notify();
    }
  }
}

export const liveAudioService = new LiveAudioService();

