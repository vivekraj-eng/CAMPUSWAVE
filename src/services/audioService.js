/**
 * Campus Wave Audio Service
 * Reusable singleton audio engine supporting real stream URLs,
 * on-demand podcast/episode tracks, HTML5 Audio API, and graceful offline state handling.
 */

class AudioService {
  constructor() {
    this.streamUrl = import.meta.env.VITE_RADIO_STREAM_URL || '';
    this.audioElement = null;
    this.audioContext = null;
    this.analyser = null;
    this.sourceNode = null;
    this.gainNode = null;
    this.dataArray = null;

    // Mode: 'live' | 'podcast'
    this.mode = 'live';
    this.activeTrack = null;
    this.currentTime = 0;
    this.trackDuration = 0;

    // States: 'live' | 'connecting' | 'offline' | 'error'
    this.state = this.streamUrl ? 'connecting' : 'offline';
    this.isPlaying = false;
    this.volume = 0.8;
    this.isMuted = false;
    this.connectionMessage = this.streamUrl ? 'Connecting to stream' : 'Campus Wave is not currently broadcasting.';
    this.listeners = new Set();

    // Data-driven models
    this.currentBroadcast = {
      title: 'STUDIO BROADCAST',
      sub: 'Campus Wave radio stream',
      host: null,
      track: null
    };

    this.trackMetadata = null;
    this.upNextBroadcast = null;
    this.todaysSchedule = [];

    if (this.streamUrl) {
      this.initAudioElement();
    }
  }

  initAudioElement() {
    if (this.audioElement) return;

    try {
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.preload = 'none';

      this.audioElement.addEventListener('waiting', () => {
        this.state = 'connecting';
        this.connectionMessage = this.mode === 'podcast' ? 'Buffering episode...' : 'Buffering stream carrier...';
        this.notify();
      });

      this.audioElement.addEventListener('playing', () => {
        this.state = 'live';
        this.isPlaying = true;
        this.connectionMessage = this.mode === 'podcast' ? `Playing: ${this.activeTrack?.title || 'Episode'}` : 'Connected • Broadcasting live';
        this.notify();
      });

      this.audioElement.addEventListener('pause', () => {
        this.isPlaying = false;
        this.notify();
      });

      this.audioElement.addEventListener('ended', () => {
        this.isPlaying = false;
        this.currentTime = 0;
        this.notify();
      });

      this.audioElement.addEventListener('timeupdate', () => {
        if (this.audioElement) {
          this.currentTime = this.audioElement.currentTime;
          this.notify();
        }
      });

      this.audioElement.addEventListener('loadedmetadata', () => {
        if (this.audioElement) {
          this.trackDuration = this.audioElement.duration || 0;
          this.notify();
        }
      });

      this.audioElement.addEventListener('error', () => {
        this.state = 'error';
        this.isPlaying = false;
        this.connectionMessage = this.mode === 'podcast'
          ? 'Episode playback error.'
          : 'Stream carrier unavailable or connection interrupted.';
        this.notify();
      });
    } catch {
      this.state = 'error';
      this.isPlaying = false;
      this.connectionMessage = 'Audio engine failed to initialize.';
    }
  }

  initWebAudio() {
    if (this.audioContext) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      if (this.audioElement) {
        this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
        this.gainNode = this.audioContext.createGain();
        this.sourceNode.connect(this.gainNode);
        this.gainNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
      }
    } catch {
      // AudioContext policy or cross-origin fallback
    }
  }

  playLive() {
    this.mode = 'live';
    this.activeTrack = null;

    if (!this.streamUrl) {
      this.state = 'offline';
      this.isPlaying = false;
      this.connectionMessage = 'Campus Wave is not currently broadcasting.';
      this.notify();
      return;
    }

    if (!this.audioElement) {
      this.initAudioElement();
    }

    this.initWebAudio();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    if (this.audioElement) {
      this.state = 'connecting';
      this.connectionMessage = 'Connecting to Campus Wave stream...';
      this.notify();

      if (this.audioElement.src !== this.streamUrl) {
        this.audioElement.src = this.streamUrl;
      }

      this.audioElement.play().catch(() => {
        this.state = 'offline';
        this.isPlaying = false;
        this.connectionMessage = 'Campus Wave is currently between broadcasts.';
        this.notify();
      });
    }
  }

  playTrack(track) {
    if (!track?.audio_url) return;

    this.mode = 'podcast';
    this.activeTrack = track;

    if (!this.audioElement) {
      this.initAudioElement();
    }

    this.initWebAudio();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    if (this.audioElement) {
      this.state = 'connecting';
      this.connectionMessage = `Loading: ${track.title}...`;
      this.notify();

      if (this.audioElement.src !== track.audio_url) {
        this.audioElement.src = track.audio_url;
      }

      this.audioElement.play().then(() => {
        this.isPlaying = true;
        this.state = 'live';
        this.notify();
      }).catch(err => {
        console.warn('Track playback failed:', err);
        this.state = 'error';
        this.isPlaying = false;
        this.connectionMessage = 'Audio file could not be played.';
        this.notify();
      });
    }
  }

  togglePlayTrack(track) {
    if (this.mode === 'podcast' && this.activeTrack?.id === track.id) {
      if (this.isPlaying) {
        this.pause();
      } else {
        if (this.audioElement) {
          this.audioElement.play().then(() => {
            this.isPlaying = true;
            this.notify();
          });
        }
      }
    } else {
      this.playTrack(track);
    }
  }

  seek(seconds) {
    if (this.audioElement && this.mode === 'podcast') {
      this.audioElement.currentTime = seconds;
      this.currentTime = seconds;
      this.notify();
    }
  }

  play() {
    if (this.mode === 'podcast' && this.activeTrack) {
      if (this.audioElement) {
        this.audioElement.play().catch(() => {});
        this.isPlaying = true;
        this.notify();
      }
    } else {
      this.playLive();
    }
  }

  pause() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.isPlaying = false;
    this.notify();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
    if (this.volume > 0 && this.isMuted) {
      this.isMuted = false;
    }
    this.notify();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.audioElement) {
      this.audioElement.muted = this.isMuted;
    }
    this.notify();
  }

  setSimulatorState(newState) {
    this.state = newState;
    if (newState === 'offline') {
      this.isPlaying = false;
      if (this.audioElement) {
        this.audioElement.pause();
      }
      this.connectionMessage = 'Campus Wave is currently between broadcasts.';
    } else if (newState === 'connecting') {
      this.isPlaying = false;
      this.connectionMessage = 'Connecting to Campus Wave...';
    } else if (newState === 'live') {
      this.isPlaying = true;
      this.connectionMessage = 'Connected • Broadcasting live';
    }
    this.notify();
  }

  getWaveformData() {
    if (this.analyser && this.dataArray && this.isPlaying) {
      this.analyser.getByteFrequencyData(this.dataArray);
      return this.dataArray;
    }
    return null;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) => listener(this.getSnapshot()));
  }

  getSnapshot() {
    return {
      streamUrl: this.streamUrl,
      mode: this.mode,
      activeTrack: this.activeTrack,
      currentTime: this.currentTime,
      trackDuration: this.trackDuration,
      state: this.state,
      isPlaying: this.isPlaying,
      volume: this.volume,
      isMuted: this.isMuted,
      connectionMessage: this.connectionMessage,
      currentBroadcast: this.currentBroadcast,
      trackMetadata: this.trackMetadata,
      upNextBroadcast: this.upNextBroadcast,
      todaysSchedule: this.todaysSchedule
    };
  }
}

export const audioService = new AudioService();
