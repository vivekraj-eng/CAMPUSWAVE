import React, { useState, useMemo } from 'react';
import { Music2, Check, X, Play, Filter, Search, Calendar, Mail, User, Trash2 } from 'lucide-react';
import EmptyState from '../EmptyState';
import ConfirmationModal from './ConfirmationModal';
import FormStatus from '../FormStatus';
import { requestService } from '../../services/request-service';
import { adminService } from '../../services/admin-service';
import './AdminTableSection.css';

export default function AdminRequests({
  requests = [],
  onRefresh = () => {}
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formStatus, setFormStatus] = useState({ status: 'idle', title: '', message: '' });

  // Confirmation modal
  const [modalState, setModalState] = useState({
    isOpen: false,
    action: null, // 'played' | 'reject' | 'delete'
    req: null
  });
  const [actionLoading, setActionLoading] = useState(false);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase().trim();
        const matchesSong = r.song_name?.toLowerCase().includes(q) || r.song_title?.toLowerCase().includes(q);
        const matchesArtist = r.artist_name?.toLowerCase().includes(q);
        const matchesStudent = r.student_name?.toLowerCase().includes(q) || r.student_email?.toLowerCase().includes(q);
        const matchesDed = r.dedication?.toLowerCase().includes(q);
        return matchesSong || matchesArtist || matchesStudent || matchesDed;
      }
      return true;
    });
  }, [requests, statusFilter, searchTerm]);

  const handleUpdateStatusDirect = async (id, status) => {
    setFormStatus({ status: 'submitting', title: 'Updating Request', message: `Setting status to ${status}...` });
    try {
      const res = await requestService.updateRequestStatus(id, status);
      if (res?.error) {
        setFormStatus({ status: 'error', title: 'Update Failed', message: res.error.message });
      } else {
        setFormStatus({ status: 'success', title: 'Status Updated', message: `Request updated to ${status}.` });
        await onRefresh();
      }
    } catch (err) {
      setFormStatus({ status: 'error', title: 'Error', message: err.message });
    }
  };

  const handleExecuteModalAction = async () => {
    const { action, req } = modalState;
    if (!req) return;

    setActionLoading(true);
    try {
      let res;
      if (action === 'delete') {
        res = await adminService.deleteSongRequest(req.id);
      } else {
        res = await requestService.updateRequestStatus(req.id, action);
      }

      if (res?.error) {
        setFormStatus({ status: 'error', title: 'Action Failed', message: res.error.message });
      } else {
        setFormStatus({
          status: 'success',
          title: 'Confirmed',
          message: action === 'delete' ? 'Request deleted.' : `Request marked as ${action}.`
        });
        setModalState({ isOpen: false, action: null, req: null });
        await onRefresh();
      }
    } catch (err) {
      setFormStatus({ status: 'error', title: 'Error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-subpage">
      <div className="subpage-masthead">
        <div>
          <h2 className="subpage-title font-display">Song Requests Moderation</h2>
          <p className="subpage-subtitle">
            Curate student broadcast queue, approve dedications, and manage on-air playlist selections.
          </p>
        </div>
      </div>

      <FormStatus
        status={formStatus.status}
        title={formStatus.title}
        message={formStatus.message}
        className="subpage-form-status"
      />

      {/* Filter and Search Controls */}
      <div className="admin-controls-card radio-card">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="search"
            className="admin-search-field"
            placeholder="Search by song name, artist, student, or dedication..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group font-mono">
          <label className="filter-label">
            <Filter size={13} />
            <span>STATUS:</span>
          </label>
          <div className="filter-pills">
            {['all', 'pending', 'approved', 'played', 'rejected'].map((s) => (
              <button
                key={s}
                type="button"
                className={`filter-pill-btn ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requests Table */}
      {filteredRequests.length === 0 ? (
        <EmptyState
          icon={Music2}
          title="No Song Requests Found"
          description={
            statusFilter !== 'all' || searchTerm
              ? 'No track requests match the current search or status filter.'
              : 'The station track request queue is currently empty.'
          }
        />
      ) : (
        <div className="admin-data-container radio-card">
          <div className="data-table-header font-mono">
            <div>TRACK & DEDICATION</div>
            <div>STUDENT</div>
            <div>STATUS</div>
            <div>SUBMITTED</div>
            <div style={{ textAlign: 'right' }}>MODERATION ACTIONS</div>
          </div>

          <div className="data-table-body">
            {filteredRequests.map((r) => {
              const timeStr = r.created_at
                ? new Date(r.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : '—';

              const title = r.song_title || r.song_name;

              return (
                <div key={r.id} className="data-table-row">
                  {/* Track Info */}
                  <div className="col-primary">
                    <div className="row-title font-display">
                      {title} {r.artist_name ? <span className="text-cyan">— {r.artist_name}</span> : ''}
                    </div>
                    {r.dedication && (
                      <div className="row-sub font-mono" style={{ color: '#C084FC' }}>
                        Dedication: {r.dedication}
                      </div>
                    )}
                    {r.message_to_rj && (
                      <div className="row-sub" style={{ fontStyle: 'italic', color: '#94A3B8' }}>
                        "{r.message_to_rj}"
                      </div>
                    )}
                  </div>

                  {/* Student */}
                  <div className="col-dept font-mono">
                    <div className="dept-badge">{r.student_name}</div>
                    <div className="row-sub">{r.student_email}</div>
                  </div>

                  {/* Status */}
                  <div>
                    <span className={`status-pill pill-${r.status || 'pending'} font-mono`}>
                      {(r.status || 'pending').toUpperCase()}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="font-mono text-muted date-col">
                    <Calendar size={12} className="inline-icon" />
                    <span>{timeStr}</span>
                  </div>

                  {/* Actions */}
                  <div className="col-actions">
                    {r.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          className="action-btn-green font-mono"
                          onClick={() => handleUpdateStatusDirect(r.id, 'approved')}
                          title="Approve for airplay"
                        >
                          <Check size={13} />
                          <span>APPROVE</span>
                        </button>
                        <button
                          type="button"
                          className="action-btn-red font-mono"
                          onClick={() => setModalState({ isOpen: true, action: 'rejected', req: r })}
                          title="Reject request"
                        >
                          <X size={13} />
                        </button>
                      </>
                    )}

                    {r.status === 'approved' && (
                      <>
                        <button
                          type="button"
                          className="action-btn-purple font-mono"
                          onClick={() => setModalState({ isOpen: true, action: 'played', req: r })}
                          title="Mark Track Played"
                        >
                          <Play size={12} fill="currentColor" />
                          <span>MARK PLAYED</span>
                        </button>
                      </>
                    )}

                    {(r.status === 'played' || r.status === 'rejected') && (
                      <button
                        type="button"
                        className="action-icon-btn delete"
                        onClick={() => setModalState({ isOpen: true, action: 'delete', req: r })}
                        title="Delete record"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        title={
          modalState.action === 'played'
            ? 'Mark Track Played'
            : modalState.action === 'rejected'
            ? 'Reject Song Request'
            : 'Delete Request Record'
        }
        message={
          modalState.action === 'played'
            ? `Confirm that "${modalState.req?.song_name}" was aired on broadcast?`
            : modalState.action === 'rejected'
            ? `Reject the request for "${modalState.req?.song_name}"?`
            : `Delete the request record for "${modalState.req?.song_name}"?`
        }
        confirmText={
          modalState.action === 'played'
            ? 'Mark Played'
            : modalState.action === 'rejected'
            ? 'Reject Request'
            : 'Delete Record'
        }
        cancelText="Cancel"
        isDanger={modalState.action === 'rejected' || modalState.action === 'delete'}
        isLoading={actionLoading}
        onConfirm={handleExecuteModalAction}
        onCancel={() => setModalState({ isOpen: false, action: null, req: null })}
      />
    </div>
  );
}
