import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Square, Volume2, VolumeX, Radio, Users, Music2, MessageSquare, AlertCircle, Headphones, Volume1 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRadioPlayer } from '../hooks/useRadioPlayer';
import BrandLogo from './BrandLogo';
import RadioWave from './RadioWave';
import Waveform from './Waveform';
import OfflineState from './OfflineState';
import './LivePlayer.css';

export default function LivePlayer() {
  const navigate = useNavigate();
  const {
    streamUrl,
    state,
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
    listenerCount,
    dbMetadata,
    getWaveformData,
    isLiveKitLive,
    liveKitState,
    liveKitError,
    isLiveKitListening,
    connectLiveKitListener,
    disconnectLiveKitListener,
    unlockLiveAudio
  } = useRadioPlayer();

  // If station is broadcasting via LiveKit, listen state dominates
  const activeIsListening = (liveKitState === 'listening');
  const activeIsWaiting = (liveKitState === 'waiting_for_broadcaster');
  const activeIsConnecting = (liveKitState === 'connecting');
  const activeIsAutoplayBlocked = (liveKitState === 'autoplay_blocked');
  const activeIsLive = isLiveKitLive || (state === 'live') || activeIsListening;
  const activeIsPlaying = activeIsListening || (state === 'live' && isPlaying);
  const activeIsOffline = !activeIsLive && !activeIsConnecting && !activeIsWaiting && !activeIsListening;
  const activeIsError = Boolean(liveKitError) || (state === 'error' && !isLiveKitLive);

  // Auto-disconnect LiveKit listener if broadcast concludes
  useEffect(() => {
    if (!isLiveKitLive && activeIsListening) {
      disconnectLiveKitListener();
    }
  }, [isLiveKitLive, activeIsListening, disconnectLiveKitListener]);

  // Real or active broadcast details
  const displayShow = dbMetadata?.current_show_title || (activeIsLive ? currentBroadcast?.title : 'Studio Standby');
  const displayRj = dbMetadata?.current_rj || (activeIsLive ? currentBroadcast?.host : null);
  const displayTrack = dbMetadata?.current_track || trackMetadata?.title || null;
  const displayArtist = dbMetadata?.current_artist || trackMetadata?.artist || null;

  const handlePlayToggle = () => {
    if (activeIsAutoplayBlocked) {
      unlockLiveAudio();
      return;
    }
    if (activeIsPlaying || activeIsWaiting) {
      disconnectLiveKitListener();
      return;
    }
    connectLiveKitListener();
  };


  return (
    <div className="broadcast-console-root">

      {/* Main Broadcast Console Card */}
      <motion.div
        className="broadcast-console-card"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Subtle Ambient Radio Waves Radiating from Console Center */}
        <div className="console-waves-halo" aria-hidden="true">
          <RadioWave isPlaying={activeIsPlaying} size={520} />
        </div>

        {/* Console Header Bar */}
        <div className="console-top-bar font-mono">
          <div className="console-frequency-badge">
            <Radio size={13} className="freq-icon" />
            <span>104.2 FM</span>
            <span className="bullet-sep">•</span>
            <span>{isLiveKitLive ? 'LIVE RJ STUDIO' : 'CAMPUSWAVE STEREO'}</span>
          </div>

          <div className="console-status-cluster">
            {/* Listener count - only shown when real source exists */}
            {listenerCount !== null && (
              <div className="listener-count-pill">
                <Users size={12} />
                <span>{listenerCount.toLocaleString()} LISTENING</span>
              </div>
            )}

            <div className="console-status-indicator">
              {activeIsListening ? (
                <span className="live-status-pill">
                  <span className="pill-dot dot-live" />
                  <span>LISTENING LIVE</span>
                </span>
              ) : activeIsWaiting ? (
                <span className="connecting-status-pill" style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                  <span className="pill-dot dot-connecting" style={{ background: '#f59e0b' }} />
                  <span>WAITING FOR BROADCASTER</span>
                </span>
              ) : activeIsConnecting ? (
                <span className="connecting-status-pill">
                  <span className="pill-dot dot-connecting" />
                  <span>CONNECTING</span>
                </span>
              ) : activeIsLive ? (
                <span className="live-status-pill">
                  <span className="pill-dot dot-live" />
                  <span>RJ ON AIR</span>
                </span>
              ) : activeIsError ? (
                <span className="error-status-pill">
                  <AlertCircle size={12} />
                  <span>TRANSMISSION ERROR</span>
                </span>
              ) : (
                <span className="offline-status-pill">
                  <span className="pill-dot dot-offline" />
                  <span>OFF AIR</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center Mascot & Station Branding */}
        <div className="console-center-stage">
          <div className="console-logo-mount">
            <BrandLogo variant="hero" size={148} showGlow={activeIsPlaying} className="console-dinosaur-emblem" />
          </div>

              <div className="console-identity-text">
                <h2 className="console-station-name font-display">CampusWave Radio</h2>
                {activeIsListening ? (
                  <>
                    <div className="console-show-title font-display">
                      Show: {displayShow || 'Live Campus Broadcast'}
                    </div>
                    {displayRj && (
                      <div className="console-rj-name font-mono">
                        RJ: {displayRj}
                      </div>
                    )}
                    <p className="console-state-msg font-mono" style={{ color: '#10b981' }}>
                      Broadcasting live from the CampusWave RJ Studio.
                    </p>
                  </>
                ) : activeIsWaiting ? (
                  <>
                    <div className="console-show-title font-display">Waiting for Broadcaster</div>
                    <p className="console-state-msg font-mono" style={{ color: '#f59e0b' }}>
                      Connected to live studio. Audio will begin automatically when RJ speaks.
                    </p>
                  </>
                ) : activeIsLive ? (
                  <>
                    <div className="console-show-title font-display">
                      Show: {displayShow || 'Live Campus Broadcast'}
                    </div>
                    {displayRj && (
                      <div className="console-rj-name font-mono">
                        RJ: {displayRj}
                      </div>
                    )}
                    <p className="console-state-msg font-mono">
                      Broadcasting live from the CampusWave RJ Studio. Click Listen Live to tune in.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="console-show-title font-display">OFF AIR</div>
                    <p className="console-state-msg font-mono">
                      CampusWave is currently not broadcasting. Click Listen Live to stand by.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Current Song / Content Badge if emitting */}
            {displayTrack && (
              <div className="console-track-banner font-mono">
                <Music2 size={14} className="track-icon" />
                <span className="track-label">NOW PLAYING:</span>
                <span className="track-info">
                  {displayTrack} {displayArtist ? `— ${displayArtist}` : ''}
                </span>
              </div>
            )}

            {/* Autoplay Interruption Banner if browser blocked sound */}
            {isLiveKitLive && liveKitState === 'autoplay_blocked' && (
              <div className="console-autoplay-prompt font-mono" style={{ margin: '0 auto 16px', textAlign: 'center' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={unlockLiveAudio}
                  style={{ background: '#ec4899', borderColor: '#f472b6', gap: '8px', padding: '10px 20px' }}
                >
                  <Volume1 size={18} />
                  <span>TAP TO LISTEN</span>
                </button>
              </div>
            )}

        {/* Waveform Visualization Tray */}
        <div className="console-waveform-tray" aria-label="Audio Waveform Display">
          <Waveform
            isPlaying={activeIsPlaying}
            isOffline={activeIsOffline || activeIsError}
            isConnecting={activeIsConnecting}
            getWaveformData={getWaveformData}
            height={68}
            barsCount={48}
          />
          <div className="console-waveform-meta font-mono">
            <span>TRANSMISSION: 104.20 MHz</span>
            <span>{isLiveKitLive ? 'WEBRTC PCM FEED' : 'ACOUSTIC SPECTRUM'}</span>
            <span>DIGITAL STEREO</span>
          </div>
        </div>

        {/* Primary Controls Cluster: Large Play Button & Volume Controls */}
        <div className="console-controls-cluster">
          <button
            type="button"
            className={`console-play-btn font-mono ${activeIsPlaying ? 'playing' : ''} ${activeIsWaiting ? 'waiting' : ''} ${(activeIsLive || activeIsPlaying) ? 'pulsing-live' : ''}`}
            onClick={handlePlayToggle}
            disabled={activeIsConnecting}
            aria-label={activeIsPlaying ? 'Stop listening' : activeIsWaiting ? 'Stop waiting' : 'Listen Live'}
            title={activeIsPlaying ? 'Stop listening' : activeIsWaiting ? 'Stop waiting' : 'Listen Live'}
          >
            {activeIsPlaying ? (
              <>
                <Square size={20} fill="currentColor" />
                <span>STOP LISTENING</span>
              </>
            ) : activeIsWaiting ? (
              <>
                <Square size={20} fill="currentColor" />
                <span>STOP WAITING</span>
              </>
            ) : activeIsConnecting ? (
              <>
                <Play size={20} fill="currentColor" />
                <span>CONNECTING...</span>
              </>
            ) : (
              <>
                <Play size={20} fill="currentColor" />
                <span>LISTEN LIVE</span>
              </>
            )}
          </button>

          <div className="console-volume-block">
            <button
              type="button"
              className="console-mute-btn"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute CampusWave' : 'Mute CampusWave'}
              title={isMuted ? 'Unmute CampusWave' : 'Mute CampusWave'}
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

        {/* Interactive Broadcast Action Buttons */}
        <div className="console-broadcast-actions">
          <button
            type="button"
            className="broadcast-action-btn song-request-btn font-mono"
            onClick={() => navigate('/requests?tab=song')}
            aria-label="Submit a song request to the live show"
          >
            <Music2 size={15} />
            <span>SONG REQUEST</span>
          </button>

          <button
            type="button"
            className="broadcast-action-btn shoutout-btn font-mono"
            onClick={() => navigate('/requests?tab=shoutout')}
            aria-label="Submit a campus shout-out to be read on air"
          >
            <MessageSquare size={15} />
            <span>SHOUT-OUT</span>
          </button>
        </div>

        {/* Technical Console Footer */}
        <div className="console-bottom-hardware font-mono">
          <div className="hardware-item">
            <span className="hw-label">CARRIER</span>
            <span className="hw-val">{isLiveKitLive ? 'WEBRTC 48kHz' : '104.2 FM STEREO'}</span>
          </div>
          <div className="hw-sep" />
          <div className="hardware-item">
            <span className="hw-label">TRANSMITTER</span>
            <span className="hw-val">CAMPUS MEDIA BOOTH</span>
          </div>
          <div className="hw-sep" />
          <div className="hardware-item">
            <span className="hw-label">STATUS</span>
            <span className="hw-val">{activeIsLive ? 'ON AIR' : activeIsConnecting ? 'TUNING' : 'STANDBY'}</span>
          </div>
        </div>
      </motion.div>

      {/* If entirely offline and not playing, provide additional reassurance */}
      {!activeIsPlaying && activeIsOffline && !streamUrl && !isLiveKitLive && (
        <div style={{ marginTop: '36px' }}>
          <OfflineState
            upNextBroadcast={upNextBroadcast}
            onScheduleClick={() => navigate('/schedule')}
          />
        </div>
      )}
    </div>
  );
}
