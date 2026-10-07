import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Music2,
  MessageSquare,
  Calendar,
  Award,
  User,
  Radio,
  LogOut,
  RefreshCw,
  ExternalLink,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboard-service';
import BrandLogo from '../components/BrandLogo';
import StudentProfileCard from '../components/dashboard/StudentProfileCard';
import MyRequestsCard from '../components/dashboard/MyRequestsCard';
import MyShoutoutsCard from '../components/dashboard/MyShoutoutsCard';
import MyApplicationCard from '../components/dashboard/MyApplicationCard';
import MyEventsCard from '../components/dashboard/MyEventsCard';
import QuickActionsCard from '../components/dashboard/QuickActionsCard';
import AccountCard from '../components/dashboard/AccountCard';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';
import ErrorState from '../components/ErrorState';
import './DashboardPage.css';

/**
 * Student Dashboard Page (/dashboard)
 * Authenticated workspace for CampusWave student listeners.
 * Strictly driven by real Supabase student queries — never uses fake operational data.
 */
export default function DashboardPage() {
  const { user, profile: authProfile, isAuthenticated, loading: authLoading, signOut } = useAuth();
  const location = useLocation();

  // Active view tab: 'all' | 'requests' | 'shoutouts' | 'events' | 'application' | 'profile'
  const [activeTab, setActiveTab] = useState('all');

  // Real operational activity state
  const [dashboardData, setDashboardData] = useState({
    profile: null,
    requests: [],
    shoutouts: [],
    applications: [],
    eventRegistrations: []
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Load student dashboard data
  const loadDashboard = useCallback(async () => {
    if (!user?.id) {
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    setFetchError(null);

    const { data, error } = await dashboardService.getStudentDashboardData(user.id, user.email);

    if (error) {
      setFetchError(error.message || 'Unable to load your CampusWave student activity.');
    } else if (data) {
      setDashboardData({
        profile: data.profile || authProfile,
        requests: data.requests || [],
        shoutouts: data.shoutouts || [],
        applications: data.applications || [],
        eventRegistrations: data.eventRegistrations || []
      });
    }

    setDataLoading(false);
  }, [user?.id, user?.email, authProfile]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadDashboard();
    }
  }, [isAuthenticated, user?.id, loadDashboard]);

  // Auth protection check
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login?redirect=/dashboard" state={{ from: location }} replace />;
  }

  // Initial auth session resolving
  if (authLoading) {
    return (
      <div className="student-dashboard-page">
        <div className="container">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  const activeProfile = dashboardData.profile || authProfile;
  const studentFirstName = activeProfile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || '';
  const welcomeGreeting = studentFirstName ? `Welcome back, ${studentFirstName}` : 'Welcome back to CampusWave';

  return (
    <div className="student-dashboard-page">
      <div className="container">
        <div className="dashboard-workspace-layout">
          {/* ================================================================
              Desktop Workspace Left Sidebar
              ================================================================ */}
          <aside className="dashboard-sidebar" aria-label="Student Workspace Navigation">
            <div className="radio-card sidebar-branding-box">
              <BrandLogo variant="navbar" asLink to="/" showMetadata={false} />
              <div className="sidebar-portal-tag font-mono">
                <span className="tag-dot" />
                <span>STUDENT WORKSPACE</span>
              </div>
            </div>

            <nav className="radio-card sidebar-nav-menu font-mono">
              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <div className="sidebar-nav-item-inner">
                  <LayoutDashboard size={16} />
                  <span>Overview</span>
                </div>
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('requests')}
              >
                <div className="sidebar-nav-item-inner">
                  <Music2 size={16} />
                  <span>My Requests</span>
                </div>
                {dashboardData.requests.length > 0 && (
                  <span className="sidebar-count-badge font-mono">{dashboardData.requests.length}</span>
                )}
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'shoutouts' ? 'active' : ''}`}
                onClick={() => setActiveTab('shoutouts')}
              >
                <div className="sidebar-nav-item-inner">
                  <MessageSquare size={16} />
                  <span>My Shout-outs</span>
                </div>
                {dashboardData.shoutouts.length > 0 && (
                  <span className="sidebar-count-badge font-mono">{dashboardData.shoutouts.length}</span>
                )}
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'events' ? 'active' : ''}`}
                onClick={() => setActiveTab('events')}
              >
                <div className="sidebar-nav-item-inner">
                  <Calendar size={16} />
                  <span>Event Passes</span>
                </div>
                {dashboardData.eventRegistrations.length > 0 && (
                  <span className="sidebar-count-badge font-mono">{dashboardData.eventRegistrations.length}</span>
                )}
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'application' ? 'active' : ''}`}
                onClick={() => setActiveTab('application')}
              >
                <div className="sidebar-nav-item-inner">
                  <Award size={16} />
                  <span>Club Application</span>
                </div>
                {dashboardData.applications.length > 0 && (
                  <span className="sidebar-count-badge font-mono">{dashboardData.applications.length}</span>
                )}
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <div className="sidebar-nav-item-inner">
                  <User size={16} />
                  <span>Profile & Account</span>
                </div>
              </button>
            </nav>

            <div className="radio-card sidebar-quick-links-box font-mono">
              <span className="sidebar-section-label">LIVE BROADCAST</span>
              <Link to="/live" className="sidebar-external-link live-link">
                <span>Tune In Live (104.2 FM)</span>
                <Radio size={13} />
              </Link>
              <Link to="/requests" className="sidebar-external-link">
                <span>Station Request Desk</span>
                <ExternalLink size={13} />
              </Link>
            </div>

            <button
              type="button"
              className="sidebar-logout-btn font-mono"
              onClick={signOut}
              aria-label="Sign out of student account"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </aside>

          {/* ================================================================
              Main Workspace Content
              ================================================================ */}
          <main className="dashboard-main-area">
            {/* Welcome Header Banner */}
            <header className="radio-card dashboard-welcome-banner">
              <div className="banner-ambient-glow" aria-hidden="true" />
              <div className="welcome-title-wrap">
                <div className="welcome-kicker font-mono">
                  <Shield size={13} />
                  <span>AUTHENTICATED STUDENT WORKSPACE</span>
                </div>
                <h1 className="welcome-heading font-display">{welcomeGreeting}</h1>
                <p className="welcome-subtext">
                  Your personal CampusWave workspace for requests, shout-outs, passes and club involvement.
                </p>
              </div>

              <div className="welcome-meta-pill font-mono">
                <span className="pill-dot" />
                <span>STUDENT LISTENER</span>
              </div>
            </header>

            {/* Mobile View Switcher Pills */}
            <div className="mobile-view-tabs font-mono" role="tablist" aria-label="Dashboard sections">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'all'}
                className={`mobile-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Overview
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'requests'}
                className={`mobile-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('requests')}
              >
                Requests {dashboardData.requests.length > 0 && `(${dashboardData.requests.length})`}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'shoutouts'}
                className={`mobile-tab-btn ${activeTab === 'shoutouts' ? 'active' : ''}`}
                onClick={() => setActiveTab('shoutouts')}
              >
                Shout-outs {dashboardData.shoutouts.length > 0 && `(${dashboardData.shoutouts.length})`}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'events'}
                className={`mobile-tab-btn ${activeTab === 'events' ? 'active' : ''}`}
                onClick={() => setActiveTab('events')}
              >
                Events {dashboardData.eventRegistrations.length > 0 && `(${dashboardData.eventRegistrations.length})`}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'application'}
                className={`mobile-tab-btn ${activeTab === 'application' ? 'active' : ''}`}
                onClick={() => setActiveTab('application')}
              >
                Club
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'profile'}
                className={`mobile-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                Account
              </button>
            </div>

            {/* Error State with genuine retry */}
            {fetchError ? (
              <ErrorState
                title="Unable to load your CampusWave activity"
                message={fetchError}
                actionLabel="Try Again"
                onAction={loadDashboard}
              />
            ) : dataLoading ? (
              <DashboardSkeleton />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="dash-cards-grid"
                >
                  {/* Overview tab: Render all sections */}
                  {activeTab === 'all' && (
                    <>
                      <StudentProfileCard profile={activeProfile} user={user} />
                      <QuickActionsCard />
                      <MyRequestsCard requests={dashboardData.requests} />
                      <MyShoutoutsCard shoutouts={dashboardData.shoutouts} />
                      <MyApplicationCard applications={dashboardData.applications} />
                      <MyEventsCard registrations={dashboardData.eventRegistrations} />
                      <AccountCard user={user} profile={activeProfile} onSignOut={signOut} />
                    </>
                  )}

                  {/* Focused tabs */}
                  {activeTab === 'requests' && (
                    <>
                      <MyRequestsCard requests={dashboardData.requests} />
                      <QuickActionsCard />
                    </>
                  )}

                  {activeTab === 'shoutouts' && (
                    <>
                      <MyShoutoutsCard shoutouts={dashboardData.shoutouts} />
                      <QuickActionsCard />
                    </>
                  )}

                  {activeTab === 'events' && (
                    <>
                      <MyEventsCard registrations={dashboardData.eventRegistrations} />
                      <QuickActionsCard />
                    </>
                  )}

                  {activeTab === 'application' && (
                    <>
                      <MyApplicationCard applications={dashboardData.applications} />
                      <QuickActionsCard />
                    </>
                  )}

                  {activeTab === 'profile' && (
                    <>
                      <StudentProfileCard profile={activeProfile} user={user} />
                      <AccountCard user={user} profile={activeProfile} onSignOut={signOut} />
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
