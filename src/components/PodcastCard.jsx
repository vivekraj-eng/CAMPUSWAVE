import React from 'react';
import { Play, Pause, Clock, Calendar, User, Volume2, Radio } from 'lucide-react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import './PodcastCard.css';

/**
 * PodcastCard Component
 * Displays an on-demand podcast episode.
 * Integrates directly with the centralized AudioService.
 * Does NOT create independent audio implementations.
 */
export default function PodcastCard({ podcast }) {
  const { isPlaying, activeTrack, togglePlayTrack } = useAudioPlayer();

  if (!podcast) return null;

  const isCurrentTrack = activeTrack?.id === podcast.id;
  const isPlayingThis = isPlaying && isCurrentTrack;

  const handlePlayToggle = () => {
    if (!podcast.audio_url) return;
    togglePlayTrack(podcast);
  };

  const formattedDate = podcast.date
    ? new Date(podcast.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const showName = podcast.shows?.title || podcast.show_title || null;

  return (
    <div className={`radio-card podcast-card ${isPlayingThis ? 'is-playing' : ''}`}>
      <div className="podcast-card-header">
        {podcast.cover_image ? (
          <div className="podcast-thumb-wrap">
            <img src={podcast.cover_image} alt={podcast.title} className="podcast-thumb-img" />
            {isPlayingThis && <div className="podcast-playing-overlay" />}
          </div>
        ) : (
          <div className="podcast-thumb-placeholder">
            <Volume2 size={24} />
            {isPlayingThis && <div className="podcast-playing-overlay" />}
          </div>
        )}

        <div className="podcast-header-info">
          <div className="podcast-top-pills font-mono">
            <span className="podcast-category-badge">{podcast.category || 'Podcast'}</span>
            {showName && (
              <span className="podcast-show-name font-mono">
                <Radio size={10} style={{ display: 'inline', marginRight: 4 }} />
                {showName}
              </span>
            )}
          </div>
          <h4 className="podcast-title font-display">{podcast.title}</h4>
          <div className="podcast-rj font-mono">
            <User size={12} />
            <span>Hosted by {podcast.rj_name}</span>
          </div>
        </div>
      </div>

      <p className="podcast-desc">{podcast.description}</p>

      <div className="podcast-footer">
        <div className="podcast-meta font-mono">
          {formattedDate && (
            <span className="meta-bit">
              <Calendar size={12} />
              <span>{formattedDate}</span>
            </span>
          )}
          <span className="meta-bit">
            <Clock size={12} />
            <span>{podcast.duration || '30 min'}</span>
          </span>
        </div>

        {podcast.audio_url ? (
          <button
            type="button"
            className={`podcast-play-btn font-mono ${isPlayingThis ? 'playing' : ''}`}
            onClick={handlePlayToggle}
            aria-label={isPlayingThis ? `Pause ${podcast.title}` : `Play ${podcast.title}`}
          >
            {isPlayingThis ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
            <span>{isPlayingThis ? 'PAUSE' : 'PLAY EPISODE'}</span>
          </button>
        ) : (
          <span className="podcast-offline-tag font-mono">ARCHIVED RECORDING</span>
        )}
      </div>
    </div>
  );
}
