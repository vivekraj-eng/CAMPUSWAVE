import React, { useState } from 'react';
import { Mic, Plus, Trash2, Clock, Calendar, AlertCircle, Loader2, Play } from 'lucide-react';
import EmptyState from '../EmptyState';

/**
 * RjPodcastManager
 * Allows an authorized RJ to publish and manage podcast episodes associated with their assigned shows.
 * Strictly uses real database values and transparent audio streaming URLs.
 */
export default function RjPodcastManager({
  podcasts = [],
  assignedShows = [],
  rjName = '',
  userId = null,
  onCreatePodcast,
  onDeletePodcast
}) {
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    title: '',
    show_id: assignedShows[0]?.id || '',
    duration: '30 min',
    category: 'Talk',
    description: '',
    audio_url: '',
    cover_image: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.title.trim()) {
      setErrorMsg('Episode title is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await onCreatePodcast({
        title: form.title.trim(),
        show_id: form.show_id || null,
        rj_name: rjName || 'Radio Jockey',
        host_id: userId || null,
        duration: form.duration.trim() || '30 min',
        category: form.category,
        description: form.description.trim(),
        audio_url: form.audio_url.trim() || null,
        cover_image: form.cover_image.trim() || null
      });

      if (res && res.error) {
        setErrorMsg(res.error.message || 'Failed to publish episode.');
      } else {
        setShowModal(false);
        setForm({
          title: '',
          show_id: assignedShows[0]?.id || '',
          duration: '30 min',
          category: 'Talk',
          description: '',
          audio_url: '',
          cover_image: ''
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error occurred while saving episode.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Permanently remove episode "${title}"?`)) return;
    try {
      await onDeletePodcast(id);
    } catch (err) {
      alert(`Failed to delete episode: ${err.message}`);
    }
  };

  return (
    <div className="radio-card rj-card rj-podcasts-card" id="rj-podcasts-section">
      <div className="dash-card-header font-mono">
        <div className="dash-header-title">
          <Mic size={16} />
          <span>PODCAST CATALOG MANAGEMENT</span>
          {podcasts.length > 0 && <span className="dash-count-badge font-mono">{podcasts.length}</span>}
        </div>

        <button
          type="button"
          className="btn-primary font-mono btn-compact"
          onClick={() => setShowModal(true)}
        >
          <Plus size={14} />
          <span>Publish Episode</span>
        </button>
      </div>

      {podcasts.length === 0 ? (
        <EmptyState
          icon={Mic}
          title="No podcast episodes yet"
          description="Recordings of your studio interviews, talk shows, and acoustic sets will be listed here for student on-demand playback."
          action={
            <button
              type="button"
              className="btn-primary font-mono btn-compact"
              onClick={() => setShowModal(true)}
            >
              <Plus size={14} />
              <span>Publish First Episode</span>
            </button>
          }
        />
      ) : (
        <div className="rj-podcasts-list">
          {podcasts.map((pod) => (
            <div key={pod.id} className="rj-podcast-row">
              <div className="pod-lead-icon">
                <Play size={18} fill="currentColor" />
              </div>

              <div className="pod-content-col">
                <h4 className="pod-title font-display">{pod.title}</h4>
                {pod.description && <p className="pod-desc">{pod.description}</p>}

                <div className="pod-meta-line font-mono">
                  {pod.shows?.title && (
                    <span className="pod-show-tag font-mono">Show: {pod.shows.title}</span>
                  )}
                  {pod.shows?.title && <span className="bullet-sep">•</span>}
                  <span className="pod-meta-item">
                    <Clock size={12} />
                    <span>{pod.duration || '30 min'}</span>
                  </span>
                  <span className="bullet-sep">•</span>
                  <span className="pod-meta-item">
                    <Calendar size={12} />
                    <span>{pod.date || 'Recent'}</span>
                  </span>
                  <span className="bullet-sep">•</span>
                  <span className="category-pill font-mono">{pod.category || 'Talk'}</span>
                </div>
              </div>

              <div className="pod-actions-col">
                <button
                  type="button"
                  className="btn-delete-icon"
                  onClick={() => handleDelete(pod.id, pod.title)}
                  title="Delete Episode"
                  aria-label={`Delete episode ${pod.title}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Publish Podcast Modal */}
      {showModal && (
        <div className="rj-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-pod-title">
          <div className="radio-card rj-modal-box">
            <div className="rj-modal-header">
              <h3 id="modal-pod-title" className="rj-modal-heading font-display">
                Publish New Podcast Episode
              </h3>
              <button
                type="button"
                className="rj-modal-close"
                onClick={() => setShowModal(false)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            {errorMsg && (
              <div className="rj-action-alert error font-mono">
                <AlertCircle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="rj-modal-form">
              <div className="form-group">
                <label className="form-label font-mono" htmlFor="ep-title">
                  EPISODE TITLE *
                </label>
                <input
                  id="ep-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Episode 12: Late Night Indie Vinyls"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              {assignedShows.length > 0 && (
                <div className="form-group">
                  <label className="form-label font-mono" htmlFor="ep-show">
                    ASSOCIATED RADIO SHOW
                  </label>
                  <select
                    id="ep-show"
                    className="form-select"
                    value={form.show_id}
                    onChange={(e) => setForm({ ...form, show_id: e.target.value })}
                  >
                    <option value="">Independent Podcast</option>
                    {assignedShows.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label font-mono" htmlFor="ep-duration">
                    DURATION
                  </label>
                  <input
                    id="ep-duration"
                    type="text"
                    className="form-input"
                    placeholder="e.g. 35 min"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label font-mono" htmlFor="ep-cat">
                    CATEGORY
                  </label>
                  <select
                    id="ep-cat"
                    className="form-select"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="Talk">Talk</option>
                    <option value="Music">Music</option>
                    <option value="Culture">Culture</option>
                    <option value="Interviews">Interviews</option>
                    <option value="Special">Special Broadcast</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label font-mono" htmlFor="ep-audio">
                  AUDIO STREAM URL (.mp3 / podcast feed)
                </label>
                <input
                  id="ep-audio"
                  type="url"
                  className="form-input"
                  placeholder="https://.../episode.mp3"
                  value={form.audio_url}
                  onChange={(e) => setForm({ ...form, audio_url: e.target.value })}
                />
                <span className="form-input-help font-mono">
                  Direct HTTP/HTTPS audio stream link or hosted episode file.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label font-mono" htmlFor="ep-cover">
                  COVER ARTWORK URL
                </label>
                <input
                  id="ep-cover"
                  type="url"
                  className="form-input"
                  placeholder="https://.../artwork.jpg"
                  value={form.cover_image}
                  onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label font-mono" htmlFor="ep-desc">
                  EPISODE SYNOPSIS
                </label>
                <textarea
                  id="ep-desc"
                  className="form-textarea"
                  rows={3}
                  placeholder="Overview of show discussions, guest interviews, and music sets..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="rj-modal-actions">
                <button
                  type="button"
                  className="btn-secondary font-mono"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary font-mono"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="spin-icon" />
                      <span>SAVING EPISODE...</span>
                    </>
                  ) : (
                    <span>PUBLISH EPISODE</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
