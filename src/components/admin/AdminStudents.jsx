import React, { useState, useMemo } from 'react';
import { Search, Filter, Shield, User, Mic, ShieldAlert, CheckCircle, RefreshCw, Calendar, Mail, BookOpen } from 'lucide-react';
import EmptyState from '../EmptyState';
import ConfirmationModal from './ConfirmationModal';
import FormStatus from '../FormStatus';
import { adminService } from '../../services/admin-service';
import './AdminTableSection.css';

export default function AdminStudents({
  users = [],
  loading = false,
  onRefresh = () => {}
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [targetRole, setTargetRole] = useState('student');
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formStatus, setFormStatus] = useState({ status: 'idle', title: '', message: '' });

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase().trim();
        const matchesName = u.full_name?.toLowerCase().includes(q);
        const matchesEmail = u.email?.toLowerCase().includes(q);
        const matchesDept = u.department?.toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesDept;
      }
      return true;
    });
  }, [users, roleFilter, searchTerm]);

  const handleRoleChangeInitiate = (user, newRole) => {
    setSelectedUser(user);
    setTargetRole(newRole);
    setModalOpen(true);
  };

  const handleConfirmRoleChange = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    setFormStatus({ status: 'submitting', title: 'Updating Role', message: `Securing role assignment for ${selectedUser.full_name}...` });

    try {
      const res = await adminService.updateUserRole(selectedUser.id, targetRole);
      if (res.error) {
        setFormStatus({
          status: 'error',
          title: 'Authorization Update Failed',
          message: res.error.message || 'Unable to update user role under current database policies.'
        });
      } else {
        setFormStatus({
          status: 'success',
          title: 'Role Updated Successfully',
          message: `${selectedUser.full_name} is now designated as ${targetRole.toUpperCase()}.`
        });
        setModalOpen(false);
        setSelectedUser(null);
        await onRefresh();
      }
    } catch (err) {
      setFormStatus({
        status: 'error',
        title: 'Network / Database Error',
        message: err.message || 'Failed to modify role record.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    if (role === 'admin') return <ShieldAlert size={13} className="text-red" />;
    if (role === 'rj') return <Mic size={13} className="text-purple" />;
    return <User size={13} className="text-blue" />;
  };

  return (
    <div className="admin-subpage">
      <div className="subpage-masthead">
        <div>
          <h2 className="subpage-title font-display">Student & Account Directory</h2>
          <p className="subpage-subtitle">
            Verified registered student listeners and station staff accounts stored in Supabase profiles.
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
            placeholder="Search by student name, college email, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group font-mono">
          <label className="filter-label">
            <Filter size={13} />
            <span>ROLE:</span>
          </label>
          <div className="filter-pills">
            {['all', 'student', 'rj', 'admin'].map((r) => (
              <button
                key={r}
                type="button"
                className={`filter-pill-btn ${roleFilter === r ? 'active' : ''}`}
                onClick={() => setRoleFilter(r)}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Directory Table / Cards */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={User}
          title="No Matching Students Found"
          description={
            searchTerm || roleFilter !== 'all'
              ? 'Try modifying your search query or role filter.'
              : 'No registered student profiles exist in the database yet.'
          }
        />
      ) : (
        <div className="admin-data-container radio-card">
          <div className="data-table-header font-mono">
            <div>STUDENT / ACCOUNT</div>
            <div>DEPARTMENT & YEAR</div>
            <div>ROLE</div>
            <div>JOINED DATE</div>
            <div style={{ textAlign: 'right' }}>ROLE ACTIONS</div>
          </div>

          <div className="data-table-body">
            {filteredUsers.map((u) => {
              const joined = u.created_at
                ? new Date(u.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })
                : '—';

              return (
                <div key={u.id} className="data-table-row">
                  {/* Student Info */}
                  <div className="col-primary">
                    <div className="row-title font-display">{u.full_name || 'Anonymous Student'}</div>
                    <div className="row-sub font-mono">
                      <Mail size={12} className="inline-icon" />
                      <span>{u.email}</span>
                      {u.phone && <span>• {u.phone}</span>}
                    </div>
                  </div>

                  {/* Department & Year */}
                  <div className="col-dept font-mono">
                    <div className="dept-badge">
                      <BookOpen size={12} className="inline-icon" />
                      <span>{u.department || 'General'}</span>
                    </div>
                    <div className="row-sub">{u.year || 'Student'}</div>
                  </div>

                  {/* Role */}
                  <div>
                    <span className={`role-badge role-${u.role || 'student'} font-mono`}>
                      {getRoleIcon(u.role)}
                      <span>{(u.role || 'student').toUpperCase()}</span>
                    </span>
                  </div>

                  {/* Joined Date */}
                  <div className="font-mono text-muted date-col">
                    <Calendar size={12} className="inline-icon" />
                    <span>{joined}</span>
                  </div>

                  {/* Role Actions */}
                  <div className="col-actions">
                    {u.role === 'student' && (
                      <button
                        type="button"
                        className="btn-action-small promote font-mono"
                        onClick={() => handleRoleChangeInitiate(u, 'rj')}
                        title="Authorize as Radio Jockey"
                      >
                        <Mic size={12} />
                        <span>MAKE RJ</span>
                      </button>
                    )}
                    {u.role === 'rj' && (
                      <button
                        type="button"
                        className="btn-action-small demote font-mono"
                        onClick={() => handleRoleChangeInitiate(u, 'student')}
                        title="Demote to Student Listener"
                      >
                        <User size={12} />
                        <span>MAKE STUDENT</span>
                      </button>
                    )}
                    {u.role === 'admin' && (
                      <span className="admin-fixed-tag font-mono">DIRECTOR</span>
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
        isOpen={modalOpen}
        title="Confirm Role Authorization"
        message={`Are you sure you want to designate ${selectedUser?.full_name} as an authorized ${targetRole.toUpperCase()}? This modifies database access privileges.`}
        confirmText={`Set as ${targetRole.toUpperCase()}`}
        cancelText="Cancel"
        isLoading={actionLoading}
        onConfirm={handleConfirmRoleChange}
        onCancel={() => {
          setModalOpen(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
}
