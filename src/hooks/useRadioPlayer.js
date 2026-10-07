import { useState, useEffect } from 'react';
import { audioService } from '../services/audioService';
import { radioService } from '../services/radio-service';

export function useRadioPlayer() {
  const [snapshot, setSnapshot] = useState(() => audioService.getSnapshot());
  const [liveDbData, setLiveDbData] = useState(null);

  useEffect(() => {
    const unsubscribe = audioService.subscribe((newSnapshot) => {
      setSnapshot(newSnapshot);
    });

    // Check database for active live metadata
    let isMounted = true;
    radioService.getNowPlaying().then((dbData) => {
      if (isMounted && dbData) {
        setLiveDbData(dbData);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return {
    ...snapshot,
    // Database overlay if live
    dbMetadata: liveDbData,
    listenerCount: liveDbData?.listener_count ?? null,
    play: () => audioService.play(),
    pause: () => audioService.pause(),
    togglePlay: () => audioService.togglePlay(),
    playLive: () => audioService.playLive(),
    playTrack: (track) => audioService.playTrack(track),
    togglePlayTrack: (track) => audioService.togglePlayTrack(track),
    seek: (sec) => audioService.seek(sec),
    setVolume: (val) => audioService.setVolume(val),
    toggleMute: () => audioService.toggleMute(),
    setSimulatorState: (state) => audioService.setSimulatorState(state),
    getWaveformData: () => audioService.getWaveformData()
  };
}

// Keep backwards-compatible export
export const useAudioPlayer = useRadioPlayer;
