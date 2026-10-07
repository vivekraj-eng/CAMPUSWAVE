import React, { useState, useEffect, useMemo } from 'react';
import { Search, Radio, Headphones } from 'lucide-react';
import ShowCard from '../components/ShowCard';
import PodcastCard from '../components/PodcastCard';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { showService } from '../services/show-service';
import { podcastService } from '../services/podcast-service';

// Standard candidate category taxonomy
const CANDIDATE_CATEGORIES = ['All', 'Music', 'Talk', 'Culture', 'Campus', 'Special'];

export default function ShowsPage() {
  const [activeTab, setActiveTab] = useState('shows'); // 'shows' | 'podcasts'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [allShows, setAllShows] = useState([]);
  const [allPodcasts, setAllPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [showsRes, podcastsRes] = await Promise.all([
        showService.getShows(null, ''),
        podcastService.getPodcasts(null, '')
      ]);
      setAllShows(showsRes || []);
      setAllPodcasts(podcastsRes || []);
    } catch (err) {
      console.warn('Shows load error:', err);
      setError('Something went wrong while loading this content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Active catalog based on tab
  const currentCatalog = activeTab === 'shows' ? allShows : allPodcasts;

  // Rule: Only display categories that actually have content
  const visibleCategories = useMemo(() => {
    const presentCategories = new Set();

    currentCatalog.forEach((item) => {
      if (item.category) {
        presentCategories.add(item.category.trim());
      }
    });

    const list = ['All'];
    CANDIDATE_CATEGORIES.forEach((cand) => {
      if (cand !== 'All') {
        const exists = Array.from(presentCategories).some(
          (c) => c.toLowerCase() === cand.toLowerCase() || c.toLowerCase().includes(cand.toLowerCase())
        );
        if (exists && !list.includes(cand)) {
          list.push(cand);
        }
      }
    });

    // Also include any other unique categories from database if not covered
    presentCategories.forEach((cat) => {
      const alreadyCovered = list.some((c) => c.toLowerCase() === cat.toLowerCase());
      if (!alreadyCovered && !list.includes(cat)) {
        list.push(cat);
      }
    });

    return list;
  }, [currentCatalog]);

  // Keep selection valid if tab changes
  useEffect(() => {
    if (selectedCategory !== 'All' && !visibleCategories.includes(selectedCategory)) {
      setSelectedCategory('All');
    }
  }, [visibleCategories, selectedCategory]);

  // Filter items by category and search (show name, episode title, RJ name)
  const filteredItems = useMemo(() => {
    let result = currentCatalog;

    if (selectedCategory !== 'All') {
      result = result.filter((item) => {
        const itemCat = (item.category || '').toLowerCase();
        return itemCat === selectedCategory.toLowerCase() || itemCat.includes(selectedCategory.toLowerCase());
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        const titleMatch = item.title?.toLowerCase().includes(q);
        const episodeMatch = item.episode_title?.toLowerCase().includes(q);
        const rjMatch = (item.host_name || item.rj_name)?.toLowerCase().includes(q);
        return titleMatch || episodeMatch || rjMatch;
      });
    }

    return result;
  }, [currentCatalog, selectedCategory, searchQuery]);

  return (
    <div className="shows-page-layout">
      <div className="container">
        {/* Top Section */}
        <div className="section-masthead">
          <div className="section-eyebrow">
            <span className="section-eyebrow-line" />
            <span>DISCOVER PROGRAMMING</span>
          </div>
          <h1 className="section-title">SHOWS & PODCASTS</h1>
          <p className="section-subtitle">
            Discover the voices, conversations and stories coming from CampusWave.
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div className="shows-view-toggle tabs-header" role="tablist" aria-label="Content Selection">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'shows'}
            className={`tab-btn ${activeTab === 'shows' ? 'active' : ''}`}
            onClick={() => setActiveTab('shows')}
          >
            <Radio size={14} style={{ display: 'inline', marginRight: 6 }} />
            Broadcast Shows ({allShows.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'podcasts'}
            className={`tab-btn ${activeTab === 'podcasts' ? 'active' : ''}`}
            onClick={() => setActiveTab('podcasts')}
          >
            <Headphones size={14} style={{ display: 'inline', marginRight: 6 }} />
            Podcasts & Recordings ({allPodcasts.length})
          </button>
        </div>

        {/* Search & Dynamic Category Filters Bar */}
        <div className="shows-controls-bar">
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder={`Search by show name, episode title, or RJ...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input font-mono"
              aria-label="Search shows and episodes"
            />
          </div>

          {/* Only display categories that actually have content */}
          {visibleCategories.length > 1 && (
            <div className="category-chips font-mono" role="group" aria-label="Category Filters">
              {visibleCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                  aria-pressed={selectedCategory === cat}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Display */}
        {loading ? (
          <LoadingState message="Loading shows..." />
        ) : error ? (
          <ErrorState
            title="Something went wrong while loading this content."
            description="We were unable to load the station broadcast catalog. Please try refreshing."
            onRetry={loadData}
          />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={activeTab === 'shows' ? Radio : Headphones}
            title="No shows or episodes found."
            description={
              searchQuery || selectedCategory !== 'All'
                ? 'No broadcast shows or episodes match your search query.'
                : activeTab === 'shows'
                ? 'No shows available yet.'
                : 'No podcast episodes available yet.'
            }
          />
        ) : activeTab === 'shows' ? (
          <div className="shows-grid">
            {filteredItems.map((show) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>
        ) : (
          <div className="podcasts-grid">
            {filteredItems.map((pod) => (
              <PodcastCard key={pod.id} podcast={pod} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .shows-page-layout {
          padding: 44px 0 80px;
        }
        .shows-controls-bar {
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
        .shows-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }
        .podcasts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 20px;
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
