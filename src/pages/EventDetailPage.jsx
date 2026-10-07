import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, CheckCircle2, AlertCircle, Users, Share2, LogIn } from 'lucide-react';
import { eventService } from '../services/event-service';
import { useAuth } from '../context/AuthContext';
import { getEventStatus } from '../components/EventCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import './EventDetailPage.css';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile, isAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [copied, setCopied] = useState(false);

  const fetchEventData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await eventService.getEventById(id);
      if (!data) {
        setError('Event not found or has concluded.');
      } else {
        setEvent(data);
        if (user) {
          const registered = await eventService.checkUserRegistration(id, user.id);
          setIsRegistered(registered);
        }
      }
    } catch (err) {
      console.warn('Error loading event detail:', err);
      setError('Something went wrong while loading this event.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [id, user]);

  const handleRegister = async () => {
    setFeedback({ type: '', message: '' });

    if (!isAuthenticated) {
      navigate(`/login?redirect=/events/${id}`, { state: { from: { pathname: `/events/${id}` } } });
      return;
    }

    if (isRegistered) return;

    setSubmitting(true);
    try {
      const res = await eventService.registerForEvent({
        eventId: event.id,
        userId: user.id,
        userName: profile?.full_name || user.email.split('@')[0],
        userEmail: user.email,
        phone: profile?.phone || ''
      });

      if (res.error) {
        setFeedback({ type: 'error', message: res.error.message || 'Registration failed.' });
      } else {
        setIsRegistered(true);
        setFeedback({ type: 'success', message: "You're registered. Access details have been saved to your student portal." });
        // Refresh event data to update genuine registration count
        const updated = await eventService.getEventById(id);
        if (updated) setEvent(updated);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to complete registration.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="container event-detail-container">
        <LoadingState message="Loading event details..." />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container event-detail-container">
        <Link to="/events" className="detail-back-link font-mono">
          <ArrowLeft size={14} />
          <span>BACK TO CAMPUS EVENTS</span>
        </Link>
        <ErrorState
          title="Event Not Found"
          description={error || "The requested campus event does not exist or has been removed."}
          onRetry={fetchEventData}
        />
      </div>
    );
  }

  const eventStatus = getEventStatus(event);
  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : null;

  return (
    <div className="event-detail-layout">
      <div className="container event-detail-container">
        {/* Navigation Breadcrumb */}
        <div className="detail-header-nav">
          <Link to="/events" className="detail-back-link font-mono">
            <ArrowLeft size={14} />
            <span>CAMPUS EVENTS</span>
          </Link>
          <span className="detail-crumb-sep font-mono">/</span>
          <span className="detail-crumb-current font-mono">{event.title}</span>
        </div>

        {/* Large Event Header Card */}
        <article className="event-detail-card">
          {event.image_url && (
            <div className="event-detail-banner-wrap">
              <img src={event.image_url} alt={event.title} className="event-detail-banner-img" />
              <span className={`event-status-pill status-${eventStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                {eventStatus}
              </span>
            </div>
          )}

          <div className="event-detail-content">
            {!event.image_url && (
              <div className="event-detail-top-bar">
                <span className={`event-status-pill inline-pill status-${eventStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                  {eventStatus}
                </span>
              </div>
            )}

            <h1 className="event-detail-headline font-display">{event.title}</h1>

            {/* Quick Meta Grid */}
            <div className="event-detail-meta-grid font-mono">
              {formattedDate && (
                <div className="meta-tile">
                  <Calendar size={18} className="tile-icon" />
                  <div className="tile-info">
                    <span className="tile-label">DATE</span>
                    <span className="tile-val">{formattedDate}</span>
                  </div>
                </div>
              )}

              {event.time && (
                <div className="meta-tile">
                  <Clock size={18} className="tile-icon" />
                  <div className="tile-info">
                    <span className="tile-label">TIME</span>
                    <span className="tile-val">{event.time}</span>
                  </div>
                </div>
              )}

              {event.location && (
                <div className="meta-tile">
                  <MapPin size={18} className="tile-icon" />
                  <div className="tile-info">
                    <span className="tile-label">LOCATION</span>
                    <span className="tile-val">{event.location}</span>
                  </div>
                </div>
              )}

              {/* Only render registration count if valid number in database */}
              {typeof event.registration_count === 'number' && event.registration_count > 0 && (
                <div className="meta-tile">
                  <Users size={18} className="tile-icon" />
                  <div className="tile-info">
                    <span className="tile-label">ATTENDEES</span>
                    <span className="tile-val">{event.registration_count} Registered</span>
                  </div>
                </div>
              )}
            </div>

            {/* Registration Action Section */}
            <div className="event-action-panel">
              <div className="action-panel-info">
                <h3 className="action-panel-title font-display">Student Event Registration</h3>
                <p className="action-panel-desc">
                  Guaranteed entry for college students and club members. Free admission.
                </p>
              </div>

              <div className="action-panel-controls">
                {isRegistered ? (
                  <div className="registered-confirmation-badge font-mono">
                    <CheckCircle2 size={16} />
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
                ) : isAuthenticated ? (
                  <button
                    type="button"
                    className="btn-primary font-mono"
                    onClick={handleRegister}
                    disabled={submitting}
                    aria-label={`Register now for ${event.title}`}
                  >
                    <CheckCircle2 size={15} />
                    <span>{submitting ? 'PROCESSING...' : 'REGISTER FOR THIS EVENT'}</span>
                  </button>
                ) : (
                  <Link to="/login" className="btn-primary font-mono">
                    <LogIn size={15} />
                    <span>SIGN IN TO REGISTER</span>
                  </Link>
                )}
              </div>
            </div>

            {feedback.message && (
              <div className={`event-feedback-box ${feedback.type} font-mono`} role="alert">
                {feedback.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Event Description Section */}
            <div className="event-detail-description-wrap">
              <h3 className="section-subheading font-display">About This Event</h3>
              <div className="event-full-description">
                {event.description.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>

            {/* Footer Utilities */}
            <div className="event-detail-footer font-mono">
              <button
                type="button"
                onClick={handleShare}
                className="event-share-btn"
                aria-label="Share this event"
              >
                <Share2 size={14} />
                <span>{copied ? 'LINK COPIED!' : 'SHARE EVENT'}</span>
              </button>

              <Link to="/events" className="event-back-link">
                <span>VIEW ALL CAMPUS EVENTS</span>
              </Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
