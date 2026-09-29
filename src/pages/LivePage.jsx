import React from 'react';
import { Radio } from 'lucide-react';
import LivePlayer from '../components/LivePlayer';
import SchedulePreview from '../components/SchedulePreview';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import './LivePage.css';

export default function LivePage() {
  const { state } = useAudioPlayer();

  return (
    <div className="live-page-layout">
      <div className="container live-page-container">
        {/* Top Channel Identity */}
        <div className="live-studio-header">
          <div className="live-studio-left">
            <div className="studio-carrier-badge font-mono">
              <Radio size={14} className="carrier-badge-icon" />
              <span>104.2 FM • DIGITAL BROADCAST TRANSMITTER</span>
            </div>
            <h1 className="studio-main-title font-display">Campus Wave Studio</h1>
            <p className="studio-sub-desc">
              Dedicated student transmission hub. Streaming live campus discourse, eclectic audio sets, and college frequencies.
            </p>
          </div>

          <div className="live-studio-right font-mono">
            {state === 'live' ? (
              <div className="live-stream-status-pill pill-live">
                <span className="dot dot-live" />
                <span>CONNECTED • LIVE FEED</span>
              </div>
            ) : state === 'connecting' ? (
              <div className="live-stream-status-pill pill-connecting">
                <span className="dot dot-connecting" />
                <span>TUNING IN...</span>
              </div>
            ) : (
              <div className="live-stream-status-pill pill-offline">
                <span className="dot dot-offline" />
                <span>CARRIER STANDBY • OFFLINE</span>
              </div>
            )}
          </div>
        </div>

        {/* Central Live Radio Experience */}
        <LivePlayer />

        {/* Transmission Schedule Timeline */}
        <div className="live-schedule-anchor" id="schedule">
          <SchedulePreview />
        </div>
      </div>
    </div>
  );
}
