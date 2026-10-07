import React from 'react';
import { Menu, X, RefreshCw, Shield, User } from 'lucide-react';
import BrandLogo from '../BrandLogo';
import './AdminHeader.css';

export default function AdminHeader({
  title,
  subtitle,
  isRefreshing,
  onRefresh,
  mobileNavOpen,
  setMobileNavOpen,
  userProfile
}) {
  return (
    <header className="admin-header-bar radio-card">
      <div className="admin-header-left">
        <button
          type="button"
          className="admin-mobile-menu-btn"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileNavOpen}
        >
          {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="admin-header-mobile-brand">
          <BrandLogo variant="compact" size={30} asLink to="/" />
          <span className="mobile-brand-title font-display">CAMPUSWAVE ADMIN</span>
        </div>

        <div className="admin-header-titles">
          <h1 className="admin-header-title font-display">{title}</h1>
          {subtitle && <p className="admin-header-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="admin-header-actions font-mono">
        <button
          type="button"
          className="admin-sync-btn"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Synchronize database records"
        >
          <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
          <span className="sync-btn-text">{isRefreshing ? 'SYNCING...' : 'SYNC DATA'}</span>
        </button>

        <div className="admin-profile-pill">
          <div className="admin-avatar-icon">
            <Shield size={14} />
          </div>
          <div className="admin-pill-meta">
            <span className="admin-pill-name">{userProfile?.full_name || 'Station Director'}</span>
            <span className="admin-pill-role">ADMIN</span>
          </div>
        </div>
      </div>
    </header>
  );
}
