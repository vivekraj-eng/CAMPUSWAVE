import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Mic,
  Radio,
  Calendar,
  Headphones,
  Music2,
  Megaphone,
  Award,
  Bell,
  CalendarDays,
  MessageSquare,
  ArrowLeft,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import BrandLogo from '../BrandLogo';
import { useAuth } from '../../context/AuthContext';
import './AdminSidebar.css';

export default function AdminSidebar({
  counts = {},
  onNavigateMobile = () => {}
}) {
  const { signOut } = useAuth();

  const navItems = [
    {
      to: '/admin',
      end: true,
      label: 'Overview',
      icon: LayoutDashboard,
      badge: counts.totalNeedsAttention > 0 ? counts.totalNeedsAttention : null,
      badgeType: 'amber'
    },
    {
      to: '/admin/staff',
      label: 'Staff Access',
      icon: ShieldAlert
    },
    {
      to: '/admin/students',
      label: 'Students',
      icon: Users
    },
    {
      to: '/admin/team',
      label: 'RJs / Team',
      icon: Mic
    },
    {
      to: '/admin/shows',
      label: 'Shows',
      icon: Radio
    },
    {
      to: '/admin/schedule',
      label: 'Schedule',
      icon: Calendar
    },
    {
      to: '/admin/podcasts',
      label: 'Podcasts',
      icon: Headphones
    },
    {
      to: '/admin/requests',
      label: 'Requests',
      icon: Music2,
      badge: counts.pendingRequests > 0 ? counts.pendingRequests : null,
      badgeType: 'cyan'
    },
    {
      to: '/admin/shoutouts',
      label: 'Shout-outs',
      icon: Megaphone,
      badge: counts.pendingShoutouts > 0 ? counts.pendingShoutouts : null,
      badgeType: 'purple'
    },
    {
      to: '/admin/applications',
      label: 'Applications',
      icon: Award,
      badge: counts.pendingApplications > 0 ? counts.pendingApplications : null,
      badgeType: 'amber'
    },
    {
      to: '/admin/announcements',
      label: 'Announcements',
      icon: Bell
    },
    {
      to: '/admin/events',
      label: 'Events',
      icon: CalendarDays
    },
    {
      to: '/admin/messages',
      label: 'Contact Messages',
      icon: MessageSquare,
      badge: counts.newContactMessages > 0 ? counts.newContactMessages : null,
      badgeType: 'red'
    }
  ];

  return (
    <aside className="station-admin-sidebar radio-card" aria-label="Station Administration Navigation">
      {/* Brand Masthead */}
      <div className="admin-sidebar-brand">
        <BrandLogo variant="compact" size={38} asLink to="/" />
        <div className="brand-text-block">
          <div className="brand-name font-display">CAMPUSWAVE</div>
          <div className="station-role-tag font-mono">
            <span className="dot-live" />
            STATION ADMIN
          </div>
        </div>
      </div>

      {/* Main Admin Navigation */}
      <nav className="admin-sidebar-nav" aria-label="Station Admin Modules">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `admin-nav-item font-mono ${isActive ? 'active' : ''}`
              }
              onClick={onNavigateMobile}
            >
              <Icon size={16} className="nav-icon" />
              <span className="nav-label">{item.label}</span>
              {item.badge && (
                <span className={`nav-badge badge-${item.badgeType || 'default'}`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="admin-sidebar-footer font-mono">
        <Link to="/" className="sidebar-footer-btn back" onClick={onNavigateMobile}>
          <ArrowLeft size={15} />
          <span>Back to CampusWave</span>
        </Link>
        <button
          type="button"
          className="sidebar-footer-btn signout"
          onClick={() => {
            onNavigateMobile();
            signOut();
          }}
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
