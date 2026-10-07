import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight, RefreshCw, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import AdminOverview from '../components/admin/AdminOverview';
import AdminStudents from '../components/admin/AdminStudents';
import AdminStaff from '../components/admin/AdminStaff';
import AdminTeam from '../components/admin/AdminTeam';
import AdminShows from '../components/admin/AdminShows';
import AdminSchedule from '../components/admin/AdminSchedule';
import AdminPodcasts from '../components/admin/AdminPodcasts';
import AdminRequests from '../components/admin/AdminRequests';
import AdminShoutouts from '../components/admin/AdminShoutouts';
import AdminApplications from '../components/admin/AdminApplications';
import AdminAnnouncements from '../components/admin/AdminAnnouncements';
import AdminEvents from '../components/admin/AdminEvents';
import AdminMessages from '../components/admin/AdminMessages';
import AdminSkeleton from '../components/admin/AdminSkeleton';
import { adminService } from '../services/admin-service';
import { teamService } from '../services/team-service';
import { showService } from '../services/show-service';
import { scheduleService } from '../services/schedule-service';
import { podcastService } from '../services/podcast-service';
import { applicationService } from '../services/application-service';
import { requestService } from '../services/request-service';
import { announcementService } from '../services/announcement-service';
import { eventService } from '../services/event-service';
import { contactService } from '../services/contact-service';
import './AdminDashboardPage.css';

