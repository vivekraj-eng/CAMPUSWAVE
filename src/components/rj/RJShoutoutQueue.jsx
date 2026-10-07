import React, { useState } from 'react';
import { MessageSquare, Check, Radio, X, Clock, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import EmptyState from '../EmptyState';

/**
 * RJShoutoutQueue
 * Allows the on-air RJ to review incoming listener shout-outs and mark them as read live on air.
 */
export default function RJShoutoutQueue({ shoutouts = [], onUpdateStatus }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'aired'
  const [actionInProgressId, setActionInProgressId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const handleAction = async (id, status) => {
    setActionError(null);
    setActionInProgressId(id);
    try {
      const res = await onUpdateStatus(id, status);
      if (res && res.error) {
        setActionError(`Action failed: ${res.error.message || 'Database rejected update.'}`);
      }
    } catch (err) {
      setActionError(`Action failed: ${err.message || 'Network error.'}`);
    } finally {
      setActionInProgressId(null);
    }
  };

  const filteredShoutouts = shoutouts.filter((so) => {
    if (filter === 'all') return true;
    return (so.status || 'pending').toLowerCase() === filter;
  });

  const pendingCount = shoutouts.filter((so) => (so.status || 'pending').toLowerCase() === 'pending').length;

  return (
    <div className="radio-card rj-card rj-shoutouts-card" id="rj-shoutouts-section">
      <div className="dash-card-header font-mono">
        <div className="dash-header-title">
          <MessageSquare size={16} />
          <span>STUDIO SHOUT-OUT QUEUE</span>
          {pendingCount > 0 && (
            <span className="dash-count-badge font-mono pending-pulse">
              {pendingCount} PENDING
            </span>
          )}
        </div>

        <div className="rj-filter-pills font-mono">
          <button
            type="button"
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({shoutouts.length})
          </button>
          <button
            type="button"
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approved
          </button>
          <button
            type="button"
            className={`filter-btn ${filter === 'aired' ? 'active' : ''}`}
            onClick={() => setFilter('aired')}
          >
            Aired
          </button>
        </div>
      </div>

      {actionError && (
        <div className="rj-action-alert error font-mono">
          <AlertCircle size={14} />
          <span>{actionError}</span>
        </div>
      )}

      {filteredShoutouts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={filter === 'all' ? 'No shout-outs waiting for review' : `No ${filter} shout-outs`}
          description="Listener dedications and on-air shout-out submissions will appear here for RJ reading."
        />
      ) : (
        <div className="rj-queue-list">
          {filteredShoutouts.map((so) => {
            const recipient = so.recipient_name || so.dedication || '';
            const student = so.student_name || 'Anonymous Student';
            const email = so.student_email || '';
            const message = so.message || '';
            const status = (so.status || 'pending').toLowerCase();
            const isProcessing = actionInProgressId === so.id;

            return (
              <div key={so.id} className="rj-queue-row">
                <div className="queue-main-col">
                  <div className="queue-title-row">
                    <div className="shoutout-recipient-tag font-mono">
                      {recipient ? `FOR: ${recipient.toUpperCase()}` : 'GENERAL CAMPUS DEDICATION'}
                    </div>
                    {status === 'approved' && (
                      <span className="status-badge status-approved font-mono">
                        <Check size={11} /> APPROVED
                      </span>
                    )}
                    {status === 'aired' && (
                      <span className="status-badge status-played font-mono">
                        <Radio size={11} /> AIRED LIVE
                      </span>
                    )}
                    {status === 'rejected' && (
                      <span className="status-badge status-rejected font-mono">
                        <X size={11} /> NOT AIRED
                      </span>
                    )}
                    {status === 'pending' && (
                      <span className="status-badge status-pending font-mono">
                        <Clock size={11} /> PENDING REVIEW
                      </span>
                    )}
                  </div>

                  <blockquote className="rj-shoutout-quote">
                    "{message}"
                  </blockquote>

                  <div className="queue-meta-line font-mono">
                    <span className="queue-listener">Submitted by {student}</span>
                    {email && <span className="queue-listener-email">({email})</span>}
                  </div>
                </div>

                {/* Moderation Controls */}
                <div className="queue-actions-col">
                  {status === 'pending' && (
                    <>
                      <button
                        type="button"
                        className="btn-rj-action approve font-mono"
                        disabled={isProcessing}
                        onClick={() => handleAction(so.id, 'approved')}
                        aria-label={`Approve shout-out from ${student}`}
                      >
                        {isProcessing ? <Loader2 size={12} className="spin-icon" /> : <Check size={12} />}
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        className="btn-rj-action reject font-mono"
                        disabled={isProcessing}
                        onClick={() => handleAction(so.id, 'rejected')}
                        aria-label={`Reject shout-out from ${student}`}
                      >
                        <X size={12} />
                        <span>Decline</span>
                      </button>
                    </>
                  )}

                  {status === 'approved' && (
                    <button
                      type="button"
                      className="btn-rj-action play font-mono"
                      disabled={isProcessing}
                      onClick={() => handleAction(so.id, 'aired')}
                      aria-label={`Mark shout-out from ${student} as read live`}
                    >
                      {isProcessing ? <Loader2 size={12} className="spin-icon" /> : <Radio size={12} />}
                      <span>Mark Aired</span>
                    </button>
                  )}

                  {status === 'aired' && (
                    <span className="queue-status-done font-mono">
                      <Sparkles size={12} /> Read on Air
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
