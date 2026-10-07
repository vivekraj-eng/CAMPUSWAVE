import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, Clock, Tag, ExternalLink } from 'lucide-react';
import EmptyState from '../EmptyState';

/**
 * MyShowsCard
 * Displays only broadcast programs assigned to the authenticated Radio Jockey.
 * Strictly uses real database show records — never invents fake shows.
 */
export default function MyShowsCard({ shows = [] }) {
  return (
    <div className="radio-card rj-card my-shows-card" id="rj-shows-section">
      <div className="dash-card-header font-mono">
        <div className="dash-header-title">
          <Radio size={16} />
          <span>ASSIGNED SHOWS</span>
          {shows.length > 0 && <span className="dash-count-badge font-mono">{shows.length}</span>}
        </div>
        <Link to="/shows" className="dash-header-action font-mono">
          <span>Public Catalog</span>
          <ExternalLink size={13} />
        </Link>
      </div>

      {shows.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No shows assigned yet"
          description="You do not have any radio programs assigned to your host profile yet. Broadcast slots are rostered by Station Directors."
        />
      ) : (
        <div className="rj-shows-grid">
          {shows.map((show) => (
            <div key={show.id} className="rj-show-item">
              <div className="rj-show-cover-box">
                {show.cover_image ? (
                  <img
                    src={show.cover_image}
                    alt={show.title}
                    className="rj-show-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="rj-show-placeholder-art">
                    <Radio size={24} />
                  </div>
                )}
                <span className="rj-show-badge font-mono">
                  {show.is_active ? 'ACTIVE PROGRAM' : 'STANDBY'}
                </span>
              </div>

              <div className="rj-show-details">
                <div className="rj-show-top-meta font-mono">
                  <span className="rj-show-category">
                    <Tag size={11} />
                    <span>{show.category || 'General'}</span>
                  </span>
                  {show.schedule_time && (
                    <span className="rj-show-time">
                      <Clock size={11} />
                      <span>{show.schedule_time}</span>
                    </span>
                  )}
                </div>

                <h3 className="rj-show-title font-display">{show.title}</h3>
                {show.tagline && <p className="rj-show-tagline font-mono">"{show.tagline}"</p>}
                {show.description && <p className="rj-show-desc">{show.description}</p>}

                <div className="rj-show-footer">
                  <Link
                    to={`/shows/${show.id}`}
                    className="btn-outline-purple font-mono btn-compact"
                  >
                    <span>View Public Page</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
