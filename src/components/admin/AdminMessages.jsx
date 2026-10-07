import React, { useState, useMemo } from 'react';
import { MessageSquare, Mail, Calendar, Check, Archive, Trash2, Search, Filter, CheckCircle2, User } from 'lucide-react';
import EmptyState from '../EmptyState';
import ConfirmationModal from './ConfirmationModal';
import FormStatus from '../FormStatus';
import { contactService } from '../../services/contact-service';
import { adminService } from '../../services/admin-service';
import './AdminTableSection.css';

export default function AdminMessages({
  messages = [],
  onRefresh = () => {}
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formStatus, setFormStatus] = useState({ status: 'idle', title: '', message: '' });

  // Confirmation modal
  const [modalState, setModalState] = useState({
    isOpen: false,
    action: null, // 'replied' | 'archive' | 'delete'
    msg: null
  });
  const [actionLoading, setActionLoading] = useState(false);

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase().trim();
        const matchesSender = m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
        const matchesSubj = m.subject?.toLowerCase().includes(q);
        const matchesMsg = m.message?.toLowerCase().includes(q);
        return matchesSender || matchesSubj || matchesMsg;
      }
      return true;
    });
  }, [messages, statusFilter, searchTerm]);

  const handleUpdateStatusDirect = async (id, status) => {
    setFormStatus({ status: 'submitting', title: 'Updating Status', message: `Setting message to ${status}...` });
    try {
      const res = await contactService.updateContactMessageStatus(id, status);
      if (res?.error) {
        setFormStatus({ status: 'error', title: 'Update Failed', message: res.error.message });
      } else {
        setFormStatus({ status: 'success', title: 'Status Updated', message: `Message marked as ${status}.` });
        await onRefresh();
      }
    } catch (err) {
      setFormStatus({ status: 'error', title: 'Error', message: err.message });
    }
  };

  const handleExecuteModalAction = async () => {
    const { action, msg } = modalState;
    if (!msg) return;

    setActionLoading(true);
    try {
      let res;
      if (action === 'delete') {
        res = await adminService.deleteContactMessage(msg.id);
      } else {
        res = await contactService.updateContactMessageStatus(msg.id, action);
      }

      if (res?.error) {
        setFormStatus({ status: 'error', title: 'Action Failed', message: res.error.message });
      } else {
        setFormStatus({
          status: 'success',
          title: 'Confirmed',
          message: action === 'delete' ? 'Message deleted.' : `Message status updated to ${action}.`
        });
        setModalState({ isOpen: false, action: null, msg: null });
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
          <h2 className="subpage-title font-display">Station Dispatch Inbox</h2>
          <p className="subpage-subtitle">
            Private communications and campus inquiries submitted through the contact portal. Strictly restricted to Station Administration.
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
            placeholder="Search inquiries by sender, email, subject, or message body..."
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
            {['all', 'new', 'read', 'replied', 'archived'].map((s) => (
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

      {/* Messages Table */}
      {filteredMessages.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No Contact Messages Found"
          description={
            statusFilter !== 'all' || searchTerm
              ? 'No messages match your search or status filter.'
              : 'Your station dispatch inbox is clear.'
          }
        />
      ) : (
        <div className="admin-data-container radio-card">
          <div className="data-table-header font-mono">
            <div>SUBJECT & MESSAGE</div>
            <div>SENDER</div>
            <div>STATUS</div>
            <div>RECEIVED</div>
            <div style={{ textAlign: 'right' }}>ACTIONS</div>
          </div>

          <div className="data-table-body">
            {filteredMessages.map((m) => {
              const timeStr = m.created_at
                ? new Date(m.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : '—';

              return (
                <div key={m.id} className="data-table-row">
                  {/* Subject & Message */}
                  <div className="col-primary">
                    <div className="row-title font-display">{m.subject || 'Studio Inquiry'}</div>
                    <p
                      className="row-sub"
                      style={{
                        color: '#CBD5E1',
                        marginTop: 4,
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      "{m.message}"
                    </p>
                  </div>

                  {/* Sender */}
                  <div className="col-dept font-mono">
                    <div className="dept-badge">{m.name}</div>
                    <div className="row-sub">
                      <Mail size={12} className="inline-icon" />
                      <span>{m.email}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <span className={`status-pill pill-${m.status || 'new'} font-mono`}>
                      {(m.status || 'new').toUpperCase()}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="font-mono text-muted date-col">
                    <Calendar size={12} className="inline-icon" />
                    <span>{timeStr}</span>
                  </div>

                  {/* Actions */}
                  <div className="col-actions">
                    {m.status === 'new' && (
                      <button
                        type="button"
                        className="action-btn-green font-mono"
                        onClick={() => handleUpdateStatusDirect(m.id, 'read')}
                        title="Mark message as read"
                      >
                        <Check size={13} />
                        <span>MARK READ</span>
                      </button>
                    )}

                    {m.status === 'read' && (
                      <button
                        type="button"
                        className="action-btn-purple font-mono"
                        onClick={() => setModalState({ isOpen: true, action: 'replied', msg: m })}
                        title="Mark inquiry answered"
                      >
                        <CheckCircle2 size={13} />
                        <span>MARK REPLIED</span>
                      </button>
                    )}

                    {(m.status === 'replied' || m.status === 'read') && (
                      <button
                        type="button"
                        className="action-icon-btn"
                        onClick={() => setModalState({ isOpen: true, action: 'archived', msg: m })}
                        title="Archive inquiry"
                      >
                        <Archive size={14} />
                      </button>
                    )}

                    <button
                      type="button"
                      className="action-icon-btn delete"
                      onClick={() => setModalState({ isOpen: true, action: 'delete', msg: m })}
                      title="Delete inquiry"
                    >
                      <Trash2 size={14} />
                    </button>
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
          modalState.action === 'replied'
            ? 'Mark Message Replied'
            : modalState.action === 'archived'
            ? 'Archive Message'
            : 'Delete Inquiry Record'
        }
        message={
          modalState.action === 'replied'
            ? `Confirm that the inquiry "${modalState.msg?.subject}" from ${modalState.msg?.name} has been resolved?`
            : modalState.action === 'archived'
            ? `Archive the inquiry from ${modalState.msg?.name}?`
            : `Permanently delete the inquiry from ${modalState.msg?.name}?`
        }
        confirmText={
          modalState.action === 'replied'
            ? 'Mark Replied'
            : modalState.action === 'archived'
            ? 'Archive'
            : 'Delete'
        }
        cancelText="Cancel"
        isDanger={modalState.action === 'delete'}
        isLoading={actionLoading}
        onConfirm={handleExecuteModalAction}
        onCancel={() => setModalState({ isOpen: false, action: null, msg: null })}
      />
    </div>
  );
}
