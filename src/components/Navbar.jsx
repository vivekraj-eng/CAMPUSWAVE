import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Play, Menu, X, ChevronDown, User, LogOut, Radio, LayoutDashboard, Mic, ShieldAlert, LogIn } from 'lucide-react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';
import './Navbar.css';

export default function Navbar() {
  const { state } = useAudioPlayer();
  const { user, profile, role, isAuthenticated, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const moreRef = useRef(null);
  const userRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isMoreActive = ['/announcements', '/events', '/requests', '/join', '/team', '/about', '/contact'].some(path =>
    location.pathname.startsWith(path)
  );

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setMoreDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMoreDropdownOpen(false);
        setUserDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Auto-close on location navigation
  useEffect(() => {
    setMoreDropdownOpen(false);
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleListenLiveClick = () => {
    navigate('/live');
  };

  return (
    <header className="navbar-header">
      <div className="container navbar-container">
        {/* Brand with CampusWave Mascot Emblem & Masthead */}
        <Link to="/" className="navbar-brand-wrapper" aria-label="CampusWave 104.2 FM Home">
          <BrandLogo variant="navbar" showGlow={state === 'live'} />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="navbar-nav" aria-label="Primary Navigation">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Home
          </NavLink>
          <NavLink to="/live" className={({ isActive }) => `nav-link nav-link-live ${isActive ? 'active' : ''}`}>
            <span className="live-nav-dot" />
            Live
          </NavLink>
          <NavLink to="/shows" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Shows
          </NavLink>
          <NavLink to="/schedule" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Schedule
          </NavLink>

          {/* More Dropdown containing Announcements, Events, Requests, Join, Team, About, Contact */}
          <div className="nav-dropdown-wrapper" ref={moreRef}>
            <button
              type="button"
              className={`nav-dropdown-toggle ${moreDropdownOpen ? 'open' : ''} ${isMoreActive ? 'active' : ''}`}
              onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
              aria-expanded={moreDropdownOpen}
            >
              <span>More</span>
              <ChevronDown size={14} className="dropdown-arrow" />
            </button>

            {moreDropdownOpen && (
              <div className="nav-dropdown-menu">
                <NavLink
                  to="/announcements"
                  className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMoreDropdownOpen(false)}
                >
                  Announcements
                </NavLink>
                <NavLink
                  to="/events"
                  className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMoreDropdownOpen(false)}
                >
                  Events
                </NavLink>
                <NavLink
                  to="/requests"
                  className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMoreDropdownOpen(false)}
                >
                  Requests & Shout-outs
                </NavLink>
                <NavLink
                  to="/join"
                  className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMoreDropdownOpen(false)}
                >
                  Join the Club
                </NavLink>
                <NavLink
                  to="/team"
                  className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMoreDropdownOpen(false)}
                >
                  Our Team
                </NavLink>
                <NavLink
                  to="/about"
                  className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMoreDropdownOpen(false)}
                >
                  About
                </NavLink>
                <NavLink
                  to="/contact"
                  className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMoreDropdownOpen(false)}
                >
                  Contact
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        {/* Status, Auth & Prominent Listen Live CTA */}
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
            aria-label="Listen Live to CampusWave"
          >
            <Play size={13} fill="currentColor" />
            <span>LISTEN LIVE</span>
          </button>

          {/* User Account / Auth Dropdown */}
          <div className="nav-user-wrapper" ref={userRef}>
            {isAuthenticated ? (
              <button
                type="button"
                className="user-profile-btn font-mono"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-label="User Account Menu"
              >
                <div className="user-avatar-circle">
                  {role === 'admin' ? <ShieldAlert size={14} /> : role === 'rj' ? <Mic size={14} /> : <User size={14} />}
                </div>
                <span className="user-role-badge">{role}</span>
                <ChevronDown size={13} />
              </button>
            ) : (
              <Link to="/login" className="btn-login font-mono">
                <LogIn size={14} />
                <span>SIGN IN</span>
              </Link>
            )}

            {userDropdownOpen && isAuthenticated && (
              <div className="user-dropdown-menu">
                <div className="user-meta-header">
                  <div className="user-meta-name font-display">{profile?.full_name || user?.email}</div>
                  <div className="user-meta-email font-mono">{user?.email}</div>
                  <div className="user-role-tag font-mono">ROLE: {role.toUpperCase()}</div>
                </div>

                <div className="user-menu-links">
                  <Link to="/dashboard" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                    <LayoutDashboard size={15} />
                    <span>Student Dashboard</span>
                  </Link>

                  {(role === 'rj' || role === 'admin') && (
                    <>
                      <Link to="/rj" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <Mic size={15} />
                        <span>RJ Workspace</span>
                      </Link>
                      <Link to="/live-studio" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                        <Radio size={15} />
                        <span>Live Studio</span>
                      </Link>
                    </>
                  )}

                  {role === 'admin' && (
                    <Link to="/admin" className="dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                      <ShieldAlert size={15} />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                </div>

                <button
                  type="button"
                  className="user-logout-btn font-mono"
                  onClick={() => {
                    signOut();
                    setUserDropdownOpen(false);
                  }}
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu hamburger */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <div className="mobile-drawer-links">
            <NavLink to="/" end className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              Home
            </NavLink>
            <NavLink to="/live" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              Live Radio
            </NavLink>
            <NavLink to="/shows" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              Shows & Podcasts
            </NavLink>
            <NavLink to="/schedule" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              Schedule
            </NavLink>
            <NavLink to="/announcements" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              Announcements
            </NavLink>
            <NavLink to="/events" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              Events
            </NavLink>
            <NavLink to="/requests" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              Requests & Shout-outs
            </NavLink>
            <NavLink to="/join" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              Join the Club
            </NavLink>
            <NavLink to="/team" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              Our Team
            </NavLink>
            <NavLink to="/about" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              About CampusWave
            </NavLink>
            <NavLink to="/contact" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              Contact
            </NavLink>

            <div className="mobile-divider" />

            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" className="mobile-nav-link highlight" onClick={() => setMobileMenuOpen(false)}>
                  Student Dashboard
                </NavLink>
                {(role === 'rj' || role === 'admin') && (
                  <>
                    <NavLink to="/rj" className="mobile-nav-link highlight" onClick={() => setMobileMenuOpen(false)}>
                      RJ Workspace
                    </NavLink>
                    <NavLink to="/live-studio" className="mobile-nav-link highlight" onClick={() => setMobileMenuOpen(false)}>
                      Live Studio
                    </NavLink>
                  </>
                )}
                {role === 'admin' && (
                  <NavLink to="/admin" className="mobile-nav-link highlight" onClick={() => setMobileMenuOpen(false)}>
                    Admin Dashboard
                  </NavLink>
                )}
                <button
                  type="button"
                  className="mobile-nav-link text-left"
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign Out ({user?.email})
                </button>
              </>
            ) : (
              <NavLink to="/login" className="mobile-nav-link highlight" onClick={() => setMobileMenuOpen(false)}>
                Sign In / Register
              </NavLink>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
