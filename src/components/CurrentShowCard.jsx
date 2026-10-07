import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, User, Clock, Tag, Play } from 'lucide-react';
import './CurrentShowCard.css';

/**
 * CurrentShowCard Component
 * Displays the currently broadcasting show slot or "STATION OFFLINE" status.
 * Strictly adheres to the rule: NO FAKE PRODUCTION DATA.
 */
export default function CurrentShowCard({ currentShow, isLive = false }) {
  if (isLive && currentShow) {
    return (
      <div className="current-show-card on-air">
        <div className="current-show-header font-mono">
          <div className="on-air-pill">
            <span className="live-dot" />
            <span>ON AIR NOW</span>
          </div>
          <span className="station-dial">104.2 FM • LIVE</span>
        </div>

        <div className="current-show-body">
          <h3 className="current-show-title font-display">{currentShow.title || currentShow.show_title}</h3>
          
          <div className="current-show-meta font-mono">
            {(currentShow.host || currentShow.rj_name) && (
              <div className="meta-row-item">
                <User size={13} className="meta-icon" />
                <span>RJ: {currentShow.host || currentShow.rj_name}</span>
              </div>
            )}
            {currentShow.category && (
              <div className="meta-row-item">
                <Tag size={13} className="meta-icon" />
                <span>CATEGORY: {currentShow.category}</span>
              </div>
            )}
            {(currentShow.time || (currentShow.start_time && currentShow.end_time)) && (
              <div className="meta-row-item">
                <Clock size={13} className="meta-icon" />
                <span>TIME: {currentShow.time || `${currentShow.start_time} - ${currentShow.end_time}`}</span>
              </div>
            )}
          </div>
        </div>

        <div className="current-show-actions">
          <Link to="/live" className="tune-in-btn font-mono">
            <Play size={13} fill="currentColor" />
            <span>TUNE IN LIVE</span>
          </Link>
        </div>
      </div>
    );
  }

  // Graceful Offline / Standby State (No fake shows or made up information)
  return (
    <div className="current-show-card offline">
      <div className="current-show-header font-mono">
        <div className="offline-pill">
          <span className="offline-dot" />
          <span>STATION OFFLINE</span>
        </div>
        <span className="station-dial">104.2 FM • STANDBY</span>
      </div>

      <div className="current-show-body">
        <h3 className="current-show-title font-display">Campus Broadcast Standby</h3>
        <p className="current-show-desc">
          There is no live show transmitting from the studio right now. Check the weekly schedule for upcoming broadcast timeslots.
        </p>
      </div>

      <div className="current-show-actions">
        <Link to="/schedule" className="btn-secondary font-mono">
          <span>VIEW SCHEDULE</span>
        </Link>
      </div>
    </div>
  );
}
