import React from 'react';
import { Radio, Wifi } from 'lucide-react';
import './Footer.css';

export default function Footer({ onReplayIntro }) {
  return (
    <footer className="station-footer">
      <div className="container footer-container">
        <div className="footer-top">
          <div className="footer-brand-col">
            <div className="footer-logo-row">
              <div className="footer-badge-icon">
                <img
                  src="/campus-wave-logo.png"
                  alt="Campus Wave Dinosaur Badge"
                  className="footer-logo-img"
                />
              </div>
              <div className="footer-brand-meta">
                <span className="footer-title">CAMPUS WAVE</span>
                <span className="footer-sub font-mono">104.2 FM • COLLEGE RADIO</span>
              </div>
            </div>
            <p className="footer-tagline">Radio Beyond the Frequency</p>
            <p className="footer-desc">
              Student-curated broadcasting hub connecting campus life, independent music, and open discourse.
            </p>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-heading font-mono">STATION NAV</h4>
            <ul className="footer-list">
              <li><a href="/">Home</a></li>
              <li><a href="/live">Live Radio (Studio Player)</a></li>
              <li><a href="#schedule">Broadcast Schedule</a></li>
            </ul>
          </div>

          <div className="footer-tech-col">
            <h4 className="footer-heading font-mono">TRANSMITTER STATUS</h4>
            <div className="tech-badge">
              <Wifi size={14} className="tech-icon" />
              <span>DIGITAL CARRIER • ONLINE</span>
            </div>
            <p className="tech-meta font-mono">FREQUENCY: 104.2 FM STEREO</p>
            <p className="tech-meta font-mono">CARRIER: LOW POWER CAMPUS RELAY</p>

            {onReplayIntro && (
              <button
                type="button"
                className="replay-ident-btn"
                onClick={onReplayIntro}
                aria-label="Replay Station Ident Intro"
              >
                Replay Station Ident
              </button>
            )}
          </div>
        </div>

        <div className="footer-bottom font-mono">
          <span>&copy; {new Date().getFullYear()} Campus Wave Student Radio. All student productions preserved.</span>
          <span>STUDIO: CAMPUS MEDIA PAVILION ROOM 104</span>
        </div>
      </div>
    </footer>
  );
}
