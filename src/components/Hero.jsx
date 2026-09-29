import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Calendar } from 'lucide-react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import Logo from './Logo';
import RadioWave from './RadioWave';
import Waveform from './Waveform';
import './Hero.css';

export default function Hero() {
  const { isPlaying, state, currentBroadcast, getWaveformData } = useAudioPlayer();
  const isOffline = state === 'offline';

  return (
    <section className="hero-section">
      <div className="container hero-container">
        {/* Left Column: Editorial Headline & Actions */}
        <div className="hero-content">
          <div className="hero-eyebrow font-mono">
            <span className="eyebrow-line" />
            <span className="eyebrow-text">THE COLLEGE RADIO STATION</span>
          </div>

          <h1 className="hero-title font-display">
            CAMPUS WAVE
            <span className="hero-subtext">Radio Beyond the Frequency</span>
          </h1>

          <p className="hero-manifesto">
            Real voices. Campus stories.
            <br />
            Music, conversations and moments.
          </p>

          <div className="hero-cta-group font-mono">
            <Link to="/live" className="btn-primary" aria-label="Listen Live to Campus Wave">
              <Play size={15} fill="currentColor" />
              <span>LISTEN LIVE</span>
            </Link>

            <a href="#schedule" className="btn-secondary" aria-label="Explore Scheduled Shows">
              <Calendar size={15} />
              <span>EXPLORE SHOWS</span>
            </a>
          </div>

          {/* Broadcast Status Pill */}
          <div className="hero-broadcast-strip">
            <div className="strip-status-row">
              <div className="strip-badge">
                <span className={state === 'live' ? 'status-dot dot-live' : 'status-dot dot-offline'} />
                <span className="strip-label font-mono">
                  {state === 'live' ? 'BROADCASTING NOW' : 'STUDIO STANDBY'}
                </span>
              </div>
              <span className="strip-frequency font-mono">104.2 FM • DIGITAL STREAM</span>
            </div>

            <div className="strip-details">
              <span className="strip-show-name font-display">
                {state === 'live' && currentBroadcast ? currentBroadcast.title : 'Campus Wave Studio Standby'}
              </span>
              <span className="strip-show-meta">
                {state === 'live' && currentBroadcast
                  ? `With ${currentBroadcast.host} • ${currentBroadcast.timeslot}`
                  : 'Check transmission schedule below'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Visual identity with Dinosaur Mascot & Waveform */}
        <div className="hero-visual-column">
          <div className="hero-card-frame">
            <div className="hero-waves-halo">
              <RadioWave isPlaying={isPlaying} size={360} />
            </div>

            <div className="hero-mascot-center">
              <Logo size={180} showGlow={isPlaying} className="hero-mascot-img" />
            </div>

            {/* Subtle acoustic waveform graphics (no stock photography) */}
            <div className="hero-waveform-wrapper">
              <Waveform
                isPlaying={isPlaying}
                isOffline={isOffline}
                getWaveformData={getWaveformData}
                height={54}
                barsCount={40}
              />
            </div>

            <div className="hero-card-footer font-mono">
              <span>TRANSMITTER • ROOM 104</span>
              <span>CARRIER 104.2 FM</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
