import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, ExternalLink } from 'lucide-react';
import BrandLogo from './BrandLogo';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Only display station frequency if explicitly configured in environment
  const stationFrequency = import.meta.env.VITE_STATION_FREQUENCY;

  // Real social links only if configured in environment (never invent fake handles)
  const socialLinks = [
    { name: 'Instagram', url: import.meta.env.VITE_SOCIAL_INSTAGRAM },
    { name: 'Twitter / X', url: import.meta.env.VITE_SOCIAL_TWITTER },
    { name: 'YouTube', url: import.meta.env.VITE_SOCIAL_YOUTUBE },
    { name: 'Spotify', url: import.meta.env.VITE_SOCIAL_SPOTIFY }
  ].filter(item => Boolean(item.url && item.url.startsWith('http')));

  return (
    <footer className="station-footer" aria-label="CampusWave Station Footer">
      <div className="container footer-container">
        <div className="footer-top-grid">
          {/* Brand & Purpose Column */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-brand-link" aria-label="CampusWave Home">
              <BrandLogo variant="footer" showMetadata={Boolean(stationFrequency)} />
            </Link>
            <p className="footer-tagline font-display">Your Campus. Your Voice.</p>
            <p className="footer-desc">
              The student-run broadcasting station connecting college culture, underground sounds, campus discourse, and original student storytelling.
            </p>

            {/* Subtle frequency badge only if frequency is configured */}
            {stationFrequency && (
              <div className="footer-frequency-badge font-mono" aria-label={`Broadcasting on ${stationFrequency}`}>
                <Radio size={13} className="text-accent-blue" />
                <span className="freq-value">{stationFrequency}</span>
                <span className="freq-sep">•</span>
                <span className="freq-label">CAMPUS RADIO</span>
              </div>
            )}
          </div>

          {/* Navigation Links Column 1: Broadcast */}
          <nav className="footer-nav-col" aria-label="Broadcast Links">
            <h4 className="footer-nav-heading font-mono">BROADCAST</h4>
            <ul className="footer-links-list">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/live">Live</Link></li>
              <li><Link to="/shows">Shows</Link></li>
              <li><Link to="/schedule">Schedule</Link></li>
            </ul>
          </nav>

          {/* Navigation Links Column 2: Campus & Platform */}
          <nav className="footer-nav-col" aria-label="Platform Links">
            <h4 className="footer-nav-heading font-mono">CAMPUS</h4>
            <ul className="footer-links-list">
              <li><Link to="/events">Events</Link></li>
              <li><Link to="/announcements">Announcements</Link></li>
              <li><Link to="/requests">Requests & Shout-outs</Link></li>
              <li><Link to="/join">Join the Club</Link></li>
            </ul>
          </nav>

          {/* Navigation Links Column 3: Station Guild */}
          <nav className="footer-nav-col" aria-label="Station Guild Links">
            <h4 className="footer-nav-heading font-mono">STATION</h4>
            <ul className="footer-links-list">
              <li><Link to="/about">About</Link></li>
              <li><Link to="/team">Team</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </nav>

          {/* Optional Social Section: only rendered if real URLs are configured */}
          {socialLinks.length > 0 && (
            <div className="footer-nav-col footer-social-col">
              <h4 className="footer-nav-heading font-mono">CHANNELS</h4>
              <ul className="footer-links-list">
                {socialLinks.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="footer-social-link"
                    >
                      <span>{item.name}</span>
                      <ExternalLink size={11} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom-bar font-mono">
          <div className="footer-copyright">
            &copy; {currentYear} CampusWave
          </div>
          <div className="footer-bottom-meta">
            <span>Student-Operated Broadcast Media</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
