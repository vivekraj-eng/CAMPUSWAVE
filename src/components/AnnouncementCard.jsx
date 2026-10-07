import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import './AnnouncementCard.css';

/**
 * AnnouncementCard Component
 * Displays an official station bulletin with category, date, excerpt, and link to detail view.
 * Only published announcements are rendered.
 */
export default function AnnouncementCard({ announcement }) {
  if (!announcement) return null;

  const isImportant = announcement.category?.toLowerCase() === 'important';

  const formattedDate = announcement.date
    ? new Date(announcement.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : null;

  return (
    <article className={`radio-card announcement-card ${isImportant ? 'is-important' : ''}`}>
      {announcement.image_url && (
        <div className="announcement-image-wrap">
          <Link to={`/announcements/${announcement.id}`} tabIndex={-1} aria-hidden="true">
            <img src={announcement.image_url} alt={announcement.title} className="announcement-img" />
          </Link>
        </div>
      )}

      <div className="announcement-content-wrap">
        <div className="announcement-top-bar font-mono">
          <span className={`announcement-category-pill ${isImportant ? 'pill-important' : ''}`}>
            {isImportant && <AlertCircle size={11} />}
            {announcement.category || 'Campus'}
          </span>

          <div className="announcement-meta-right">
            {formattedDate && (
              <span className="announcement-date">
                <Calendar size={12} />
                <time dateTime={announcement.date}>{formattedDate}</time>
              </span>
            )}
            <span className="announcement-published-tag" title="Official Published Notice">
              <CheckCircle2 size={11} />
              <span>OFFICIAL</span>
            </span>
          </div>
        </div>

        <Link to={`/announcements/${announcement.id}`} className="announcement-title-link">
          <h3 className="announcement-title font-display">{announcement.title}</h3>
        </Link>

        <p className="announcement-body">
          {announcement.content}
        </p>

        <div className="announcement-card-footer">
          <Link
            to={`/announcements/${announcement.id}`}
            className="announcement-read-btn font-mono"
            aria-label={`Read full announcement: ${announcement.title}`}
          >
            <span>READ FULL NOTICE</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
}
