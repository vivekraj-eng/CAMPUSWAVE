import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, Music2, MessageSquare, Mic, Calendar, ExternalLink } from 'lucide-react';

/**
 * RjQuickActions
 * Broadcast studio shortcuts for on-air Radio Jockeys.
 */
export default function RjQuickActions({ onSwitchTab }) {
  const internalShortcuts = [
    {
      title: 'Review Track Requests',
      desc: 'Moderate live song queue',
      tab: 'requests',
      icon: Music2
    },
    {
      title: 'Studio Shout-outs',
      desc: 'Read dedications on air',
      tab: 'shoutouts',
      icon: MessageSquare
    },
    {
      title: 'Podcast Catalog',
      desc: 'Publish or edit episodes',
      tab: 'podcasts',
      icon: Mic
    },
    {
      title: 'Assigned Schedule',
      desc: 'Weekly broadcast timetable',
      tab: 'schedule',
      icon: Calendar
    }
  ];

  return (
    <div className="radio-card rj-card rj-quick-actions-card">
      <div className="dash-card-header font-mono">
        <div className="dash-header-title">
          <span>STUDIO DESK SHORTCUTS</span>
        </div>
      </div>

      <div className="rj-shortcuts-grid">
        {internalShortcuts.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              type="button"
              className="rj-shortcut-tile"
              onClick={() => onSwitchTab(item.tab)}
            >
              <div className="tile-icon-frame">
                <Icon size={18} />
              </div>
              <div className="tile-text-frame">
                <div className="tile-heading font-display">{item.title}</div>
                <div className="tile-sub font-mono">{item.desc}</div>
              </div>
            </button>
          );
        })}

        <Link to="/live" className="rj-shortcut-tile live-tune">
          <div className="tile-icon-frame live">
            <Radio size={18} />
          </div>
          <div className="tile-text-frame">
            <div className="tile-heading font-display">
              <span>Live Transmission</span>
              <ExternalLink size={12} />
            </div>
            <div className="tile-sub font-mono">Monitor 104.2 FM Stream</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
