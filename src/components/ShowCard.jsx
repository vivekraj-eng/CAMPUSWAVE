import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, User, Radio, Play, Pause, ExternalLink } from 'lucide-react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import './ShowCard.css';

/**
 * ShowCard Component
 * Displays a broadcast show card containing:
 * - cover image
 * - show name
 * - RJ
 * - category
 * - short description
 * - schedule information
 * - play/open button
 */
export default function ShowCard({ show }) {
  const { isPlaying, activeTrack, togglePlayTrack } = useAudioPlayer();

  if (!show) return null;

  const isCurrentTrack = activeTrack?.id === show.id;
  const isPlayingThis = isPlaying && isCurrentTrack;

  const handlePlayToggle = () => {
    if (show.audio_url) {
      togglePlayTrack({
        id: show.id,
        title: show.title,
        rj_name: show.host_name,
        cover_image: show.cover_image,
        audio_url: show.audio_url,
        category: show.category
      });
    }
  };

  const formattedDate = show.date
    ? new Date(show.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : show.created_at
    ? new Date(show.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className={`radio-card show-card ${isPlayingThis ? 'is-playing' : ''}`}>
      {show.cover_image ? (
        <div className="show-card-banner">
          <Link to={`/shows/${show.id}`} aria-label={`View ${show.title}`}>
            <img src={show.cover_image} alt={show.title} className="show-img" />
          </Link>
          <span className="show-category-badge font-mono">{show.category || 'Music'}</span>
        </div>
      ) : (
        <div className="show-card-banner-placeholder">
          <Link to={`/shows/${show.id}`} className="placeholder-link" aria-label={`View ${show.title}`}>
            <Radio size={36} className="placeholder-icon" />
          </Link>
          <span className="show-category-badge font-mono">{show.category || 'Music'}</span>
        </div>
      )}

      <div className="show-card-body">
        <Link to={`/shows/${show.id}`} className="show-title-link">
          <h3 className="show-title font-display">{show.title}</h3>
        </Link>
        {show.tagline && <p className="show-tagline font-mono">{show.tagline}</p>}
        <p className="show-desc">{show.description}</p>

        <div className="show-meta-row font-mono">
          <div className="show-meta-item">
            <User size={13} className="meta-icon" />
            <span>{show.host_name || show.rj_name}</span>
          </div>

          {formattedDate && (
            <div className="show-meta-item">
              <Calendar size={13} className="meta-icon" />
              <span>{formattedDate}</span>
            </div>
          )}

          {(show.duration || show.schedule_time) && (
            <div className="show-meta-item">
              <Clock size={13} className="meta-icon" />
              <span>{show.duration || show.schedule_time}</span>
            </div>
          )}
        </div>

        <div className="show-card-footer">
          <Link to={`/shows/${show.id}`} className="show-open-btn font-mono" aria-label={`Open ${show.title} details`}>
            <span>OPEN SHOW</span>
            <ExternalLink size={12} />
          </Link>

          {show.audio_url ? (
            <button
              type="button"
              className={`show-play-btn font-mono ${isPlayingThis ? 'playing' : ''}`}
              onClick={handlePlayToggle}
              aria-label={isPlayingThis ? `Pause ${show.title}` : `Play preview of ${show.title}`}
            >
              {isPlayingThis ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
              <span>{isPlayingThis ? 'PAUSE' : 'PLAY'}</span>
            </button>
          ) : (
            <Link to="/live" className="show-play-btn font-mono" aria-label="Tune into live broadcast">
              <Play size={13} fill="currentColor" />
              <span>TUNE IN</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
