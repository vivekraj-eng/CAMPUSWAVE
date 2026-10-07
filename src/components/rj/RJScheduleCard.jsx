import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Radio, ArrowUpRight } from 'lucide-react';
import EmptyState from '../EmptyState';

/**
 * RJScheduleCard
 * Displays schedule slots where the RJ is scheduled to broadcast live.
 */
export default function RJScheduleCard({ schedule = [] }) {
  return (
    <div className="radio-card rj-card rj-schedule-card" id="rj-schedule-section">
      <div className="dash-card-header font-mono">
        <div className="dash-header-title">
          <Calendar size={16} />
          <span>BROADCAST LINEUP</span>
          {schedule.length > 0 && <span className="dash-count-badge font-mono">{schedule.length}</span>}
        </div>
        <Link to="/schedule" className="dash-header-action font-mono">
          <span>Weekly Timetable</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {schedule.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No upcoming broadcasts assigned to you"
          description="Your weekly timetable slots will appear here once rostered by station administrators."
        />
      ) : (
        <div className="rj-schedule-list">
          {schedule.map((slot) => (
            <div key={slot.id} className="rj-schedule-row">
              <div className="schedule-day-badge font-mono">
                {slot.day_of_week}
              </div>

              <div className="schedule-time-range font-mono">
                <Clock size={13} />
                <span>{slot.start_time} — {slot.end_time}</span>
              </div>

              <div className="schedule-show-info">
                <h4 className="schedule-show-name font-display">{slot.show_title}</h4>
                <div className="schedule-host-meta font-mono">
                  <span>Host: {slot.rj_name}</span>
                  {slot.category && (
                    <>
                      <span className="bullet-sep">•</span>
                      <span className="category-pill font-mono">{slot.category}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="schedule-badge-col">
                <span className="status-badge status-approved font-mono">
                  <Radio size={11} />
                  <span>SCHEDULED</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
