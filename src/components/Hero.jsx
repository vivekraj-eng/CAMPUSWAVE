import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Calendar, Radio, Activity, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import Logo from './Logo';
import RadioWave from './RadioWave';
import Waveform from './Waveform';
import './Hero.css';

export default function Hero() {
  const { isPlaying, state, currentBroadcast, getWaveformData } = useAudioPlayer();
  const isOffline = state === 'offline';
  const isLive = state === 'live';

  return (
    <section className="hero-section">
      <div className="container hero-container">
        {/* Left Column: Editorial Radio Masthead & Actions */}
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Eyebrow */}
          <div className="hero-eyebrow font-mono">
            <span className="eyebrow-accent-bar" />
            <span className="eyebrow-text">THE COLLEGE RADIO STATION</span>
          </div>

          {/* Station Masthead */}
          <h1 className="hero-masthead font-display">
            CAMPUS WAVE
            <span className="hero-subhead">Radio Beyond the Frequency</span>
          </h1>

          {/* Station Manifesto */}
          <p className="hero-manifesto">
            Real voices. Campus stories.
            <br />
            Music, conversations and moments.
          </p>

          {/* Action CTAs */}
          <div className="hero-actions font-mono">
            <Link to="/live" className="btn-primary" aria-label="Listen Live to Campus Wave">
              <Play size={14} fill="currentColor" />
              <span>LISTEN LIVE</span>
            </Link>

            <a href="#schedule" className="btn-secondary" aria-label="Explore Broadcast Shows">
              <Calendar size={14} />
              <span>EXPLORE SHOWS</span>
            </a>
          </div>

          {/* Refined Radio Status Panel */}
          <div className="hero-status-panel">
            <div className="status-panel-top">
              <div className="status-indicator-tag">
                <span className={`status-dot ${isLive ? 'dot-live' : 'dot-offline'}`} />
                <span className="status-name font-mono">
                  {isLive ? 'TRANSMITTING LIVE' : 'STUDIO STANDBY'}
                </span>
              </div>
              <span className="status-dial font-mono">104.2 FM • DIGITAL STREAM</span>
            </div>

            <div className="status-panel-body">
              <h3 className="status-program-title font-display">
                {isLive && currentBroadcast ? currentBroadcast.title : 'Campus Wave Studio Standby'}
              </h3>
              <p className="status-program-desc">
                {isLive && currentBroadcast
                  ? `With ${currentBroadcast.host} • Timeslot: ${currentBroadcast.timeslot}`
                  : 'The station is currently offline. Check back during the next scheduled broadcast.'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Radio Transmission Panel (Equipment-Inspired) */}
        <motion.div
          className="hero-transmission-column"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="transmission-panel-rack">
            {/* Rack Mounting Screws (Tactile Hardware Aesthetic) */}
            <div className="rack-corner rack-tl" />
            <div className="rack-corner rack-tr" />
            <div className="rack-corner rack-bl" />
            <div className="rack-corner rack-br" />

            {/* Equipment Top Bar */}
            <div className="panel-equipment-header font-mono">
              <div className="equipment-tag">
                <Radio size={12} className="tag-icon" />
                <span>UNIT CW-104</span>
              </div>
              <div className="carrier-frequency">
                <span className="carrier-label">FREQ</span>
                <span className="carrier-val">104.20 MHz</span>
              </div>
            </div>

            {/* Center Dinosaur Mascot Emblem with Acoustic Waves */}
            <div className="transmission-visual-stage">
              <div className="transmission-waves-halo">
                <RadioWave isPlaying={isPlaying} size={340} />
              </div>

              <div className="transmission-mascot-anchor">
                <Logo size={170} showGlow={isPlaying} className="transmission-dinosaur-logo" />
              </div>
            </div>

            {/* Sub-Panel: Live / Resting Audio Spectrum */}
            <div className="transmission-spectrum-card">
              <div className="spectrum-card-header font-mono">
                <div className="spectrum-monitor-label">
                  <Activity size={12} className={isPlaying ? 'icon-live-wave' : ''} />
                  <span>ACOUSTIC SPECTRUM MONITOR</span>
                </div>
                <span className="spectrum-mode">{isLive && isPlaying ? 'LIVE 320K' : 'PASSIVE RX'}</span>
              </div>

              <div className="spectrum-canvas-slot">
                <Waveform
                  isPlaying={isPlaying}
                  isOffline={isOffline}
                  getWaveformData={getWaveformData}
                  height={50}
                  barsCount={38}
                />
              </div>
            </div>

            {/* Equipment Bottom Metadata Labels */}
            <div className="panel-equipment-footer font-mono">
              <div className="footer-meta-item">
                <span className="meta-key">TRANSMITTER</span>
                <span className="meta-val">ROOM 104</span>
              </div>
              <div className="footer-divider" />
              <div className="footer-meta-item">
                <span className="meta-key">CARRIER</span>
                <span className="meta-val">104.2 FM</span>
              </div>
              <div className="footer-divider" />
              <div className="footer-meta-item">
                <span className="meta-key">RELAY</span>
                <span className="meta-val">DIGITAL STREAM</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
