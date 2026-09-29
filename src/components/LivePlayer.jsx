import React from 'react';
import { Play, Square, Volume2, VolumeX, Radio, Wifi, Sliders } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import Logo from './Logo';
import RadioWave from './RadioWave';
import Waveform from './Waveform';
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
    connectionMessage,
    currentBroadcast,
    trackMetadata,
    upNextBroadcast,
    todaysSchedule,
    getWaveformData
  } = useAudioPlayer();

  const isLive = state === 'live';
  const isConnecting = state === 'connecting';
  const isOffline = state === 'offline';

  return (
    <div className="broadcast-console-root">
      {/* Studio Diagnostic / State Simulator Bar (Allows inspecting Live, Connecting, Offline states) */}
      <div className="console-state-toolbar font-mono">
        <div className="toolbar-label">
          <Sliders size={13} />
          <span>CONSOLE PREVIEW:</span>
        </div>
        <div className="toolbar-controls">
          <button
            type="button"
            className={`state-select-btn ${isLive ? 'active' : ''}`}
            onClick={() => setSimulatorState('live')}
          >
            State 1: Live
          </button>
          <button
            type="button"
            className={`state-select-btn ${isConnecting ? 'active' : ''}`}
            onClick={() => setSimulatorState('connecting')}
          >
            State 2: Connecting
          </button>
          <button
            type="button"
            className={`state-select-btn ${isOffline ? 'active' : ''}`}
            onClick={() => setSimulatorState('offline')}
          >
            State 3: Offline
          </button>
        </div>
      </div>

      {/* Main Broadcast Console Player */}
      <motion.div
        className="broadcast-console-card"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Subtle Ambient Radio Waves Radiating from Console Center */}
        <div className="console-waves-halo" aria-hidden="true">
          <RadioWave isPlaying={isPlaying} size={520} />
        </div>

        {/* Console Header Bar */}
        <div className="console-top-bar font-mono">
          <div className="console-frequency-badge">
            <Radio size={13} className="freq-icon" />
            <span>104.2 FM</span>
            <span className="bullet-sep">•</span>
            <span>CAMPUS WAVE</span>
          </div>

          <div className="console-status-indicator">
            {isLive ? (
              <span className="live-status-pill">
                <span className="pill-dot dot-live" />
                <span>LIVE</span>
              </span>
            ) : isConnecting ? (
              <span className="connecting-status-pill">
                <span className="pill-dot dot-connecting" />
                <span>CONNECTING</span>
              </span>
            ) : (
              <span className="offline-status-pill">
                <span className="pill-dot dot-offline" />
                <span>OFFLINE</span>
              </span>
            )}
          </div>
        </div>

        {/* Center Mascot & Station Branding */}
        <div className="console-center-stage">
          <div className="console-logo-mount">
            <Logo size={150} showGlow={isPlaying} className="console-dinosaur-emblem" />
          </div>

          <div className="console-identity-text">
            <h2 className="console-station-name font-display">CAMPUS WAVE</h2>
            <p className="console-state-msg font-mono">
              {isLive
                ? 'Campus Wave is broadcasting.'
                : isConnecting
                ? 'Connecting to broadcast feed...'
                : 'Campus Wave is currently between broadcasts.'}
            </p>
          </div>
        </div>

        {/* Waveform Visualization Tray */}
        <div className="console-waveform-tray" aria-label="Audio Waveform Display">
          <Waveform
            isPlaying={isPlaying}
            isOffline={isOffline}
            isConnecting={isConnecting}
            getWaveformData={getWaveformData}
            height={68}
            barsCount={48}
          />
          <div className="console-waveform-meta font-mono">
            <span>TRANSMISSION: 104.20 MHz</span>
            <span>ACOUSTIC SPECTRUM</span>
            <span>DIGITAL STEREO</span>
          </div>
        </div>

        {/* Primary Controls Cluster: Large Play Button & Volume Controls */}
        <div className="console-controls-cluster">
          <button
            type="button"
            className={`console-play-btn font-mono ${isPlaying ? 'playing' : ''}`}
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause Campus Wave' : 'Play Campus Wave'}
            title={isPlaying ? 'Pause Campus Wave' : 'Play Campus Wave'}
          >
            {isPlaying ? (
              <>
                <Square size={20} fill="currentColor" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play size={20} fill="currentColor" />
                <span>PLAY</span>
              </>
            )}
          </button>

          <div className="console-volume-block">
            <button
              type="button"
              className="console-mute-btn"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute Campus Wave' : 'Mute Campus Wave'}
              title={isMuted ? 'Unmute Campus Wave' : 'Mute Campus Wave'}
            >
              {isMuted || volume === 0 ? <VolumeX size={19} /> : <Volume2 size={19} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="console-vol-slider"
              aria-label="Volume Control"
            />
            <span className="console-vol-reading font-mono">
              {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
            </span>
          </div>
        </div>

        {/* Technical Console Footer */}
        <div className="console-bottom-hardware font-mono">
          <div className="hardware-item">
            <span className="hw-label">CARRIER</span>
            <span className="hw-val">104.2 FM STEREO</span>
          </div>
          <div className="hw-sep" />
          <div className="hardware-item">
            <span className="hw-label">TRANSMITTER</span>
            <span className="hw-val">CAMPUS PAVILION</span>
          </div>
          <div className="hw-sep" />
          <div className="hardware-item">
            <span className="hw-label">STATUS</span>
            <span className="hw-val">{isLive ? 'ON AIR' : isConnecting ? 'TUNING' : 'STANDBY'}</span>
          </div>
        </div>
      </motion.div>

      {/* Broadcast Sections: Now On Campus Wave & Up Next */}
      <div className="console-secondary-sections">
        {/* CURRENT BROADCAST: NOW ON CAMPUS WAVE */}
        <section className="broadcast-info-card">
          <div className="card-technical-bar font-mono">
            <span className="card-section-label">NOW ON CAMPUS WAVE</span>
            <span className="card-mode-label">{isLive ? 'ACTIVE' : 'STANDBY'}</span>
          </div>

          <div className="broadcast-info-body">
            {/* Strict Content Rule: Show real track/host metadata ONLY if real data exists */}
            {trackMetadata ? (
              <div className="real-metadata-row">
                {trackMetadata.artwork && (
                  <img
                    src={trackMetadata.artwork}
                    alt={trackMetadata.title}
                    className="track-artwork-thumb"
                  />
                )}
                <div>
                  <h3 className="track-title font-display">{trackMetadata.title}</h3>
                  <p className="track-artist">{trackMetadata.artist}</p>
                </div>
              </div>
            ) : currentBroadcast?.host ? (
              <div>
                <h3 className="broadcast-title font-display">{currentBroadcast.title}</h3>
                <p className="broadcast-host">Host: {currentBroadcast.host}</p>
              </div>
            ) : (
              <div>
                <h3 className="broadcast-title font-display">STUDIO BROADCAST</h3>
                <p className="broadcast-desc">Campus Wave radio stream</p>
                <p className="broadcast-sub font-mono">104.2 FM • Autonomous Student Broadcasting</p>
              </div>
            )}
          </div>
        </section>

        {/* UP NEXT (ONLY rendered when actual schedule data exists) */}
        {upNextBroadcast && (
          <section className="broadcast-info-card up-next-card">
            <div className="card-technical-bar font-mono">
              <span className="card-section-label">UP NEXT</span>
              <span className="card-time-range">{upNextBroadcast.startTime} — {upNextBroadcast.endTime}</span>
            </div>
            <div className="broadcast-info-body">
              <h3 className="upnext-title font-display">{upNextBroadcast.title}</h3>
              {upNextBroadcast.host && (
                <p className="upnext-host">Presented by {upNextBroadcast.host}</p>
              )}
            </div>
          </section>
        )}
      </div>

      {/* TODAY'S SCHEDULE (ONLY rendered when actual schedule data exists) */}
      {todaysSchedule && todaysSchedule.length > 0 && (
        <section className="console-schedule-section">
          <div className="schedule-header font-mono">
            <span>TODAY'S SCHEDULE</span>
            <span>TRANSMISSION LINEUP</span>
          </div>
          <div className="console-schedule-list">
            {todaysSchedule.map((item) => (
              <div
                key={item.id}
                className={`schedule-entry-row ${item.active && isLive ? 'is-active-entry' : ''}`}
              >
                <div className="entry-time font-mono">{item.time}</div>
                <div className="entry-show font-display">{item.title}</div>
                <div className="entry-status font-mono">
                  {item.active && isLive ? (
                    <span className="badge-live-sm">ON AIR</span>
                  ) : (
                    <span>SCHEDULED</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
