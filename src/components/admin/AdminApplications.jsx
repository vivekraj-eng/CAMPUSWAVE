import React, { useState, useMemo } from 'react';
import { Award, Check, X, Filter, Search, Calendar, Mail, Phone, BookOpen, AlertCircle, Trash2 } from 'lucide-react';
import EmptyState from '../EmptyState';
import ConfirmationModal from './ConfirmationModal';
import FormStatus from '../FormStatus';
import { applicationService } from '../../services/application-service';
import { adminService } from '../../services/admin-service';
import './AdminTableSection.css';

export default function AdminApplications({
  applications = [],
  onRefresh = () => {}
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formStatus, setFormStatus] = useState({ status: 'idle', title: '', message: '' });

  // Confirmation modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    action: null, // 'approve' | 'reject' | 'delete'
    app: null
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase().trim();
        const matchesName = app.full_name?.toLowerCase().includes(q);
        const matchesEmail = app.email?.toLowerCase().includes(q);
        const matchesTeam = app.preferred_team?.toLowerCase().includes(q);
        const matchesDept = app.department?.toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesTeam || matchesDept;
      }
      return true;
    });
  }, [applications, statusFilter, searchTerm]);

  const handleOpenModal = (app, action) => {
    setReviewNotes(
      action === 'approve'
        ? 'Application approved for radio club induction.'
        : action === 'reject'
        ? 'Positions filled for current broadcast semester.'
        : ''
    );
    setModalState({ isOpen: true, action, app });
  };

  const handleExecuteModalAction = async () => {
    const { action, app } = modalState;
    if (!app) return;

    setModalLoading(true);
    setFormStatus({
      status: 'submitting',
      title: 'Transmitting Decision to Supabase',
      message: `Persisting ${action} status for ${app.full_name}...`
    });

    try {
      let res;
      if (action === 'approve') {
        res = await applicationService.updateApplicationStatus(app.id, 'approved', reviewNotes);
      } else if (action === 'reject') {
        res = await applicationService.updateApplicationStatus(app.id, 'rejected', reviewNotes);
      } else if (action === 'delete') {
        res = await adminService.deleteApplication(app.id);
      }

      if (res?.error) {
        setFormStatus({
          status: 'error',
          title: 'Database Mutation Failed',
          message: res.error.message || 'Operation was rejected by Supabase RLS policies.'
        });
      } else {
        setFormStatus({
          status: 'success',
          title: action === 'delete' ? 'Record Removed' : 'Status Updated',
          message: `Application for ${app.full_name} is now ${action === 'delete' ? 'deleted' : action + 'd'}.`
        });
        setModalState({ isOpen: false, action: null, app: null });
        await onRefresh();
      }
    } catch (err) {
      setFormStatus({
        status: 'error',
        title: 'Communication Error',
        message: err.message || 'Failed to update club application record.'
      });
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="admin-subpage">
      <div className="subpage-masthead">
        <div>
          <h2 className="subpage-title font-display">Club Membership Applications</h2>
          <p className="subpage-subtitle">
            Review student candidates applying to join the CampusWave broadcast and technical teams.
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
            placeholder="Search applicants, emails, preferred team, or department..."
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
            {['all', 'pending', 'approved', 'rejected'].map((s) => (
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

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No Applications Found"
          description={
            statusFilter !== 'all' || searchTerm
              ? 'No candidate applications match the selected criteria.'
              : 'No club membership applications have been submitted yet.'
          }
        />
      ) : (
        <div className="admin-data-container radio-card">
          <div className="data-table-header font-mono">
            <div>APPLICANT & CONTACT</div>
            <div>TEAM & INTRO</div>
            <div>DEPARTMENT & YR</div>
            <div>STATUS</div>
            <div style={{ textAlign: 'right' }}>DECISION</div>
          </div>

          <div className="data-table-body">
            {filteredApps.map((app) => {
              const dateStr = app.created_at
                ? new Date(app.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })
                : '—';

              return (
                <div key={app.id} className="data-table-row">
                  {/* Applicant Details */}
                  <div className="col-primary">
                    <div className="row-title font-display">{app.full_name}</div>
                    <div className="row-sub font-mono">
                      <Mail size={12} className="inline-icon" />
                      <span>{app.email || app.college_email}</span>
                      {app.phone && (
                        <>
                          <span style={{ opacity: 0.4 }}>•</span>
                          <Phone size={12} className="inline-icon" />
                          <span>{app.phone}</span>
                        </>
                      )}
                    </div>
                    <div className="row-sub font-mono" style={{ fontSize: '0.68rem', color: '#64748B' }}>
                      <Calendar size={11} className="inline-icon" />
                      <span>Submitted: {dateStr}</span>
                    </div>
                  </div>

                  {/* Team & Statement */}
                  <div className="col-primary">
                    <span className="font-mono text-purple" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                      {app.preferred_team}
                    </span>
                    {app.skills_interests && (
                      <div className="row-sub font-mono" style={{ color: '#38BDF8' }}>
                        Skills: {app.skills_interests}
                      </div>
                    )}
                    {app.introduction && (
                      <p
                        className="row-sub"
                        style={{
                          fontStyle: 'italic',
                          color: '#CBD5E1',
                          marginTop: 4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        "{app.introduction}"
                      </p>
                    )}
                    {app.review_notes && (
                      <div className="row-sub font-mono" style={{ color: '#F59E0B', marginTop: 2 }}>
                        Note: {app.review_notes}
                      </div>
                    )}
                  </div>

                  {/* Dept */}
                  <div className="col-dept font-mono">
                    <div className="dept-badge">{app.department}</div>
                    <div className="row-sub">{app.year || app.academic_year || '1st Year'}</div>
                  </div>

                  {/* Status */}
                  <div>
                    <span className={`status-pill pill-${app.status || 'pending'} font-mono`}>
                      {(app.status || 'pending').toUpperCase()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-actions">
                    {app.status === 'pending' ? (
                      <>
                        <button
                          type="button"
                          className="action-btn-green font-mono"
                          onClick={() => handleOpenModal(app, 'approve')}
                          title="Approve membership"
                        >
                          <Check size={13} />
                          <span>APPROVE</span>
                        </button>
                        <button
                          type="button"
                          className="action-btn-red font-mono"
                          onClick={() => handleOpenModal(app, 'reject')}
                          title="Reject application"
                        >
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="action-icon-btn delete"
                          onClick={() => handleOpenModal(app, 'delete')}
                          title="Delete application record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
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
          modalState.action === 'approve'
            ? 'Approve Club Application'
            : modalState.action === 'reject'
            ? 'Reject Club Application'
            : 'Delete Application Record'
        }
        message={
          modalState.action === 'approve'
            ? `Confirm approving ${modalState.app?.full_name} for the ${modalState.app?.preferred_team} team?`
            : modalState.action === 'reject'
            ? `Confirm rejecting the application submitted by ${modalState.app?.full_name}?`
            : `Delete the application submission for ${modalState.app?.full_name}? This action cannot be undone.`
        }
        confirmText={
          modalState.action === 'approve'
            ? 'Approve Candidate'
            : modalState.action === 'reject'
            ? 'Reject Candidate'
            : 'Delete Record'
        }
        cancelText="Cancel"
        isDanger={modalState.action === 'reject' || modalState.action === 'delete'}
        isLoading={modalLoading}
        onConfirm={handleExecuteModalAction}
        onCancel={() => setModalState({ isOpen: false, action: null, app: null })}
      />
    </div>
  );
}
