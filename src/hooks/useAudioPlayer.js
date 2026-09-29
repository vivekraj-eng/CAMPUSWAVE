import { useState, useEffect } from 'react';
import { audioService } from '../services/audioService';

export function useAudioPlayer() {
  const [snapshot, setSnapshot] = useState(() => audioService.getSnapshot());

  useEffect(() => {
    const unsubscribe = audioService.subscribe((newSnapshot) => {
      setSnapshot(newSnapshot);
    });
    return unsubscribe;
  }, []);

  return {
    ...snapshot,
    play: () => audioService.play(),
    pause: () => audioService.pause(),
    togglePlay: () => audioService.togglePlay(),
    setVolume: (val) => audioService.setVolume(val),
    toggleMute: () => audioService.toggleMute(),
    setSimulatorState: (state) => audioService.setSimulatorState(state),
    getWaveformData: () => audioService.getWaveformData()
  };
}
