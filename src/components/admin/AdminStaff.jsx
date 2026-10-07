import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Trash2,
  Power,
  RefreshCw,
  Search,
  AlertTriangle,
  Mail,
  CheckCircle,
  Lock,
  Mic,
  Shield
} from 'lucide-react';
import { adminService } from '../../services/admin-service';
import ConfirmationModal from './ConfirmationModal';
import FormStatus from '../FormStatus';
import EmptyState from '../EmptyState';
import './AdminTableSection.css';
import './AdminStaff.css';

const OWNER_EMAIL = 'jalagadugulavivekraj@gmail.com';

export default function AdminStaff() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Add staff form modal / toggle
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('rj');
  const [newIsActive, setNewIsActive] = useState(true);
  const [addLoading, setAddLoading] = useState(false);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    isDanger: false,
    onConfirm: () => {}
  });

  const [formStatus, setFormStatus] = useState({ status: 'idle', title: '', message: '' });

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getAuthorizedStaff();
      setStaffList(data || []);
    } catch (err) {
      console.error('Failed to load authorized staff:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((staff) => {
      const staffEmail = (staff.email || '').toLowerCase().trim();
      if (roleFilter !== 'all' && staff.role !== roleFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase().trim();
        return staffEmail.includes(q);
      }
      return true;
    });
  }, [staffList, roleFilter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = staffList.length;
    const activeAdmins = staffList.filter((s) => s.role === 'admin' && s.is_active).length;
    const activeRJs = staffList.filter((s) => s.role === 'rj' && s.is_active).length;
    return { total, activeAdmins, activeRJs };
  }, [staffList]);

  // Handle Add Staff
  const handleAddStaff = async (e) => {
    e.preventDefault();
    const cleanEmail = newEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormStatus({
        status: 'error',
        title: 'Invalid Email',
        message: 'Please provide a valid staff email address.'
      });
      return;
    }

    if (!['rj', 'admin'].includes(newRole)) {
      setFormStatus({
        status: 'error',
        title: 'Invalid Role',
        message: "Only 'rj' or 'admin' roles can be authorized."
      });
      return;
    }

    setAddLoading(true);
    setFormStatus({ status: 'submitting', title: 'Authorizing Staff', message: `Registering ${cleanEmail}...` });

    try {
      const res = await adminService.addAuthorizedStaff({
        email: cleanEmail,
        role: newRole,
        is_active: newIsActive
      });

      if (res.error) {
        setFormStatus({
          status: 'error',
          title: 'Authorization Failed',
          message: res.error.message || 'Unable to authorize staff member.'
        });
      } else {
        setFormStatus({
          status: 'success',
          title: 'Staff Member Authorized',
          message: `${cleanEmail} is now authorized as ${newRole.toUpperCase()}. They can sign in with Supabase Auth.`
        });
        setNewEmail('');
        setNewRole('rj');
        setNewIsActive(true);
        setShowAddForm(false);
        await loadStaff();
      }
    } catch (err) {
      setFormStatus({
        status: 'error',
        title: 'Authorization Error',
        message: err.message || 'An unexpected error occurred.'
      });
    } finally {
      setAddLoading(false);
    }
  };

  // Toggle Staff Active Status
  const handleToggleActiveInitiate = (staff) => {
    const isOwner = (staff.email || '').toLowerCase().trim() === OWNER_EMAIL;
    if (isOwner && staff.is_active) {
      setFormStatus({
        status: 'error',
        title: 'Action Prohibited',
        message: 'The primary station owner record (jalagadugulavivekraj@gmail.com) cannot be deactivated.'
      });
      return;
    }

    const nextState = !staff.is_active;
    const willDeactivateAdmin = staff.role === 'admin' && !nextState;
    const isLastAdmin = willDeactivateAdmin && stats.activeAdmins <= 1;

    setConfirmModal({
      isOpen: true,
      title: nextState ? 'Activate Staff Member' : 'Deactivate Staff Access',
      message: isLastAdmin
        ? `CAUTION: Deactivating ${staff.email} will leave the station without any active administrators! Are you sure?`
        : `Are you sure you want to ${nextState ? 'activate' : 'deactivate'} access for ${staff.email}?`,
      confirmText: nextState ? 'Activate' : 'Deactivate',
      isDanger: !nextState,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setFormStatus({
          status: 'submitting',
          title: 'Updating Access',
          message: `Updating authorization state for ${staff.email}...`
        });

        const res = await adminService.updateAuthorizedStaff(staff.id, { is_active: nextState }, staff.email);
        if (res.error) {
          setFormStatus({
            status: 'error',
            title: 'Update Failed',
            message: res.error.message || 'Unable to modify staff status.'
          });
        } else {
          setFormStatus({
            status: 'success',
            title: 'Staff Status Updated',
            message: `${staff.email} has been ${nextState ? 'activated' : 'deactivated'}.`
          });
          await loadStaff();
        }
      }
    });
  };

  // Change Role (RJ <-> Admin)
  const handleChangeRoleInitiate = (staff, targetRole) => {
    const isOwner = (staff.email || '').toLowerCase().trim() === OWNER_EMAIL;
    if (isOwner && targetRole !== 'admin') {
      setFormStatus({
        status: 'error',
        title: 'Action Prohibited',
        message: 'The primary station owner (jalagadugulavivekraj@gmail.com) cannot be demoted from admin.'
      });
      return;
    }

    const willDemoteAdmin = staff.role === 'admin' && targetRole !== 'admin';
    const isLastAdmin = willDemoteAdmin && stats.activeAdmins <= 1;

    setConfirmModal({
      isOpen: true,
      title: `Change Role to ${targetRole.toUpperCase()}`,
      message: isLastAdmin
        ? `CAUTION: Demoting ${staff.email} will leave the station without an active administrator!`
        : `Are you sure you want to reassign ${staff.email} from ${staff.role.toUpperCase()} to ${targetRole.toUpperCase()}?`,
      confirmText: `Promote / Reassign to ${targetRole.toUpperCase()}`,
      isDanger: targetRole !== 'admin',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setFormStatus({
          status: 'submitting',
          title: 'Reassigning Role',
          message: `Updating staff role to ${targetRole.toUpperCase()}...`
        });

        const res = await adminService.updateAuthorizedStaff(staff.id, { role: targetRole }, staff.email);
        if (res.error) {
          setFormStatus({
            status: 'error',
            title: 'Role Update Failed',
            message: res.error.message || 'Unable to update staff role.'
          });
        } else {
          setFormStatus({
            status: 'success',
            title: 'Role Updated',
            message: `${staff.email} is now assigned the ${targetRole.toUpperCase()} role.`
          });
          await loadStaff();
        }
      }
    });
  };

  // Remove Staff Member
  const handleDeleteStaffInitiate = (staff) => {
    const isOwner = (staff.email || '').toLowerCase().trim() === OWNER_EMAIL;
    if (isOwner) {
      setFormStatus({
        status: 'error',
        title: 'Action Prohibited',
        message: 'The primary station owner record (jalagadugulavivekraj@gmail.com) cannot be deleted.'
      });
      return;
    }

    const isLastAdmin = staff.role === 'admin' && stats.activeAdmins <= 1;

    setConfirmModal({
      isOpen: true,
      title: 'Remove Authorized Staff',
      message: isLastAdmin
        ? `CRITICAL WARNING: Removing ${staff.email} will remove the last active administrator! Are you sure?`
        : `Are you sure you want to remove ${staff.email} from authorized staff? Their privileged access will be revoked immediately upon database sync.`,
      confirmText: 'Remove Staff',
      isDanger: true,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setFormStatus({
          status: 'submitting',
          title: 'Removing Staff',
          message: `Revoking staff authorization for ${staff.email}...`
        });

        const res = await adminService.deleteAuthorizedStaff(staff.id, staff.email);
        if (res.error) {
          setFormStatus({
            status: 'error',
            title: 'Removal Failed',
            message: res.error.message || 'Failed to remove staff record.'
          });
        } else {
          setFormStatus({
            status: 'success',
            title: 'Staff Removed',
            message: `${staff.email} has been removed from authorized staff.`
          });
          await loadStaff();
        }
      }
    });
  };

  return (
    <div className="admin-staff-management">
      {/* Top Banner / Metrics */}
      <div className="staff-metrics-grid">
        <div className="radio-card staff-metric-card">
          <div className="metric-icon-wrap primary">
            <ShieldCheck size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label font-mono">TOTAL AUTHORIZED</span>
            <span className="metric-value font-display">{stats.total}</span>
          </div>
        </div>

        <div className="radio-card staff-metric-card">
          <div className="metric-icon-wrap red">
            <ShieldAlert size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label font-mono">ACTIVE ADMINS</span>
            <span className="metric-value font-display">{stats.activeAdmins}</span>
          </div>
        </div>

        <div className="radio-card staff-metric-card">
          <div className="metric-icon-wrap purple">
            <Mic size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label font-mono">ACTIVE RJS</span>
            <span className="metric-value font-display">{stats.activeRJs}</span>
          </div>
        </div>
      </div>

      {/* Status Feedback */}
      {formStatus.status !== 'idle' && (
        <div style={{ marginBottom: '18px' }}>
          <FormStatus
            status={formStatus.status}
            title={formStatus.title}
            message={formStatus.message}
            onDismiss={() => setFormStatus({ status: 'idle', title: '', message: '' })}
          />
        </div>
      )}

      {/* Actions & Filters Toolbar */}
      <div className="radio-card table-toolbar-card">
        <div className="table-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search by staff email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="table-filters-row">
          <select
            className="form-select filter-select font-mono"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="rj">Radio Jockeys (RJ)</option>
          </select>

          <button
            type="button"
            className="btn-outline-purple font-mono"
            onClick={loadStaff}
            disabled={loading}
            title="Refresh staff records"
          >
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn-primary font-mono"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <UserPlus size={15} />
            <span>{showAddForm ? 'Close Form' : 'Authorize Staff'}</span>
          </button>
        </div>
      </div>

      {/* Add Staff Form (Collapsible) */}
      {showAddForm && (
        <div className="radio-card staff-add-card">
          <div className="staff-add-header">
            <h3 className="staff-add-title font-display">Authorize New Staff Member</h3>
            <p className="staff-add-subtitle font-mono">
              Add an approved email for RJ or Station Administrator privileges.
            </p>
          </div>

          <form onSubmit={handleAddStaff} className="staff-add-form" noValidate>
            <div className="staff-form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="staff-email">
                  Staff Email Address <span className="req">*</span>
                </label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon" />
                  <input
                    id="staff-email"
                    type="email"
                    className="form-input"
                    placeholder="e.g. staff.member@college.edu"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </div>
                <span className="field-hint font-mono">
                  Normalized automatically (trimmed & lowercase). No password required here; verified securely via Supabase Auth.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="staff-role">
                  Privilege Role <span className="req">*</span>
                </label>
                <select
                  id="staff-role"
                  className="form-select font-mono"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="rj">Radio Jockey (RJ)</option>
                  <option value="admin">Station Administrator</option>
                </select>
                <span className="field-hint font-mono">
                  Students cannot be added to authorized staff.
                </span>
              </div>
            </div>

            <div className="form-checkbox-row">
              <label className="checkbox-label font-mono">
                <input
                  type="checkbox"
                  checked={newIsActive}
                  onChange={(e) => setNewIsActive(e.target.checked)}
                />
                <span>Active authorization (grant access immediately upon login)</span>
              </label>
            </div>

            <div className="staff-form-actions font-mono">
              <button
                type="button"
                className="btn-outline-secondary"
                onClick={() => setShowAddForm(false)}
                disabled={addLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={addLoading}
              >
                {addLoading ? 'Saving...' : 'Authorize Staff Email'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Table */}
      <div className="radio-card table-container-card">
        {loading ? (
          <div className="table-loading-box font-mono">
            <RefreshCw size={24} className="spin-icon" />
            <span>Querying authorized staff directory...</span>
          </div>
        ) : filteredStaff.length === 0 ? (
          <EmptyState
            title="No Authorized Staff Found"
            message={
              searchTerm || roleFilter !== 'all'
                ? 'No staff members match the selected search or filter criteria.'
                : 'No authorized staff members registered yet.'
            }
          />
        ) : (
          <div className="table-responsive-wrapper">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Authorized Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Authorized Since</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staff) => {
                  const isOwner = (staff.email || '').toLowerCase().trim() === OWNER_EMAIL;
                  return (
                    <tr key={staff.id} className={isOwner ? 'owner-row' : ''}>
                      <td>
                        <div className="staff-email-cell">
                          <span className="font-mono staff-email-text">{staff.email}</span>
                          {isOwner && (
                            <span className="owner-badge font-mono">
                              <Lock size={11} />
                              <span>PRIMARY OWNER</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge ${staff.role} font-mono`}>
                          {staff.role === 'admin' ? (
                            <>
                              <ShieldAlert size={12} />
                              <span>ADMIN</span>
                            </>
                          ) : (
                            <>
                              <Mic size={12} />
                              <span>RJ</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${staff.is_active ? 'active' : 'inactive'} font-mono`}>
                          <span className="status-dot" />
                          <span>{staff.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                        </span>
                      </td>
                      <td className="font-mono text-muted text-sm">
                        {staff.created_at ? new Date(staff.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="staff-actions-row">
                          {isOwner ? (
                            <span className="protected-tag font-mono" title="Initial owner cannot be altered or removed">
                              PROTECTED
                            </span>
                          ) : (
                            <>
                              {/* Toggle Role */}
                              {staff.role === 'rj' ? (
                                <button
                                  type="button"
                                  className="action-btn promote"
                                  onClick={() => handleChangeRoleInitiate(staff, 'admin')}
                                  title="Promote to Administrator"
                                >
                                  Make Admin
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="action-btn demote"
                                  onClick={() => handleChangeRoleInitiate(staff, 'rj')}
                                  title="Reassign to RJ"
                                >
                                  Make RJ
                                </button>
                              )}

                              {/* Toggle Active / Inactive */}
                              <button
                                type="button"
                                className={`action-btn ${staff.is_active ? 'deactivate' : 'activate'}`}
                                onClick={() => handleToggleActiveInitiate(staff)}
                                title={staff.is_active ? 'Deactivate access' : 'Activate access'}
                              >
                                <Power size={13} />
                                <span>{staff.is_active ? 'Deactivate' : 'Activate'}</span>
                              </button>

                              {/* Remove */}
                              <button
                                type="button"
                                className="action-btn delete"
                                onClick={() => handleDeleteStaffInitiate(staff)}
                                title="Remove staff authorization"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDanger={confirmModal.isDanger}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
