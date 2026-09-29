import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Play, Menu, X } from 'lucide-react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import Logo from './Logo';
import './Navbar.css';

export default function Navbar() {
  const { state } = useAudioPlayer();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleListenLiveClick = () => {
    navigate('/live');
  };

  return (
    <header className="navbar-header">
      <div className="container navbar-container">
        {/* Brand with Campus Wave Dinosaur Logo */}
        <Link to="/" className="navbar-brand" aria-label="Campus Wave Home">
          <Logo size={42} />
          <div className="brand-text">
            <span className="brand-name font-display">CAMPUS WAVE</span>
            <span className="brand-sub font-mono">104.2 FM • COLLEGE RADIO</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="navbar-nav" aria-label="Primary Navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Home
          </NavLink>
          <NavLink
            to="/live"
            className={({ isActive }) => `nav-link nav-link-live ${isActive ? 'active' : ''}`}
          >
            <span className="live-nav-dot" />
            Live Radio
          </NavLink>
          <a href="#schedule" className="nav-link">
            Shows
          </a>
          <span className="nav-link nav-link-future" title="Scheduled for future release">
            Recordings
          </span>
          <span className="nav-link nav-link-future" title="Scheduled for future release">
            Quizzes
          </span>
          <span className="nav-link nav-link-future" title="Scheduled for future release">
            Events
          </span>
          <span className="nav-link nav-link-future" title="Scheduled for future release">
            Download
          </span>
        </nav>

        {/* Status & Prominent Listen Live CTA */}
        <div className="navbar-actions">
          <div className="navbar-status-indicator">
            {state === 'live' ? (
              <span className="badge-on-air">
                <span className="status-dot" />
                ON AIR
              </span>
            ) : state === 'connecting' ? (
              <span className="badge-connecting">
                <span className="status-dot" />
                TUNING
              </span>
            ) : (
              <span className="badge-offline">
                <span className="status-dot" />
                OFFLINE
              </span>
            )}
          </div>

          <button
            type="button"
            className="navbar-listen-btn font-mono"
            onClick={handleListenLiveClick}
            aria-label="Listen Live to Campus Wave"
          >
            <Play size={12} fill="currentColor" />
            <span>LISTEN LIVE</span>
          </button>

          {/* Mobile menu trigger */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </NavLink>
          <NavLink
            to="/live"
            className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Live Radio
          </NavLink>
          <a
            href="#schedule"
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Shows
          </a>
          <span className="mobile-nav-link muted">Recordings (Future Route)</span>
          <span className="mobile-nav-link muted">Quizzes (Future Route)</span>
          <span className="mobile-nav-link muted">Events (Future Route)</span>
          <span className="mobile-nav-link muted">Download (Future Route)</span>
        </div>
      )}
    </header>
  );
}
