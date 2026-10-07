import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingState from './components/LoadingState';
import PersistentPlayer from './components/PersistentPlayer';
import IntroAnimation from './components/IntroAnimation';

// Lazy-loaded route components for high performance
const HomePage = lazy(() => import('./pages/HomePage'));
const LivePage = lazy(() => import('./pages/LivePage'));
const ShowsPage = lazy(() => import('./pages/ShowsPage'));
const ShowDetailPage = lazy(() => import('./pages/ShowDetailPage'));
const SchedulePage = lazy(() => import('./pages/SchedulePage'));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'));
const AnnouncementDetailPage = lazy(() => import('./pages/AnnouncementDetailPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const RequestsPage = lazy(() => import('./pages/RequestsPage'));
const JoinClubPage = lazy(() => import('./pages/JoinClubPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const RjWorkspacePage = lazy(() => import('./pages/RjWorkspacePage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return !sessionStorage.getItem('cw_intro_played');
    } catch {
      return false;
    }
  });

  const handleIntroComplete = useCallback(() => {
    try {
      sessionStorage.setItem('cw_intro_played', 'true');
    } catch {}
    setShowIntro(false);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
        <ScrollToTop />
        <div className="app-container">
          <Navbar />

          <main className="main-content">
            <Suspense fallback={<LoadingState message="Tuning station frequency..." />}>
              <Routes>
                {/* Public Station Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/live" element={<LivePage />} />
                <Route path="/shows" element={<ShowsPage />} />
                <Route path="/shows/:id" element={<ShowDetailPage />} />
                <Route path="/schedule" element={<SchedulePage />} />
                <Route path="/announcements" element={<AnnouncementsPage />} />
                <Route path="/announcements/:id" element={<AnnouncementDetailPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/requests" element={<RequestsPage />} />
                <Route path="/join" element={<JoinClubPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/auth" element={<AuthPage />} />

                {/* Authenticated / Role Portals */}
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/rj" element={<RjWorkspacePage />} />
                <Route path="/rj/*" element={<RjWorkspacePage />} />
                <Route path="/live-studio" element={<RjWorkspacePage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/*" element={<AdminDashboardPage />} />

                {/* Fallback */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>

          <Footer />
          <PersistentPlayer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
