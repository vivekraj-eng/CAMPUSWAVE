import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Radio,
  RadioTower,
  Play,
  Square,
  Volume2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Headphones,
  Signal,
  CheckCircle2,
  Users,
  Music2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { liveAudioService } from '../../services/liveAudioService';
import { radioService } from '../../services/radio-service';
import './RjLiveStudio.css';

/**
 * CampusWave RJ Live Studio
 * Professional college radio control booth.
 * Live WebRTC audio broadcast powered by LiveKit Cloud SFU.
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

  // Subscribe to LiveAudioService state changes
  useEffect(() => {
    const unsub = liveAudioService.subscribe((snapshot) => {
      setLiveState(snapshot);
    });
    return () => unsub();
  }, []);

  // Poll real microphone VU level from physical audio stream
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

  // Live session duration clock
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

  // Check current station-wide broadcast state from Supabase
  const checkStationState = async () => {
    setIsCheckingStation(true);
    try {
      const data = await radioService.getNowPlaying();
      setActiveStationBroadcast(data);
    } catch {
      // Handled silently
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
      ? (customShowTitle.trim() || 'Live Studio Broadcast')
      : (selectedShowTitle || assignedShows[0]?.title || 'Live Studio Broadcast');

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

  // Genuine counts of pending listener requests
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

  return (
    <div className="rj-live-studio-root" id="rj-live-radio-section">
      {/* Studio Header Bar */}
      <div className="radio-card studio-hero-card">
        <div className="studio-hero-top">
          <div className="studio-ident">
            <div className="studio-ident-badge font-mono">
              <RadioTower size={14} className="accent-glow" />
              <span>CAMPUSWAVE LIVE STUDIO</span>
              <span className="dot-divider">•</span>
              <span>104.2 FM STEREO</span>
            </div>
            <h1 className="studio-title font-display">Live Radio Studio</h1>
            <p className="studio-subtitle">
              Broadcast directly from your browser microphone into the campus-wide audio stream.
            </p>
          </div>

          {/* Studio "ON AIR" / "OFF AIR" Sign */}
          <div className={`on-air-sign font-mono ${isLive ? 'is-live' : 'is-off-air'}`}>
            <span className="on-air-led" />
            <span className="on-air-text">{isLive ? '🔴 LIVE' : 'OFF AIR'}</span>
          </div>
        </div>

        {/* Conflict Warning: Another RJ is live */}
        {anotherRjIsLive && (
          <div className="studio-alert-banner alert-warning font-mono">
            <AlertCircle size={16} />
            <div className="alert-content">
              <strong>Station In Use:</strong> CampusWave is already live with another RJ ({activeStationBroadcast.current_rj}){' '}
              <em>"{activeStationBroadcast.current_show_title}"</em>. Wait until their broadcast concludes.
            </div>
          </div>
        )}

        {/* Error Banner */}
        {liveState.broadcasterError && (
          <div className="studio-alert-banner alert-danger font-mono">
            <AlertCircle size={16} />
            <div className="alert-content">
              <strong>Broadcast Error:</strong> {liveState.broadcasterError}
            </div>
          </div>
        )}
      </div>

      {/* Main Studio Console Grid */}
      <div className="studio-console-grid">
        {/* Left Column: Transmission Controls */}
        <div className="radio-card studio-panel controls-panel">
          <div className="panel-header font-mono">
            <span className="panel-title">1. BROADCAST CONTROLS</span>
            <span className="panel-status-pill">
              {isLive ? 'TRANSMITTING' : isMicReady ? 'MIC ARMED' : 'STANDBY'}
            </span>
          </div>

          {/* Show Selection */}
          <div className="studio-form-group">
            <label className="studio-label font-mono">BROADCAST SEGMENT / SHOW</label>
            <select
              className="studio-select"
              disabled={isLive}
              value={selectedShowTitle}
              onChange={(e) => setSelectedShowTitle(e.target.value)}
            >
              {assignedShows.length > 0 ? (
                <>
                  {assignedShows.map((s) => (
                    <option key={s.id} value={s.title}>
                      {s.title} ({s.category || 'General'})
                    </option>
                  ))}
                  <option value="custom">-- Custom Special Segment --</option>
                </>
              ) : (
                <>
                  <option value="Live Campus Broadcast">Live Campus Broadcast</option>
                  <option value="Indie Hour with RJ">Indie Hour with RJ</option>
                  <option value="Campus Discourse Live">Campus Discourse Live</option>
                  <option value="custom">-- Custom Show Title --</option>
                </>
              )}
            </select>

            {selectedShowTitle === 'custom' && (
              <input
                type="text"
                placeholder="Enter custom broadcast title..."
                className="studio-input"
                disabled={isLive}
                value={customShowTitle}
                onChange={(e) => setCustomShowTitle(e.target.value)}
              />
            )}
          </div>

          {/* Broadcaster Identity & Station Metadata */}
          <div className="broadcaster-meta-box font-mono">
            <div className="meta-row">
              <span className="meta-label">CURRENT RJ:</span>
              <strong className="meta-val">{rjName}</strong>
            </div>
            <div className="meta-row">
              <span className="meta-label">CURRENT SHOW:</span>
              <span className="meta-val">
                {selectedShowTitle === 'custom'
                  ? (customShowTitle || 'Custom Broadcast')
                  : (selectedShowTitle || assignedShows[0]?.title || 'Live Campus Broadcast')}
              </span>
            </div>
            <div className="meta-row">
              <span className="meta-label">MICROPHONE:</span>
              <span className={`meta-val ${liveState.isMuted ? 'text-amber' : isMicReady || isLive ? 'text-green' : 'text-muted'}`}>
                {liveState.isMuted
                  ? 'HARDWARE MUTED'
                  : isLive
                  ? 'ACTIVE ON AIR'
                  : isMicReady
                  ? 'READY / ARMED'
                  : 'NOT CONNECTED'}
              </span>
            </div>
            <div className="meta-row">
              <span className="meta-label">CONNECTION:</span>
              <span className={`meta-val ${isLive ? 'text-green' : isConnecting ? 'text-amber' : 'text-muted'}`}>
                {isLive
                  ? 'CONNECTED (LiveKit SFU)'
                  : isConnecting
                  ? 'CONNECTING...'
                  : 'STANDBY'}
              </span>
            </div>
            {isLive && (
              <>
                <div className="meta-row">
                  <span className="meta-label">LIVE DURATION:</span>
                  <span className="meta-val text-red accent-clock">{formatTimer(elapsedSeconds)}</span>
                </div>
                {liveState.listenerCount !== null && (
                  <div className="meta-row">
                    <span className="meta-label">LISTENERS:</span>
                    <span className="meta-val text-cyan">
                      {liveState.listenerCount} {liveState.listenerCount === 1 ? 'TUNED IN' : 'TUNED IN'}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Main Action Trigger */}
          <div className="studio-action-cluster">
            {!isMicReady && !isLive ? (
              <button
                type="button"
                className="btn-studio-action btn-arm-mic font-mono"
                disabled={isRequestingMic}
                onClick={handleRequestMic}
              >
                <Mic size={18} />
                <span>{isRequestingMic ? 'REQUESTING MICROPHONE...' : 'REQUEST MIC PERMISSION'}</span>
              </button>
            ) : !isLive ? (
              <div className="broadcast-trigger-row">
                <button
                  type="button"
                  className="btn-studio-action btn-go-live font-mono"
                  disabled={isConnecting || anotherRjIsLive}
                  onClick={handleStartBroadcast}
                >
                  <Play size={18} fill="currentColor" />
                  <span>{isConnecting ? 'CONNECTING TO AIR...' : 'START LIVE'}</span>
                </button>
              </div>
            ) : (
              <div className="live-controls-cluster">
                <button
                  type="button"
                  className={`btn-mute-toggle font-mono ${liveState.isMuted ? 'muted' : 'unmuted'}`}
                  onClick={handleToggleMute}
                  title={liveState.isMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {liveState.isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                  <span>{liveState.isMuted ? 'UNMUTE MICROPHONE' : 'MUTE MICROPHONE'}</span>
                </button>

                <button
                  type="button"
                  className="btn-studio-action btn-stop-live font-mono"
                  onClick={handleStopBroadcast}
                >
                  <Square size={16} fill="currentColor" />
                  <span>STOP LIVE</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Physical Audio Level & VU Meter */}
        <div className="radio-card studio-panel meters-panel">
          <div className="panel-header font-mono">
            <span className="panel-title">2. MICROPHONE VU METER</span>
            <span className="panel-signal">
              <Signal size={14} className={isLive ? 'text-green' : 'text-muted'} />
            </span>
          </div>

          {/* Real Audio Volume Bar from Web Audio AnalyserNode */}
          <div className="vu-meter-box">
            <div className="vu-scale font-mono">
              <span>-∞</span>
              <span>-24</span>
              <span>-12</span>
              <span>-6</span>
              <span>-3</span>
              <span>0dB</span>
              <span className="text-red">PEAK</span>
            </div>

            <div className="vu-meter-track">
              <div
                className={`vu-meter-fill ${micLevel > 85 ? 'peak' : micLevel > 60 ? 'warm' : 'normal'}`}
                style={{ width: `${micLevel}%` }}
              />
            </div>

            <div className="vu-indicator-row font-mono">
              <div className="vu-level-badge">
                <span>INPUT LEVEL:</span>
                <strong>{micLevel}%</strong>
              </div>
              <div className="vu-hardware-status">
                {liveState.isMuted ? (
                  <span className="badge-muted">HARDWARE MUTED</span>
                ) : micLevel > 5 ? (
                  <span className="badge-active">SIGNAL ACTIVE</span>
                ) : (
                  <span className="badge-silence">SILENCE</span>
                )}
              </div>
            </div>
          </div>

          {/* Visual Activity Bars (driven directly by Web Audio data) */}
          <div className="studio-wave-bars">
            {Array.from({ length: 16 }).map((_, i) => {
              const activeRatio = (micLevel / 100);
              const heightPercent = Math.max(8, Math.min(100, Math.round(activeRatio * 100 * (1 - Math.abs(i - 8) / 10))));
              return (
                <div
                  key={i}
                  className="wave-bar-col"
                  style={{
                    height: `${heightPercent}%`,
                    opacity: isLive || isMicReady ? 0.3 + (micLevel / 150) : 0.15
                  }}
                />
              );
            })}
          </div>

          {/* Real Listener Requests On-Air Summary */}
          <div className="studio-requests-banner font-mono">
            <div className="requests-banner-head">
              <div className="banner-title-wrap">
                <Music2 size={14} />
                <span>PENDING REQUESTS</span>
              </div>
              <button
                type="button"
                className="btn-toggle-requests"
                onClick={() => setShowLiveRequestsDrawer(!showLiveRequestsDrawer)}
              >
                <span>{showLiveRequestsDrawer ? 'Hide Queue' : 'View Queue'}</span>
                {showLiveRequestsDrawer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            <div className="requests-counts-row">
              <div className="count-pill">
                <span>Song requests:</span>
                <strong>{pendingRequests.length}</strong>
              </div>
              <div className="count-pill">
                <span>Shout-outs:</span>
                <strong>{pendingShoutouts.length}</strong>
              </div>
            </div>

            {/* Expandable Live Queue Drawer */}
            <AnimatePresence>
              {showLiveRequestsDrawer && (
                <motion.div
                  className="live-requests-drawer"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="drawer-inner">
                    <h4 className="drawer-heading">SONG REQUESTS AWAITING PLAY ({pendingRequests.length})</h4>
                    {pendingRequests.length === 0 ? (
                      <p className="drawer-empty-msg">No pending song requests currently in queue.</p>
                    ) : (
                      <div className="drawer-list">
                        {pendingRequests.slice(0, 5).map((req) => (
                          <div key={req.id} className="drawer-item">
                            <div className="item-details">
                              <strong>{req.song_title}</strong>
                              <span>{req.artist_name || 'Various'}</span>
                            </div>
                            <div className="item-actions">
                              <button
                                type="button"
                                className="btn-drawer-action btn-play"
                                disabled={processingId === req.id}
                                onClick={() => handleLiveRequestAction(req.id, 'played')}
                                title="Mark played on air"
                              >
                                <Check size={12} />
                                <span>PLAYED</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <h4 className="drawer-heading" style={{ marginTop: '12px' }}>
                      SHOUT-OUTS AWAITING AIR ({pendingShoutouts.length})
                    </h4>
                    {pendingShoutouts.length === 0 ? (
                      <p className="drawer-empty-msg">No pending shout-outs in queue.</p>
                    ) : (
                      <div className="drawer-list">
                        {pendingShoutouts.slice(0, 4).map((so) => (
                          <div key={so.id} className="drawer-item">
                            <div className="item-details">
                              <strong>For {so.recipient_name}</strong>
                              <span className="quote-text">"{so.message}"</span>
                            </div>
                            <div className="item-actions">
                              <button
                                type="button"
                                className="btn-drawer-action btn-play"
                                disabled={processingId === so.id}
                                onClick={() => handleLiveShoutoutAction(so.id, 'approved')}
                                title="Approve on air"
                              >
                                <Check size={12} />
                                <span>DELIVERED</span>
                              </button>
                            </div>
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
    </div>
  );
}
