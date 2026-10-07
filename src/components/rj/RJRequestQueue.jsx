import React, { useState } from 'react';
import { Music2, Check, Play, X, Clock, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import EmptyState from '../EmptyState';

/**
 * RJRequestQueue
 * Allows the on-air RJ to review incoming listener track requests in real time.
 * Provides mutation controls with database confirmation.
 */
export default function RJRequestQueue({ requests = [], onUpdateStatus }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'played'
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

  const filteredRequests = requests.filter((r) => {
    if (filter === 'all') return true;
    return (r.status || 'pending').toLowerCase() === filter;
  });

  const pendingCount = requests.filter((r) => (r.status || 'pending').toLowerCase() === 'pending').length;

  return (
    <div className="radio-card rj-card rj-requests-card" id="rj-requests-section">
      <div className="dash-card-header font-mono">
        <div className="dash-header-title">
          <Music2 size={16} />
          <span>LIVE TRACK REQUEST QUEUE</span>
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
            All ({requests.length})
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
            className={`filter-btn ${filter === 'played' ? 'active' : ''}`}
            onClick={() => setFilter('played')}
          >
            Played
          </button>
        </div>
      </div>

      {actionError && (
        <div className="rj-action-alert error font-mono">
          <AlertCircle size={14} />
          <span>{actionError}</span>
        </div>
      )}

      {filteredRequests.length === 0 ? (
        <EmptyState
          icon={Music2}
          title={filter === 'all' ? 'No song requests in studio queue' : `No ${filter} requests`}
          description="Track requests submitted by students from the radio player or station desk will stream here."
        />
      ) : (
        <div className="rj-queue-list">
          {filteredRequests.map((req) => {
            const title = req.song_title || req.song_name || 'Requested Track';
            const artist = req.artist_name || '';
            const student = req.student_name || 'Anonymous Student';
            const email = req.student_email || '';
            const dedication = req.dedication || '';
            const note = req.message_to_rj || '';
            const status = (req.status || 'pending').toLowerCase();
            const isProcessing = actionInProgressId === req.id;

            return (
              <div key={req.id} className="rj-queue-row">
                <div className="queue-main-col">
                  <div className="queue-title-row">
                    <h4 className="queue-item-title font-display">{title}</h4>
                    {status === 'approved' && (
                      <span className="status-badge status-approved font-mono">
                        <Check size={11} /> APPROVED
                      </span>
                    )}
                    {status === 'played' && (
                      <span className="status-badge status-played font-mono">
                        <Play size={11} /> PLAYED ON AIR
                      </span>
                    )}
                    {status === 'rejected' && (
                      <span className="status-badge status-rejected font-mono">
                        <X size={11} /> REJECTED
                      </span>
                    )}
                    {status === 'pending' && (
                      <span className="status-badge status-pending font-mono">
                        <Clock size={11} /> PENDING REVIEW
                      </span>
                    )}
                  </div>

                  <div className="queue-meta-line font-mono">
                    {artist && <span className="queue-artist">by {artist}</span>}
                    {artist && <span className="bullet-sep">•</span>}
                    <span className="queue-listener">Requested by {student}</span>
                    {email && <span className="queue-listener-email">({email})</span>}
                  </div>

                  {dedication && (
                    <div className="queue-annotation dedication font-mono">
                      <span>Dedication:</span> {dedication}
                    </div>
                  )}

                  {note && (
                    <div className="queue-annotation note font-mono">
                      <span>Message to RJ:</span> {note}
                    </div>
                  )}
                </div>

                {/* Moderation Controls */}
                <div className="queue-actions-col">
                  {status === 'pending' && (
                    <>
                      <button
                        type="button"
                        className="btn-rj-action approve font-mono"
                        disabled={isProcessing}
                        onClick={() => handleAction(req.id, 'approved')}
                        aria-label={`Approve request for ${title}`}
                      >
                        {isProcessing ? <Loader2 size={12} className="spin-icon" /> : <Check size={12} />}
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        className="btn-rj-action reject font-mono"
                        disabled={isProcessing}
                        onClick={() => handleAction(req.id, 'rejected')}
                        aria-label={`Reject request for ${title}`}
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
                      onClick={() => handleAction(req.id, 'played')}
                      aria-label={`Mark ${title} as played on air`}
                    >
                      {isProcessing ? <Loader2 size={12} className="spin-icon" /> : <Play size={12} />}
                      <span>Mark Played</span>
                    </button>
                  )}

                  {status === 'played' && (
                    <span className="queue-status-done font-mono">
                      <Sparkles size={12} /> Broadcasted
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
