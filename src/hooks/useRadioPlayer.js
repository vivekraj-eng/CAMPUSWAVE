import { useState, useEffect, useCallback } from 'react';
import { audioService } from '../services/audioService';
import { radioService } from '../services/radio-service';
import { liveAudioService } from '../services/liveAudioService';
import { supabase, isSupabaseConfigured } from '../services/supabase';

export function useRadioPlayer() {
  const [snapshot, setSnapshot] = useState(() => audioService.getSnapshot());
  const [liveAudioSnapshot, setLiveAudioSnapshot] = useState(() => liveAudioService.getSnapshot());
  const [liveDbData, setLiveDbData] = useState(null);

  // Subscribe to external audio service updates
  useEffect(() => {
    const unsubAudio = audioService.subscribe((newSnapshot) => {
      setSnapshot(newSnapshot);
    });
    const unsubLive = liveAudioService.subscribe((newLiveSnapshot) => {
      setLiveAudioSnapshot(newLiveSnapshot);
    });

    return () => {
      unsubAudio();
      unsubLive();
    };
  }, []);

  // Supabase Realtime synchronization for radio_now_playing
  useEffect(() => {
    let isMounted = true;

    const fetchNowPlaying = async () => {
      try {
        const data = await radioService.getNowPlaying();
        if (isMounted) {
          setLiveDbData(data);
        }
      } catch (err) {
        console.warn('Error fetching radio metadata:', err);
      }
    };

    fetchNowPlaying();

    let channel = null;
    if (isSupabaseConfigured && supabase.channel) {
      try {
        channel = supabase
          .channel('radio_now_playing_realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'radio_now_playing' },
            (payload) => {
              if (isMounted && payload.new) {
                setLiveDbData(payload.new);
              }
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('Realtime channel subscription error:', e);
      }
    }

    // Reliable 6-second heartbeat polling fallback in case WebSocket reconnects
    const pollInterval = setInterval(fetchNowPlaying, 6000);

    // Also poll LiveKit room status directly
    const pollLiveKitStatus = async () => {
      try {
        const res = await fetch('/.netlify/functions/livekit-token?action=status');
        if (res.ok) {
          const statusData = await res.json();
          if (isMounted && statusData && statusData.configured) {
            if (statusData.isLive) {
              setLiveDbData((prev) => ({
                ...(prev || {}),
                is_live: true,
                current_rj: statusData.broadcaster?.name || prev?.current_rj || 'CampusWave RJ',
                listener_count: Math.max(statusData.participantCount || 1, prev?.listener_count || 1)
              }));
            }
          }
        }
      } catch {
        // Fallback silently
      }
    };

    pollLiveKitStatus();
    const lkInterval = setInterval(pollLiveKitStatus, 10000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      clearInterval(lkInterval);
      if (channel && channel.unsubscribe) {
        try {
          channel.unsubscribe();
        } catch {}
      }
    };
  }, []);

  const isLiveKitLive = Boolean(liveDbData?.is_live || liveAudioSnapshot.listenerState === 'listening');
  const isExternalLive = Boolean(!isLiveKitLive && snapshot.state === 'live');

  // Unified audio waveform data
  const getWaveformData = useCallback(() => {
    if (isLiveKitLive || liveAudioSnapshot.listenerState === 'listening') {
      return liveAudioService.getWaveformData();
    }
    return audioService.getWaveformData();
  }, [isLiveKitLive, liveAudioSnapshot.listenerState]);

  return {
    ...snapshot,
    // Database live station overlay
    dbMetadata: liveDbData,
    listenerCount: liveDbData?.listener_count ?? liveAudioSnapshot.listenerCount ?? null,
    isLiveKitLive,
    liveKitState: liveAudioSnapshot.listenerState,
    liveKitError: liveAudioSnapshot.listenerError,
    isLiveKitListening: liveAudioSnapshot.isLiveListening,

    // LiveKit WebRTC controls
    connectLiveKitListener: () => liveAudioService.startListening(),
    disconnectLiveKitListener: () => liveAudioService.stopListening(),
    unlockLiveAudio: () => liveAudioService.unlockAudioPlayback(),

    // Standard stream controls
    play: () => liveAudioService.startListening(),
    pause: () => liveAudioService.stopListening(),
    togglePlay: () => {
      if (liveAudioSnapshot.isLiveListening || liveAudioSnapshot.listenerState === 'waiting_for_broadcaster' || liveAudioSnapshot.listenerState === 'connecting') {
        return liveAudioService.stopListening();
      }
      return liveAudioService.startListening();
    },
    playLive: () => liveAudioService.startListening(),
    playTrack: (track) => audioService.playTrack(track),
    togglePlayTrack: (track) => audioService.togglePlayTrack(track),
    seek: (sec) => audioService.seek(sec),
    setVolume: (val) => {
      audioService.setVolume(val);
      liveAudioService.setVolume(val);
    },
    toggleMute: () => {
      audioService.toggleMute();
      return liveAudioService.toggleMute();
    },
    setSimulatorState: (state) => audioService.setSimulatorState(state),
    getWaveformData
  };
}

export const useAudioPlayer = useRadioPlayer;

