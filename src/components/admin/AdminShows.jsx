import React, { useState } from 'react';
import { Radio, Plus, Edit2, Trash2, Check, X, Eye, EyeOff, Search, Clock, User, Tag } from 'lucide-react';
import EmptyState from '../EmptyState';
import ConfirmationModal from './ConfirmationModal';
import FormStatus from '../FormStatus';
import { showService } from '../../services/show-service';
import './AdminTableSection.css';

export default function AdminShows({
  shows = [],
  rjProfiles = [],
  onRefresh = () => {}
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingShow, setEditingShow] = useState(null);
  const [formStatus, setFormStatus] = useState({ status: 'idle', title: '', message: '' });

  // Show form fields
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Music');
  const [hostName, setHostName] = useState('');
  const [hostId, setHostId] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [showToDelete, setShowToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredShows = shows.filter((s) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      s.title?.toLowerCase().includes(q) ||
      s.host_name?.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q)
    );
  });

  const handleOpenAddForm = () => {
    setEditingShow(null);
    setTitle('');
    setTagline('');
    setDescription('');
    setCategory('Music');
    setHostName(rjProfiles[0]?.full_name || '');
    setHostId(rjProfiles[0]?.id || '');
    setScheduleTime('');
    setShowForm(true);
  };

  const handleOpenEditForm = (show) => {
    setEditingShow(show);
    setTitle(show.title || '');
    setTagline(show.tagline || '');
    setDescription(show.description || '');
    setCategory(show.category || 'Music');
    setHostName(show.host_name || '');
    setHostId(show.host_id || '');
    setScheduleTime(show.schedule_time || '');
    setShowForm(true);
  };

  const handleSaveShow = async (e) => {
    e.preventDefault();
    if (!title.trim() || !category.trim()) {
      setFormStatus({ status: 'error', title: 'Validation Error', message: 'Show title and category are required.' });
      return;
    }

    setFormStatus({
      status: 'submitting',
      title: editingShow ? 'Updating Show' : 'Creating Show',
      message: 'Submitting changes to Supabase catalog...'
    });

    const payload = {
      title: title.trim(),
      tagline: tagline.trim() || null,
      description: description.trim() || null,
      category: category.trim(),
      host_name: hostName.trim() || 'CampusWave RJ',
      host_id: hostId || null,
      schedule_time: scheduleTime.trim() || null,
      is_active: editingShow ? editingShow.is_active : true
    };

    try {
      let res;
      if (editingShow) {
        res = await showService.updateShow(editingShow.id, payload);
      } else {
        res = await showService.createShow(payload);
      }

      if (res?.error) {
        setFormStatus({ status: 'error', title: 'Show Save Failed', message: res.error.message });
      } else {
        setFormStatus({
          status: 'success',
          title: editingShow ? 'Show Updated' : 'Show Created',
          message: `"${title}" has been saved to the station catalog.`
        });
        setShowForm(false);
        setEditingShow(null);
        await onRefresh();
      }
    } catch (err) {
      setFormStatus({ status: 'error', title: 'Network Error', message: err.message });
    }
  };

  const handleToggleActive = async (show) => {
    try {
      const res = await showService.updateShow(show.id, { is_active: !show.is_active });
      if (!res?.error) {
        await onRefresh();
      }
    } catch (err) {
      console.warn('Error toggling show status:', err);
    }
  };

  const handleDeleteShow = async () => {
    if (!showToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await showService.deleteShow(showToDelete.id);
      if (res?.error) {
        setFormStatus({ status: 'error', title: 'Delete Failed', message: res.error.message });
      } else {
        setFormStatus({ status: 'success', title: 'Show Deleted', message: `"${showToDelete.title}" removed.` });
        setDeleteModalOpen(false);
        setShowToDelete(null);
        await onRefresh();
      }
    } catch (err) {
      setFormStatus({ status: 'error', title: 'Error', message: err.message });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="admin-subpage">
      <div className="subpage-masthead">
        <div>
          <h2 className="subpage-title font-display">Broadcast Show Management</h2>
          <p className="subpage-subtitle">
            Configure series, assign on-air talent, program broadcast schedules, and manage the live directory.
          </p>
        </div>

        <button
          type="button"
          className="action-btn-green font-mono"
          onClick={showForm ? () => setShowForm(false) : handleOpenAddForm}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          <span>{showForm ? 'CANCEL' : 'CREATE NEW SHOW'}</span>
        </button>
      </div>

      <FormStatus
        status={formStatus.status}
        title={formStatus.title}
        message={formStatus.message}
        className="subpage-form-status"
      />

      {/* Show Creation / Edit Form Card */}
      {showForm && (
        <div className="radio-card admin-modal-form-card">
          <h3 className="form-title font-display" style={{ color: '#FFFFFF', marginBottom: 16 }}>
            {editingShow ? `Edit Show: ${editingShow.title}` : 'Program New Station Show'}
          </h3>
          <form onSubmit={handleSaveShow}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label font-mono">SHOW TITLE *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Neon Horizon"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label font-mono">CATEGORY *</label>
                <select
                  className="form-select font-mono"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Music">Music</option>
                  <option value="Talk">Talk</option>
                  <option value="Campus Culture">Campus Culture</option>
                  <option value="Indie & Alternative">Indie & Alternative</option>
                  <option value="Sports">Sports</option>
                  <option value="Late Night">Late Night</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label font-mono">TAGLINE</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Synthesizers, city drives, and midnight frequencies"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label font-mono">ASSIGNED RJ / HOST *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. RJ Sarah Vance"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label font-mono">TIMESLOT / SCHEDULE HINT</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Fridays 9:00 PM - 11:00 PM"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label font-mono">LINKED RJ PROFILE (OPTIONAL)</label>
                <select
                  className="form-select font-mono"
                  value={hostId}
                  onChange={(e) => {
                    setHostId(e.target.value);
                    const matched = rjProfiles.find((p) => p.id === e.target.value);
                    if (matched) setHostName(matched.full_name);
                  }}
                >
                  <option value="">Unlinked / Guest Host</option>
                  {rjProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label font-mono">SHOW DESCRIPTION</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Overview of the show's musical style, discussions, or weekly highlights..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button type="submit" className="action-btn-green font-mono">
                <Check size={14} />
                <span>{editingShow ? 'UPDATE SHOW' : 'PUBLISH SHOW'}</span>
              </button>
              <button
                type="button"
                className="action-btn-red font-mono"
                onClick={() => {
                  setShowForm(false);
                  setEditingShow(null);
                }}
              >
                <X size={14} />
                <span>CANCEL</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shows Catalog Controls */}
      <div className="admin-controls-card radio-card">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="search"
            className="admin-search-field"
            placeholder="Search shows by title, host, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="font-mono text-muted" style={{ fontSize: '0.74rem' }}>
          TOTAL SHOWS: <strong className="text-cyan">{filteredShows.length}</strong>
        </div>
      </div>

      {/* Shows List */}
      {filteredShows.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No Shows in Catalog"
          description="Create your first CampusWave broadcast show using the 'Create New Show' button."
        />
      ) : (
        <div className="admin-data-container radio-card">
          <div className="data-table-header font-mono">
            <div>SHOW & TAGLINE</div>
            <div>HOST RJ</div>
            <div>SCHEDULE TIME</div>
            <div>STATUS</div>
            <div style={{ textAlign: 'right' }}>ACTIONS</div>
          </div>

          <div className="data-table-body">
            {filteredShows.map((s) => (
              <div key={s.id} className="data-table-row">
                {/* Title & Tagline */}
                <div className="col-primary">
                  <div className="row-title font-display">{s.title}</div>
                  <div className="row-sub font-mono">
                    <span className="text-purple" style={{ fontWeight: 700 }}>
                      {s.category}
                    </span>
                    {s.tagline && <span>• {s.tagline}</span>}
                  </div>
                </div>

                {/* Host */}
                <div className="col-dept font-mono">
                  <div className="dept-badge">
                    <User size={12} className="inline-icon" />
                    <span>{s.host_name}</span>
                  </div>
                </div>

                {/* Schedule Time */}
                <div className="font-mono text-muted date-col">
                  <Clock size={12} className="inline-icon" />
                  <span>{s.schedule_time || 'Schedule Flexible'}</span>
                </div>

                {/* Status Toggle */}
                <div>
                  <button
                    type="button"
                    className={`status-pill ${s.is_active ? 'pill-approved' : 'pill-archived'} font-mono`}
                    onClick={() => handleToggleActive(s)}
                    title="Toggle active broadcast state"
                    style={{ cursor: 'pointer' }}
                  >
                    {s.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                    <span>{s.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                  </button>
                </div>

                {/* Actions */}
                <div className="col-actions">
                  <button
                    type="button"
                    className="action-icon-btn"
                    onClick={() => handleOpenEditForm(s)}
                    title="Edit show"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="action-icon-btn delete"
                    onClick={() => {
                      setShowToDelete(s);
                      setDeleteModalOpen(true);
                    }}
                    title="Delete show"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Delete Broadcast Show"
        message={`Are you sure you want to permanently remove "${showToDelete?.title}" from the CampusWave directory?`}
        confirmText="Delete Show"
        cancelText="Cancel"
        isDanger={true}
        isLoading={deleteLoading}
        onConfirm={handleDeleteShow}
        onCancel={() => {
          setDeleteModalOpen(false);
          setShowToDelete(null);
        }}
      />
    </div>
  );
}
