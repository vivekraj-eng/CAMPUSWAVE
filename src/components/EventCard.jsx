import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/event-service';
import './EventCard.css';

/**
 * Calculates event status from actual event date/time and state.
 * Supports: 'Upcoming' | 'Registration Open' | 'Registration Closed' | 'Completed'
 */
export function getEventStatus(event) {
  if (!event) return 'Upcoming';

  const now = new Date();
  let eventDateTime = null;

  if (event.date) {
    eventDateTime = new Date(event.date);
    if (event.time && event.time.includes(':')) {
      const [h, m = 0] = event.time.split(':').map(Number);
      if (!isNaN(h)) {
        eventDateTime.setHours(h, m, 0, 0);
      }
    } else {
      eventDateTime.setHours(23, 59, 59, 999);
    }
  }

  if (eventDateTime && eventDateTime < now) {
    return 'Completed';
  }

  if (event.is_active === false) {
    return 'Registration Closed';
  }

  if (event.max_capacity && (event.registration_count || 0) >= event.max_capacity) {
    return 'Registration Closed';
  }

  return 'Registration Open';
}

export default function EventCard({
  event,
  isRegistered = false,
  onRegistered = () => {}
}) {
  const { user, profile, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(isRegistered);
  const [errorMsg, setErrorMsg] = useState('');

  if (!event) return null;

  const eventStatus = getEventStatus(event);

  const handleRegisterClick = async () => {
    setErrorMsg('');

    if (!isAuthenticated) {
      navigate('/login?redirect=/events', { state: { from: { pathname: '/events' } } });
      return;
    }

    if (registered) return;

    setLoading(true);
    try {
      const res = await eventService.registerForEvent({
        eventId: event.id,
        userId: user.id,
        userName: profile?.full_name || user.email.split('@')[0],
        userEmail: user.email,
        phone: profile?.phone || ''
      });

      if (res.error) {
        setErrorMsg(res.error.message || 'Registration failed.');
      } else {
        setRegistered(true);
        onRegistered(event.id);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to register.');
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    : null;

  return (
    <article className="radio-card event-card">
      {event.image_url ? (
        <div className="event-banner-wrap">
          <Link to={`/events/${event.id}`} tabIndex={-1} aria-hidden="true">
            <img src={event.image_url} alt={event.title} className="event-img" />
          </Link>
          <span className={`event-status-pill status-${eventStatus.toLowerCase().replace(/\s+/g, '-')}`}>
            {eventStatus}
          </span>
        </div>
      ) : (
        <div className="event-banner-placeholder">
          <Link to={`/events/${event.id}`} className="placeholder-link" tabIndex={-1} aria-hidden="true">
            <Calendar size={36} />
          </Link>
          <span className={`event-status-pill status-${eventStatus.toLowerCase().replace(/\s+/g, '-')}`}>
            {eventStatus}
          </span>
        </div>
      )}

      <div className="event-card-body">
        <div className="event-datetime font-mono">
          {formattedDate && (
            <span className="dt-item">
              <Calendar size={13} />
              <span>{formattedDate}</span>
            </span>
          )}
          {event.time && (
            <span className="dt-item">
              <Clock size={13} />
              <span>{event.time}</span>
            </span>
          )}
        </div>

        <Link to={`/events/${event.id}`} className="event-title-link">
          <h3 className="event-title font-display">{event.title}</h3>
        </Link>

        {event.location && (
          <div className="event-location font-mono">
            <MapPin size={13} className="loc-icon" />
            <span>{event.location}</span>
          </div>
        )}

        <p className="event-description">{event.description}</p>

        {errorMsg && (
          <div className="event-card-alert font-mono">
            <AlertCircle size={13} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="event-footer">
          <Link to={`/events/${event.id}`} className="event-details-link font-mono">
            <span>DETAILS</span>
            <ArrowRight size={12} />
          </Link>

          {registered || isRegistered ? (
            <div className="registered-confirmation-badge font-mono">
              <CheckCircle2 size={14} />
              <span>You're registered.</span>
            </div>
          ) : eventStatus === 'Completed' ? (
            <span className="event-closed-btn font-mono" disabled>
              EVENT CONCLUDED
            </span>
          ) : eventStatus === 'Registration Closed' ? (
            <span className="event-closed-btn font-mono" disabled>
              REGISTRATION CLOSED
            </span>
          ) : (
            <button
              type="button"
              className="event-register-btn font-mono"
              onClick={handleRegisterClick}
              disabled={loading}
              aria-label={`Register for ${event.title}`}
            >
              {loading ? 'REGISTERING...' : 'REGISTER NOW'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
