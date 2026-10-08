import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Volume2, VolumeX, Radio, X, Music, ExternalLink } from 'lucide-react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import Waveform from './Waveform';
import './PersistentPlayer.css';

/**
 * PersistentPlayer Component
 * Floating persistent audio bar that keeps sound uninterrupted across navigation.
 * Supports both on-demand podcast playback and live radio streaming.
 */
export default function PersistentPlayer() {
  const {
    isPlaying,
    mode,
    activeTrack,
    currentBroadcast,
    togglePlay,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    pause,
    getWaveformData,
    isLiveKitLive,
    isLiveKitListening,
    dbMetadata
  } = useAudioPlayer();

  const isActuallyPlaying = isPlaying || isLiveKitListening;

  // If no audio is loaded or playing, hide persistent bar
  if (!isActuallyPlaying && !activeTrack) {
    return null;
  }

  const isLiveMode = isLiveKitLive || mode === 'live';
  const title = isLiveKitLive
    ? dbMetadata?.current_show_title || 'Live Studio Broadcast'
    : isLiveMode
    ? currentBroadcast?.title || 'CampusWave 104.2 FM'
    : activeTrack?.title || 'Podcast Episode';

  const host = isLiveKitLive
    ? dbMetadata?.current_rj || 'CampusWave RJ'
    : isLiveMode
    ? currentBroadcast?.host || 'Studio Console'
    : activeTrack?.rj_name || 'CampusWave RJ';

  const cover = isLiveMode
    ? null
    : activeTrack?.cover_image || null;

  return (
    <aside className="persistent-player-bar" aria-label="Persistent Audio Player">
      <div className="container persistent-player-container">
        {/* Track / Stream Info */}
        <div className="persistent-info-col">
          {cover ? (
            <div className="persistent-thumb-wrap">
              <img src={cover} alt={title} className="persistent-thumb" />
            </div>
          ) : (
            <div className="persistent-thumb-placeholder">
              <Radio size={18} />
            </div>
          )}

          <div className="persistent-meta">
            <div className="persistent-top-meta font-mono">
              <span className={`persistent-mode-badge ${isLiveMode ? 'mode-live' : 'mode-podcast'}`}>
                {isLiveMode ? 'LIVE 104.2 FM' : 'ON-DEMAND'}
              </span>
              <span className="persistent-host">RJ: {host}</span>
            </div>

            <div className="persistent-title font-display" title={title}>
              {title}
            </div>
          </div>
        </div>

        {/* Center Controls & Audio Spectrum */}
        <div className="persistent-center-col">
          <button
            type="button"
            className="persistent-play-btn"
            onClick={togglePlay}
            aria-label={isActuallyPlaying ? 'Pause Audio' : 'Play Audio'}
          >
            {isActuallyPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </button>

          <div className="persistent-waveform-slot" aria-hidden="true">
            <Waveform
              isPlaying={isActuallyPlaying}
              isOffline={false}
              getWaveformData={getWaveformData}
              height={28}
              barsCount={24}
            />
          </div>
        </div>

        {/* Volume & Close Utilities */}
        <div className="persistent-right-col">
          <div className="persistent-vol-wrap font-mono">
            <button
              type="button"
              className="persistent-mute-btn"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="persistent-vol-slider"
              aria-label="Adjust Volume"
            />
          </div>

          {isLiveMode ? (
            <Link to="/live" className="persistent-view-link font-mono" title="Open Full Studio Console">
              <span>CONSOLE</span>
              <ExternalLink size={12} />
            </Link>
          ) : activeTrack?.show_id ? (
            <Link to={`/shows/${activeTrack.show_id}`} className="persistent-view-link font-mono" title="Open Show Details">
              <span>SHOW</span>
              <ExternalLink size={12} />
            </Link>
          ) : null}

          <button
            type="button"
            className="persistent-close-btn"
            onClick={pause}
            aria-label="Stop audio"
            title="Stop audio playback"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
