import React from 'react';
import { motion } from 'framer-motion';
import LivePlayer from '../components/LivePlayer';
import './LivePage.css';

export default function LivePage() {
  return (
    <div className="live-page-layout">
      <div className="container live-page-container">
        {/* Broadcast Studio Header */}
        <motion.div
          className="live-broadcast-header"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="live-header-meta font-mono">
            <span className="live-eyebrow">LIVE BROADCAST STUDIO</span>
            <span className="live-meta-divider">•</span>
            <span className="live-dial">104.2 FM • CAMPUSWAVE</span>
          </div>

          <h1 className="live-headline font-display">Live Radio Stream</h1>

          <p className="live-subtext">
            Streaming direct from the student broadcast console. Tune into ongoing live segments, participate via song requests and shout-outs, or explore the studio console.
          </p>
        </motion.div>

        {/* Central Broadcast Console Player */}
        <LivePlayer />
      </div>
    </div>
  );
}
