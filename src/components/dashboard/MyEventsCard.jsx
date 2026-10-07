import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Ticket, ArrowUpRight, Clock } from 'lucide-react';
import EmptyState from '../EmptyState';

/**
 * MyEventsCard
 * Displays station events the student has actually registered for.
 * Does not show events as registered merely because they exist in the catalog.
 */
export default function MyEventsCard({ registrations = [] }) {
  return (
    <div className="radio-card dashboard-card my-events-card" id="my-events-section">
      <div className="dash-card-header font-mono">
        <div className="dash-header-title">
          <Calendar size={16} />
          <span>EVENT REGISTRATIONS</span>
          {registrations.length > 0 && (
            <span className="dash-count-badge font-mono">{registrations.length}</span>
          )}
        </div>
        <Link to="/events" className="dash-header-action font-mono">
          <span>Explore Events</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {registrations.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No event registrations yet"
          description="Register for upcoming live studio workshops, acoustic concerts, and station celebrations across campus."
          action={
            <Link to="/events" className="btn-primary font-mono btn-compact">
              <Calendar size={14} />
              <span>Explore Events</span>
            </Link>
          }
        />
      ) : (
        <div className="dash-records-list">
          {registrations.map((reg) => {
            const ev = reg.events || {};
            const title = ev.title || 'CampusWave Station Event';
            const date = ev.date || (reg.created_at ? new Date(reg.created_at).toLocaleDateString() : 'Upcoming');
            const location = ev.location || 'CampusWave Studio';
            const category = ev.category || 'Live Event';

            return (
              <div key={reg.id} className="dash-record-row event-pass-row">
                <div className="dash-record-lead-icon event">
                  <Ticket size={18} />
                </div>

                <div className="dash-record-content">
                  <div className="record-title-row">
                    <h4 className="record-primary-title font-display">{title}</h4>
                    <span className="status-badge status-approved font-mono">
                      <Ticket size={12} />
                      <span>PASS CONFIRMED</span>
                    </span>
                  </div>

                  <div className="record-meta-line font-mono">
                    <span className="record-meta-item">
                      <Clock size={12} />
                      <span>{date}</span>
                    </span>
                    <span className="bullet-sep">•</span>
                    <span className="record-meta-item">
                      <MapPin size={12} />
                      <span>{location}</span>
                    </span>
                    {category && (
                      <>
                        <span className="bullet-sep">•</span>
                        <span className="category-pill font-mono">{category}</span>
                      </>
                    )}
                  </div>
                </div>

                {ev.id && (
                  <div className="dash-record-tail-action">
                    <Link
                      to={`/events/${ev.id}`}
                      className="btn-outline-purple font-mono btn-compact"
                      aria-label={`View details for ${title}`}
                    >
                      <span>Pass Info</span>
                      <ArrowUpRight size={12} />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
