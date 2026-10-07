import React, { useState } from 'react';
import { CalendarDays, Plus, Edit2, Trash2, Check, X, Eye, EyeOff, Search, Clock, MapPin, Users } from 'lucide-react';
import EmptyState from '../EmptyState';
import ConfirmationModal from './ConfirmationModal';
import FormStatus from '../FormStatus';
import { eventService } from '../../services/event-service';
import './AdminTableSection.css';

export default function AdminEvents({
  events = [],
  onRefresh = () => {}
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formStatus, setFormStatus] = useState({ status: 'idle', title: '', message: '' });

  // Fields
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredEvents = events.filter((ev) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return ev.title?.toLowerCase().includes(q) || ev.location?.toLowerCase().includes(q) || ev.description?.toLowerCase().includes(q);
  });

  const handleOpenAddForm = () => {
    setEditingEvent(null);
    setTitle('');
    setDate('');
    setTime('18:00');
    setLocation('Media Pavilion Room 104');
    setDescription('');
    setShowForm(true);
  };

  const handleOpenEditForm = (ev) => {
    setEditingEvent(ev);
    setTitle(ev.title || '');
    setDate(ev.date || '');
    setTime(ev.time || '');
    setLocation(ev.location || '');
    setDescription(ev.description || '');
    setShowForm(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      setFormStatus({ status: 'error', title: 'Validation Error', message: 'Event title and date are required.' });
      return;
    }

    setFormStatus({
      status: 'submitting',
      title: editingEvent ? 'Updating Event' : 'Scheduling Event',
      message: 'Persisting event to database...'
    });

    const payload = {
      title: title.trim(),
      date,
      time: time.trim() || '19:00',
      location: location.trim() || 'Studio Pavilion',
      description: description.trim() || 'CampusWave live event.',
      is_active: editingEvent ? editingEvent.is_active : true
    };

    try {
      let res;
      if (editingEvent) {
        res = await eventService.updateEvent(editingEvent.id, payload);
      } else {
        res = await eventService.createEvent(payload);
      }

      if (res?.error) {
        setFormStatus({ status: 'error', title: 'Save Failed', message: res.error.message });
      } else {
        setFormStatus({
          status: 'success',
          title: editingEvent ? 'Event Updated' : 'Event Scheduled',
          message: `"${title}" has been saved to the station calendar.`
        });
        setShowForm(false);
        setEditingEvent(null);
        await onRefresh();
      }
    } catch (err) {
      setFormStatus({ status: 'error', title: 'Network Error', message: err.message });
    }
  };

  const handleToggleActive = async (ev) => {
    try {
      const res = await eventService.updateEvent(ev.id, { is_active: !ev.is_active });
      if (!res?.error) {
        await onRefresh();
      }
    } catch (err) {
      console.warn('Error toggling event state:', err);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await eventService.deleteEvent(eventToDelete.id);
      if (res?.error) {
        setFormStatus({ status: 'error', title: 'Delete Failed', message: res.error.message });
      } else {
        setFormStatus({ status: 'success', title: 'Deleted', message: 'Event removed from station schedule.' });
        setDeleteModalOpen(false);
        setEventToDelete(null);
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
          <h2 className="subpage-title font-display">Campus Events Management</h2>
          <p className="subpage-subtitle">
            Plan station live shows, recording sessions, DJ workshops, and manage real verified attendee counts.
          </p>
        </div>

        <button
          type="button"
          className="action-btn-green font-mono"
          onClick={showForm ? () => setShowForm(false) : handleOpenAddForm}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          <span>{showForm ? 'CANCEL' : 'SCHEDULE EVENT'}</span>
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
            {editingEvent ? `Edit Event: ${editingEvent.title}` : 'Schedule Station Event'}
          </h3>
          <form onSubmit={handleSaveEvent}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label font-mono">EVENT TITLE *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Acoustic Lounge #4: Vinyl Sessions"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label font-mono">LOCATION *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Media Pavilion Room 104"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label font-mono">DATE *</label>
                <input
                  type="date"
                  className="form-input font-mono"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label font-mono">TIME (e.g. 7:00 PM - 9:00 PM)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 7:00 PM - 9:30 PM"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label font-mono">EVENT DESCRIPTION</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Details on performances, guest speakers, audience guidelines, and workshop itinerary..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button type="submit" className="action-btn-green font-mono">
                <Check size={14} />
                <span>{editingEvent ? 'UPDATE EVENT' : 'PUBLISH EVENT'}</span>
              </button>
              <button
                type="button"
                className="action-btn-red font-mono"
                onClick={() => {
                  setShowForm(false);
                  setEditingEvent(null);
                }}
              >
                <X size={14} />
                <span>CANCEL</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Controls */}
      <div className="admin-controls-card radio-card">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="search"
            className="admin-search-field"
            placeholder="Search events by title, location, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="font-mono text-muted" style={{ fontSize: '0.74rem' }}>
          EVENTS: <strong className="text-cyan">{filteredEvents.length}</strong>
        </div>
      </div>

      {/* Events Table */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No Events Scheduled"
          description="Click 'Schedule Event' above to plan live recordings and studio workshops."
        />
      ) : (
        <div className="admin-data-container radio-card">
          <div className="data-table-header font-mono">
            <div>EVENT & LOCATION</div>
            <div>DATE & TIME</div>
            <div>REGISTRATIONS</div>
            <div>STATUS</div>
            <div style={{ textAlign: 'right' }}>ACTIONS</div>
          </div>

          <div className="data-table-body">
            {filteredEvents.map((ev) => (
              <div key={ev.id} className="data-table-row">
                <div className="col-primary">
                  <div className="row-title font-display">{ev.title}</div>
                  <div className="row-sub font-mono">
                    <MapPin size={12} className="inline-icon" />
                    <span>{ev.location || 'Studio Pavilion'}</span>
                  </div>
                </div>

                <div className="font-mono text-muted date-col">
                  <Clock size={12} className="inline-icon" />
                  <span>{ev.date} • {ev.time || '19:00'}</span>
                </div>

                <div className="col-dept font-mono">
                  <div className="dept-badge text-cyan">
                    <Users size={12} className="inline-icon" />
                    <span>{ev.registration_count || 0} registered</span>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    className={`status-pill ${ev.is_active ? 'pill-approved' : 'pill-archived'} font-mono`}
                    onClick={() => handleToggleActive(ev)}
                    title="Toggle event visibility"
                    style={{ cursor: 'pointer' }}
                  >
                    {ev.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                    <span>{ev.is_active ? 'ACTIVE' : 'OFFLINE'}</span>
                  </button>
                </div>

                <div className="col-actions">
                  <button
                    type="button"
                    className="action-icon-btn"
                    onClick={() => handleOpenEditForm(ev)}
                    title="Edit event"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="action-icon-btn delete"
                    onClick={() => {
                      setEventToDelete(ev);
                      setDeleteModalOpen(true);
                    }}
                    title="Delete event"
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
        title="Delete Event"
        message={`Delete "${eventToDelete?.title}" from the station calendar? Registered attendees will no longer see this session.`}
        confirmText="Delete Event"
        cancelText="Cancel"
        isDanger={true}
        isLoading={deleteLoading}
        onConfirm={handleDeleteEvent}
        onCancel={() => {
          setDeleteModalOpen(false);
          setEventToDelete(null);
        }}
      />
    </div>
  );
}
