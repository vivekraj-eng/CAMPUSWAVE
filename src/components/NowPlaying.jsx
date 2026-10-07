import React from 'react';
import { Music, Radio, Disc, User } from 'lucide-react';
import './NowPlaying.css';

/**
 * NowPlaying Component
 * 
 * Displays live track & program metadata when transmitting.
 * When metadata is not available: shows "CAMPUSWAVE RADIO / Waiting for broadcast metadata...".
 * Never fabricates or fakes song titles or artists.
 */
export default function NowPlaying({
  track,
  artist,
  show,
  rj,
  artwork,
  isLive = false
}) {
  const hasTrackInfo = Boolean(track);

  return (
    <div className={`now-playing-card ${hasTrackInfo ? 'has-track' : 'standby'}`}>
      <div className="now-playing-header font-mono">
        <div className="now-playing-label">
          <Disc size={13} className={isLive && hasTrackInfo ? 'spinning-disc' : ''} />
          <span>NOW PLAYING</span>
        </div>
        <span className="now-playing-badge font-mono">104.2 FM • STEREO</span>
      </div>

      <div className="now-playing-content">
        {artwork ? (
          <div className="track-artwork-wrap">
            <img src={artwork} alt={track || 'Broadcast Artwork'} className="track-artwork-img" />
          </div>
        ) : (
          <div className="track-artwork-placeholder">
            <Music size={26} className="artwork-icon" />
          </div>
        )}

        <div className="track-details">
          {hasTrackInfo ? (
            <>
              <h3 className="track-title font-display">{track}</h3>
              {artist && <div className="track-artist font-mono">{artist}</div>}
              {(show || rj) && (
                <div className="track-broadcast-source font-mono">
                  {show && <span className="source-show">{show}</span>}
                  {show && rj && <span className="source-bullet">•</span>}
                  {rj && (
                    <span className="source-rj">
                      <User size={11} style={{ display: 'inline', marginRight: 4 }} />
                      {rj}
                    </span>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <h3 className="track-title font-display">CAMPUSWAVE RADIO</h3>
              <p className="track-waiting-msg font-mono">
                Waiting for broadcast metadata...
              </p>
              {show && (
                <div className="track-broadcast-source font-mono">
                  <span className="source-show">Show: {show}</span>
                  {rj && <span className="source-bullet">• RJ: {rj}</span>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
