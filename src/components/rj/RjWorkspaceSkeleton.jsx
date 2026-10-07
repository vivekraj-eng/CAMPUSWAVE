import React from 'react';

/**
 * RjWorkspaceSkeleton
 * Shimmering placeholder blocks displayed while RJ studio workspace data is loading.
 */
export default function RjWorkspaceSkeleton() {
  return (
    <div className="rj-skeleton-wrap" aria-busy="true" aria-label="Loading RJ workspace">
      <div className="radio-card skeleton-banner">
        <div className="skeleton-avatar skeleton-box" />
        <div className="skeleton-text-group">
          <div className="skeleton-line skeleton-box w-25" />
          <div className="skeleton-line skeleton-box w-60 h-lg" />
          <div className="skeleton-line skeleton-box w-40" />
        </div>
      </div>

      <div className="rj-skeleton-grid">
        <div className="radio-card skeleton-card">
          <div className="skeleton-line skeleton-box w-35" />
          <div className="skeleton-box skeleton-row" />
          <div className="skeleton-box skeleton-row" />
        </div>
        <div className="radio-card skeleton-card">
          <div className="skeleton-line skeleton-box w-35" />
          <div className="skeleton-box skeleton-row" />
          <div className="skeleton-box skeleton-row" />
        </div>
      </div>
    </div>
  );
}
