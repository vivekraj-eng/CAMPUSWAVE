import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import './ErrorState.css';

/**
 * ErrorState Component
 * Displays a student-friendly error message with a retry action
 * without exposing raw database errors.
 */
export default function ErrorState({
  title = 'Something went wrong while loading this content.',
  description = 'We encountered an unexpected issue connecting to the station network. Please try refreshing.',
  message,
  onRetry = null,
  className = ''
}) {
  const descText = message || description;

  return (
    <div className={`error-state-card ${className}`} role="alert">
      <div className="error-state-icon">
        <AlertCircle size={28} />
      </div>
      <h3 className="error-state-title font-display">{title}</h3>
      <p className="error-state-desc">{descText}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="error-retry-btn font-mono"
          aria-label="Retry loading content"
        >
          <RefreshCw size={14} />
          <span>RETRY CONNECTION</span>
        </button>
      )}
    </div>
  );
}
