import React from 'react';
import { Wifi, Radio } from 'lucide-react';
import Logo from './Logo';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="station-footer">
      <div className="container footer-container">
        <div className="footer-top">
          <div className="footer-brand-col">
            <div className="footer-logo-row">
              <Logo size={38} />
              <div className="footer-brand-meta">
                <span className="footer-title font-display">CAMPUS WAVE</span>
                <span className="footer-sub font-mono">104.2 FM • COLLEGE RADIO</span>
              </div>
            </div>
            <p className="footer-tagline">Radio Beyond the Frequency</p>
            <p className="footer-desc">
              Student-curated broadcasting hub connecting campus life, independent music, and open discourse.
            </p>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-heading font-mono">BROADCAST NAV</h4>
            <ul className="footer-list">
              <li><a href="/">Home</a></li>
              <li><a href="/live">Live Radio (Studio Player)</a></li>
              <li><a href="#schedule">Broadcast Schedule</a></li>
            </ul>
          </div>

          <div className="footer-tech-col">
            <h4 className="footer-heading font-mono">TRANSMITTER CARRIER</h4>
            <div className="tech-badge font-mono">
              <Wifi size={13} className="tech-icon" />
              <span>CARRIER STANDBY • 104.2 FM</span>
            </div>
            <p className="tech-meta font-mono">STUDIO: CAMPUS MEDIA PAVILION ROOM 104</p>
            <p className="tech-meta font-mono">TRANSMITTER: LOW-POWER CAMPUS RELAY</p>
          </div>
        </div>

        <div className="footer-bottom font-mono">
          <span>&copy; {new Date().getFullYear()} Campus Wave Student Radio. Autonomous college broadcast.</span>
          <span>CAMPUS AUDIO GUILD</span>
        </div>
      </div>
    </footer>
  );
}
