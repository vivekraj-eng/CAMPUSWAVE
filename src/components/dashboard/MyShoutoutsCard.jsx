import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Clock, CheckCircle2, Radio, Archive, XCircle, ArrowUpRight } from 'lucide-react';
import EmptyState from '../EmptyState';

/**
 * MyShoutoutsCard
 * Displays personal shout-outs queued for live broadcast by station RJs.
 * Statuses: pending, approved, aired, archived, rejected.
 */
export default function MyShoutoutsCard({ shoutouts = [] }) {
  const getStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'approved':
        return (
          <span className="status-badge status-approved font-mono">
            <CheckCircle2 size={12} />
            <span>APPROVED</span>
          </span>
        );
      case 'aired':
        return (
          <span className="status-badge status-played font-mono">
            <Radio size={12} />
            <span>AIRED LIVE</span>
          </span>
        );
      case 'archived':
        return (
          <span className="status-badge status-archived font-mono">
            <Archive size={12} />
            <span>ARCHIVED</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="status-badge status-rejected font-mono">
            <XCircle size={12} />
            <span>NOT AIRED</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="status-badge status-pending font-mono">
            <Clock size={12} />
            <span>PENDING REVIEW</span>
          </span>
        );
    }
  };

  return (
    <div className="radio-card dashboard-card my-shoutouts-card" id="my-shoutouts-section">
      <div className="dash-card-header font-mono">
        <div className="dash-header-title">
          <MessageSquare size={16} />
          <span>MY SHOUT-OUTS</span>
          {shoutouts.length > 0 && <span className="dash-count-badge font-mono">{shoutouts.length}</span>}
        </div>
        <Link to="/requests?tab=shoutout" className="dash-header-action font-mono">
          <span>Send a Shout-out</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {shoutouts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No shout-outs yet"
          description="Dedicate an on-air message to classmates, professors, clubs, or study squads during station shows."
          action={
            <Link to="/requests?tab=shoutout" className="btn-primary font-mono btn-compact">
              <MessageSquare size={14} />
              <span>Send a Shout-out</span>
            </Link>
          }
        />
      ) : (
        <div className="dash-records-list">
          {shoutouts.map((so) => {
            const recipient = so.recipient_name || so.dedication || '';
            const message = so.message || '';
            const formattedDate = so.created_at
              ? new Date(so.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              : 'Recently submitted';

            return (
              <div key={so.id} className="dash-record-row">
                <div className="dash-record-lead-icon">
                  <MessageSquare size={18} />
                </div>

                <div className="dash-record-content">
                  <div className="record-title-row">
                    <div className="recipient-heading">
                      {recipient ? (
                        <span className="recipient-tag font-mono">For {recipient}</span>
                      ) : (
                        <span className="recipient-tag font-mono general">General Broadcast</span>
                      )}
                    </div>
                    {getStatusBadge(so.status)}
                  </div>

                  <blockquote className="dash-quote-message">
                    "{message}"
                  </blockquote>

                  <div className="record-meta-line font-mono">
                    <span className="record-timestamp">Submitted {formattedDate}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
