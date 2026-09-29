import React from 'react';
import { Play, Square, Volume2, VolumeX, Radio, Activity } from 'lucide-react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import Waveform from './Waveform';
import './AudioPlayer.css';

export default function AudioPlayer({ compact = false, showWaveform = true, className = '' }) {
  const {
    state,
    isPlaying,
    togglePlay,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    currentBroadcast,
    getWaveformData
  } = useAudioPlayer();

  const isOffline = state === 'offline';
  const isConnecting = state === 'connecting';

  return (
    <div className={`reusable-audio-player ${compact ? 'is-compact' : ''} ${className}`}>
      <div className="player-meta-row">
        <div className="player-status-badge">
          {state === 'live' ? (
            <span className="badge-on-air">
              <span className="status-dot" />
              <span>ON AIR</span>
            </span>
          ) : isConnecting ? (
            <span className="badge-connecting">
              <span className="status-dot" />
              <span>CONNECTING</span>
            </span>
          ) : (
            <span className="badge-offline">
              <span className="status-dot" />
              <span>OFFLINE</span>
            </span>
          )}
          <span className="player-carrier font-mono">104.2 FM • CAMPUS WAVE</span>
        </div>

        <div className="player-signal-status font-mono">
          <Activity size={13} className={isPlaying ? 'icon-active' : ''} />
          <span>{isPlaying ? 'CARRIER ACTIVE' : isOffline ? 'STANDBY' : 'TUNING'}</span>
        </div>
      </div>

      <div className="player-core-row">
        <button
          type="button"
          className={`player-action-btn ${isPlaying ? 'playing' : ''}`}
          onClick={togglePlay}
          disabled={isOffline}
          aria-label={isPlaying ? 'Pause Campus Wave broadcast' : 'Play Campus Wave broadcast'}
        >
          {isPlaying ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>

        <div className="player-program-info">
          <h4 className="program-title font-display">
            {state === 'live' && currentBroadcast ? currentBroadcast.title : isOffline ? 'Station Standby' : 'Tuning Stream...'}
          </h4>
          <p className="program-host">
            {state === 'live' && currentBroadcast
              ? `Curated by ${currentBroadcast.host}`
              : isOffline
              ? 'No live broadcast streaming currently'
              : 'Connecting to broadcast feed'}
          </p>
        </div>

        <div className="player-volume-cluster">
          <button
            type="button"
            className="player-vol-icon-btn"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute stream' : 'Mute stream'}
          >
            {isMuted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="player-vol-slider"
            aria-label="Volume slider"
          />
        </div>
      </div>

      {showWaveform && (
        <div className="player-waveform-tray">
          <Waveform
            isPlaying={isPlaying}
            isOffline={isOffline}
            isConnecting={isConnecting}
            getWaveformData={getWaveformData}
            height={36}
            barsCount={36}
          />
        </div>
      )}
    </div>
  );
}
