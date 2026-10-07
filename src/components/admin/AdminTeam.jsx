import React, { useState } from 'react';
import { Mic, Users, Plus, Edit2, Trash2, Eye, EyeOff, Radio, Shield, Check, X } from 'lucide-react';
import EmptyState from '../EmptyState';
import ConfirmationModal from './ConfirmationModal';
import FormStatus from '../FormStatus';
import { teamService } from '../../services/team-service';
import { adminService } from '../../services/admin-service';
import './AdminTableSection.css';

export default function AdminTeam({
  teamMembers = [],
  rjProfiles = [],
  shows = [],
  onRefresh = () => {}
}) {
  const [activeTab, setActiveTab] = useState('rjs'); // 'rjs' | 'roster'
  const [showAddForm, setShowAddForm] = useState(false);
  const [formStatus, setFormStatus] = useState({ status: 'idle', title: '', message: '' });

  // Add Member Form fields
  const [name, setName] = useState('');
  const [role, setRole] = useState('Radio Jockey');
  const [department, setDepartment] = useState('');
  const [category, setCategory] = useState('ON AIR');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [socialLink, setSocialLink] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Demote RJ modal
  const [demoteModalOpen, setDemoteModalOpen] = useState(false);
  const [rjToDemote, setRjToDemote] = useState(null);
  const [demoteLoading, setDemoteLoading] = useState(false);

  const handleCreateMember = async (e) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !department.trim()) {
      setFormStatus({ status: 'error', title: 'Validation Error', message: 'Name, role, and department are required.' });
      return;
    }

    setFormStatus({ status: 'submitting', title: 'Adding Team Member', message: 'Inserting record into team_members table...' });

    try {
      const res = await teamService.addTeamMember({
        name: name.trim(),
        role: role.trim(),
        department: department.trim(),
        category,
        bio: bio.trim() || null,
        photo_url: photoUrl.trim() || null,
        social_link: socialLink.trim() || null
      });

      if (res.error) {
        setFormStatus({ status: 'error', title: 'Creation Failed', message: res.error.message });
      } else {
        setFormStatus({ status: 'success', title: 'Member Created', message: `${name} added to station team roster.` });
        setName('');
        setDepartment('');
        setBio('');
        setPhotoUrl('');
        setSocialLink('');
        setShowAddForm(false);
        await onRefresh();
      }
    } catch (err) {
      setFormStatus({ status: 'error', title: 'Network Error', message: err.message });
    }
  };

  const handleTogglePublish = async (member) => {
    const updatedStatus = !member.is_published;
    try {
      const res = await teamService.updateTeamMember(member.id, { is_published: updatedStatus });
      if (!res.error) {
        await onRefresh();
      }
    } catch (err) {
      console.warn('Error updating team visibility:', err);
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await teamService.deleteTeamMember(memberToDelete.id);
      if (res.error) {
        setFormStatus({ status: 'error', title: 'Delete Failed', message: res.error.message });
      } else {
        setFormStatus({ status: 'success', title: 'Deleted', message: 'Team member record removed.' });
        setDeleteModalOpen(false);
        setMemberToDelete(null);
        await onRefresh();
      }
    } catch (err) {
      setFormStatus({ status: 'error', title: 'Delete Error', message: err.message });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDemoteRj = async () => {
    if (!rjToDemote) return;
    setDemoteLoading(true);
    try {
      const res = await adminService.updateUserRole(rjToDemote.id, 'student');
      if (res.error) {
        setFormStatus({ status: 'error', title: 'Update Failed', message: res.error.message });
      } else {
        setFormStatus({ status: 'success', title: 'RJ Access Revoked', message: `${rjToDemote.full_name} returned to student status.` });
        setDemoteModalOpen(false);
        setRjToDemote(null);
        await onRefresh();
      }
    } catch (err) {
      setFormStatus({ status: 'error', title: 'Error', message: err.message });
    } finally {
      setDemoteLoading(false);
    }
  };

  return (
    <div className="admin-subpage">
      <div className="subpage-masthead">
        <div>
          <h2 className="subpage-title font-display">RJ & Team Administration</h2>
          <p className="subpage-subtitle">
            Manage authorized broadcast hosts and public directory profiles across station departments.
          </p>
        </div>

        <div className="subpage-actions font-mono">
          <div className="filter-pills">
            <button
              type="button"
              className={`filter-pill-btn ${activeTab === 'rjs' ? 'active' : ''}`}
              onClick={() => setActiveTab('rjs')}
            >
              STATION RJS ({rjProfiles.length})
            </button>
            <button
              type="button"
              className={`filter-pill-btn ${activeTab === 'roster' ? 'active' : ''}`}
              onClick={() => setActiveTab('roster')}
            >
              PUBLIC ROSTER ({teamMembers.length})
            </button>
          </div>

          {activeTab === 'roster' && (
            <button
              type="button"
              className="btn-action-small promote font-mono"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus size={14} />
              <span>{showAddForm ? 'CANCEL' : 'ADD TEAM MEMBER'}</span>
            </button>
          )}
        </div>
      </div>

      <FormStatus
        status={formStatus.status}
        title={formStatus.title}
        message={formStatus.message}
        className="subpage-form-status"
      />

      {/* Inline Form to Add Team Member */}
      {showAddForm && activeTab === 'roster' && (
        <div className="radio-card admin-modal-form-card">
          <h3 className="form-title font-display" style={{ color: '#FFFFFF', marginBottom: 16 }}>
            Add Station Team Member
          </h3>
          <form onSubmit={handleCreateMember}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label font-mono">FULL NAME *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Maya Lin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label font-mono">STATION ROLE *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Lead Sound Engineer / RJ"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label font-mono">DEPARTMENT *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Electronics & Comm"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label font-mono">CATEGORY</label>
                <select
                  className="form-select font-mono"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="ON AIR">ON AIR</option>
                  <option value="CONTENT">CONTENT</option>
                  <option value="PRODUCTION">PRODUCTION</option>
                  <option value="TECHNICAL">TECHNICAL</option>
                  <option value="CREATIVE">CREATIVE</option>
                  <option value="EVENTS">EVENTS</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label font-mono">BIO / CREDENTIALS</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Brief introduction or on-air achievements..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label font-mono">PHOTO URL (OPTIONAL)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label font-mono">SOCIAL / PORTFOLIO LINK</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://instagram.com/..."
                  value={socialLink}
                  onChange={(e) => setSocialLink(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button type="submit" className="action-btn-green font-mono">
                <Check size={14} />
                <span>SAVE TEAM MEMBER</span>
              </button>
              <button
                type="button"
                className="action-btn-red font-mono"
                onClick={() => setShowAddForm(false)}
              >
                <X size={14} />
                <span>CANCEL</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 1: Authorized RJs from profiles */}
      {activeTab === 'rjs' && (
        <>
          {rjProfiles.length === 0 ? (
            <EmptyState
              icon={Mic}
              title="No Authorized Radio Jockeys"
              description="No user profiles currently hold the 'rj' authorization role. You can designate RJs from the Students tab or approve candidates in Applications."
            />
          ) : (
            <div className="admin-data-container radio-card">
              <div className="data-table-header font-mono">
                <div>RADIO JOCKEY</div>
                <div>DEPARTMENT & YEAR</div>
                <div>ASSIGNED SHOWS</div>
                <div>STATUS</div>
                <div style={{ textAlign: 'right' }}>ROLE ACTION</div>
              </div>

              <div className="data-table-body">
                {rjProfiles.map((rj) => {
                  const assigned = shows.filter(
                    (s) =>
                      s.host_id === rj.id ||
                      (s.host_name && s.host_name.toLowerCase().includes(rj.full_name?.toLowerCase()))
                  );

                  return (
                    <div key={rj.id} className="data-table-row">
                      <div className="col-primary">
                        <div className="row-title font-display">{rj.full_name}</div>
                        <div className="row-sub font-mono">{rj.email}</div>
                      </div>

                      <div className="col-dept font-mono">
                        <div className="dept-badge">{rj.department || 'General'}</div>
                        <div className="row-sub">{rj.year || '4th Year'}</div>
                      </div>

                      <div className="font-mono">
                        {assigned.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {assigned.map((s) => (
                              <span key={s.id} className="text-cyan font-bold" style={{ fontSize: '0.76rem' }}>
                                • {s.title}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.74rem' }}>None assigned</span>
                        )}
                      </div>

                      <div>
                        <span className="role-badge role-rj font-mono">
                          <Mic size={12} />
                          <span>ON-AIR HOST</span>
                        </span>
                      </div>

                      <div className="col-actions">
                        <button
                          type="button"
                          className="btn-action-small demote font-mono"
                          onClick={() => {
                            setRjToDemote(rj);
                            setDemoteModalOpen(true);
                          }}
                          title="Revoke RJ status"
                        >
                          <span>REVOKE RJ</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab 2: Public Team Members table */}
      {activeTab === 'roster' && (
        <>
          {teamMembers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Team Roster Members Published"
              description="Click 'Add Team Member' above to create member cards displayed on the public /team page."
            />
          ) : (
            <div className="admin-data-container radio-card">
              <div className="data-table-header font-mono">
                <div>MEMBER</div>
                <div>CATEGORY & DEPT</div>
                <div>STATUS</div>
                <div style={{ textAlign: 'right' }}>ACTIONS</div>
              </div>

              <div className="data-table-body">
                {teamMembers.map((m) => (
                  <div key={m.id} className="data-table-row" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 140px' }}>
                    <div className="col-primary">
                      <div className="row-title font-display">{m.name}</div>
                      <div className="row-sub font-mono">{m.role}</div>
                      {m.bio && <div className="row-sub" style={{ fontStyle: 'italic', marginTop: 2 }}>"{m.bio}"</div>}
                    </div>

                    <div className="col-dept font-mono">
                      <span className="dept-badge text-purple">{m.category || 'ON AIR'}</span>
                      <div className="row-sub">{m.department}</div>
                    </div>

                    <div>
                      <button
                        type="button"
                        className={`status-pill ${m.is_published ? 'pill-approved' : 'pill-archived'} font-mono`}
                        onClick={() => handleTogglePublish(m)}
                        title="Click to toggle public display"
                        style={{ cursor: 'pointer' }}
                      >
                        {m.is_published ? <Eye size={12} /> : <EyeOff size={12} />}
                        <span>{m.is_published ? 'PUBLISHED' : 'HIDDEN'}</span>
                      </button>
                    </div>

                    <div className="col-actions">
                      <button
                        type="button"
                        className="action-icon-btn delete"
                        onClick={() => {
                          setMemberToDelete(m);
                          setDeleteModalOpen(true);
                        }}
                        title="Remove member record"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete Team Member"
        message={`Are you sure you want to delete ${memberToDelete?.name} from the station team?`}
        confirmText="Delete Member"
        cancelText="Cancel"
        isDanger={true}
        isLoading={deleteLoading}
        onConfirm={handleDeleteMember}
        onCancel={() => {
          setDeleteModalOpen(false);
          setMemberToDelete(null);
        }}
      />

      {/* Revoke RJ Modal */}
      <ConfirmationModal
        isOpen={demoteModalOpen}
        title="Revoke RJ Privileges"
        message={`Are you sure you want to demote ${rjToDemote?.full_name} from RJ to Student listener? They will lose access to the RJ Workspace.`}
        confirmText="Revoke RJ Role"
        cancelText="Cancel"
        isDanger={true}
        isLoading={demoteLoading}
        onConfirm={handleDemoteRj}
        onCancel={() => {
          setDemoteModalOpen(false);
          setRjToDemote(null);
        }}
      />
    </div>
  );
}
