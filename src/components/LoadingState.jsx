import React from 'react';
import Logo from './Logo';
import './LoadingState.css';

export default function LoadingState({ message = 'Connecting to Campus Wave stream...' }) {
  return (
    <div className="loading-state-view">
      <div className="loading-badge-pill font-mono">
        <span className="loading-dot" />
        <span>CONNECTING</span>
      </div>

      <div className="loading-spinner-wrapper">
        <div className="loading-spinner-ring" />
        <Logo size={90} className="loading-logo" />
      </div>

      <h2 className="loading-headline font-display">CONNECTING TO CAMPUS WAVE</h2>
      <p className="loading-subtext">{message}</p>

      <div className="loading-progress-track">
        <div className="loading-progress-bar" />
      </div>
    </div>
  );
}
