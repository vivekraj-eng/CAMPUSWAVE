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
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { liveAudioService } from '../../services/liveAudioService';
import { radioService } from '../../services/radio-service';
import './RjLiveStudio.css';

export default function RjLiveStudio({ assignedShows = [] }) {
  const { user, profile } = useAuth();
  const [liveState, setLiveState] = useState(() => liveAudioService.getSnapshot());
  const [selectedShowTitle, setSelectedShowTitle] = useState('');
  const [customShowTitle, setCustomShowTitle] = useState('');
  const [micLevel, setMicLevel] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeStationBroadcast, setActiveStationBroadcast] = useState(null);
  const [isCheckingStation, setIsCheckingStation] = useState(true);

  const meterIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Subscribe to LiveAudioService state changes
  useEffect(() => {
    const unsub = liveAudioService.subscribe((snapshot) => {
      setLiveState(snapshot);
    });
    return () => unsub();
  }, []);

  // Poll real microphone VU level
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
      // Ignored
    } finally {
      setIsCheckingStation(false);
    }
  };

  useEffect(() => {
    checkStationState();
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
  const rjName = profile?.full_name || user?.user_metadata?.full_name || 'CampusWave RJ';

  const anotherRjIsLive = activeStationBroadcast?.is_live &&
    activeStationBroadcast?.current_rj &&
    activeStationBroadcast?.current_rj !== rjName &&
    !isLive;

  return (
    <div className="rj-live-studio-root">
      {/* Studio Header Bar */}
      <div className="radio-card studio-hero-card">
        <div className="studio-hero-top">
          <div className="studio-ident">
            <div className="studio-ident-badge font-mono">
              <RadioTower size={14} className="accent-glow" />
              <span>TRANSMISSION BOOTH 1</span>
              <span className="dot-divider">•</span>
              <span>104.2 FM STEREO</span>
            </div>
            <h1 className="studio-title font-display">Live Radio Studio</h1>
            <p className="studio-subtitle">
              Broadcast directly from your browser microphone into the campus-wide audio stream.
            </p>
          </div>

          {/* Large Studio "ON AIR" Signage */}
          <div className={`on-air-sign font-mono ${isLive ? 'is-live' : 'is-off-air'}`}>
            <span className="on-air-led" />
            <span className="on-air-text">{isLive ? 'ON AIR' : 'OFF AIR'}</span>
          </div>
        </div>

        {/* Conflict Warning: Another RJ is live */}
        {anotherRjIsLive && (
          <div className="studio-alert-banner alert-warning font-mono">
            <AlertCircle size={16} />
            <div className="alert-content">
              <strong>Station In Use:</strong> {activeStationBroadcast.current_rj} is currently broadcasting{' '}
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
                  <option value="Indie Hour with RJ">Indie Hour</option>
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

          {/* Broadcaster Identity Card */}
          <div className="broadcaster-meta-box font-mono">
            <div className="meta-row">
              <span className="meta-label">LEAD RJ:</span>
              <span className="meta-val">{rjName}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">AUDIO CARRIER:</span>
              <span className="meta-val">WebRTC Stereo 48kHz</span>
            </div>
            {isLive && (
              <div className="meta-row">
                <span className="meta-label">SESSION CLOCK:</span>
                <span className="meta-val text-red accent-clock">{formatTimer(elapsedSeconds)}</span>
              </div>
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
                <span>{isRequestingMic ? 'REQUESTING MICROPHONE...' : 'ENABLE STUDIO MICROPHONE'}</span>
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
                  <span>{isConnecting ? 'CONNECTING TO AIR...' : 'START LIVE BROADCAST'}</span>
                </button>
              </div>
            ) : (
              <div className="live-controls-cluster">
                <button
                  type="button"
                  className={`btn-mute-toggle font-mono ${liveState.isMuted ? 'muted' : 'unmuted'}`}
                  onClick={handleToggleMute}
                >
                  {liveState.isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                  <span>{liveState.isMuted ? 'MIC MUTED' : 'MUTE MIC'}</span>
                </button>

                <button
                  type="button"
                  className="btn-studio-action btn-stop-live font-mono"
                  onClick={handleStopBroadcast}
                >
                  <Square size={16} fill="currentColor" />
                  <span>STOP BROADCAST</span>
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

          {/* Real Audio Volume Bar */}
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

          {/* Broadcaster Guidelines Checklist */}
          <div className="studio-guidelines font-mono">
            <div className="guide-item">
              <CheckCircle2 size={13} className="text-purple" />
              <span>Use headphones to prevent acoustic feedback loop</span>
            </div>
            <div className="guide-item">
              <CheckCircle2 size={13} className="text-purple" />
              <span>Keep microphone 3–5 inches away for optimal vocal clarity</span>
            </div>
            <div className="guide-item">
              <CheckCircle2 size={13} className="text-purple" />
              <span>Listeners receive audio within 200ms across all pages</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
