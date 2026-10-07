import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Music2, MessageSquare, Radio, User, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import RequestForm from '../components/RequestForm';
import ShoutoutForm from '../components/ShoutoutForm';

export default function RequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'shoutout' ? 'shoutout' : 'song';
  const [activeTab, setActiveTab] = useState(initialTab);

  const { isAuthenticated, profile, user } = useAuth();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'shoutout') {
      setActiveTab('shoutout');
    } else if (tabParam === 'song') {
      setActiveTab('song');
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="requests-page-layout">
      <div className="container requests-container">
        {/* Header Section */}
        <div className="section-masthead">
          <div className="section-eyebrow">
            <span className="section-eyebrow-line" />
            <span>INTERACTIVE BROADCAST • 104.2 FM</span>
          </div>
          <h1 className="section-title">Requests & Shout-outs</h1>
          <p className="section-subtitle">
            Directly connect with the RJ on air. Request tracks for our live radio rotation or send personal dedications and club shout-outs across campus.
          </p>
        </div>

        {/* Authentication Context Banner */}
        <div className="requests-auth-strip font-mono">
          {isAuthenticated ? (
            <div className="auth-strip-inner connected">
              <span className="auth-status-dot connected" />
              <span>
                AUTHENTICATED AS <strong>{profile?.full_name || user?.email}</strong> ({user?.email})
              </span>
              <Link to="/dashboard" className="auth-strip-link">
                <span>VIEW PAST TRANSMISSIONS</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          ) : (
            <div className="auth-strip-inner guest">
              <span className="auth-status-dot guest" />
              <span>
                SUBMITTING AS CAMPUS GUEST •{' '}
                <Link to="/login?redirect=/requests" className="auth-strip-action">
                  Sign in with college ID
                </Link>{' '}
                to link requests to your student dashboard
              </span>
            </div>
          )}
        </div>

        {/* Tab Controls */}
        <div className="tabs-header font-mono" role="tablist" aria-label="Broadcast Submissions">
          <button
            type="button"
            role="tab"
            id="tab-song"
            aria-selected={activeTab === 'song'}
            aria-controls="panel-song"
            tabIndex={activeTab === 'song' ? 0 : -1}
            className={`tab-btn ${activeTab === 'song' ? 'active' : ''}`}
            onClick={() => handleTabChange('song')}
          >
            <Music2 size={15} style={{ display: 'inline', marginRight: 6 }} />
            Song Request
          </button>
          <button
            type="button"
            role="tab"
            id="tab-shoutout"
            aria-selected={activeTab === 'shoutout'}
            aria-controls="panel-shoutout"
            tabIndex={activeTab === 'shoutout' ? 0 : -1}
            className={`tab-btn ${activeTab === 'shoutout' ? 'active' : ''}`}
            onClick={() => handleTabChange('shoutout')}
          >
            <MessageSquare size={15} style={{ display: 'inline', marginRight: 6 }} />
            Shout-out
          </button>
        </div>

        {/* Form Container Card */}
        <div className="radio-card request-form-card">
          <div
            role="tabpanel"
            id="panel-song"
            aria-labelledby="tab-song"
            hidden={activeTab !== 'song'}
          >
            {activeTab === 'song' && <RequestForm />}
          </div>

          <div
            role="tabpanel"
            id="panel-shoutout"
            aria-labelledby="tab-shoutout"
            hidden={activeTab !== 'shoutout'}
          >
            {activeTab === 'shoutout' && <ShoutoutForm />}
          </div>
        </div>

        {/* Broadcaster Guidelines Note */}
        <div className="requests-guidelines-card font-mono">
          <div className="guidelines-header">
            <Radio size={14} className="text-accent-blue" />
            <span>CAMPUSWAVE BROADCAST GUIDELINES</span>
          </div>
          <p className="guidelines-text">
            All submitted tracks and shout-outs are queued for review by the on-air host before transmission. Please ensure requests are respectful and follow campus media standards. Track selections depend on active show formats and licensing.
          </p>
        </div>
      </div>

      <style>{`
        .requests-page-layout {
          padding: 44px 0 80px;
        }
        .requests-container {
          max-width: 820px;
        }
        .requests-auth-strip {
          margin-bottom: 20px;
          border-radius: var(--radius-sm, 6px);
          font-size: 0.78rem;
          padding: 10px 16px;
          background: rgba(14, 20, 36, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .auth-strip-inner {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .auth-strip-inner.connected {
          color: var(--text-secondary, #94A3B8);
        }
        .auth-strip-inner.connected strong {
          color: #FFFFFF;
        }
        .auth-strip-inner.guest {
          color: var(--text-muted, #75809E);
        }
        .auth-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }
        .auth-status-dot.connected {
          background: #34D399;
          box-shadow: 0 0 8px rgba(52, 211, 153, 0.6);
        }
        .auth-status-dot.guest {
          background: var(--accent-blue, #4D8DFF);
        }
        .auth-strip-link {
          margin-left: auto;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: var(--accent-blue, #4D8DFF);
          text-decoration: none;
          font-weight: 600;
        }
        .auth-strip-link:hover {
          text-decoration: underline;
        }
        .auth-strip-action {
          color: var(--accent-blue, #4D8DFF);
          text-decoration: underline;
        }
        .request-form-card {
          padding: 36px 32px;
          margin-bottom: 24px;
          background: rgba(8, 11, 20, 0.75);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-md, 12px);
        }
        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 10px;
        }
        .submit-button {
          padding: 12px 24px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .requests-guidelines-card {
          background: rgba(10, 14, 26, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-sm, 6px);
          padding: 16px 20px;
        }
        .guidelines-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.74rem;
          font-weight: 700;
          color: var(--accent-blue, #4D8DFF);
          margin-bottom: 6px;
          letter-spacing: 0.05em;
        }
        .guidelines-text {
          font-size: 0.78rem;
          color: var(--text-muted, #75809E);
          line-height: 1.55;
          margin: 0;
        }
        @media (max-width: 640px) {
          .request-form-card {
            padding: 22px 16px;
          }
          .form-grid-2 {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .auth-strip-link {
            margin-left: 0;
            width: 100%;
            margin-top: 4px;
          }
          .submit-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
