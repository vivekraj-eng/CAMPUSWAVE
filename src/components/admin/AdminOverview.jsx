import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Mic,
  Radio,
  Calendar,
  Headphones,
  Music2,
  Megaphone,
  Award,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  RadioTower,
  Square
} from 'lucide-react';
import { radioService } from '../../services/radio-service';
import './AdminOverview.css';

export default function AdminOverview({
  metrics = {},
  needsAttention = { applications: [], requests: [], shoutouts: [], messages: [], total: 0 },
  loading = false
}) {
  const [liveBroadcast, setLiveBroadcast] = React.useState(null);

  const fetchLiveState = React.useCallback(async () => {
    try {
      const data = await radioService.getNowPlaying();
      setLiveBroadcast(data);
    } catch {}
  }, []);

  React.useEffect(() => {
    fetchLiveState();
    const interval = setInterval(fetchLiveState, 8000);
    return () => clearInterval(interval);
  }, [fetchLiveState]);

  const handleEmergencyStop = async () => {
    if (!window.confirm('Are you sure you want to terminate the active live broadcast? Station will immediately return to standby.')) {
      return;
    }
    await radioService.updateNowPlaying({
      is_live: false,
      stream_url: null,
      current_track: null,
      current_artist: null
    });
    await fetchLiveState();
  };

  const metricCards = [
    {
      label: 'REGISTERED STUDENTS',
      value: metrics?.totalStudents ?? 0,
      sub: 'Verified listener accounts',
      icon: Users,
      color: 'blue',
      link: '/admin/students'
    },
    {
      label: 'STATION RJS',
      value: metrics?.activeRJs ?? 0,
      sub: 'Authorized on-air hosts',
      icon: Mic,
      color: 'purple',
      link: '/admin/team'
    },
    {
      label: 'ACTIVE SHOWS',
      value: metrics?.publishedShows ?? 0,
      sub: 'Broadcast series catalog',
      icon: Radio,
      color: 'cyan',
      link: '/admin/shows'
    },
    {
      label: 'PUBLISHED PODCASTS',
      value: metrics?.publishedPodcasts ?? 0,
      sub: 'Streamable episodes',
      icon: Headphones,
      color: 'indigo',
      link: '/admin/podcasts'
    },
    {
      label: 'UPCOMING EVENTS',
      value: metrics?.upcomingEvents ?? 0,
      sub: 'Active campus calendar',
      icon: Calendar,
      color: 'green',
      link: '/admin/events'
    },
    {
      label: 'PENDING APPLICATIONS',
      value: metrics?.pendingApplications ?? 0,
      sub: 'Candidates awaiting review',
      icon: Award,
      color: 'amber',
      highlight: (metrics?.pendingApplications ?? 0) > 0,
      link: '/admin/applications'
    },
    {
      label: 'PENDING REQUESTS',
      value: metrics?.pendingRequests ?? 0,
      sub: 'Track requests in queue',
      icon: Music2,
      color: 'cyan',
      highlight: (metrics?.pendingRequests ?? 0) > 0,
      link: '/admin/requests'
    },
    {
      label: 'PENDING SHOUT-OUTS',
      value: metrics?.pendingShoutouts ?? 0,
      sub: 'Awaiting on-air delivery',
      icon: Megaphone,
      color: 'purple',
      highlight: (metrics?.pendingShoutouts ?? 0) > 0,
      link: '/admin/shoutouts'
    },
    {
      label: 'NEW MESSAGES',
      value: metrics?.newContactMessages ?? 0,
      sub: 'Studio inquiries received',
      icon: MessageSquare,
      color: 'red',
      highlight: (metrics?.newContactMessages ?? 0) > 0,
      link: '/admin/messages'
    }
  ];

  const hasPendingItems = (needsAttention?.total ?? 0) > 0;

  return (
    <div className="admin-overview-view">
      {/* Real-time Station Broadcast Monitor & Emergency Override */}
      <section className="admin-section-block" style={{ marginBottom: '24px' }}>
        <div
          className="radio-card"
          style={{
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            background: liveBroadcast?.is_live
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(16, 20, 36, 0.95))'
              : 'rgba(16, 20, 36, 0.8)',
            borderColor: liveBroadcast?.is_live ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="font-mono">
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: liveBroadcast?.is_live ? '#ef4444' : '#64748b',
                  boxShadow: liveBroadcast?.is_live ? '0 0 10px #ef4444' : 'none'
                }}
              />
              <strong style={{ color: liveBroadcast?.is_live ? '#f87171' : 'var(--text-muted)', fontSize: '0.85rem' }}>
                {liveBroadcast?.is_live ? 'STATION LIVE ON AIR' : 'STATION TRANSMITTER OFF AIR'}
              </strong>
            </div>

            {liveBroadcast?.is_live && (
              <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>HOST: <strong style={{ color: '#fff' }}>{liveBroadcast.current_rj || 'CampusWave RJ'}</strong></span>
                <span style={{ margin: '0 8px', opacity: 0.4 }}>•</span>
                <span>SEGMENT: <strong style={{ color: '#fff' }}>"{liveBroadcast.current_show_title || 'Live Session'}"</strong></span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {liveBroadcast?.is_live ? (
              <button
                type="button"
                className="font-mono"
                onClick={handleEmergencyStop}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.6)',
                  color: '#f87171',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Square size={13} fill="currentColor" />
                <span>TERMINATE BROADCAST</span>
              </button>
            ) : (
              <Link
                to="/rj"
                className="font-mono"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.35)',
                  color: '#c4b5fd',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
              >
                <RadioTower size={13} />
                <span>OPEN RJ STUDIO</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Metrics Grid */}
      <section className="admin-section-block" aria-labelledby="metrics-title">
        <div className="section-header-compact">
          <h2 id="metrics-title" className="section-heading font-display">Station Operational Metrics</h2>
          <span className="section-note font-mono">Calculated strictly from Supabase database registers</span>
        </div>

        <div className="metrics-summary-grid">
          {metricCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link to={card.link} key={idx} className={`metric-stat-card radio-card color-${card.color}`}>
                <div className="metric-stat-top">
                  <span className="metric-stat-label font-mono">{card.label}</span>
                  <div className={`metric-icon-wrap ${card.highlight ? 'pulse' : ''}`}>
                    <Icon size={16} />
                  </div>
                </div>
                <div className="metric-stat-num font-display">{card.value}</div>
                <div className="metric-stat-sub font-mono">{card.sub}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Needs Attention / Pending Moderation */}
      <section className="admin-section-block" aria-labelledby="attention-title">
        <div className="section-header-compact">
          <div className="heading-with-badge">
            <h2 id="attention-title" className="section-heading font-display">Needs Attention</h2>
            {hasPendingItems ? (
              <span className="badge-count-urgent font-mono">
                {needsAttention.total} PENDING
              </span>
            ) : (
              <span className="badge-count-success font-mono">
                UP TO DATE
              </span>
            )}
          </div>
          <p className="section-desc">Actionable submissions awaiting administrative or broadcast review.</p>
        </div>

        {!hasPendingItems ? (
          <div className="radio-card attention-cleared-card">
            <div className="cleared-icon-wrap">
              <CheckCircle2 size={36} className="text-emerald" />
            </div>
            <div className="cleared-content">
              <h3 className="cleared-title font-display">Everything is up to date.</h3>
              <p className="cleared-desc">
                All club applications, song requests, shout-outs, and contact messages have been reviewed.
              </p>
            </div>
          </div>
        ) : (
          <div className="attention-cards-grid">
            {/* Pending Applications */}
            {needsAttention.applications?.length > 0 && (
              <div className="radio-card attention-group-card">
                <div className="attention-card-header font-mono">
                  <div className="header-left">
                    <Award size={16} className="text-amber" />
                    <span>APPLICATIONS AWAITING REVIEW ({needsAttention.applications.length})</span>
                  </div>
                  <Link to="/admin/applications" className="attention-view-link">
                    Review all <ArrowRight size={13} />
                  </Link>
                </div>
                <div className="attention-list">
                  {needsAttention.applications.map((app) => (
                    <div key={app.id} className="attention-item">
                      <div className="item-main">
                        <span className="item-name font-display">{app.full_name}</span>
                        <span className="item-meta font-mono">
                          Team: <strong className="text-purple">{app.preferred_team}</strong> • {app.department} ({app.year})
                        </span>
                      </div>
                      <Link to="/admin/applications" className="action-pill font-mono">Review</Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Song Requests */}
            {needsAttention.requests?.length > 0 && (
              <div className="radio-card attention-group-card">
                <div className="attention-card-header font-mono">
                  <div className="header-left">
                    <Music2 size={16} className="text-cyan" />
                    <span>SONG REQUESTS IN QUEUE ({needsAttention.requests.length})</span>
                  </div>
                  <Link to="/admin/requests" className="attention-view-link">
                    Moderate <ArrowRight size={13} />
                  </Link>
                </div>
                <div className="attention-list">
                  {needsAttention.requests.map((req) => (
                    <div key={req.id} className="attention-item">
                      <div className="item-main">
                        <span className="item-name font-display">{req.song_name} {req.artist_name ? `— ${req.artist_name}` : ''}</span>
                        <span className="item-meta font-mono">From: {req.student_name}</span>
                      </div>
                      <Link to="/admin/requests" className="action-pill font-mono">Moderate</Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Shout-outs */}
            {needsAttention.shoutouts?.length > 0 && (
              <div className="radio-card attention-group-card">
                <div className="attention-card-header font-mono">
                  <div className="header-left">
                    <Megaphone size={16} className="text-purple" />
                    <span>SHOUT-OUTS TO MODERATE ({needsAttention.shoutouts.length})</span>
                  </div>
                  <Link to="/admin/shoutouts" className="attention-view-link">
                    Review <ArrowRight size={13} />
                  </Link>
                </div>
                <div className="attention-list">
                  {needsAttention.shoutouts.map((s) => (
                    <div key={s.id} className="attention-item">
                      <div className="item-main">
                        <span className="item-name font-display">{s.recipient_name ? `To: ${s.recipient_name}` : 'General Shout-out'}</span>
                        <span className="item-meta font-mono">From: {s.student_name} — "{s.message?.slice(0, 50)}..."</span>
                      </div>
                      <Link to="/admin/shoutouts" className="action-pill font-mono">Review</Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Contact Messages */}
            {needsAttention.messages?.length > 0 && (
              <div className="radio-card attention-group-card">
                <div className="attention-card-header font-mono">
                  <div className="header-left">
                    <MessageSquare size={16} className="text-red" />
                    <span>NEW CONTACT MESSAGES ({needsAttention.messages.length})</span>
                  </div>
                  <Link to="/admin/messages" className="attention-view-link">
                    View Inbox <ArrowRight size={13} />
                  </Link>
                </div>
                <div className="attention-list">
                  {needsAttention.messages.map((msg) => (
                    <div key={msg.id} className="attention-item">
                      <div className="item-main">
                        <span className="item-name font-display">{msg.subject || 'Campus Inquiry'}</span>
                        <span className="item-meta font-mono">From: {msg.name}</span>
                      </div>
                      <Link to="/admin/messages" className="action-pill font-mono">Read</Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Station Environment Banner */}
      <div className="radio-card station-telemetry-banner">
        <div className="telemetry-info">
          <div className="telemetry-badge font-mono">
            <Sparkles size={13} className="text-cyan" />
            <span>STATION TELEMETRY</span>
          </div>
          <h3 className="telemetry-title font-display">Broadcast Architecture Online</h3>
          <p className="telemetry-desc">
            CampusWave 104.2 FM • Station administration console connected via PostgreSQL Row Level Security.
          </p>
        </div>
        <div className="telemetry-specs font-mono">
          <div className="spec-row">
            <span className="spec-label">FREQUENCY</span>
            <span className="spec-val">104.20 MHz FM</span>
          </div>
          <div className="spec-row">
            <span className="spec-label">SECURITY</span>
            <span className="spec-val text-emerald">Active RLS Policy</span>
          </div>
          <div className="spec-row">
            <span className="spec-label">STUDIO DESK</span>
            <span className="spec-val">Pavilion Suite 104</span>
          </div>
        </div>
      </div>
    </div>
  );
}
