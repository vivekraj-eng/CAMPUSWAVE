import React from 'react';
import './AdminSkeleton.css';

export default function AdminSkeleton() {
  return (
    <div className="admin-skeleton-wrap" aria-label="Loading station workspace">
      <div className="skeleton-bar header-skeleton" />
      <div className="skeleton-grid">
        <div className="skeleton-card skeleton-stat" />
        <div className="skeleton-card skeleton-stat" />
        <div className="skeleton-card skeleton-stat" />
      </div>
      <div className="skeleton-card skeleton-table" />
    </div>
  );
}
