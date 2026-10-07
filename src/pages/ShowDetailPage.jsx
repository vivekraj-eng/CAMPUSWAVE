import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Radio, Calendar, Clock, User, Play, Headphones, Disc } from 'lucide-react';
import { showService } from '../services/show-service';
import PodcastCard from '../components/PodcastCard';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import './ShowDetailPage.css';

export default function ShowDetailPage() {
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchShowData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [showData, epsData] = await Promise.all([
        showService.getShowById(id),
        showService.getShowEpisodes(id)
      ]);

      if (!showData) {
        setError('Show not found.');
      } else {
        setShow(showData);
        setEpisodes(epsData || []);
      }
    } catch (err) {
      console.warn('Error loading show detail:', err);
      setError('Something went wrong while loading this show.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowData();
  }, [id]);

  if (loading) {
    return (
      <div className="container show-detail-container">
        <LoadingState message="Loading show details..." />
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="container show-detail-container">
        <Link to="/shows" className="detail-back-link font-mono">
          <ArrowLeft size={14} />
          <span>BACK TO ALL SHOWS</span>
        </Link>
        <ErrorState
          title="Show Not Found"
          description={error || "The requested broadcast show could not be found or is inactive."}
          onRetry={fetchShowData}
        />
      </div>
    );
  }

  return (
    <div className="show-detail-layout">
      <div className="container show-detail-container">
        {/* Navigation Breadcrumb / Back Link */}
        <div className="detail-header-nav">
          <Link to="/shows" className="detail-back-link font-mono">
            <ArrowLeft size={14} />
            <span>ALL SHOWS & PODCASTS</span>
          </Link>
          <span className="detail-crumb-sep font-mono">/</span>
          <span className="detail-crumb-current font-mono">{show.title}</span>
        </div>

        {/* Hero Banner Area */}
        <div className="show-hero-card">
          {show.cover_image ? (
            <div className="show-hero-image-wrap">
              <img src={show.cover_image} alt={show.title} className="show-hero-img" />
            </div>
          ) : (
            <div className="show-hero-placeholder">
              <Radio size={54} />
            </div>
          )}

          <div className="show-hero-content">
            <div className="show-hero-pills font-mono">
              <span className="category-pill">{show.category || 'General'}</span>
              <span className="status-pill font-mono">BROADCAST PROGRAM</span>
            </div>

            <h1 className="show-hero-title font-display">{show.title}</h1>
            {show.tagline && <p className="show-hero-tagline font-mono">{show.tagline}</p>}

            <div className="show-hero-meta font-mono">
              <div className="meta-badge">
                <User size={13} className="badge-icon" />
                <span>HOST: {show.host_name}</span>
              </div>
              {show.schedule_time && (
                <div className="meta-badge">
                  <Clock size={13} className="badge-icon" />
                  <span>SLOT: {show.schedule_time}</span>
                </div>
              )}
            </div>

            <p className="show-hero-description">{show.description}</p>

            <div className="show-hero-actions font-mono">
              <Link to="/live" className="btn-primary">
                <Play size={14} fill="currentColor" />
                <span>TUNE INTO LIVE STUDIO</span>
              </Link>
              <Link to="/schedule" className="btn-secondary">
                <Calendar size={14} />
                <span>VIEW SCHEDULE TIME</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Episodes & Archive Section */}
        <div className="show-episodes-section">
          <div className="section-masthead">
            <div className="section-eyebrow">
              <span className="section-eyebrow-line" />
              <span>RECORDED ARCHIVES</span>
            </div>
            <h2 className="section-title">Episodes of {show.title}</h2>
            <p className="section-subtitle">
              On-demand recordings and podcast segments from this broadcast show.
            </p>
          </div>

          {episodes.length === 0 ? (
            <EmptyState
              icon={Headphones}
              title="No Recorded Episodes Yet"
              description={`There are currently no published episodes for "${show.title}". Live segments air according to the station schedule.`}
            />
          ) : (
            <div className="episodes-grid">
              {episodes.map((ep) => (
                <PodcastCard key={ep.id} podcast={ep} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
