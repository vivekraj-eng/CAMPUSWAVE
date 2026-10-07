import React from 'react';
import { Link } from 'react-router-dom';
import {
  Radio,
  Mic2,
  BookOpen,
  Sparkles,
  Users2,
  Compass,
  Target,
  ArrowRight,
  Disc3,
  Waves
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import RadioWave from '../components/RadioWave';
import './AboutPage.css';

const PRINCIPLES = [
  {
    title: 'STUDENT VOICES',
    desc: 'Unfiltered, student-directed commentary and open microphones across campus communities.',
    icon: Mic2
  },
  {
    title: 'REAL STORIES',
    desc: 'Documenting the lived student experience, campus journalism, club movements, and faculty conversations.',
    icon: BookOpen
  },
  {
    title: 'CREATIVE EXPRESSION',
    desc: 'Eclectic music sets, original radio dramas, soundscapes, and student audio production experiments.',
    icon: Sparkles
  },
  {
    title: 'CAMPUS COMMUNITY',
    desc: 'Connecting dorms, departments, clubs, and commuter students under a shared acoustic frequency.',
    icon: Users2
  }
];

export default function AboutPage() {
  return (
    <div className="about-page-layout">
      <div className="container about-container">
        {/* Editorial Masthead */}
        <header className="about-hero-header">
          <div className="about-eyebrow font-mono">
            <RadioWave count={4} isLive={true} />
            <span>STATION MANIFESTO</span>
          </div>

          <h1 className="about-main-title font-display">ABOUT CAMPUSWAVE</h1>
          <p className="about-main-subheading font-display">Your Campus. Your Voice.</p>

          <p className="about-lead-text">
            CampusWave is the autonomous student-run broadcasting station of our college. We exist to give students an authentic acoustic space for campus storytelling, independent music, open conversation, creative audio experimentation, and technical media production.
          </p>
        </header>

        {/* Section 1: Radio Identity Visual Reinforcement */}
        <section className="about-identity-section radio-card" aria-label="CampusWave Radio Identity">
          <div className="identity-ambient-rings" aria-hidden="true">
            <span className="signal-ring ring-1" />
            <span className="signal-ring ring-2" />
            <span className="signal-ring ring-3" />
          </div>

          <div className="identity-content">
            <div className="identity-logo-wrap">
              <BrandLogo variant="hero" size={130} showGlow={true} />
            </div>

            <div className="identity-text-block">
              <div className="identity-frequency-badge font-mono">
                <Radio size={13} className="text-accent-blue" />
                <span>CAMPUSWAVE • 104.2 FM • COLLEGE RADIO</span>
              </div>
              <h2 className="identity-title font-display">The Station Identity</h2>
              <p className="identity-desc">
                Rooted in college radio heritage and powered by modern digital streaming, the CampusWave mascot emblem represents our commitment to fierce student independence, curiosity, and high-fidelity sound.
              </p>
              <div className="identity-meta-row font-mono">
                <span className="meta-pill">Autonomous Media</span>
                <span className="meta-pill">Live On Air</span>
                <span className="meta-pill">Student Governed</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Vision & Mission Two-Column Layout */}
        <div className="about-duo-grid">
          {/* Our Vision */}
          <section className="radio-card about-block-card vision-card" aria-label="Our Vision">
            <div className="block-icon-badge vision-badge">
              <Compass size={22} />
            </div>
            <h2 className="block-title font-display">OUR VISION</h2>
            <p className="block-text">
              We envision a fully student-driven media environment where every student has access to an open microphone and a studio desk. By combining traditional FM broadcast warmth with contemporary online distribution, CampusWave strives to make student radio a dynamic, living fixture of university culture—a place where ideas are debated, music is discovered, and student life is celebrated in real time.
            </p>
          </section>

          {/* Our Mission */}
          <section className="radio-card about-block-card mission-card" aria-label="Our Mission">
            <div className="block-icon-badge mission-badge">
              <Target size={22} />
            </div>
            <h2 className="block-title font-display">OUR MISSION</h2>
            <ul className="mission-list font-mono">
              <li>
                <span className="bullet-dot" />
                <span><strong>Give students a platform</strong> to be heard and share perspectives.</span>
              </li>
              <li>
                <span className="bullet-dot" />
                <span><strong>Encourage creativity</strong> across music, writing, and sound design.</span>
              </li>
              <li>
                <span className="bullet-dot" />
                <span><strong>Develop media & technical skills</strong> in live radio and production.</span>
              </li>
              <li>
                <span className="bullet-dot" />
                <span><strong>Connect students through radio</strong> across campus boundaries.</span>
              </li>
              <li>
                <span className="bullet-dot" />
                <span><strong>Document campus culture</strong>, history, and real stories.</span>
              </li>
            </ul>
          </section>
        </div>

        {/* Section 3: Why CampusWave Principles */}
        <section className="about-principles-section" aria-label="Why CampusWave Principles">
          <div className="section-masthead" style={{ marginBottom: 28 }}>
            <div className="section-eyebrow">
              <span className="section-eyebrow-line" />
              <span>CORE VALUES</span>
            </div>
            <h2 className="section-title">WHY CAMPUSWAVE</h2>
            <p className="section-subtitle">
              The four foundational pillars guiding every broadcast, podcast episode, and campus tracklist.
            </p>
          </div>

          <div className="principles-grid">
            {PRINCIPLES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="radio-card principle-card">
                  <div className="principle-icon-wrap">
                    <Icon size={20} />
                  </div>
                  <h3 className="principle-title font-display">{item.title}</h3>
                  <p className="principle-desc">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 4: Get Involved CTA */}
        <section className="about-cta-card radio-card font-mono">
          <div className="cta-content">
            <h3 className="cta-title font-display">Ready to Be Heard?</h3>
            <p className="cta-desc">
              Whether you want to host an on-air show, master podcasts, write station articles, or manage campus live broadcasts, CampusWave welcomes every college student.
            </p>
          </div>
          <div className="cta-actions">
            <Link to="/join" className="btn-primary">
              <span>JOIN THE CLUB</span>
              <ArrowRight size={15} />
            </Link>
            <Link to="/shows" className="btn-secondary">
              <span>EXPLORE SHOWS</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
