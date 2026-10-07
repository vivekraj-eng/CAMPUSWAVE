import React from 'react';
import { Link } from 'react-router-dom';
import { Music2, Clock, CheckCircle2, Play, XCircle, ArrowUpRight } from 'lucide-react';
import EmptyState from '../EmptyState';

/**
 * MyRequestsCard
 * Displays personal track requests submitted to the live radio studio.
 * Statuses: pending, approved, played, rejected.
 */
export default function MyRequestsCard({ requests = [] }) {
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
      case 'played':
        return (
          <span className="status-badge status-played font-mono">
            <Play size={12} />
            <span>PLAYED ON AIR</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="status-badge status-rejected font-mono">
            <XCircle size={12} />
            <span>NOT PLAYED</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="status-badge status-pending font-mono">
            <Clock size={12} />
            <span>STUDIO REVIEW</span>
          </span>
        );
    }
  };

  return (
    <div className="radio-card dashboard-card my-requests-card" id="my-requests-section">
      <div className="dash-card-header font-mono">
        <div className="dash-header-title">
          <Music2 size={16} />
          <span>MY SONG REQUESTS</span>
          {requests.length > 0 && <span className="dash-count-badge font-mono">{requests.length}</span>}
        </div>
        <Link to="/requests?tab=song" className="dash-header-action font-mono">
          <span>Make a Request</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={Music2}
          title="No song requests yet"
          description="Send a track request to the RJ control room to be queued during upcoming live broadcasts."
          action={
            <Link to="/requests?tab=song" className="btn-primary font-mono btn-compact">
              <Music2 size={14} />
              <span>Make a Request</span>
            </Link>
          }
        />
      ) : (
        <div className="dash-records-list">
          {requests.map((req) => {
            const title = req.song_title || req.song_name || 'Requested Track';
            const artist = req.artist_name || '';
            const dedication = req.dedication || '';
            const message = req.message_to_rj || '';
            const formattedDate = req.created_at
              ? new Date(req.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              : 'Recently submitted';

            return (
              <div key={req.id} className="dash-record-row">
                <div className="dash-record-lead-icon">
                  <Music2 size={18} />
                </div>

                <div className="dash-record-content">
                  <div className="record-title-row">
                    <h4 className="record-primary-title font-display">{title}</h4>
                    {getStatusBadge(req.status)}
                  </div>

                  <div className="record-meta-line font-mono">
                    {artist && <span className="record-artist">by {artist}</span>}
                    {artist && <span className="bullet-sep">•</span>}
                    <span className="record-timestamp">Submitted {formattedDate}</span>
                  </div>

                  {dedication && (
                    <div className="record-annotation font-mono dedication">
                      <span>Dedication:</span> {dedication}
                    </div>
                  )}

                  {message && (
                    <div className="record-annotation font-mono message">
                      <span>Note to RJ:</span> {message}
                    </div>
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