export default function AdminDashboardPage() {
  const { user, profile, role, isAuthenticated, loading: authLoading } = useAuth();
  const location = useLocation();

  // Mobile navigation drawer toggle
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Administrative data registers
  const [metrics, setMetrics] = useState(null);
  const [needsAttention, setNeedsAttention] = useState({ applications: [], requests: [], shoutouts: [], messages: [], total: 0 });
  const [users, setUsers] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [shows, setShows] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [podcasts, setPodcasts] = useState([]);
  const [applications, setApplications] = useState([]);
  const [requests, setRequests] = useState([]);
  const [shoutouts, setShoutouts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [messages, setMessages] = useState([]);

  const [dataLoading, setDataLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isAdmin = role === 'admin';

  // Master parallel data fetcher
  const loadAdminData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setDataLoading(true);

    try {
      const [
        metricsRes,
        attentionRes,
        usersRes,
        teamRes,
        showsRes,
        schedRes,
        podcastsRes,
        appsRes,
        reqsRes,
        shoutsRes,
        annsRes,
        eventsRes,
        msgsRes
      ] = await Promise.allSettled([
        adminService.getOverviewMetrics(),
        adminService.getNeedsAttention(),
        adminService.getUsers(),
        teamService.getPublishedTeamMembers(),
        showService.getShows(),
        scheduleService.getWeeklySchedule(),
        podcastService.getPodcasts(),
        applicationService.getAllApplications(),
        requestService.getAllRequests(),
        requestService.getAllShoutouts(),
        announcementService.getAllAdminAnnouncements(),
        eventService.getEvents(),
        contactService.getContactMessages()
      ]);

      if (metricsRes.status === 'fulfilled') setMetrics(metricsRes.value);
      if (attentionRes.status === 'fulfilled') setNeedsAttention(attentionRes.value || { applications: [], requests: [], shoutouts: [], messages: [], total: 0 });
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value || []);
      if (teamRes.status === 'fulfilled') setTeamMembers(teamRes.value || []);
      if (showsRes.status === 'fulfilled') setShows(showsRes.value || []);
      if (schedRes.status === 'fulfilled') setSchedule(schedRes.value || []);
      if (podcastsRes.status === 'fulfilled') setPodcasts(podcastsRes.value || []);
      if (appsRes.status === 'fulfilled') setApplications(appsRes.value || []);
      if (reqsRes.status === 'fulfilled') setRequests(reqsRes.value || []);
      if (shoutsRes.status === 'fulfilled') setShoutouts(shoutsRes.value || []);
      if (annsRes.status === 'fulfilled') setAnnouncements(annsRes.value || []);
      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value || []);
      if (msgsRes.status === 'fulfilled') setMessages(msgsRes.value || []);
    } catch (err) {
      console.warn('Admin workspace load error:', err);
    } finally {
      setDataLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadAdminData();
    }
  }, [isAuthenticated, isAdmin, loadAdminData]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // Compute pending badge counts
  const badgeCounts = useMemo(() => {
    const pendingReqCount = requests.filter((r) => (r.status || 'pending').toLowerCase() === 'pending').length;
    const pendingShoutCount = shoutouts.filter((s) => (s.status || 'pending').toLowerCase() === 'pending').length;
    const pendingAppCount = applications.filter((a) => (a.status || 'pending').toLowerCase() === 'pending').length;
    const newMsgCount = messages.filter((m) => (m.status || 'new').toLowerCase() === 'new').length;

    return {
      pendingRequests: pendingReqCount,
      pendingShoutouts: pendingShoutCount,
      pendingApplications: pendingAppCount,
      newContactMessages: newMsgCount,
      totalNeedsAttention: pendingReqCount + pendingShoutCount + pendingAppCount + newMsgCount
    };
  }, [requests, shoutouts, applications, messages]);

  // Determine current screen title & subtitle
  const headerMeta = useMemo(() => {
    const path = location.pathname.replace(/\/$/, '');
    if (path === '/admin/staff') {
      return {
        title: 'Staff Access Authorization',
        subtitle: 'Authorize and manage privileged Radio Jockey and Station Administrator emails.'
      };
    }
    if (path === '/admin/students') {
      return {
        title: 'Students & Registered Accounts',
        subtitle: 'Inspect student listeners, directory records, and manage access authorization roles.'
      };
    }
    if (path === '/admin/team') {
      return {
        title: 'RJ & Team Management',
        subtitle: 'Oversee authorized on-air talent and public station team member roster cards.'
      };
    }
    if (path === '/admin/shows') {
      return {
        title: 'Broadcast Show Catalog',
        subtitle: 'Configure series, categories, time tags, and host affiliations across the station.'
      };
    }
    if (path === '/admin/schedule') {
      return {
        title: 'Weekly Radio Timetable',
        subtitle: 'Program transmission slots and assign on-air talent across Monday-Sunday rotations.'
      };
    }
    if (path === '/admin/podcasts') {
      return {
        title: 'Podcast Episodes Catalog',
        subtitle: 'Moderate recorded broadcasts, talk sessions, and student audio stream links.'
      };
    }
    if (path === '/admin/requests') {
      return {
        title: 'Song Request Moderation',
        subtitle: 'Moderate student track submissions, approve dedications, and manage broadcast queues.'
      };
    }
    if (path === '/admin/shoutouts') {
      return {
        title: 'Shout-outs Moderation',
        subtitle: 'Review student greetings, campus milestones, and air live dedications.'
      };
    }
    if (path === '/admin/applications') {
      return {
        title: 'Club Applications Review',
        subtitle: 'Evaluate student applicants seeking admission into broadcast, content, and engineering teams.'
      };
    }
    if (path === '/admin/announcements') {
      return {
        title: 'Station Announcements',
        subtitle: 'Draft, publish, and schedule campus notices and official station dispatches.'
      };
    }
    if (path === '/admin/events') {
      return {
        title: 'Campus Events Management',
        subtitle: 'Coordinate studio acoustic lounge gigs, DJ workshops, and verify real registrations.'
      };
    }
    if (path === '/admin/messages') {
      return {
        title: 'Station Dispatch Inbox',
        subtitle: 'Review private feedback, sponsor inquiries, and student messages submitted to the desk.'
      };
    }
    return {
      title: 'Station Executive Console',
      subtitle: 'Real-time operational registers across listeners, broadcast catalog, and moderation queues.'
    };
  }, [location.pathname]);

  // 1. Initial auth resolving
  if (authLoading) {
    return (
      <div className="admin-page-layout">
        <div className="container admin-container">
          <AdminSkeleton />
        </div>
      </div>
    );
  }

  // 2. Logged out: Redirect to login preserving destination
  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/admin" state={{ from: location }} replace />;
  }

  // 3. Logged-in Student or RJ: Station Administration Restricted
  if (!isAdmin) {
    return (
      <div className="admin-page-layout">
        <div className="container admin-denied-container">
          <div className="radio-card admin-denied-card">
            <div className="denied-icon-wrap">
              <ShieldAlert size={52} className="denied-icon" />
            </div>
            <h2 className="denied-title font-display">Station Administration Restricted</h2>
            <p className="denied-desc">
              Access to this console requires verified Station Administrator authorization.
              Student listeners and Radio Jockeys are restricted from station configuration registers.
            </p>

            <div className="denied-actions font-mono">
              <Link to="/dashboard" className="btn-primary">
                <span>GO TO STUDENT DASHBOARD</span>
                <ArrowRight size={14} />
              </Link>
              {role === 'rj' && (
                <Link to="/rj" className="btn-secondary">
                  <span>GO TO RJ WORKSPACE</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authenticated Station Administrator
  return (
    <div className="admin-page-layout">
      <div className="container admin-container">
        <div className="admin-layout-grid">
          {/* Desktop Left Sidebar */}
          <div className="admin-sidebar-desktop">
            <AdminSidebar counts={badgeCounts} />
          </div>

          {/* Mobile Drawer Overlay */}
          {mobileNavOpen && (
            <div
              className="admin-mobile-drawer-backdrop"
              onClick={() => setMobileNavOpen(false)}
              role="presentation"
            >
              <div
                className="admin-mobile-drawer"
                onClick={(e) => e.stopPropagation()}
              >
                <AdminSidebar
                  counts={badgeCounts}
                  onNavigateMobile={() => setMobileNavOpen(false)}
                />
              </div>
            </div>
          )}

          {/* Main Content Workspace */}
          <main className="admin-main-stage">
            <AdminHeader
              title={headerMeta.title}
              subtitle={headerMeta.subtitle}
              isRefreshing={isRefreshing}
              onRefresh={() => loadAdminData(true)}
              mobileNavOpen={mobileNavOpen}
              setMobileNavOpen={setMobileNavOpen}
              userProfile={profile}
            />

            {dataLoading && !isRefreshing ? (
              <AdminSkeleton />
            ) : (
              <Routes>
                <Route
                  index
                  element={
                    <AdminOverview
                      metrics={metrics}
                      needsAttention={needsAttention}
                      loading={dataLoading}
                    />
                  }
                />
                <Route
                  path="staff"
                  element={<AdminStaff />}
                />
                <Route
                  path="students"
                  element={
                    <AdminStudents
                      users={users}
                      loading={dataLoading}
                      onRefresh={loadAdminData}
                    />
                  }
                />
                <Route
                  path="team"
                  element={
                    <AdminTeam
                      teamMembers={teamMembers}
                      rjProfiles={users.filter((u) => u.role === 'rj')}
                      shows={shows}
                      onRefresh={loadAdminData}
                    />
                  }
                />
                <Route
                  path="shows"
                  element={
                    <AdminShows
                      shows={shows}
                      rjProfiles={users.filter((u) => u.role === 'rj')}
                      onRefresh={loadAdminData}
                    />
                  }
                />
                <Route
                  path="schedule"
                  element={
                    <AdminSchedule
                      schedule={schedule}
                      shows={shows}
                      rjProfiles={users.filter((u) => u.role === 'rj')}
                      onRefresh={loadAdminData}
                    />
                  }
                />
                <Route
                  path="podcasts"
                  element={
                    <AdminPodcasts
                      podcasts={podcasts}
                      shows={shows}
                      rjProfiles={users.filter((u) => u.role === 'rj')}
                      onRefresh={loadAdminData}
                    />
                  }
                />
                <Route
                  path="requests"
                  element={
                    <AdminRequests
                      requests={requests}
                      onRefresh={loadAdminData}
                    />
                  }
                />
                <Route
                  path="shoutouts"
                  element={
                    <AdminShoutouts
                      shoutouts={shoutouts}
                      onRefresh={loadAdminData}
                    />
                  }
                />
                <Route
                  path="applications"
                  element={
                    <AdminApplications
                      applications={applications}
                      onRefresh={loadAdminData}
                    />
                  }
                />
                <Route
                  path="announcements"
                  element={
                    <AdminAnnouncements
                      announcements={announcements}
                      onRefresh={loadAdminData}
                    />
                  }
                />
                <Route
                  path="events"
                  element={
                    <AdminEvents
                      events={events}
                      onRefresh={loadAdminData}
                    />
                  }
                />
                <Route
                  path="messages"
                  element={
                    <AdminMessages
                      messages={messages}
                      onRefresh={loadAdminData}
                    />
                  }
                />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
