import React from 'react';
import { Calendar, Clock, Radio, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import './SchedulePreview.css';

export default function SchedulePreview() {
  const { todaysSchedule, state } = useAudioPlayer();

  return (
    <section id="schedule" className="schedule-preview-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-head">
          <div className="section-head-left">
            <div className="section-eyebrow font-mono">
              <Calendar size={14} className="eyebrow-icon" />
              <span>TRANSMISSION GUIDE</span>
            </div>
            <h2 className="section-title font-display">Today's Broadcast Schedule</h2>
            <p className="section-sub">Scheduled program transmission times from the campus studio.</p>
          </div>

          <Link to="/live" className="section-head-link font-mono">
            <span>Tune in on Live Page</span>
            <ChevronRight size={15} />
          </Link>
        </div>

        {/* Schedule Grid or Clean Empty State */}
        {(!todaysSchedule || todaysSchedule.length === 0) ? (
          <div className="schedule-empty-card">
            <Radio size={32} className="empty-icon" />
            <h3 className="empty-title font-display">No broadcasts scheduled yet.</h3>
            <p className="empty-desc">
              The studio transmission timetable for today is currently clear. Live broadcasts resume according to the campus station term schedule.
            </p>
          </div>
        ) : (
          <div className="schedule-timeline">
            {todaysSchedule.map((item) => (
              <div
                key={item.id}
                className={`schedule-row ${item.active && state === 'live' ? 'is-live-slot' : ''}`}
              >
                <div className="time-col">
                  <div className="time-badge font-mono">
                    <Clock size={13} />
                    <span>{item.time}</span>
                  </div>
                  {item.active && state === 'live' && (
                    <span className="live-tag font-mono">CURRENT TRANSMISSION</span>
                  )}
                </div>

                <div className="info-col">
                  <h4 className="show-name font-display">{item.title}</h4>
                  <p className="show-host">With {item.host}</p>
                </div>

                <div className="status-col font-mono">
                  {item.active && state === 'live' ? (
                    <span className="slot-status-live">
                      <span className="status-dot" />
                      ON AIR
                    </span>
                  ) : (
                    <span className="slot-status-upcoming">SCHEDULED</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
