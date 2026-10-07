import React from 'react';

/**
 * DashboardSkeleton
 * Subtle skeleton placeholder shown while student personal records are loading.
 */
export default function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton-container" aria-busy="true" aria-label="Loading student dashboard">
      {/* Banner Skeleton */}
      <div className="radio-card skeleton-banner">
        <div className="skeleton-avatar skeleton-box" />
        <div className="skeleton-text-group">
          <div className="skeleton-line skeleton-box w-25" />
          <div className="skeleton-line skeleton-box w-60 h-lg" />
          <div className="skeleton-line skeleton-box w-40" />
        </div>
      </div>

      {/* Grid Cards Skeleton */}
      <div className="skeleton-cards-grid">
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
