import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Clock, CheckCircle2, XCircle, ArrowUpRight, Shield, Sparkles } from 'lucide-react';
import EmptyState from '../EmptyState';

/**
 * MyApplicationCard
 * Displays the status of the student's membership application to the CampusWave Radio Club.
 * Statuses: pending, approved, rejected.
 */
export default function MyApplicationCard({ applications = [] }) {
  // Use the most recent application on record
  const currentApp = applications && applications.length > 0 ? applications[0] : null;

  return (
    <div className="radio-card dashboard-card my-application-card" id="my-application-section">
      <div className="dash-card-header font-mono">
        <div className="dash-header-title">
          <Award size={16} />
          <span>CLUB APPLICATION</span>
        </div>
        {currentApp?.status === 'rejected' && (
          <Link to="/join" className="dash-header-action font-mono">
            <span>Apply Again</span>
            <ArrowUpRight size={13} />
          </Link>
        )}
      </div>

      {!currentApp ? (
        <EmptyState
          icon={Award}
          title="Join the CampusWave team"
          description="Become an On-Air RJ, Audio Engineer, Content Creator, Event Coordinator, or Technical Specialist."
          action={
            <Link to="/join" className="btn-primary font-mono btn-compact">
              <Award size={14} />
              <span>Apply to Join</span>
            </Link>
          }
        />
      ) : (
        <div className="application-status-card">
          <div className="app-summary-row">
            <div className="app-team-lead">
              <div className="app-guild-badge font-mono">
                <Shield size={12} />
                <span>PREFERRED GUILD</span>
              </div>
              <h3 className="app-team-title font-display">
                {currentApp.preferred_team || 'Radio Station Operations'}
              </h3>
              <div className="app-date font-mono">
                Applied on{' '}
                {currentApp.created_at
                  ? new Date(currentApp.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })
                  : 'Recent cycle'}
              </div>
            </div>

            <div className="app-status-indicator">
              {currentApp.status === 'pending' && (
                <div className="status-badge status-pending font-mono">
                  <Clock size={13} />
                  <span>APPLICATION UNDER REVIEW</span>
                </div>
              )}
              {currentApp.status === 'approved' && (
                <div className="status-badge status-approved font-mono">
                  <CheckCircle2 size={13} />
                  <span>ACCEPTED & ROSTERED</span>
                </div>
              )}
              {currentApp.status === 'rejected' && (
                <div className="status-badge status-rejected font-mono">
                  <XCircle size={13} />
                  <span>APPLICATION NOT ACCEPTED</span>
                </div>
              )}
            </div>
          </div>

          {/* Contextual status feedback */}
          {currentApp.status === 'pending' && (
            <div className="app-feedback-box pending font-mono">
              <Clock size={14} className="feedback-icon" />
              <div>
                <strong>Application under review:</strong> Station directors review submissions on a weekly cycle. If selected for an interview or studio audition, you will be contacted at your registered college email.
              </div>
            </div>
          )}

          {currentApp.status === 'approved' && (
            <div className="app-feedback-box approved">
              <div className="feedback-header font-mono">
                <Sparkles size={14} />
                <span>WELCOME TO THE STATION TEAM</span>
              </div>
              <p className="feedback-desc">
                Congratulations! Your application to the <strong>{currentApp.preferred_team}</strong> team has been approved. Check your college inbox for studio onboarding details and production guild schedules.
              </p>
            </div>
          )}

          {currentApp.status === 'rejected' && (
            <div className="app-feedback-box rejected">
              <div className="feedback-header font-mono">
                <XCircle size={14} />
                <span>SELECTION CYCLE CONCLUDED</span>
              </div>
              <p className="feedback-desc">
                Thank you for applying. While this cycle was competitive, student applications reopen next term, or you may apply for alternative team departments.
              </p>
              <div className="feedback-action">
                <Link to="/join" className="btn-secondary font-mono btn-compact">
                  <span>Submit New Application</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>
          )}

          {currentApp.review_notes && (
            <div className="app-review-notes font-mono">
              <span className="notes-label">Station Director Note:</span> {currentApp.review_notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
