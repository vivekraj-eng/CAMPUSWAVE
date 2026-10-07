import React, { useState, useMemo } from 'react';
import { Megaphone, Check, X, Radio, Archive, Trash2, Search, Filter, Calendar, Mail, User } from 'lucide-react';
import EmptyState from '../EmptyState';
import ConfirmationModal from './ConfirmationModal';
import FormStatus from '../FormStatus';
import { requestService } from '../../services/request-service';
import { adminService } from '../../services/admin-service';
import './AdminTableSection.css';

export default function AdminShoutouts({
  shoutouts = [],
  onRefresh = () => {}
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formStatus, setFormStatus] = useState({ status: 'idle', title: '', message: '' });

  // Confirmation modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    action: null, // 'aired' | 'archive' | 'reject' | 'delete'
    shout: null
  });
  const [actionLoading, setActionLoading] = useState(false);

  const filteredShoutouts = useMemo(() => {
    return shoutouts.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase().trim();
        const matchesSender = s.student_name?.toLowerCase().includes(q) || s.student_email?.toLowerCase().includes(q);
        const matchesRecip = s.recipient_name?.toLowerCase().includes(q);
        const matchesMsg = s.message?.toLowerCase().includes(q);
        const matchesDed = s.dedication?.toLowerCase().includes(q);
        return matchesSender || matchesRecip || matchesMsg || matchesDed;
      }
      return true;
    });
  }, [shoutouts, statusFilter, searchTerm]);

  const handleUpdateStatusDirect = async (id, status) => {
    setFormStatus({ status: 'submitting', title: 'Updating Shout-out', message: `Setting status to ${status}...` });
    try {
      const res = await requestService.updateShoutoutStatus(id, status);
      if (res?.error) {
        setFormStatus({ status: 'error', title: 'Update Failed', message: res.error.message });
      } else {
        setFormStatus({ status: 'success', title: 'Status Updated', message: `Shout-out updated to ${status}.` });
        await onRefresh();
      }
    } catch (err) {
      setFormStatus({ status: 'error', title: 'Error', message: err.message });
    }
  };

  const handleExecuteModalAction = async () => {
    const { action, shout } = modalState;
    if (!shout) return;

    setActionLoading(true);
    try {
      let res;
      if (action === 'delete') {
        res = await adminService.deleteShoutout(shout.id);
      } else {
        res = await requestService.updateShoutoutStatus(shout.id, action);
      }

      if (res?.error) {
        setFormStatus({ status: 'error', title: 'Action Failed', message: res.error.message });
      } else {
        setFormStatus({
          status: 'success',
          title: 'Confirmed',
          message: action === 'delete' ? 'Shout-out deleted.' : `Shout-out set to ${action}.`
        });
        setModalState({ isOpen: false, action: null, shout: null });
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
          <h2 className="subpage-title font-display">Shout-outs Moderation Desk</h2>
          <p className="subpage-subtitle">
            Review live dedications, celebratory notes, and messages to be broadcast by Radio Jockeys.
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
            placeholder="Search shout-outs by sender, recipient, message text, or occasion..."
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
            {['all', 'pending', 'approved', 'aired', 'archived', 'rejected'].map((s) => (
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

      {/* Shout-outs Table */}
      {filteredShoutouts.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No Shout-outs Found"
          description={
            statusFilter !== 'all' || searchTerm
              ? 'No shout-outs match the specified search or filter criteria.'
              : 'No student shout-outs have been logged yet.'
          }
        />
      ) : (
        <div className="admin-data-container radio-card">
          <div className="data-table-header font-mono">
            <div>RECIPIENT & MESSAGE</div>
            <div>SENDER</div>
            <div>STATUS</div>
            <div>SUBMITTED</div>
            <div style={{ textAlign: 'right' }}>ACTIONS</div>
          </div>

          <div className="data-table-body">
            {filteredShoutouts.map((s) => {
              const timeStr = s.created_at
                ? new Date(s.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : '—';

              return (
                <div key={s.id} className="data-table-row">
                  {/* Recipient & Message */}
                  <div className="col-primary">
                    <div className="row-title font-display">
                      {s.recipient_name ? (
                        <>To: <span className="text-purple">{s.recipient_name}</span></>
                      ) : (
                        'General Campus Dedication'
                      )}
                    </div>
                    {s.dedication && (
                      <div className="row-sub font-mono" style={{ color: '#FBBF24' }}>
                        Occasion: {s.dedication}
                      </div>
                    )}
                    <p
                      className="row-sub"
                      style={{
                        fontStyle: 'italic',
                        color: '#E2E8F0',
                        marginTop: 4,
                        lineHeight: 1.4
                      }}
                    >
                      "{s.message}"
                    </p>
                  </div>

                  {/* Sender */}
                  <div className="col-dept font-mono">
                    <div className="dept-badge">{s.student_name}</div>
                    <div className="row-sub">{s.student_email}</div>
                  </div>

                  {/* Status */}
                  <div>
                    <span className={`status-pill pill-${s.status || 'pending'} font-mono`}>
                      {(s.status || 'pending').toUpperCase()}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="font-mono text-muted date-col">
                    <Calendar size={12} className="inline-icon" />
                    <span>{timeStr}</span>
                  </div>

                  {/* Actions */}
                  <div className="col-actions">
                    {s.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          className="action-btn-green font-mono"
                          onClick={() => handleUpdateStatusDirect(s.id, 'approved')}
                          title="Approve for on-air reading"
                        >
                          <Check size={13} />
                          <span>APPROVE</span>
                        </button>
                        <button
                          type="button"
                          className="action-btn-red font-mono"
                          onClick={() => setModalState({ isOpen: true, action: 'rejected', shout: s })}
                          title="Reject shout-out"
                        >
                          <X size={13} />
                        </button>
                      </>
                    )}

                    {s.status === 'approved' && (
                      <>
                        <button
                          type="button"
                          className="action-btn-purple font-mono"
                          onClick={() => setModalState({ isOpen: true, action: 'aired', shout: s })}
                          title="Mark Aired on Live Broadcast"
                        >
                          <Radio size={12} />
                          <span>MARK AIRED</span>
                        </button>
                      </>
                    )}

                    {(s.status === 'aired' || s.status === 'rejected') && (
                      <>
                        <button
                          type="button"
                          className="action-icon-btn"
                          onClick={() => handleUpdateStatusDirect(s.id, 'archived')}
                          title="Archive shout-out"
                        >
                          <Archive size={14} />
                        </button>
                        <button
                          type="button"
                          className="action-icon-btn delete"
                          onClick={() => setModalState({ isOpen: true, action: 'delete', shout: s })}
                          title="Delete record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}

                    {s.status === 'archived' && (
                      <button
                        type="button"
                        className="action-icon-btn delete"
                        onClick={() => setModalState({ isOpen: true, action: 'delete', shout: s })}
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
          modalState.action === 'aired'
            ? 'Mark Shout-out Aired'
            : modalState.action === 'rejected'
            ? 'Reject Shout-out'
            : 'Delete Shout-out Record'
        }
        message={
          modalState.action === 'aired'
            ? `Confirm that this shout-out from ${modalState.shout?.student_name} was delivered on air?`
            : modalState.action === 'rejected'
            ? `Reject the shout-out from ${modalState.shout?.student_name}?`
            : `Delete the shout-out record from ${modalState.shout?.student_name}?`
        }
        confirmText={
          modalState.action === 'aired'
            ? 'Mark Aired'
            : modalState.action === 'rejected'
            ? 'Reject'
            : 'Delete'
        }
        cancelText="Cancel"
        isDanger={modalState.action === 'rejected' || modalState.action === 'delete'}
        isLoading={actionLoading}
        onConfirm={handleExecuteModalAction}
        onCancel={() => setModalState({ isOpen: false, action: null, shout: null })}
      />
    </div>
  );
}
