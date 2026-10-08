import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Radio,
  Music2,
  MessageSquare,
  Calendar,
  LayoutDashboard,
  ShieldAlert,
  LogOut,
  ExternalLink,
  Shield,
  User,
  ArrowRight,
  RadioTower
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { rjService } from '../services/rj-service';
import BrandLogo from '../components/BrandLogo';
import MyShowsCard from '../components/rj/MyShowsCard';
import RJScheduleCard from '../components/rj/RJScheduleCard';
import RJRequestQueue from '../components/rj/RJRequestQueue';
import RJShoutoutQueue from '../components/rj/RJShoutoutQueue';
import RjPodcastManager from '../components/rj/RjPodcastManager';
import RjQuickActions from '../components/rj/RjQuickActions';
import RjWorkspaceSkeleton from '../components/rj/RjWorkspaceSkeleton';
import RjLiveStudio from '../components/rj/RjLiveStudio';
import AccountCard from '../components/dashboard/AccountCard';
import ErrorState from '../components/ErrorState';
import './RjWorkspacePage.css';

/**
 * RJ Workspace Page (/rj)
 * Restricted operational booth for approved Radio Jockeys & Station Directors.
 * Governed strictly by Supabase RLS and authenticated role verification.
 */
export default function RjWorkspacePage() {
  const { user, profile, role, isAuthenticated, loading: authLoading, signOut } = useAuth();
  const location = useLocation();

  // Active view tab: 'all' | 'shows' | 'requests' | 'shoutouts' | 'podcasts' | 'schedule' | 'account'
  const [activeTab, setActiveTab] = useState('all');

  // Workspace data states
  const [data, setData] = useState({
    assignedShows: [],
    assignedSchedule: [],
    requests: [],
    shoutouts: [],
    podcasts: []
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const isRjOrAdmin = role === 'rj' || role === 'admin';

  // Load RJ workspace data
  const loadWorkspace = useCallback(async () => {
    if (!user?.id) {
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    setFetchError(null);

    const rjName = profile?.full_name || '';
    const res = await rjService.getRjWorkspaceData(user.id, rjName);

    if (res.error) {
      setFetchError(res.error.message || 'Unable to connect to RJ transmission workspace.');
    } else if (res.data) {
      setData({
        assignedShows: res.data.assignedShows || [],
        assignedSchedule: res.data.assignedSchedule || [],
        requests: res.data.requests || [],
        shoutouts: res.data.shoutouts || [],
        podcasts: res.data.podcasts || []
      });
    }

    setDataLoading(false);
  }, [user?.id, profile?.full_name]);

  useEffect(() => {
    if (isAuthenticated && isRjOrAdmin && user?.id) {
      loadWorkspace();
    }
  }, [isAuthenticated, isRjOrAdmin, user?.id, loadWorkspace]);

  // Handle request moderation mutation
  const handleUpdateRequestStatus = async (id, status) => {
    const res = await rjService.updateRequestStatus(id, status);
    if (!res.error) {
      // Refresh workspace data upon confirmed update
      await loadWorkspace();
    }
    return res;
  };

  // Handle shoutout moderation mutation
  const handleUpdateShoutoutStatus = async (id, status) => {
    const res = await rjService.updateShoutoutStatus(id, status);
    if (!res.error) {
      await loadWorkspace();
    }
    return res;
  };

  // Handle create podcast mutation
  const handleCreatePodcast = async (podcastData) => {
    const res = await rjService.createPodcast(podcastData);
    if (!res.error) {
      await loadWorkspace();
    }
    return res;
  };

  // Handle delete podcast mutation
  const handleDeletePodcast = async (id) => {
    const res = await rjService.deletePodcast(id);
    if (!res.error) {
      await loadWorkspace();
    }
    return res;
  };

  // 1. Initial auth resolving
  if (authLoading) {
    return (
      <div className="rj-workspace-page">
        <div className="container">
          <RjWorkspaceSkeleton />
        </div>
      </div>
    );
  }

  // 2. Logged out: Redirect to login preserving destination
  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/rj" state={{ from: location }} replace />;
  }

  // 3. Logged-in Student: Access restricted screen
  if (!isRjOrAdmin) {
    return (
      <div className="rj-workspace-page">
        <div className="container">
          <div className="radio-card rj-denied-box">
            <ShieldAlert size={52} className="rj-denied-icon" />
            <h2 className="rj-denied-title font-display">RJ Transmission Workspace Restricted</h2>
            <p className="rj-denied-desc">
              This broadcasting booth is exclusively accessible to approved Radio Jockeys and Station Directors.
              Student listeners may manage requests and event passes from the student dashboard.
            </p>
            <div className="rj-denied-actions font-mono">
              <Link to="/dashboard" className="btn-primary">
                <span>GO TO STUDENT DASHBOARD</span>
                <ArrowRight size={14} />
              </Link>
              <Link to="/join" className="btn-secondary">
                <span>APPLY TO JOIN THE RJ TEAM</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Approved RJ / Admin: Load workspace
  const rjDisplayName = profile?.full_name || 'CampusWave RJ';
  const pendingRequestsCount = data.requests.filter(
    (r) => (r.status || 'pending').toLowerCase() === 'pending'
  ).length;
  const pendingShoutoutsCount = data.shoutouts.filter(
    (s) => (s.status || 'pending').toLowerCase() === 'pending'
  ).length;

  return (
    <div className="rj-workspace-page">
      <div className="container">
        <div className="rj-workspace-layout">
          {/* ================================================================
              Desktop Workspace Left Sidebar
              ================================================================ */}
          <aside className="rj-sidebar" aria-label="RJ Booth Navigation">
            <div className="radio-card sidebar-branding-box">
              <BrandLogo variant="navbar" asLink to="/" showMetadata={false} />
              <div className="sidebar-booth-tag font-mono">
                <span className="tag-dot" />
                <span>RJ BROADCAST BOOTH</span>
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
                className={`sidebar-nav-item ${activeTab === 'live' ? 'active' : ''}`}
                onClick={() => setActiveTab('live')}
              >
                <div className="sidebar-nav-item-inner">
                  <RadioTower size={16} />
                  <span>Live Radio</span>
                </div>
                <span className="sidebar-count-badge font-mono" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                  STUDIO
                </span>
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'shows' ? 'active' : ''}`}
                onClick={() => setActiveTab('shows')}
              >
                <div className="sidebar-nav-item-inner">
                  <Radio size={16} />
                  <span>My Shows</span>
                </div>
                {data.assignedShows.length > 0 && (
                  <span className="sidebar-count-badge font-mono">{data.assignedShows.length}</span>
                )}
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('requests')}
              >
                <div className="sidebar-nav-item-inner">
                  <Music2 size={16} />
                  <span>Requests</span>
                </div>
                {pendingRequestsCount > 0 && (
                  <span className="sidebar-count-badge font-mono pending-pulse">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'shoutouts' ? 'active' : ''}`}
                onClick={() => setActiveTab('shoutouts')}
              >
                <div className="sidebar-nav-item-inner">
                  <MessageSquare size={16} />
                  <span>Shout-outs</span>
                </div>
                {pendingShoutoutsCount > 0 && (
                  <span className="sidebar-count-badge font-mono pending-pulse">
                    {pendingShoutoutsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'podcasts' ? 'active' : ''}`}
                onClick={() => setActiveTab('podcasts')}
              >
                <div className="sidebar-nav-item-inner">
                  <Mic size={16} />
                  <span>Podcasts</span>
                </div>
                {data.podcasts.length > 0 && (
                  <span className="sidebar-count-badge font-mono">{data.podcasts.length}</span>
                )}
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'schedule' ? 'active' : ''}`}
                onClick={() => setActiveTab('schedule')}
              >
                <div className="sidebar-nav-item-inner">
                  <Calendar size={16} />
                  <span>Schedule</span>
                </div>
                {data.assignedSchedule.length > 0 && (
                  <span className="sidebar-count-badge font-mono">{data.assignedSchedule.length}</span>
                )}
              </button>

              <button
                type="button"
                className={`sidebar-nav-item ${activeTab === 'account' ? 'active' : ''}`}
                onClick={() => setActiveTab('account')}
              >
                <div className="sidebar-nav-item-inner">
                  <User size={16} />
                  <span>Profile & Booth</span>
                </div>
              </button>
            </nav>

            <div className="radio-card sidebar-quick-links-box font-mono">
              <span className="sidebar-section-label">STUDIO LINK</span>
              <Link to="/live" className="sidebar-external-link live-link">
                <span>Monitor Broadcast</span>
                <Radio size={13} />
              </Link>
              <Link to="/" className="sidebar-external-link">
                <span>Back to CampusWave</span>
                <ExternalLink size={13} />
              </Link>
            </div>

            <button
              type="button"
              className="sidebar-logout-btn font-mono"
              onClick={signOut}
              aria-label="Sign out of RJ booth"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </aside>

          {/* ================================================================
              Main Workspace Content
              ================================================================ */}
          <main className="rj-main-area">
            {/* Header Banner */}
            <header className="radio-card rj-banner">
              <div className="rj-banner-ambient-glow" aria-hidden="true" />
              <div className="rj-banner-content">
                <div className="rj-kicker font-mono">
                  <Shield size={13} />
                  <span>TRANSMISSION DESK • 104.2 FM</span>
                </div>
                <h1 className="rj-heading font-display">Welcome, {rjDisplayName}</h1>
                <p className="rj-subtext">
                  Manage your assigned radio programs, live track queue, listener dedications, and podcast catalog.
                </p>
              </div>

              <div className="rj-status-badge-wrap">
                <div className="rj-on-air-pill font-mono">
                  <span className="live-dot" />
                  <span>{role === 'admin' ? 'STATION ADMIN ACCESS' : 'RJ CONSOLE AUTHORIZED'}</span>
                </div>
              </div>
            </header>

            {/* Mobile View Switcher Pills */}
            <div className="mobile-view-tabs font-mono" role="tablist" aria-label="RJ Booth sections">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'all'}
                className={`mobile-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Overview
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'live'}
                className={`mobile-tab-btn ${activeTab === 'live' ? 'active' : ''}`}
                onClick={() => setActiveTab('live')}
              >
                Live Radio 🔴
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'shows'}
                className={`mobile-tab-btn ${activeTab === 'shows' ? 'active' : ''}`}
                onClick={() => setActiveTab('shows')}
              >
                Shows {data.assignedShows.length > 0 && `(${data.assignedShows.length})`}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'requests'}
                className={`mobile-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('requests')}
              >
                Requests {pendingRequestsCount > 0 && `(${pendingRequestsCount})`}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'shoutouts'}
                className={`mobile-tab-btn ${activeTab === 'shoutouts' ? 'active' : ''}`}
                onClick={() => setActiveTab('shoutouts')}
              >
                Shout-outs {pendingShoutoutsCount > 0 && `(${pendingShoutoutsCount})`}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'podcasts'}
                className={`mobile-tab-btn ${activeTab === 'podcasts' ? 'active' : ''}`}
                onClick={() => setActiveTab('podcasts')}
              >
                Podcasts {data.podcasts.length > 0 && `(${data.podcasts.length})`}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'schedule'}
                className={`mobile-tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
                onClick={() => setActiveTab('schedule')}
              >
                Schedule
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'account'}
                className={`mobile-tab-btn ${activeTab === 'account' ? 'active' : ''}`}
                onClick={() => setActiveTab('account')}
              >
                Account
              </button>
            </div>

            {/* Error State with genuine retry */}
            {fetchError ? (
              <ErrorState
                title="Unable to load RJ studio workspace"
                message={fetchError}
                actionLabel="Try Again"
                onAction={loadWorkspace}
              />
            ) : dataLoading ? (
              <RjWorkspaceSkeleton />
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
                  {/* All Overview: Render complete workspace */}
                  {activeTab === 'all' && (
                    <>
                      <RjLiveStudio assignedShows={data.assignedShows} />
                      <RjQuickActions onSwitchTab={setActiveTab} />
                      <MyShowsCard shows={data.assignedShows} />
                      <RJRequestQueue
                        requests={data.requests}
                        onUpdateStatus={handleUpdateRequestStatus}
                      />
                      <RJShoutoutQueue
                        shoutouts={data.shoutouts}
                        onUpdateStatus={handleUpdateShoutoutStatus}
                      />
                      <RjPodcastManager
                        podcasts={data.podcasts}
                        assignedShows={data.assignedShows}
                        rjName={rjDisplayName}
                        userId={user?.id}
                        onCreatePodcast={handleCreatePodcast}
                        onDeletePodcast={handleDeletePodcast}
                      />
                      <RJScheduleCard schedule={data.assignedSchedule} />
                      <AccountCard user={user} profile={profile} onSignOut={signOut} />
                    </>
                  )}

                  {/* Focused view tabs */}
                  {activeTab === 'live' && (
                    <>
                      <RjLiveStudio assignedShows={data.assignedShows} />
                    </>
                  )}

                  {activeTab === 'shows' && (
                    <>
                      <MyShowsCard shows={data.assignedShows} />
                      <RjQuickActions onSwitchTab={setActiveTab} />
                    </>
                  )}

                  {activeTab === 'requests' && (
                    <>
                      <RJRequestQueue
                        requests={data.requests}
                        onUpdateStatus={handleUpdateRequestStatus}
                      />
                    </>
                  )}

                  {activeTab === 'shoutouts' && (
                    <>
                      <RJShoutoutQueue
                        shoutouts={data.shoutouts}
                        onUpdateStatus={handleUpdateShoutoutStatus}
                      />
                    </>
                  )}

                  {activeTab === 'podcasts' && (
                    <>
                      <RjPodcastManager
                        podcasts={data.podcasts}
                        assignedShows={data.assignedShows}
                        rjName={rjDisplayName}
                        userId={user?.id}
                        onCreatePodcast={handleCreatePodcast}
                        onDeletePodcast={handleDeletePodcast}
                      />
                    </>
                  )}

                  {activeTab === 'schedule' && (
                    <>
                      <RJScheduleCard schedule={data.assignedSchedule} />
                      <RjQuickActions onSwitchTab={setActiveTab} />
                    </>
                  )}

                  {activeTab === 'account' && (
                    <>
                      <AccountCard user={user} profile={profile} onSignOut={signOut} />
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
