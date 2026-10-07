import React, { useState } from 'react';
import { Headphones, Plus, Trash2, Calendar, Clock, Check, X, Search, Database, ExternalLink } from 'lucide-react';
import EmptyState from '../EmptyState';
import ConfirmationModal from './ConfirmationModal';
import FormStatus from '../FormStatus';
import { podcastService } from '../../services/podcast-service';
import './AdminTableSection.css';

export default function AdminPodcasts({
  podcasts = [],
  shows = [],
  rjProfiles = [],
  onRefresh = () => {}
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formStatus, setFormStatus] = useState({ status: 'idle', title: '', message: '' });

  // Episode form fields
  const [title, setTitle] = useState('');
  const [showId, setShowId] = useState('');
  const [rjName, setRjName] = useState('');
  const [duration, setDuration] = useState('30 min');
  const [category, setCategory] = useState('Talk');
  const [description, setDescription] = useState('');
  const [audioUrl, setAudioUrl] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [podcastToDelete, setPodcastToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredPodcasts = podcasts.filter((p) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.rj_name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  });

  const handleCreatePodcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !rjName.trim()) {
      setFormStatus({ status: 'error', title: 'Validation Error', message: 'Episode title and RJ name are required.' });
      return;
    }

    setFormStatus({ status: 'submitting', title: 'Publishing Episode', message: 'Inserting podcast episode into database...' });

    try {
      const res = await podcastService.createPodcast({
        title: title.trim(),
        show_id: showId || null,
        rj_name: rjName.trim(),
        duration: duration.trim() || '30 min',
        category: category.trim(),
        description: description.trim() || null,
        audio_url: audioUrl.trim() || null,
        date: new Date().toISOString().split('T')[0]
      });

      if (res?.error) {
        setFormStatus({ status: 'error', title: 'Publishing Failed', message: res.error.message });
      } else {
        setFormStatus({ status: 'success', title: 'Episode Published', message: `"${title}" is now in the podcast library.` });
        setTitle('');
        setDescription('');
        setAudioUrl('');
        setShowAddForm(false);
        await onRefresh();
      }
    } catch (err) {
      setFormStatus({ status: 'error', title: 'Network Error', message: err.message });
    }
  };

  const handleDeletePodcast = async () => {
    if (!podcastToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await podcastService.deletePodcast(podcastToDelete.id);
      if (res?.error) {
        setFormStatus({ status: 'error', title: 'Delete Failed', message: res.error.message });
      } else {
        setFormStatus({ status: 'success', title: 'Podcast Removed', message: 'Episode deleted from database.' });
        setDeleteModalOpen(false);
        setPodcastToDelete(null);
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
          <h2 className="subpage-title font-display">Podcast Episode Administration</h2>
          <p className="subpage-subtitle">
            Manage recorded broadcast archives, talk shows, and on-demand student audio programming.
          </p>
        </div>

        <button
          type="button"
          className="action-btn-green font-mono"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? <X size={14} /> : <Plus size={14} />}
          <span>{showAddForm ? 'CANCEL' : 'PUBLISH PODCAST'}</span>
        </button>
      </div>

      <FormStatus
        status={formStatus.status}
        title={formStatus.title}
        message={formStatus.message}
        className="subpage-form-status"
      />

      {/* Audio Storage Notice */}
      <div className="radio-card" style={{ padding: '14px 18px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Database size={18} className="text-cyan flex-shrink-0" />
        <div style={{ fontSize: '0.82rem', color: '#CBD5E1', lineHeight: 1.5 }}>
          <strong className="text-white font-mono">Audio Storage Notice:</strong> Supabase Object Storage bucket for direct file uploads is not configured in this environment. Episodes stream via direct audio URL endpoints.
        </div>
      </div>

      {/* Add Podcast Form */}
      {showAddForm && (
        <div className="radio-card admin-modal-form-card">
          <h3 className="form-title font-display" style={{ color: '#FFFFFF', marginBottom: 16 }}>
            Publish Podcast Episode
          </h3>
          <form onSubmit={handleCreatePodcast}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label font-mono">EPISODE TITLE *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Episode 14: Indie Soundscapes & Campus Vinyl"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label font-mono">LINKED SHOW (OPTIONAL)</label>
                <select
                  className="form-select font-mono"
                  value={showId}
                  onChange={(e) => setShowId(e.target.value)}
                >
                  <option value="">Standalone Episode / Special Feature</option>
                  {shows.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label font-mono">HOST RJ *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. RJ Sarah"
                  value={rjName}
                  onChange={(e) => setRjName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label font-mono">DURATION (e.g. 45 min)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 35 min"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label font-mono">CATEGORY</label>
                <select
                  className="form-select font-mono"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Talk">Talk</option>
                  <option value="Music">Music</option>
                  <option value="Interviews">Interviews</option>
                  <option value="Culture">Culture</option>
                  <option value="Special">Special</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label font-mono">DIRECT AUDIO STREAM / FILE URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://stream.campuswave.fm/podcasts/ep14.mp3"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
              />
              <span style={{ fontSize: '0.7rem', color: '#64748B', marginTop: 4 }}>
                Provide a valid MP3/HLS URL. If left empty, episode remains listed in catalog with placeholder player.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label font-mono">EPISODE OVERVIEW & SHOW NOTES</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Discussion topics, featured artists, and timestamps..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button type="submit" className="action-btn-green font-mono">
                <Check size={14} />
                <span>PUBLISH EPISODE</span>
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

      {/* Search and Counts */}
      <div className="admin-controls-card radio-card">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="search"
            className="admin-search-field"
            placeholder="Search podcasts by episode title, RJ, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="font-mono text-muted" style={{ fontSize: '0.74rem' }}>
          EPISODES: <strong className="text-cyan">{filteredPodcasts.length}</strong>
        </div>
      </div>

      {/* Podcasts Table */}
      {filteredPodcasts.length === 0 ? (
        <EmptyState
          icon={Headphones}
          title="No Podcasts in Catalog"
          description="Click 'Publish Podcast' above to add archive audio recordings to CampusWave."
        />
      ) : (
        <div className="admin-data-container radio-card">
          <div className="data-table-header font-mono">
            <div>EPISODE TITLE</div>
            <div>HOST RJ</div>
            <div>DURATION & DATE</div>
            <div>CATEGORY</div>
            <div style={{ textAlign: 'right' }}>ACTIONS</div>
          </div>

          <div className="data-table-body">
            {filteredPodcasts.map((p) => (
              <div key={p.id} className="data-table-row">
                <div className="col-primary">
                  <div className="row-title font-display">{p.title}</div>
                  {p.description && (
                    <div className="row-sub" style={{ fontStyle: 'italic' }}>
                      "{p.description.slice(0, 60)}..."
                    </div>
                  )}
                </div>

                <div className="col-dept font-mono">
                  <div className="dept-badge">{p.rj_name}</div>
                </div>

                <div className="font-mono text-muted date-col">
                  <Clock size={12} className="inline-icon" />
                  <span>{p.duration || '30 min'}</span>
                  <span>• {p.date || 'Recent'}</span>
                </div>

                <div>
                  <span className="status-pill pill-approved font-mono">{p.category || 'Talk'}</span>
                </div>

                <div className="col-actions">
                  {p.audio_url && (
                    <a
                      href={p.audio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="action-icon-btn"
                      title="Open audio URL"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <button
                    type="button"
                    className="action-icon-btn delete"
                    onClick={() => {
                      setPodcastToDelete(p);
                      setDeleteModalOpen(true);
                    }}
                    title="Delete podcast"
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
        title="Delete Podcast Episode"
        message={`Are you sure you want to delete "${podcastToDelete?.title}" from the podcast library?`}
        confirmText="Delete Episode"
        cancelText="Cancel"
        isDanger={true}
        isLoading={deleteLoading}
        onConfirm={handleDeletePodcast}
        onCancel={() => {
          setDeleteModalOpen(false);
          setPodcastToDelete(null);
        }}
      />
    </div>
  );
}
