import React, { useState, useEffect, useMemo } from 'react';
import { Search, Bell, AlertCircle } from 'lucide-react';
import AnnouncementCard from '../components/AnnouncementCard';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { announcementService } from '../services/announcement-service';

// Standard announcement categories
const CANDIDATE_CATEGORIES = ['ALL', 'CAMPUS', 'CAMPUSWAVE', 'CLUB', 'IMPORTANT', 'EVENT'];

export default function AnnouncementsPage() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [allAnnouncements, setAllAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      // getAnnouncements only returns published announcements (status = 'published')
      const data = await announcementService.getAnnouncements(null, '');
      setAllAnnouncements(data || []);
    } catch (err) {
      console.warn('Announcements error:', err);
      setError('Something went wrong while loading this content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // Compute categories dynamically: Only show categories that actually have published content
  const visibleCategories = useMemo(() => {
    const presentCategories = new Set();

    allAnnouncements.forEach((item) => {
      if (item.category) {
        presentCategories.add(item.category.trim().toUpperCase());
      }
    });

    const list = ['ALL'];
    CANDIDATE_CATEGORIES.forEach((cand) => {
      if (cand !== 'ALL') {
        const match = Array.from(presentCategories).some(
          (c) => c === cand || c.includes(cand) || cand.includes(c)
        );
        if (match && !list.includes(cand)) {
          list.push(cand);
        }
      }
    });

    // Also include any other custom categories from database
    presentCategories.forEach((cat) => {
      const alreadyCovered = list.some((c) => c === cat || cat.includes(c));
      if (!alreadyCovered && !list.includes(cat)) {
        list.push(cat);
      }
    });

    return list;
  }, [allAnnouncements]);

  // Keep selection valid
  useEffect(() => {
    if (selectedCategory !== 'ALL' && !visibleCategories.includes(selectedCategory)) {
      setSelectedCategory('ALL');
    }
  }, [visibleCategories, selectedCategory]);

  // Filtering by category and search (title, content, category)
  const filteredAnnouncements = useMemo(() => {
    let result = allAnnouncements;

    if (selectedCategory !== 'ALL') {
      result = result.filter((item) => {
        const itemCat = (item.category || '').toUpperCase();
        return itemCat === selectedCategory || itemCat.includes(selectedCategory);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        const titleMatch = item.title?.toLowerCase().includes(q);
        const contentMatch = item.content?.toLowerCase().includes(q);
        const catMatch = item.category?.toLowerCase().includes(q);
        return titleMatch || contentMatch || catMatch;
      });
    }

    return result;
  }, [allAnnouncements, selectedCategory, searchQuery]);

  return (
    <div className="announcements-page-layout">
      <div className="container">
        {/* Header */}
        <div className="section-masthead">
          <div className="section-eyebrow">
            <span className="section-eyebrow-line" />
            <span>CAMPUS DISPATCHES</span>
          </div>
          <h1 className="section-title">ANNOUNCEMENTS</h1>
          <p className="section-subtitle">
            Stay informed with official notices, broadcast updates, recruitment calls, and student announcements from CampusWave.
          </p>
        </div>

        {/* Filters & Search Bar */}
        <div className="announcements-controls-bar">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by title, content, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input font-mono"
            />
          </div>

          {/* Only display categories that actually have content */}
          {visibleCategories.length > 1 && (
            <div className="category-chips font-mono">
              {visibleCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Area */}
        {loading ? (
          <LoadingState message="Loading announcements..." />
        ) : error ? (
          <ErrorState
            title="Something went wrong while loading this content."
            description="We were unable to retrieve the latest announcements. Please check your network connection and retry."
            onRetry={loadAnnouncements}
          />
        ) : filteredAnnouncements.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={searchQuery || selectedCategory !== 'ALL' ? 'No Announcements Found' : 'No announcements available.'}
            description={
              searchQuery || selectedCategory !== 'ALL'
                ? 'No dispatches match the selected search or category filters.'
                : 'There are currently no active public announcements published by the station.'
            }
          />
        ) : (
          <div className="announcements-grid">
            {filteredAnnouncements.map((ann) => (
              <AnnouncementCard key={ann.id} announcement={ann} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .announcements-page-layout {
          padding: 44px 0 80px;
        }
        .announcements-controls-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .search-input-wrap {
          position: relative;
          width: 360px;
          max-width: 100%;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }
        .search-input {
          width: 100%;
          background: rgba(16, 21, 34, 0.85);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 10px 14px 10px 42px;
          font-size: 0.85rem;
          color: #FFFFFF;
          outline: none;
          transition: all var(--transition-fast);
        }
        .search-input:focus {
          border-color: var(--accent-purple);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
        }
        .category-chips {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          max-width: 100%;
          padding-bottom: 4px;
        }
        .category-chip {
          padding: 6px 14px;
          border-radius: var(--radius-full);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--text-secondary);
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }
        .category-chip:hover {
          color: #FFFFFF;
          border-color: var(--border-medium);
        }
        .category-chip.active {
          background: var(--accent-purple);
          color: #FFFFFF;
          border-color: var(--accent-purple);
          box-shadow: 0 2px 10px rgba(139, 92, 246, 0.35);
        }
        .announcements-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 24px;
        }
        @media (max-width: 768px) {
          .search-input-wrap {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
