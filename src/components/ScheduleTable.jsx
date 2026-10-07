import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, User, Radio, Tag, Play } from 'lucide-react';
import EmptyState from './EmptyState';
import './ScheduleTable.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * Calculates genuine on-air vs upcoming state based on current device time
 * No fake statuses.
 */
function getSlotStatus(dayOfWeek, startTime, endTime) {
  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = dayNames[now.getDay()];

  if (dayOfWeek !== currentDay) {
    return 'scheduled';
  }

  const [startH = 0, startM = 0] = (startTime || '').split(':').map(Number);
  const [endH = 0, endM = 0] = (endTime || '').split(':').map(Number);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
    return 'on_air';
  } else if (currentMinutes < startMinutes) {
    return 'upcoming';
  } else {
    return 'passed';
  }
}

export default function ScheduleTable({ schedule = [] }) {
  const [selectedDay, setSelectedDay] = useState(() => {
    const todayIndex = (new Date().getDay() + 6) % 7; // Monday is 0
    return DAYS[todayIndex] || 'Monday';
  });

  if (!schedule || schedule.length === 0) {
    return (
      <EmptyState
        icon={Radio}
        title="No schedule available yet."
        description="The broadcast schedule has not been published yet. Our program director updates weekly slots regularly."
      />
    );
  }

  // Schedule for currently selected tab on desktop
  const daySchedule = schedule.filter((s) => s.day_of_week === selectedDay);

  return (
    <div className="schedule-timetable-wrapper">
      {/* Day Selector Tabs (Desktop & Tablet) */}
      <div className="schedule-day-tabs font-mono" role="tablist" aria-label="Schedule Days">
        {DAYS.map((day) => {
          const count = schedule.filter((s) => s.day_of_week === day).length;
          const isToday = DAYS[(new Date().getDay() + 6) % 7] === day;

          return (
            <button
              key={day}
              type="button"
              role="tab"
              aria-selected={selectedDay === day}
              className={`day-tab-btn ${selectedDay === day ? 'active' : ''} ${isToday ? 'is-today' : ''}`}
              onClick={() => setSelectedDay(day)}
            >
              <span className="day-abbr">{day.substring(0, 3).toUpperCase()}</span>
              {isToday && <span className="today-badge font-mono">TODAY</span>}
              {count > 0 && <span className="day-count-badge font-mono">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* DESKTOP TIMETABLE VIEW */}
      <div className="schedule-desktop-view">
        <div className="timetable-header-row font-mono">
          <div className="header-cell">TIME</div>
          <div className="header-cell">SHOW</div>
          <div className="header-cell">HOST / RJ</div>
          <div className="header-cell">CATEGORY</div>
          <div className="header-cell text-right">STATUS</div>
        </div>

        {daySchedule.length === 0 ? (
          <div className="timetable-empty-day font-mono">
            No transmissions programmed for {selectedDay}.
          </div>
        ) : (
          <div className="timetable-body">
            {daySchedule.map((slot) => {
              const status = getSlotStatus(slot.day_of_week, slot.start_time, slot.end_time);

              return (
                <div
                  key={slot.id || `${slot.day_of_week}-${slot.start_time}-${slot.show_title}`}
                  className={`timetable-row ${status === 'on_air' ? 'is-on-air-row' : ''}`}
                >
                  <div className="cell-time font-mono">
                    <Clock size={13} className="time-icon" />
                    <span>{slot.start_time} — {slot.end_time}</span>
                  </div>

                  <div className="cell-show font-display">
                    {slot.show_id ? (
                      <Link to={`/shows/${slot.show_id}`} className="slot-show-link">
                        {slot.show_title}
                      </Link>
                    ) : (
                      <span>{slot.show_title}</span>
                    )}
                  </div>

                  <div className="cell-rj font-mono">
                    <User size={13} className="rj-icon" />
                    <span>{slot.rj_name}</span>
                  </div>

                  <div className="cell-cat">
                    <span className="category-pill font-mono">{slot.category || 'General'}</span>
                  </div>

                  <div className="cell-status text-right font-mono">
                    {status === 'on_air' ? (
                      <span className="status-badge-live">
                        <span className="live-pulse-dot" />
                        <span>CURRENTLY ON AIR</span>
                      </span>
                    ) : status === 'upcoming' ? (
                      <span className="status-badge-upcoming">
                        <span>UPCOMING</span>
                      </span>
                    ) : (
                      <span className="status-badge-scheduled">
                        <span>SCHEDULED</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MOBILE DAY-BY-DAY STACKED CARDS VIEW */}
      <div className="schedule-mobile-view">
        {DAYS.map((day) => {
          const slotsForDay = schedule.filter((s) => s.day_of_week === day);
          if (slotsForDay.length === 0) return null;

          const isToday = DAYS[(new Date().getDay() + 6) % 7] === day;

          return (
            <div key={day} className="mobile-day-section">
              <div className="mobile-day-header font-mono">
                <span className="mobile-day-title">{day.toUpperCase()}</span>
                {isToday && <span className="today-badge font-mono">TODAY</span>}
              </div>

              <div className="mobile-day-slots">
                {slotsForDay.map((slot) => {
                  const status = getSlotStatus(slot.day_of_week, slot.start_time, slot.end_time);

                  return (
                    <div
                      key={slot.id || `${day}-${slot.start_time}-${slot.show_title}`}
                      className={`mobile-schedule-card radio-card ${status === 'on_air' ? 'is-on-air' : ''}`}
                    >
                      <div className="mobile-card-top font-mono">
                        <span className="mobile-time">
                          <Clock size={12} />
                          <span>{slot.start_time} — {slot.end_time}</span>
                        </span>

                        {status === 'on_air' ? (
                          <span className="status-badge-live">
                            <span className="live-pulse-dot" />
                            <span>ON AIR</span>
                          </span>
                        ) : status === 'upcoming' ? (
                          <span className="status-badge-upcoming">UPCOMING</span>
                        ) : (
                          <span className="category-pill">{slot.category || 'General'}</span>
                        )}
                      </div>

                      <h4 className="mobile-show-title font-display">
                        {slot.show_id ? (
                          <Link to={`/shows/${slot.show_id}`} className="slot-show-link">
                            {slot.show_title}
                          </Link>
                        ) : (
                          slot.show_title
                        )}
                      </h4>

                      <div className="mobile-rj font-mono">
                        <User size={12} />
                        <span>Hosted by {slot.rj_name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
