import React, { useState, useEffect } from 'react';
import { Calendar, Sparkles } from 'lucide-react';
import EventCard from '../components/EventCard';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { eventService } from '../services/event-service';
import { useAuth } from '../context/AuthContext';

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [userRegistrations, setUserRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEventsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsData, regs] = await Promise.all([
        eventService.getEvents(),
        user ? eventService.getUserRegistrations(user.id) : []
      ]);
      setEvents(eventsData || []);
      setUserRegistrations((regs || []).map((r) => r.event_id));
    } catch (err) {
      console.warn('Events loading error:', err);
      setError('Something went wrong while loading this content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventsData();
  }, [user]);

  const handleRegistered = (eventId) => {
    setUserRegistrations((prev) => [...prev, eventId]);
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId
          ? { ...ev, registration_count: (ev.registration_count || 0) + 1 }
          : ev
      )
    );
  };

  return (
    <div className="events-page-layout">
      <div className="container">
        {/* Header */}
        <div className="section-masthead">
          <div className="section-eyebrow">
            <span className="section-eyebrow-line" />
            <span>CAMPUS ENGAGEMENT</span>
          </div>
          <h1 className="section-title">CAMPUS EVENTS</h1>
          <p className="section-subtitle">
            What's happening around campus.
          </p>
        </div>

        {loading ? (
          <LoadingState message="Loading events..." />
        ) : error ? (
          <ErrorState
            title="Something went wrong while loading this content."
            description="We were unable to load the event schedule from the server."
            onRetry={loadEventsData}
          />
        ) : events.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No upcoming events."
            description="There are currently no scheduled events. Check back soon for announcements about live studio sessions and workshops."
          />
        ) : (
          <div className="events-grid">
            {events.map((ev) => (
              <EventCard
                key={ev.id}
                event={ev}
                isRegistered={userRegistrations.includes(ev.id)}
                onRegistered={handleRegistered}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .events-page-layout {
          padding: 44px 0 80px;
        }
        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 28px;
        }
      `}</style>
    </div>
  );
}
