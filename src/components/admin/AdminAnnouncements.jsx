import React, { useState } from 'react';
import { Bell, Plus, Edit2, Trash2, Check, X, Eye, EyeOff, Search, Calendar, Tag } from 'lucide-react';
import EmptyState from '../EmptyState';
import ConfirmationModal from './ConfirmationModal';
import FormStatus from '../FormStatus';
import { announcementService } from '../../services/announcement-service';
import './AdminTableSection.css';

export default function AdminAnnouncements({
  announcements = [],
  onRefresh = () => {}
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAnn, setEditingAnn] = useState(null);
  const [formStatus, setFormStatus] = useState({ status: 'idle', title: '', message: '' });

  // Fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Campus');
  const [status, setStatus] = useState('published');

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [annToDelete, setAnnToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredAnnouncements = announcements.filter((a) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return a.title?.toLowerCase().includes(q) || a.content?.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q);
  });

  const handleOpenAddForm = () => {
    setEditingAnn(null);
    setTitle('');
    setContent('');
    setCategory('Campus');
    setStatus('published');
    setShowForm(true);
  };

  const handleOpenEditForm = (ann) => {
    setEditingAnn(ann);
    setTitle(ann.title || '');
    setContent(ann.content || '');
    setCategory(ann.category || 'Campus');
    setStatus(ann.status || 'published');
    setShowForm(true);
  };

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setFormStatus({ status: 'error', title: 'Validation Error', message: 'Title and content are required fields.' });
      return;
    }

    setFormStatus({
      status: 'submitting',
      title: editingAnn ? 'Updating Announcement' : 'Publishing Announcement',
      message: 'Persisting notice in Supabase announcements table...'
    });

    const payload = {
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      status,
      date: editingAnn ? editingAnn.date : new Date().toISOString().split('T')[0]
    };

    try {
      let res;
      if (editingAnn) {
        res = await announcementService.updateAnnouncement(editingAnn.id, payload);
      } else {
        res = await announcementService.createAnnouncement(payload);
      }

      if (res?.error) {
        setFormStatus({ status: 'error', title: 'Failed to Save', message: res.error.message });
      } else {
        setFormStatus({
          status: 'success',
          title: editingAnn ? 'Announcement Updated' : 'Announcement Published',
          message: `"${title}" has been saved.`
        });
        setShowForm(false);
        setEditingAnn(null);
        await onRefresh();
      }
    } catch (err) {
      setFormStatus({ status: 'error', title: 'Network Error', message: err.message });
    }
  };

  const handleTogglePublish = async (ann) => {
    const nextStatus = ann.status === 'published' ? 'draft' : 'published';
    try {
      const res = await announcementService.updateAnnouncement(ann.id, { status: nextStatus });
      if (!res?.error) {
        await onRefresh();
      }
    } catch (err) {
      console.warn('Error updating status:', err);
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!annToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await announcementService.deleteAnnouncement(annToDelete.id);
      if (res?.error) {
        setFormStatus({ status: 'error', title: 'Delete Failed', message: res.error.message });
      } else {
        setFormStatus({ status: 'success', title: 'Deleted', message: 'Announcement record removed.' });
        setDeleteModalOpen(false);
        setAnnToDelete(null);
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
          <h2 className="subpage-title font-display">Station Announcements</h2>
          <p className="subpage-subtitle">
            Draft and distribute official campus dispatches, programming alerts, and studio bulletins.
          </p>
        </div>

        <button
          type="button"
          className="action-btn-green font-mono"
          onClick={showForm ? () => setShowForm(false) : handleOpenAddForm}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          <span>{showForm ? 'CANCEL' : 'NEW ANNOUNCEMENT'}</span>
        </button>
      </div>

      <FormStatus
        status={formStatus.status}
        title={formStatus.title}
        message={formStatus.message}
        className="subpage-form-status"
      />

      {/* Form Card */}
      {showForm && (
        <div className="radio-card admin-modal-form-card">
          <h3 className="form-title font-display" style={{ color: '#FFFFFF', marginBottom: 16 }}>
            {editingAnn ? `Edit Announcement: ${editingAnn.title}` : 'Create Campus Announcement'}
          </h3>
          <form onSubmit={handleSaveAnnouncement}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label font-mono">TITLE *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Fall Auditions Open for Student Radio Jockeys"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                  <option value="Campus">Campus</option>
                  <option value="CampusWave">CampusWave</option>
                  <option value="Important">Important</option>
                  <option value="Club">Club</option>
                  <option value="Event">Event</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label font-mono">PUBLICATION STATUS</label>
              <div className="filter-pills" style={{ marginTop: 4 }}>
                <button
                  type="button"
                  className={`filter-pill-btn ${status === 'published' ? 'active' : ''}`}
                  onClick={() => setStatus('published')}
                >
                  PUBLISHED (VISIBLE TO PUBLIC)
                </button>
                <button
                  type="button"
                  className={`filter-pill-btn ${status === 'draft' ? 'active' : ''}`}
                  onClick={() => setStatus('draft')}
                >
                  DRAFT (ADMIN ONLY)
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label font-mono">ANNOUNCEMENT CONTENT *</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Full dispatch text with all relevant dates, instructions, or links..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button type="submit" className="action-btn-green font-mono">
                <Check size={14} />
                <span>{editingAnn ? 'UPDATE NOTICE' : 'PUBLISH NOTICE'}</span>
              </button>
              <button
                type="button"
                className="action-btn-red font-mono"
                onClick={() => {
                  setShowForm(false);
                  setEditingAnn(null);
                }}
              >
                <X size={14} />
                <span>CANCEL</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="admin-controls-card radio-card">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="search"
            className="admin-search-field"
            placeholder="Search announcements by title, content, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="font-mono text-muted" style={{ fontSize: '0.74rem' }}>
          NOTICES: <strong className="text-cyan">{filteredAnnouncements.length}</strong>
        </div>
      </div>

      {/* Announcements Table */}
      {filteredAnnouncements.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Announcements Found"
          description="Create your first station notice or announcement using the button above."
        />
      ) : (
        <div className="admin-data-container radio-card">
          <div className="data-table-header font-mono">
            <div>TITLE & CONTENT</div>
            <div>CATEGORY</div>
            <div>DATE</div>
            <div>STATUS</div>
            <div style={{ textAlign: 'right' }}>ACTIONS</div>
          </div>

          <div className="data-table-body">
            {filteredAnnouncements.map((ann) => (
              <div key={ann.id} className="data-table-row">
                <div className="col-primary">
                  <div className="row-title font-display">{ann.title}</div>
                  <div className="row-sub" style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ann.content}
                  </div>
                </div>

                <div className="col-dept font-mono">
                  <div className="dept-badge text-purple">{ann.category}</div>
                </div>

                <div className="font-mono text-muted date-col">
                  <Calendar size={12} className="inline-icon" />
                  <span>{ann.date || 'Recent'}</span>
                </div>

                <div>
                  <button
                    type="button"
                    className={`status-pill ${ann.status === 'published' ? 'pill-approved' : 'pill-archived'} font-mono`}
                    onClick={() => handleTogglePublish(ann)}
                    title="Toggle public visibility"
                    style={{ cursor: 'pointer' }}
                  >
                    {ann.status === 'published' ? <Eye size={12} /> : <EyeOff size={12} />}
                    <span>{ann.status?.toUpperCase() || 'PUBLISHED'}</span>
                  </button>
                </div>

                <div className="col-actions">
                  <button
                    type="button"
                    className="action-icon-btn"
                    onClick={() => handleOpenEditForm(ann)}
                    title="Edit announcement"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="action-icon-btn delete"
                    onClick={() => {
                      setAnnToDelete(ann);
                      setDeleteModalOpen(true);
                    }}
                    title="Delete announcement"
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
        title="Delete Announcement"
        message={`Delete "${annToDelete?.title}" from announcements? This removes it from student dashboards and public feeds.`}
        confirmText="Delete Notice"
        cancelText="Cancel"
        isDanger={true}
        isLoading={deleteLoading}
        onConfirm={handleDeleteAnnouncement}
        onCancel={() => {
          setDeleteModalOpen(false);
          setAnnToDelete(null);
        }}
      />
    </div>
  );
}
