import React from 'react';
import { Play, Square, Volume2, VolumeX, Clock, Disc3, Radio, Sliders } from 'lucide-react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import Logo from './Logo';
import RadioWave from './RadioWave';
import Waveform from './Waveform';
import OfflineState from './OfflineState';
import LoadingState from './LoadingState';
import './LivePlayer.css';

export default function LivePlayer() {
  const {
    streamUrl,
    state,
    setSimulatorState,
    isPlaying,
    togglePlay,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    currentBroadcast,
    trackMetadata,
    upNextBroadcast,
    getWaveformData
  } = useAudioPlayer();

  const isLive = state === 'live';
  const isConnecting = state === 'connecting';
  const isOffline = state === 'offline';

  return (
    <div className="live-player-root">
      {/* Stream State Switcher / Inspector (allows testing all 3 required states cleanly) */}
      <div className="stream-inspector-toolbar font-mono">
        <div className="inspector-title">
          <Sliders size={13} />
          <span>STUDIO CONTROLS:</span>
        </div>
        <div className="inspector-actions">
          <button
            type="button"
            className={`inspector-btn ${isLive ? 'active' : ''}`}
            onClick={() => setSimulatorState('live')}
          >
            State 1: Live / On Air
          </button>
          <button
            type="button"
            className={`inspector-btn ${isConnecting ? 'active' : ''}`}
            onClick={() => setSimulatorState('connecting')}
          >
            State 2: Connecting
          </button>
          <button
            type="button"
            className={`inspector-btn ${isOffline ? 'active' : ''}`}
            onClick={() => setSimulatorState('offline')}
          >
            State 3: Radio Offline
          </button>
        </div>
      </div>

      {/* Main Studio Frame */}
      <div className="live-player-card">
        {/* Ambient acoustic radio waves behind badge */}
        <div className="live-waves-backdrop">
          <RadioWave isPlaying={isPlaying} size={500} />
        </div>

        {/* STATE 1: LIVE / BROADCASTING */}
        {isLive && (
          <div className="live-state-wrapper">
            <div className="live-card-topbar">
              <div className="badge-on-air">
                <span className="status-dot" />
                <span>ON AIR</span>
              </div>
              <span className="live-card-channel font-mono">104.2 FM • LIVE STUDIO BROADCAST</span>
            </div>

            {/* Central Mascot Badge */}
            <div className="live-center-badge-wrap">
              <Logo size={150} showGlow={isPlaying} className="live-main-dinosaur-logo" />
            </div>

            {/* Current Broadcast & Host */}
            <div className="live-program-head">
              <h2 className="live-program-title font-display">
                {currentBroadcast ? currentBroadcast.title : 'Live Campus Transmission'}
              </h2>
              {currentBroadcast?.host && (
                <p className="live-program-host">
                  Host: <span className="host-highlight">{currentBroadcast.host}</span>
                </p>
              )}
              {currentBroadcast?.timeslot && (
                <div className="live-program-timeslot font-mono">
                  <Clock size={13} />
                  <span>{currentBroadcast.timeslot}</span>
                </div>
              )}
            </div>

            {/* Waveform Visualizer */}
            <div className="live-waveform-shell">
              <Waveform
                isPlaying={isPlaying}
                isOffline={false}
                isConnecting={false}
                getWaveformData={getWaveformData}
                height={70}
                barsCount={50}
              />
              <div className="live-spectrum-footer font-mono">
                <span>FM 104.2 MHz</span>
                <span>ACOUSTIC SPECTRUM</span>
                <span>STEREO STREAM</span>
              </div>
            </div>

            {/* Player Controls (Play, Pause, Volume, Mute) */}
            <div className="live-controls-cluster">
              <button
                type="button"
                className={`live-primary-play-btn ${isPlaying ? 'playing' : ''}`}
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause broadcast stream' : 'Listen live to broadcast'}
              >
                {isPlaying ? (
                  <>
                    <Square size={20} fill="currentColor" />
                    <span>PAUSE BROADCAST</span>
                  </>
                ) : (
                  <>
                    <Play size={20} fill="currentColor" />
                    <span>LISTEN LIVE</span>
                  </>
                )}
              </button>

              <div className="live-volume-wrap">
                <button
                  type="button"
                  className="live-vol-mute-btn"
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute stream' : 'Mute stream'}
                >
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="live-vol-slider"
                  aria-label="Volume slider"
                />
                <span className="live-vol-percent font-mono">
                  {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STATE 2: OFFLINE */}
        {isOffline && (
          <OfflineState
            upNextBroadcast={upNextBroadcast}
            onRetry={() => setSimulatorState('connecting')}
          />
        )}

        {/* STATE 3: CONNECTING */}
        {isConnecting && (
          <LoadingState message="Synchronizing audio carrier from Campus Media Pavilion Room 104..." />
        )}
      </div>

      {/* Grid: Now Playing & Up Next */}
      <div className="live-supporting-grid">
        {/* NOW PLAYING CARD */}
        <div className="live-support-card">
          <div className="support-card-header">
            <div className="support-header-title">
              <Disc3 size={15} className={isPlaying ? 'rotating-disc' : ''} />
              <span>NOW PLAYING</span>
            </div>
            <span className="support-badge font-mono">METADATA</span>
          </div>

          {trackMetadata ? (
            <div className="now-playing-record">
              {trackMetadata.artwork && (
                <img
                  src={trackMetadata.artwork}
                  alt={trackMetadata.title}
                  className="record-artwork"
                />
              )}
              <div>
                <h4 className="record-title font-display">{trackMetadata.title}</h4>
                <p className="record-artist">{trackMetadata.artist}</p>
              </div>
            </div>
          ) : (
            <div className="no-production-data-state">
              <p className="no-data-primary">Direct studio transmission feed.</p>
              <p className="no-data-sub">No discrete track metadata is emitted for this broadcast segment.</p>
            </div>
          )}
        </div>

        {/* UP NEXT CARD */}
        <div className="live-support-card">
          <div className="support-card-header">
            <div className="support-header-title">
              <Clock size={15} />
              <span>UP NEXT</span>
            </div>
            <span className="support-badge font-mono">SCHEDULE</span>
          </div>

          {upNextBroadcast ? (
            <div className="upnext-record">
              <div className="upnext-time font-mono">
                {upNextBroadcast.startTime} — {upNextBroadcast.endTime}
              </div>
              <h4 className="upnext-program-name font-display">{upNextBroadcast.title}</h4>
              {upNextBroadcast.host && (
                <p className="upnext-program-host">Hosted by {upNextBroadcast.host}</p>
              )}
            </div>
          ) : (
            <div className="no-production-data-state">
              <p className="no-data-primary">No subsequent program scheduled today.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
