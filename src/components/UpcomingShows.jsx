import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, User, Tag, Calendar, ArrowRight } from 'lucide-react';
import './UpcomingShows.css';

/**
 * UpcomingShows Component
 * Renders authentic upcoming schedule entries in horizontal cards on desktop, stacked on mobile.
 * If no upcoming schedule exists, this component gracefully hides.
 */
export default function UpcomingShows({ schedule = [] }) {
  if (!schedule || schedule.length === 0) {
    return null;
  }

  return (
    <section className="home-section upcoming-shows-section">
      <div className="container">
        <div className="section-masthead">
          <div className="section-eyebrow">
            <span className="section-eyebrow-line" />
            <span>TRANSMISSION LINEUP</span>
          </div>
          <div className="section-heading-split">
            <div>
              <h2 className="section-title">Upcoming Broadcast Lineup</h2>
              <p className="section-subtitle">
                Scheduled student broadcast segments and shows slated for the airwaves.
              </p>
            </div>
            <Link to="/schedule" className="btn-outline-purple font-mono">
              <span>FULL WEEKLY SCHEDULE</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="upcoming-shows-grid">
          {schedule.slice(0, 4).map((entry) => (
            <div key={entry.id || `${entry.day_of_week}-${entry.start_time}-${entry.show_title}`} className="upcoming-show-card">
              <div className="upcoming-time-col font-mono">
                <div className="upcoming-day-badge">{entry.day_of_week?.substring(0, 3).toUpperCase() || 'LIVE'}</div>
                <div className="upcoming-hours">
                  <Clock size={12} className="upcoming-clock-icon" />
                  <span>{entry.start_time} - {entry.end_time}</span>
                </div>
              </div>

              <div className="upcoming-info-col">
                <div className="upcoming-top-meta font-mono">
                  <span className="upcoming-cat-badge">{entry.category || 'General'}</span>
                </div>
                <h4 className="upcoming-show-title font-display">{entry.show_title}</h4>
                <div className="upcoming-rj-meta font-mono">
                  <User size={12} className="upcoming-user-icon" />
                  <span>RJ: {entry.rj_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
