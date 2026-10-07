import React from 'react';
import { Calendar, Radio, RefreshCw } from 'lucide-react';
import BrandLogo from './BrandLogo';
import './OfflineState.css';

export default function OfflineState({ upNextBroadcast, onRetry = null, onScheduleClick = null }) {
  return (
    <div className="offline-state-view">
      <div className="offline-badge-pill font-mono">
        <span className="offline-dot" />
        <span>RADIO OFFLINE</span>
      </div>

      <div className="offline-logo-container">
        <BrandLogo variant="compact" size={96} className="offline-logo-muted" />
      </div>

      <h2 className="offline-headline font-display">Campus Wave Is Currently Off Air</h2>
      <p className="offline-subtext">
        The studio transmission is currently silent between scheduled broadcasts.
        Live programming broadcasts directly from our student station during active timetable sessions.
      </p>

      {upNextBroadcast ? (
        <div className="offline-upnext-banner">
          <span className="upnext-label font-mono">NEXT BROADCAST</span>
          <h3 className="upnext-name font-display">{upNextBroadcast.title}</h3>
          <p className="upnext-details font-mono">
            {upNextBroadcast.host ? `With ${upNextBroadcast.host} • ` : ''}
            {upNextBroadcast.startTime} — {upNextBroadcast.endTime}
          </p>
        </div>
      ) : null}

      <div className="offline-button-row">
        {onScheduleClick ? (
          <button type="button" className="btn-secondary" onClick={onScheduleClick}>
            <Calendar size={15} />
            <span>View Schedule</span>
          </button>
        ) : (
          <a href="#schedule" className="btn-secondary">
            <Calendar size={15} />
            <span>View Schedule</span>
          </a>
        )}

        {onRetry && (
          <button type="button" className="btn-primary" onClick={onRetry}>
            <RefreshCw size={15} />
            <span>Check Feed</span>
          </button>
        )}
      </div>
    </div>
  );
}
