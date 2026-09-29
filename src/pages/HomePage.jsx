import React from 'react';
import Hero from '../components/Hero';
import AudioPlayer from '../components/AudioPlayer';
import SchedulePreview from '../components/SchedulePreview';

export default function HomePage() {
  return (
    <div className="home-page-container">
      <Hero />
      <section className="home-player-wrap">
        <div className="container">
          <AudioPlayer />
        </div>
      </section>
      <SchedulePreview />
      <style>{`
        .home-player-wrap {
          padding-bottom: 60px;
        }
      `}</style>
    </div>
  );
}
