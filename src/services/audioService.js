/**
 * Campus Wave Audio Service
 * Reusable singleton audio engine supporting real stream URLs,
 * HTML5 Audio API, and graceful offline state handling.
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

    // States: 'live' | 'connecting' | 'offline'
    this.state = this.streamUrl ? 'connecting' : 'offline';
    this.isPlaying = false;
    this.volume = 0.8;
    this.isMuted = false;
    this.connectionMessage = this.streamUrl ? 'Connecting to stream' : 'Campus Wave is not currently broadcasting.';
    this.listeners = new Set();

    // Data-driven models (Strict Content Rule: never invent fake songs, fake hosts or fake schedules)
    // If real metadata exists, use it; otherwise provide authentic standard broadcast labels
    this.currentBroadcast = {
      title: 'STUDIO BROADCAST',
      sub: 'Campus Wave radio stream',
      host: null,
      track: null
    };

    this.trackMetadata = null; // null if no real track metadata emitted
    this.upNextBroadcast = null; // null if no backend schedule exists (omitted from UI)
    this.todaysSchedule = []; // empty if no backend schedule exists (omitted from UI)

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
        this.connectionMessage = 'Buffering stream carrier...';
        this.notify();
      });

      this.audioElement.addEventListener('playing', () => {
        this.state = 'live';
        this.isPlaying = true;
        this.connectionMessage = 'Connected • Broadcasting live';
        this.notify();
      });

      this.audioElement.addEventListener('pause', () => {
        this.isPlaying = false;
        this.notify();
      });

      this.audioElement.addEventListener('ended', () => {
        this.isPlaying = false;
        this.state = 'offline';
        this.connectionMessage = 'Stream transmission ended.';
        this.notify();
      });

      this.audioElement.addEventListener('error', (e) => {
        this.state = 'offline';
        this.isPlaying = false;
        this.connectionMessage = 'Stream temporarily unavailable.';
        this.notify();
      });
    } catch (err) {
      this.state = 'offline';
      this.isPlaying = false;
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

  play() {
    // If no stream URL configured, gracefully remain offline
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

  pause() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.isPlaying = false;
    this.notify();
  }

  togglePlay() {
    if (!this.streamUrl && this.state === 'offline') {
      // If user clicks play when no stream URL exists, gracefully signal offline status
      this.connectionMessage = 'No live broadcast streaming currently.';
      this.notify();
      return;
    }
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

  // Simulator helper: allows inspecting LIVE, CONNECTING and OFFLINE states in dev
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
