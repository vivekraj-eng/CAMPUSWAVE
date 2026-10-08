import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Radio,
  RadioTower,
  Play,
  Square,
  AlertCircle,
  Signal,
  Users,
  Music2,
  ChevronDown,
  ChevronUp,
  Check,
  RefreshCw,
  Clock,
  Volume2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { liveAudioService } from '../../services/liveAudioService';
import { radioService } from '../../services/radio-service';
import './RjLiveStudio.css';

/**
 * CampusWave RJ Live Studio
 * REAL Radio Broadcaster Console.
 * Microhpone capture -> LiveKit WebRTC SFU -> Listeners.
 */
export default function RjLiveStudio({
  assignedShows = [],
  requests = [],
  shoutouts = [],
  onUpdateRequestStatus,
  onUpdateShoutoutStatus
}) {
  const { user, profile } = useAuth();
  const [liveState, setLiveState] = useState(() => liveAudioService.getSnapshot());
  const [selectedShowTitle, setSelectedShowTitle] = useState('');
  const [customShowTitle, setCustomShowTitle] = useState('');
  const [micLevel, setMicLevel] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeStationBroadcast, setActiveStationBroadcast] = useState(null);
  const [isCheckingStation, setIsCheckingStation] = useState(true);
  const [showLiveRequestsDrawer, setShowLiveRequestsDrawer] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const meterIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Subscribe to live audio service state
  useEffect(() => {
    const unsub = liveAudioService.subscribe((snapshot) => {
      setLiveState(snapshot);
    });
    return () => unsub();
  }, []);

  // Poll real microphone VU level from physical Web Audio AnalyserNode
  useEffect(() => {
    if (liveState.broadcasterState === 'mic_ready' || liveState.broadcasterState === 'live') {
      meterIntervalRef.current = setInterval(() => {
        setMicLevel(liveAudioService.getMicLevel());
      }, 50); // 20fps VU meter
    } else {
      setMicLevel(0);
      if (meterIntervalRef.current) clearInterval(meterIntervalRef.current);
    }
    return () => {
      if (meterIntervalRef.current) clearInterval(meterIntervalRef.current);
    };
  }, [liveState.broadcasterState]);

  // Live session duration timer
  useEffect(() => {
    if (liveState.broadcasterState === 'live' && liveState.broadcastStartTime) {
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - liveState.broadcastStartTime) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
    } else {
      setElapsedSeconds(0);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [liveState.broadcasterState, liveState.broadcastStartTime]);

  // Check station-wide broadcast state
  const checkStationState = async () => {
    setIsCheckingStation(true);
    try {
      const data = await radioService.getNowPlaying();
      setActiveStationBroadcast(data);
    } catch {
      // Ignored
    } finally {
      setIsCheckingStation(false);
    }
  };

  useEffect(() => {
    checkStationState();
    const interval = setInterval(checkStationState, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  const handleRequestMic = async () => {
    await liveAudioService.requestMicrophone();
  };

  const handleStartBroadcast = async () => {
    const effectiveShow = selectedShowTitle === 'custom'
      ? (customShowTitle.trim() || 'Live CampusWave Broadcast')
      : (selectedShowTitle || assignedShows[0]?.title || 'Live CampusWave Broadcast');

    const res = await liveAudioService.startBroadcast({
      user,
      profile,
      showTitle: effectiveShow
    });

    if (res.success) {
      await checkStationState();
    }
  };

  const handleStopBroadcast = async () => {
    await liveAudioService.stopBroadcast();
    await checkStationState();
  };

  const handleToggleMute = () => {
    liveAudioService.toggleMute();
  };

  const isLive = liveState.broadcasterState === 'live';
  const isMicReady = liveState.broadcasterState === 'mic_ready';
  const isConnecting = liveState.broadcasterState === 'connecting';
  const isRequestingMic = liveState.broadcasterState === 'requesting_mic';
  const rjName = profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'CampusWave RJ');

  const anotherRjIsLive = activeStationBroadcast?.is_live &&
    activeStationBroadcast?.current_rj &&
    activeStationBroadcast?.current_rj !== rjName &&
    !isLive;

  // Genuine pending requests
  const pendingRequests = requests.filter(
    (r) => (r.status || 'pending').toLowerCase() === 'pending'
  );
  const pendingShoutouts = shoutouts.filter(
    (s) => (s.status || 'pending').toLowerCase() === 'pending'
  );

  const handleLiveRequestAction = async (id, status) => {
    if (!onUpdateRequestStatus) return;
    setProcessingId(id);
    try {
      await onUpdateRequestStatus(id, status);
    } finally {
      setProcessingId(null);
    }
  };

  const handleLiveShoutoutAction = async (id, status) => {
    if (!onUpdateShoutoutStatus) return;
    setProcessingId(id);
    try {
      await onUpdateShoutoutStatus(id, status);
    } finally {
      setProcessingId(null);
    }
  };

  // Helper to render text-based and visual VU blocks (e.g. ████████░░░░)
  const renderVuBlocks = (level) => {
    const totalBlocks = 12;
    const filledBlocks = Math.round((level / 100) * totalBlocks);
    return '█'.repeat(filledBlocks) + '░'.repeat(totalBlocks - filledBlocks);
  };

  const currentShowDisplay = selectedShowTitle === 'custom'
    ? (customShowTitle.trim() || 'Custom Show')
    : (selectedShowTitle || assignedShows[0]?.title || 'Live CampusWave Broadcast');

  return (
    <div className="rj-broadcast-console" id="rj-live-studio-console">
      {/* Console Top Header */}
      <div className="console-header-card">
        <div className="console-brand-row">
          <div className="console-brand-left font-mono">
            <RadioTower size={18} className="console-tower-icon" />
            <span className="console-brand-text">CAMPUSWAVE LIVE STUDIO</span>
          </div>

          {/* Header Status Badge */}
          <div className="console-state-badge font-mono">
            {isLive ? (
              <span className="badge-live-now">
                <span className="live-blink-dot" />
                <span>🔴 LIVE NOW</span>
              </span>
            ) : isMicReady ? (
              <span className="badge-ready">
                <span className="ready-dot" />
                <span>🟢 READY TO BROADCAST</span>
              </span>
            ) : (
              <span className="badge-off-air">
                <span className="off-air-dot" />
                <span>🔴 OFF AIR</span>
              </span>
            )}
          </div>
        </div>

        {/* Station Conflict Alert */}
        {anotherRjIsLive && (
          <div className="console-alert alert-warning font-mono">
            <AlertCircle size={16} />
            <span>
              CAMPUSWAVE is already live with another RJ ({activeStationBroadcast.current_rj}).
              Station allows one broadcast at a time.
            </span>
          </div>
        )}

        {/* Real Error Banner */}
        {liveState.broadcasterError && (
          <div className="console-alert alert-error font-mono">
            <AlertCircle size={16} />
            <span>{liveState.broadcasterError}</span>
          </div>
        )}
      </div>

      {/* Main Console Body */}
      <div className="console-main-panel">
        {/* ================================================================
            STATE 1: OFF AIR (Microphone not yet enabled)
            ================================================================ */}
        {!isMicReady && !isLive && (
          <div className="console-stage stage-off-air">
            <div className="stage-meta-grid font-mono">
              <div className="meta-block">
                <span className="meta-label">Broadcasting as:</span>
                <strong className="meta-value text-white">{rjName}</strong>
              </div>

              <div className="meta-block">
                <span className="meta-label">Microphone:</span>
                <span className="meta-value text-muted">[ Not Connected ]</span>
              </div>

              <div className="meta-block show-selector-block">
                <label className="meta-label" htmlFor="rj-show-select">Current Show:</label>
                <select
                  id="rj-show-select"
                  className="console-select font-mono"
                  value={selectedShowTitle}
                  onChange={(e) => setSelectedShowTitle(e.target.value)}
                >
                  {assignedShows.length > 0 ? (
                    <>
                      {assignedShows.map((s) => (
                        <option key={s.id} value={s.title}>
                          {s.title}
                        </option>
                      ))}
                      <option value="custom">-- Custom Broadcast Segment --</option>
                    </>
                  ) : (
                    <>
                      <option value="Live CampusWave Broadcast">Live CampusWave Broadcast</option>
                      <option value="custom">-- Custom Broadcast Segment --</option>
                    </>
                  )}
                </select>

                {selectedShowTitle === 'custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom show title..."
                    className="console-input font-mono"
                    value={customShowTitle}
                    onChange={(e) => setCustomShowTitle(e.target.value)}
                  />
                )}
              </div>
            </div>

            <div className="console-action-row">
              <button
                type="button"
                className="btn-console btn-enable-mic font-mono"
                disabled={isRequestingMic}
                onClick={handleRequestMic}
              >
                <Mic size={20} />
                <span>{isRequestingMic ? 'REQUESTING PERMISSION...' : 'ENABLE MICROPHONE'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ================================================================
            STATE 2: READY TO BROADCAST (Microphone enabled, level active)
            ================================================================ */}
        {isMicReady && !isLive && (
          <div className="console-stage stage-ready">
            <div className="stage-meta-grid font-mono">
              <div className="meta-block">
                <span className="meta-label">Broadcasting as:</span>
                <strong className="meta-value text-white">{rjName}</strong>
              </div>

              <div className="meta-block">
                <span className="meta-label">Current Show:</span>
                <strong className="meta-value text-purple">{currentShowDisplay}</strong>
              </div>

              <div className="meta-block">
                <span className="meta-label">Microphone:</span>
                <span className="meta-value text-green">[ ● READY ]</span>
              </div>
            </div>

            {/* Real Microphone Level VU Meter */}
            <div className="vu-meter-card font-mono">
              <div className="vu-label-row">
                <span className="vu-title">Microphone Level:</span>
                <span className="vu-text-blocks">{renderVuBlocks(micLevel)}</span>
                <span className="vu-numeric">{micLevel}%</span>
              </div>

              <div className="vu-bar-track">
                <div
                  className={`vu-bar-fill ${micLevel > 85 ? 'peak' : micLevel > 60 ? 'warm' : 'normal'}`}
                  style={{ width: `${micLevel}%` }}
                />
              </div>

              <div className="vu-footer-row">
                <span>-∞ dB</span>
                <span>-24</span>
                <span>-12</span>
                <span>-6</span>
                <span>0 dB</span>
                <span className={micLevel > 85 ? 'text-red' : 'text-muted'}>PEAK</span>
              </div>
            </div>

            <div className="console-action-row">
              <button
                type="button"
                className="btn-console btn-start-live font-mono"
                disabled={isConnecting || anotherRjIsLive}
                onClick={handleStartBroadcast}
              >
                <Play size={20} fill="currentColor" />
                <span>{isConnecting ? 'CONNECTING TO AIR...' : 'START LIVE'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ================================================================
            STATE 3: LIVE NOW (Transmitting live WebRTC audio)
            ================================================================ */}
        {isLive && (
          <div className="console-stage stage-live">
            <div className="stage-meta-grid font-mono">
              <div className="meta-block">
                <span className="meta-label">Broadcasting as:</span>
                <strong className="meta-value text-white">{rjName}</strong>
              </div>

              <div className="meta-block">
                <span className="meta-label">Current Show:</span>
                <strong className="meta-value text-purple">{currentShowDisplay}</strong>
              </div>

              <div className="meta-block">
                <span className="meta-label">Broadcast Time:</span>
                <strong className="meta-value text-red timer-pulse">{formatTimer(elapsedSeconds)}</strong>
              </div>

              <div className="meta-block">
                <span className="meta-label">Connection:</span>
                <strong className="meta-value text-green">CONNECTED</strong>
              </div>

              <div className="meta-block">
                <span className="meta-label">Listeners:</span>
                <strong className="meta-value text-cyan">
                  {liveState.listenerCount !== null ? liveState.listenerCount : 0}
                </strong>
              </div>

              <div className="meta-block">
                <span className="meta-label">Microphone Status:</span>
                <strong className={`meta-value ${liveState.isMuted ? 'text-amber' : 'text-green'}`}>
                  {liveState.isMuted ? 'HARDWARE MUTED' : 'ON AIR'}
                </strong>
              </div>
            </div>

            {/* Real Microphone Level Meter */}
            <div className="vu-meter-card font-mono">
              <div className="vu-label-row">
                <span className="vu-title">Microphone Level:</span>
                <span className="vu-text-blocks">{renderVuBlocks(liveState.isMuted ? 0 : micLevel)}</span>
                <span className="vu-numeric">{liveState.isMuted ? 'MUTED' : `${micLevel}%`}</span>
              </div>

              <div className="vu-bar-track">
                <div
                  className={`vu-bar-fill ${liveState.isMuted ? 'muted' : micLevel > 85 ? 'peak' : micLevel > 60 ? 'warm' : 'normal'}`}
                  style={{ width: `${liveState.isMuted ? 0 : micLevel}%` }}
                />
              </div>

              <div className="vu-footer-row">
                <span>-∞ dB</span>
                <span>-24</span>
                <span>-12</span>
                <span>-6</span>
                <span>0 dB</span>
                <span className={micLevel > 85 && !liveState.isMuted ? 'text-red' : 'text-muted'}>PEAK</span>
              </div>
            </div>

            {/* Live Broadcaster Controls Cluster */}
            <div className="console-action-row live-action-row">
              <button
                type="button"
                className={`btn-console btn-mute font-mono ${liveState.isMuted ? 'is-muted' : ''}`}
                onClick={handleToggleMute}
              >
                {liveState.isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                <span>{liveState.isMuted ? 'UNMUTE MICROPHONE' : 'MUTE MICROPHONE'}</span>
              </button>

              <button
                type="button"
                className="btn-console btn-stop-live font-mono"
                onClick={handleStopBroadcast}
              >
                <Square size={18} fill="currentColor" />
                <span>STOP LIVE</span>
              </button>
            </div>
          </div>
        )}

        {/* ================================================================
            REQUESTS & SHOUT-OUTS (During Live or Standby)
            ================================================================ */}
        <div className="console-requests-section font-mono">
          <div className="requests-header-bar">
            <div className="requests-title">
              <Music2 size={16} />
              <span>REQUESTS & SHOUT-OUTS</span>
            </div>

            <div className="requests-badges">
              <span className="req-pill">Song requests: {pendingRequests.length}</span>
              <span className="req-pill">Shout-outs: {pendingShoutouts.length}</span>

              <button
                type="button"
                className="btn-expand-reqs"
                onClick={() => setShowLiveRequestsDrawer(!showLiveRequestsDrawer)}
              >
                <span>{showLiveRequestsDrawer ? 'Close Queue' : 'Open Queue'}</span>
                {showLiveRequestsDrawer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showLiveRequestsDrawer && (
              <motion.div
                className="requests-drawer-body"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Song Requests Sub-List */}
                <div className="queue-block">
                  <div className="queue-block-title">PENDING TRACK REQUESTS ({pendingRequests.length})</div>
                  {pendingRequests.length === 0 ? (
                    <p className="queue-empty">No pending track requests in queue.</p>
                  ) : (
                    <div className="queue-items">
                      {pendingRequests.slice(0, 6).map((req) => (
                        <div key={req.id} className="queue-item">
                          <div className="queue-item-info">
                            <strong>{req.song_title}</strong>
                            <span>{req.artist_name || 'Unknown artist'}</span>
                          </div>
                          <button
                            type="button"
                            className="btn-req-action"
                            disabled={processingId === req.id}
                            onClick={() => handleLiveRequestAction(req.id, 'played')}
                          >
                            <Check size={12} />
                            <span>PLAYED</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Shoutouts Sub-List */}
                <div className="queue-block" style={{ marginTop: '14px' }}>
                  <div className="queue-block-title">PENDING SHOUT-OUTS ({pendingShoutouts.length})</div>
                  {pendingShoutouts.length === 0 ? (
                    <p className="queue-empty">No pending shout-outs in queue.</p>
                  ) : (
                    <div className="queue-items">
                      {pendingShoutouts.slice(0, 6).map((so) => (
                        <div key={so.id} className="queue-item">
                          <div className="queue-item-info">
                            <strong>For: {so.recipient_name}</strong>
                            <span className="quote-text">"{so.message}"</span>
                          </div>
                          <button
                            type="button"
                            className="btn-req-action"
                            disabled={processingId === so.id}
                            onClick={() => handleLiveShoutoutAction(so.id, 'approved')}
                          >
                            <Check size={12} />
                            <span>DELIVERED</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
