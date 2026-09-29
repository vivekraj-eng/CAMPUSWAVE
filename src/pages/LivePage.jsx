import React from 'react';
import { motion } from 'framer-motion';
import { Radio } from 'lucide-react';
import LivePlayer from '../components/LivePlayer';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import './LivePage.css';

export default function LivePage() {
  const { state } = useAudioPlayer();
  const isLive = state === 'live';
  const isConnecting = state === 'connecting';

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
            <span className="live-eyebrow">LIVE RADIO</span>
            <span className="live-meta-divider">•</span>
            <span className="live-dial">104.2 FM • CAMPUS WAVE</span>
          </div>

          <h1 className="live-headline font-display">Your campus, on air.</h1>

          <p className="live-subtext">
            Autonomous college broadcasting streamed live from the campus studio pavilion.
            Music, conversations, and live campus frequencies.
          </p>
        </motion.div>

        {/* Central Broadcast Console Player */}
        <LivePlayer />
      </div>
    </div>
  );
}
