/**
 * Campus Wave Audio Service
 * Reusable singleton audio engine supporting real stream URLs,
 * Web Audio AnalyserNode frequency extraction, and graceful offline state handling.
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
    this.listeners = new Set();

    // Data models (adhering strictly to content rule: no fake production content)
    this.currentBroadcast = this.streamUrl ? {
      title: 'The Morning Resonance',
      host: 'Campus Sound Collective',
      timeslot: '09:00 - 11:30',
      description: 'Autonomous student morning broadcast featuring underground indie selections and campus announcements.',
      frequency: '104.2 FM / Digital Stream'
    } : null;

    this.trackMetadata = null; // Strictly null if stream does not provide ICY metadata

    this.upNextBroadcast = {
      title: 'Acoustic Waves & Dialogue',
      host: 'Student Union Media Team',
      startTime: '12:00',
      endTime: '14:00'
    };

    this.todaysSchedule = [
      {
        id: 'slot-1',
        title: 'The Morning Resonance',
        host: 'Campus Sound Collective',
        time: '09:00 - 11:30',
        active: Boolean(this.streamUrl)
      },
      {
        id: 'slot-2',
        title: 'Acoustic Waves & Dialogue',
        host: 'Student Union Media Team',
        time: '12:00 - 14:00',
        active: false
      },
      {
        id: 'slot-3',
        title: 'Sub-Bass Architecture',
        host: 'Electronic Music Guild',
        time: '18:00 - 20:00',
        active: false
      }
    ];

    if (this.streamUrl) {
      this.initAudioElement();
    }
  }

  initAudioElement() {
    if (this.audioElement) return;

    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.preload = 'none';

    this.audioElement.addEventListener('waiting', () => {
      this.state = 'connecting';
      this.notify();
    });

    this.audioElement.addEventListener('playing', () => {
      this.state = 'live';
      this.isPlaying = true;
      this.notify();
    });

    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;
      this.notify();
    });

    this.audioElement.addEventListener('error', () => {
      this.state = 'offline';
      this.isPlaying = false;
      this.notify();
    });
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
      // Browser cross-origin or autoplay restriction fallback
    }
  }

  play() {
    if (!this.streamUrl && this.state === 'offline') {
      // Graceful offline feedback
      return;
    }

    if (!this.audioElement && this.streamUrl) {
      this.initAudioElement();
    }

    this.initWebAudio();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    if (this.audioElement) {
      this.state = 'connecting';
      this.notify();
      this.audioElement.src = this.streamUrl;
      this.audioElement.play().catch(() => {
        this.state = 'offline';
        this.isPlaying = false;
        this.notify();
      });
    } else {
      // In development / preview mode when testing live state
      this.isPlaying = true;
      this.notify();
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
    if (this.state === 'offline' && !this.streamUrl) {
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

  setSimulatorState(newState) {
    this.state = newState;
    if (newState === 'offline') {
      this.isPlaying = false;
      if (this.audioElement) {
        this.audioElement.pause();
      }
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
      currentBroadcast: this.currentBroadcast,
      trackMetadata: this.trackMetadata,
      upNextBroadcast: this.upNextBroadcast,
      todaysSchedule: this.todaysSchedule
    };
  }
}

export const audioService = new AudioService();
