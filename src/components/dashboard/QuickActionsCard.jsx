import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, Music2, MessageSquare, Calendar, Award, ArrowUpRight } from 'lucide-react';

/**
 * QuickActionsCard
 * Accessible quick shortcuts for student listeners.
 * Strictly public/student actions only — no RJ/Admin functions.
 */
export default function QuickActionsCard() {
  const actions = [
    {
      title: 'Tune In Live',
      desc: '104.2 FM Broadcast',
      to: '/live',
      icon: Radio,
      variant: 'live'
    },
    {
      title: 'Make a Request',
      desc: 'Submit track to RJ',
      to: '/requests?tab=song',
      icon: Music2,
      variant: 'default'
    },
    {
      title: 'Send a Shout-out',
      desc: 'Dedicate an on-air note',
      to: '/requests?tab=shoutout',
      icon: MessageSquare,
      variant: 'default'
    },
    {
      title: 'Explore Events',
      desc: 'Campus workshops & gigs',
      to: '/events',
      icon: Calendar,
      variant: 'default'
    },
    {
      title: 'Join CampusWave',
      desc: 'Become team crew',
      to: '/join',
      icon: Award,
      variant: 'default'
    }
  ];

  return (
    <div className="radio-card dashboard-card quick-actions-card">
      <div className="dash-card-header font-mono">
        <div className="dash-header-title">
          <span>STATION SHORTCUTS</span>
        </div>
      </div>

      <div className="quick-actions-grid">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.title}
              to={act.to}
              className={`quick-action-tile ${act.variant}`}
            >
              <div className="tile-icon-wrap">
                <Icon size={18} />
              </div>
              <div className="tile-text-wrap">
                <div className="tile-title font-display">
                  <span>{act.title}</span>
                  <ArrowUpRight size={13} className="tile-arrow" />
                </div>
                <div className="tile-desc font-mono">{act.desc}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
