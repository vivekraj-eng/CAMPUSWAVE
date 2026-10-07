import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Clock, Check, X, AlertTriangle, Radio } from 'lucide-react';
import EmptyState from '../EmptyState';
import ConfirmationModal from './ConfirmationModal';
import FormStatus from '../FormStatus';
import { scheduleService } from '../../services/schedule-service';
import './AdminTableSection.css';

export default function AdminSchedule({
  schedule = [],
  shows = [],
  rjProfiles = [],
  onRefresh = () => {}
}) {
  const [dayFilter, setDayFilter] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formStatus, setFormStatus] = useState({ status: 'idle', title: '', message: '' });

  // Add slot form fields
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('20:00');
  const [showTitle, setShowTitle] = useState('');
  const [rjName, setRjName] = useState('');
  const [category, setCategory] = useState('Music');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const filteredSchedule = schedule.filter((s) => {
    if (dayFilter !== 'All' && s.day_of_week !== dayFilter) return false;
    return true;
  });

  const checkConflict = (day, start, end) => {
    return schedule.find((s) => {
      if (s.day_of_week !== day) return false;
      // Overlap condition: start < s.end_time && end > s.start_time
      return start < s.end_time && end > s.start_time;
    });
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!showTitle.trim() || !startTime || !endTime) {
      setFormStatus({ status: 'error', title: 'Validation Error', message: 'Show title, start, and end time are required.' });
      return;
    }

    if (startTime >= endTime) {
      setFormStatus({ status: 'error', title: 'Invalid Time Interval', message: 'Start time must be before end time.' });
      return;
    }

    // Check for conflict
    const conflict = checkConflict(dayOfWeek, startTime, endTime);
    if (conflict) {
      setFormStatus({
        status: 'error',
        title: 'Schedule Conflict Detected',
        message: `Timeslot overlaps with existing broadcast "${conflict.show_title}" (${conflict.start_time} - ${conflict.end_time}) on ${dayOfWeek}.`
      });
      return;
    }

    setFormStatus({ status: 'submitting', title: 'Programming Timeslot', message: 'Inserting entry into radio_schedule...' });

    try {
      const res = await scheduleService.addScheduleEntry({
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        show_title: showTitle.trim(),
        rj_name: rjName.trim() || 'CampusWave RJ',
        category: category.trim()
      });

      if (res?.error) {
        setFormStatus({ status: 'error', title: 'Programming Failed', message: res.error.message });
      } else {
        setFormStatus({
          status: 'success',
          title: 'Timeslot Programmed',
          message: `"${showTitle}" added to ${dayOfWeek} lineup.`
        });
        setShowTitle('');
        setRjName('');
        setShowAddForm(false);
        await onRefresh();
      }
    } catch (err) {
      setFormStatus({ status: 'error', title: 'Network Error', message: err.message });
    }
  };

  const handleDeleteSlot = async () => {
    if (!slotToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await scheduleService.deleteScheduleEntry(slotToDelete.id);
      if (res?.error) {
        setFormStatus({ status: 'error', title: 'Delete Failed', message: res.error.message });
      } else {
        setFormStatus({ status: 'success', title: 'Timeslot Removed', message: 'Schedule entry deleted.' });
        setDeleteModalOpen(false);
        setSlotToDelete(null);
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
          <h2 className="subpage-title font-display">Weekly Radio Timetable</h2>
          <p className="subpage-subtitle">
            Configure transmission slots, assign show rotations, and manage the official station weekly schedule.
          </p>
        </div>

        <button
          type="button"
          className="action-btn-green font-mono"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? <X size={14} /> : <Plus size={14} />}
          <span>{showAddForm ? 'CANCEL' : 'ADD TIMETABLE SLOT'}</span>
        </button>
      </div>

      <FormStatus
        status={formStatus.status}
        title={formStatus.title}
        message={formStatus.message}
        className="subpage-form-status"
      />

      {/* Add Slot Form */}
      {showAddForm && (
        <div className="radio-card admin-modal-form-card">
          <h3 className="form-title font-display" style={{ color: '#FFFFFF', marginBottom: 16 }}>
            Program Weekly Timeslot
          </h3>
          <form onSubmit={handleAddSlot}>
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label font-mono">DAY OF WEEK *</label>
                <select
                  className="form-select font-mono"
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                >
                  {daysOfWeek.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label font-mono">START TIME (24H) *</label>
                <input
                  type="time"
                  className="form-input font-mono"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label font-mono">END TIME (24H) *</label>
                <input
                  type="time"
                  className="form-input font-mono"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label font-mono">SHOW TITLE *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Neon Horizon"
                  value={showTitle}
                  onChange={(e) => setShowTitle(e.target.value)}
                  list="show-suggestions"
                  required
                />
                <datalist id="show-suggestions">
                  {shows.map((s) => (
                    <option key={s.id} value={s.title} />
                  ))}
                </datalist>
              </div>

              <div className="form-group">
                <label className="form-label font-mono">HOST RJ *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. RJ Sarah"
                  value={rjName}
                  onChange={(e) => setRjName(e.target.value)}
                  list="rj-suggestions"
                  required
                />
                <datalist id="rj-suggestions">
                  {rjProfiles.map((p) => (
                    <option key={p.id} value={p.full_name} />
                  ))}
                </datalist>
              </div>

              <div className="form-group">
                <label className="form-label font-mono">CATEGORY</label>
                <select
                  className="form-select font-mono"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Music">Music</option>
                  <option value="Talk">Talk</option>
                  <option value="Campus Culture">Campus Culture</option>
                  <option value="Late Night">Late Night</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button type="submit" className="action-btn-green font-mono">
                <Check size={14} />
                <span>SAVE SLOT</span>
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

      {/* Day Filter Pills */}
      <div className="admin-controls-card radio-card">
        <div className="filter-group font-mono">
          <label className="filter-label">
            <Calendar size={13} />
            <span>DAY FILTER:</span>
          </label>
          <div className="filter-pills">
            {['All', ...daysOfWeek].map((d) => (
              <button
                key={d}
                type="button"
                className={`filter-pill-btn ${dayFilter === d ? 'active' : ''}`}
                onClick={() => setDayFilter(d)}
              >
                {d.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="font-mono text-muted" style={{ fontSize: '0.74rem' }}>
          SLOTS: <strong className="text-cyan">{filteredSchedule.length}</strong>
        </div>
      </div>

      {/* Schedule Table */}
      {filteredSchedule.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Scheduled Timeslots"
          description={
            dayFilter !== 'All'
              ? `No broadcasts are scheduled for ${dayFilter}.`
              : 'The station weekly timetable is currently unpopulated.'
          }
        />
      ) : (
        <div className="admin-data-container radio-card">
          <div className="data-table-header font-mono">
            <div>DAY & TIMESLOT</div>
            <div>SHOW TITLE</div>
            <div>HOST RJ</div>
            <div>CATEGORY</div>
            <div style={{ textAlign: 'right' }}>ACTIONS</div>
          </div>

          <div className="data-table-body">
            {filteredSchedule.map((slot) => (
              <div key={slot.id} className="data-table-row">
                {/* Day & Time */}
                <div className="col-primary font-mono">
                  <div className="row-title font-display text-purple">{slot.day_of_week}</div>
                  <div className="row-sub">
                    <Clock size={12} className="inline-icon" />
                    <span>{slot.start_time} - {slot.end_time}</span>
                  </div>
                </div>

                {/* Show Title */}
                <div className="col-primary">
                  <div className="row-title font-display">{slot.show_title}</div>
                </div>

                {/* Host */}
                <div className="col-dept font-mono">
                  <div className="dept-badge">{slot.rj_name}</div>
                </div>

                {/* Category */}
                <div>
                  <span className="status-pill pill-read font-mono">{slot.category || 'General'}</span>
                </div>

                {/* Actions */}
                <div className="col-actions">
                  <button
                    type="button"
                    className="action-icon-btn delete"
                    onClick={() => {
                      setSlotToDelete(slot);
                      setDeleteModalOpen(true);
                    }}
                    title="Remove timeslot"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        title="Remove Schedule Slot"
        message={`Delete the ${slotToDelete?.day_of_week} broadcast slot (${slotToDelete?.start_time} - ${slotToDelete?.end_time}) for "${slotToDelete?.show_title}"?`}
        confirmText="Remove Slot"
        cancelText="Cancel"
        isDanger={true}
        isLoading={deleteLoading}
        onConfirm={handleDeleteSlot}
        onCancel={() => {
          setDeleteModalOpen(false);
          setSlotToDelete(null);
        }}
      />
    </div>
  );
}
