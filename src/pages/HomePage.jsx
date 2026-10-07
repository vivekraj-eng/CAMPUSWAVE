import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquare, Sparkles, UserPlus } from 'lucide-react';
import Hero from '../components/Hero';
import AudioPlayer from '../components/AudioPlayer';
import CurrentShowCard from '../components/CurrentShowCard';
import NowPlaying from '../components/NowPlaying';
import UpcomingShows from '../components/UpcomingShows';
import ShowCard from '../components/ShowCard';
import PodcastCard from '../components/PodcastCard';
import EventCard from '../components/EventCard';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { podcastService } from '../services/podcast-service';
import { eventService } from '../services/event-service';
import { requestService } from '../services/request-service';
import { radioService } from '../services/radio-service';
import { scheduleService } from '../services/schedule-service';

export default function HomePage() {
  const { state, currentBroadcast } = useAudioPlayer();
  const [shows, setShows] = useState([]);
  const [podcasts, setPodcasts] = useState([]);
  const [events, setEvents] = useState([]);
  const [shoutouts, setShoutouts] = useState([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState([]);
  const [nowPlaying, setNowPlaying] = useState(null);

  const isLive = state === 'live';

  useEffect(() => {
    let isMounted = true;
    async function loadHomeData() {
      try {
        const [showsRes, podcastsRes, eventsRes, shoutoutsRes, npRes, scheduleRes] = await Promise.all([
          podcastService.getShows(null, '').catch(() => []),
          podcastService.getPodcasts(null, '', 3).catch(() => []),
          eventService.getEvents().catch(() => []),
          requestService.getAllShoutouts().catch(() => []),
          radioService.getNowPlaying().catch(() => null),
          scheduleService.getWeeklySchedule().catch(() => [])
        ]);

        if (isMounted) {
          setShows(showsRes.slice(0, 3));
          setPodcasts(podcastsRes);
          setEvents(eventsRes.slice(0, 2));
          // Only show approved/aired shoutouts
          const approved = shoutoutsRes.filter(s => s.status === 'approved' || s.status === 'aired');
          setShoutouts(approved.slice(0, 3));
          setNowPlaying(npRes);
          setUpcomingSchedule(scheduleRes);
        }
      } catch (err) {
        console.warn('Home content load error:', err);
      }
    }
    loadHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="home-page-container">
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Broadcast Status & Embedded Audio Console */}
      <section className="home-player-section">
        <div className="container">
          <div className="home-broadcast-status-grid">
            <CurrentShowCard
              currentShow={nowPlaying?.current_show_title ? {
                title: nowPlaying.current_show_title,
                host: nowPlaying.current_rj,
                category: 'Live Broadcast',
                time: 'Transmitting Now'
              } : currentBroadcast}
              isLive={isLive || Boolean(nowPlaying?.is_live)}
            />
            <NowPlaying
              track={nowPlaying?.current_track || null}
              artist={nowPlaying?.current_artist || null}
              show={nowPlaying?.current_show_title || currentBroadcast?.title || null}
              rj={nowPlaying?.current_rj || currentBroadcast?.host || null}
              isLive={isLive || Boolean(nowPlaying?.is_live)}
            />
          </div>
          <div className="home-audio-player-mount">
            <AudioPlayer />
          </div>
        </div>
      </section>

      {/* 3. CONDITIONAL SECTION: Upcoming Shows (Schedule Entries) */}
      <UpcomingShows schedule={upcomingSchedule} />

      {/* 3. CONDITIONAL SECTION: Upcoming Shows (ONLY if real database content exists) */}
      {shows.length > 0 && (
        <section className="home-section">
          <div className="container">
            <div className="section-masthead">
              <div className="section-eyebrow">
                <span className="section-eyebrow-line" />
                <span>CURATED PROGRAMMING</span>
              </div>
              <div className="section-heading-split">
                <div>
                  <h2 className="section-title">Campus Broadcast Shows</h2>
                  <p className="section-subtitle">
                    Student-led discussions, music curations, and talk broadcasts.
                  </p>
                </div>
                <Link to="/shows" className="btn-outline-purple font-mono">
                  <span>VIEW ALL SHOWS</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="cards-grid-3">
              {shows.map(show => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. CONDITIONAL SECTION: Latest Podcasts (ONLY if real database content exists) */}
      {podcasts.length > 0 && (
        <section className="home-section">
          <div className="container">
            <div className="section-masthead">
              <div className="section-eyebrow">
                <span className="section-eyebrow-line" />
                <span>ON DEMAND REPLAYS</span>
              </div>
              <div className="section-heading-split">
                <div>
                  <h2 className="section-title">Latest Recorded Episodes</h2>
                  <p className="section-subtitle">
                    Stream recorded campus audio segments and student podcasts anytime.
                  </p>
                </div>
                <Link to="/shows" className="btn-outline-purple font-mono">
                  <span>ALL PODCASTS</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="cards-grid-3">
              {podcasts.map(pod => (
                <PodcastCard key={pod.id} podcast={pod} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. CONDITIONAL SECTION: Student Shout-outs (ONLY if real database content exists) */}
      {shoutouts.length > 0 && (
        <section className="home-section shoutouts-section">
          <div className="container">
            <div className="section-masthead">
              <div className="section-eyebrow">
                <span className="section-eyebrow-line" />
                <span>CAMPUS VOICES</span>
              </div>
              <div className="section-heading-split">
                <div>
                  <h2 className="section-title">Recent Student Shout-outs</h2>
                  <p className="section-subtitle">
                    Messages and dedications broadcast across college airwaves.
                  </p>
                </div>
                <Link to="/requests?tab=shoutout" className="btn-outline-purple font-mono">
                  <span>SUBMIT SHOUT-OUT</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="cards-grid-3">
              {shoutouts.map(so => (
                <div key={so.id} className="radio-card shoutout-quote-card">
                  <div className="quote-icon-bubble">
                    <MessageSquare size={16} />
                  </div>
                  <p className="shoutout-message">"{so.message}"</p>
                  <div className="shoutout-meta font-mono">
                    <span className="so-student">{so.student_name}</span>
                    {so.dedication && <span className="so-dedication">For: {so.dedication}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. CONDITIONAL SECTION: Upcoming Events (ONLY if real database content exists) */}
      {events.length > 0 && (
        <section className="home-section">
          <div className="container">
            <div className="section-masthead">
              <div className="section-eyebrow">
                <span className="section-eyebrow-line" />
                <span>COMMUNITY CALENDAR</span>
              </div>
              <div className="section-heading-split">
                <div>
                  <h2 className="section-title">Upcoming Station Events</h2>
                  <p className="section-subtitle">
                    Live studio recordings, open mic nights, and radio workshops.
                  </p>
                </div>
                <Link to="/events" className="btn-outline-purple font-mono">
                  <span>ALL EVENTS</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="cards-grid-2">
              {events.map(ev => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. Join the Radio Club Call to Action Banner */}
      <section className="home-join-cta-section">
        <div className="container">
          <div className="join-cta-banner">
            <div className="join-cta-content">
              <div className="join-badge font-mono">
                <Sparkles size={13} />
                <span>NOW RECRUITING TALENT</span>
              </div>
              <h2 className="join-title font-display">Be Heard On CampusWave 104.2 FM</h2>
              <p className="join-description">
                Whether you want to host an RJ show, write music reviews, run studio mixers, manage campus events, or produce multimedia stories, CampusWave has a place for your voice.
              </p>
              <div className="join-actions font-mono">
                <Link to="/join" className="btn-primary">
                  <UserPlus size={15} />
                  <span>APPLY TO JOIN THE CLUB</span>
                </Link>
                <Link to="/about" className="btn-secondary">
                  <span>DISCOVER OUR VISION</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .home-page-container {
          padding-bottom: 70px;
        }
        .home-player-section {
          padding: 20px 0 50px;
        }
        .home-broadcast-status-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        .home-audio-player-mount {
          width: 100%;
        }
        @media (max-width: 800px) {
          .home-broadcast-status-grid {
            grid-template-columns: 1fr;
          }
        }
        .home-section {
          padding: 44px 0;
        }
        .section-heading-split {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }
        .cards-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .cards-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        .shoutout-quote-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
        }
        .quote-icon-bubble {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(139, 92, 246, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-purple-bright);
        }
        .shoutout-message {
          font-size: 0.95rem;
          color: var(--text-primary);
          line-height: 1.55;
          font-style: italic;
          flex: 1;
        }
        .shoutout-meta {
          display: flex;
          flex-direction: column;
          font-size: 0.74rem;
          padding-top: 10px;
          border-top: 1px solid var(--border-subtle);
          color: var(--text-muted);
        }
        .so-student {
          color: var(--accent-blue-bright);
          font-weight: 700;
        }
        .so-dedication {
          color: var(--text-muted);
        }
        .home-join-cta-section {
          padding: 60px 0 20px;
        }
        .join-cta-banner {
          background: linear-gradient(135deg, rgba(20, 28, 48, 0.9) 0%, rgba(13, 19, 34, 0.95) 100%);
          border: 1px solid rgba(139, 92, 246, 0.35);
          border-radius: var(--radius-lg);
          padding: 48px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(139, 92, 246, 0.12);
          position: relative;
          overflow: hidden;
        }
        .join-cta-content {
          max-width: 680px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .join-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--accent-purple-bright);
        }
        .join-title {
          font-size: clamp(1.8rem, 3.5vw, 2.5rem);
          font-weight: 800;
          color: #FFFFFF;
          line-height: 1.15;
        }
        .join-description {
          font-size: 1rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .join-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 8px;
        }
        @media (max-width: 960px) {
          .cards-grid-3 {
            grid-template-columns: 1fr;
          }
          .cards-grid-2 {
            grid-template-columns: 1fr;
          }
          .join-cta-banner {
            padding: 32px 24px;
          }
        }
      `}</style>
    </div>
  );
}
