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

    // Listener states: 'idle' | 'connecting' | 'listening' | 'autoplay_blocked' | 'offline' | 'error'
    this.listenerState = 'idle';
    this.listenerError = null;

    this.listeners = new Set();
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
      listenerState: this.listenerState,
      listenerError: this.listenerError,
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

      this.publisherRoom.on(RoomEvent.Disconnected, () => {
        if (this.broadcasterState === 'live') {
          this.stopBroadcast();
        }
      });

      await this.publisherRoom.connect(tokenData.url, tokenData.token);

      // 4. Publish real microphone track to room
      await this.publisherRoom.localParticipant.publishTrack(this.localAudioTrack);

      // 5. Update station metadata in database
      const rjName = profile?.full_name || user?.user_metadata?.full_name || 'CampusWave RJ';
      await radioService.updateNowPlaying({
        is_live: true,
        current_rj: rjName,
        current_show_title: showTitle || 'Live Radio Broadcast',
        stream_url: 'livekit',
        listener_count: 1
      });

      this.broadcasterState = 'live';
      this.broadcastStartTime = Date.now();
      this.notify();

      return { success: true };
    } catch (err) {
      console.error('Failed to start broadcast:', err);
      this.broadcasterState = 'error';
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
        current_artist: null
      }).catch(() => {});
    } catch (err) {
      console.warn('Error during stopBroadcast cleanup:', err);
    } finally {
      this.broadcasterState = 'idle';
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
    if (this.subscriberRoom) {
      await this.stopListening();
    }

    this.listenerState = 'connecting';
    this.listenerError = null;
    this.notify();

    try {
      // 1. Fetch Subscriber-only token
      const tokenData = await this.fetchLiveKitToken('subscribe');

      // 2. Connect to LiveKit Room as subscriber
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
        this.listenerState = 'idle';
        this.notify();
      });

      this.subscriberRoom.on(RoomEvent.Disconnected, () => {
        this.listenerState = 'offline';
        this.notify();
      });

      await this.subscriberRoom.connect(tokenData.url, tokenData.token);

      // Check if audio track is already published in room
      this.subscriberRoom.remoteParticipants.forEach((participant) => {
        participant.trackPublications.forEach((publication) => {
          if (publication.track && publication.track.kind === Track.Kind.Audio) {
            this.attachListenerAudio(publication.track);
          }
        });
      });

      return { success: true };
    } catch (err) {
      console.error('Failed to connect listener to LiveKit room:', err);
      this.listenerState = 'error';
      this.listenerError = err.message || 'Live radio audio stream currently unavailable.';
      this.notify();
      return { success: false, error: this.listenerError };
    }
  }

  attachListenerAudio(track) {
    this.subscribedTrack = track;

    if (!this.audioElement) {
      this.audioElement = document.createElement('audio');
      this.audioElement.autoplay = true;
      document.body.appendChild(this.audioElement);
    }

    track.attach(this.audioElement);

    // Setup Web Audio analyser on incoming track for real listener waveform
    this.setupRxAnalyser(track.mediaStreamTrack);

    // Test for browser autoplay policy block
    const playPromise = this.audioElement.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.listenerState = 'listening';
          this.notify();
        })
        .catch((err) => {
          if (err.name === 'NotAllowedError') {
            this.listenerState = 'autoplay_blocked';
            this.notify();
          } else {
            this.listenerState = 'listening';
            this.notify();
          }
        });
    } else {
      this.listenerState = 'listening';
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
    if (!analyser) {
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
    try {
      if (this.subscribedTrack && this.audioElement) {
        this.subscribedTrack.detach(this.audioElement);
        this.subscribedTrack = null;
      }
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.src = '';
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
