import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, AlertCircle, CheckCircle2, Share2, Bell } from 'lucide-react';
import { announcementService } from '../services/announcement-service';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import './AnnouncementDetailPage.css';

export default function AnnouncementDetailPage() {
  const { id } = useParams();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchAnnouncement = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await announcementService.getAnnouncementById(id);
      if (!data) {
        setError('Announcement not found or has been archived.');
      } else {
        setAnnouncement(data);
      }
    } catch (err) {
      console.warn('Error loading announcement:', err);
      setError('Something went wrong while loading this content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncement();
  }, [id]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="container announcement-detail-container">
        <LoadingState message="Loading announcement..." />
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="container announcement-detail-container">
        <Link to="/announcements" className="detail-back-link font-mono">
          <ArrowLeft size={14} />
          <span>BACK TO ALL ANNOUNCEMENTS</span>
        </Link>
        <ErrorState
          title="Announcement Not Found"
          description={error || "The requested notice does not exist or has been removed."}
          onRetry={fetchAnnouncement}
        />
      </div>
    );
  }

  const isImportant = announcement.category?.toLowerCase() === 'important';
  const formattedDate = announcement.date
    ? new Date(announcement.date).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : null;

  return (
    <div className="announcement-detail-layout">
      <div className="container announcement-detail-container">
        {/* Navigation Breadcrumb */}
        <div className="detail-header-nav">
          <Link to="/announcements" className="detail-back-link font-mono">
            <ArrowLeft size={14} />
            <span>ALL ANNOUNCEMENTS</span>
          </Link>
          <span className="detail-crumb-sep font-mono">/</span>
          <span className="detail-crumb-current font-mono">{announcement.title}</span>
        </div>

        {/* Main Article Container */}
        <article className={`announcement-full-article ${isImportant ? 'article-important' : ''}`}>
          {/* Header Metadata */}
          <header className="article-header">
            <div className="article-meta-top font-mono">
              <span className={`category-pill ${isImportant ? 'pill-important' : ''}`}>
                {isImportant && <AlertCircle size={12} />}
                {announcement.category || 'Campus'}
              </span>

              <div className="article-badges">
                {formattedDate && (
                  <span className="article-date">
                    <Calendar size={13} />
                    <time dateTime={announcement.date}>{formattedDate}</time>
                  </span>
                )}
                <span className="article-official-badge">
                  <CheckCircle2 size={12} />
                  <span>OFFICIAL STATION DISPATCH</span>
                </span>
              </div>
            </div>

            <h1 className="article-title font-display">{announcement.title}</h1>
          </header>

          {/* Optional Hero Image */}
          {announcement.image_url && (
            <div className="article-image-wrap">
              <img src={announcement.image_url} alt={announcement.title} className="article-img" />
            </div>
          )}

          {/* Full Body Text */}
          <div className="article-body">
            {announcement.content.split('\n\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          {/* Article Footer & Actions */}
          <footer className="article-footer font-mono">
            <button
              type="button"
              onClick={handleShare}
              className="article-share-btn"
              aria-label="Copy link to announcement"
            >
              <Share2 size={14} />
              <span>{copied ? 'LINK COPIED!' : 'SHARE NOTICE'}</span>
            </button>

            <Link to="/announcements" className="article-return-link">
              <span>RETURN TO ANNOUNCEMENTS</span>
            </Link>
          </footer>
        </article>
      </div>
    </div>
  );
}
