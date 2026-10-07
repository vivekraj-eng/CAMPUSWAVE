import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from './BrandLogo';
import RadioWave from './RadioWave';
import './IntroAnimation.css';

/**
 * CampusWave Station Intro / Logo Startup Animation
 * 
 * Cinematic 2.2-second startup ident:
 * 1. Deep navy/black atmosphere (#060811).
 * 2. Authentic dinosaur-with-headphones mascot emblem emerges with pristine aspect ratio.
 * 3. Subtle radio-wave rings radiate from the emblem.
 * 4. Emblem settles into resting anchor.
 * 5. "CAMPUSWAVE" typography resolves crisply.
 * 6. "Your Campus. Your Voice." subtitle gently fades in.
 * 7. Cinematic fade-out transition into the station experience.
 */
export default function IntroAnimation({ onComplete }) {
  // Stages:
  // 0: Initial void (0 - 150ms)
  // 1: Logo appears + subtle radio wave (150ms)
  // 2: Logo settles + "CAMPUSWAVE" appears (750ms)
  // 3: "Your Campus. Your Voice." appears (1200ms)
  // 4: Smooth transition out (1800ms)
  // 5: Finished / unmount (2200ms)
  const [stage, setStage] = useState(0);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Respect user's prefers-reduced-motion system setting
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    const t1 = setTimeout(() => setStage(1), 150);
    const t2 = setTimeout(() => setStage(2), 750);
    const t3 = setTimeout(() => setStage(3), 1200);
    const t4 = setTimeout(() => setStage(4), 1800);
    const t5 = setTimeout(() => onComplete(), 2200);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete]);

  // Subtle radio atmospheric dust drift in station purple & blue
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 24 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.2 + 0.4,
      alpha: Math.random() * 0.25 + 0.08,
      speedY: -(Math.random() * 0.3 + 0.1),
      isPurple: Math.random() > 0.5
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y += p.speedY;
        if (p.y < 0) p.y = canvas.height;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.isPurple
          ? `rgba(167, 139, 250, ${p.alpha})`
          : `rgba(112, 165, 255, ${p.alpha})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <AnimatePresence>
      {stage < 5 && (
        <motion.div
          className="intro-animation-backdrop"
          initial={{ opacity: 1 }}
          animate={{ opacity: stage === 4 ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-label="CampusWave Station Ident"
        >
          <canvas ref={canvasRef} className="intro-particle-canvas" aria-hidden="true" />

          {/* Atmospheric background radio frequency ring overlay */}
          <div className="intro-carrier-ring ring-outer" aria-hidden="true" />
          <div className="intro-carrier-ring ring-inner" aria-hidden="true" />

          <div className="intro-core">
            {/* Logo Emblem Stage with Restrained Scale & Radio Wave Pulse */}
            <div className="intro-logo-relative">
              {stage >= 1 && (
                <RadioWave isPlaying={true} size={280} className="intro-radio-wave" />
              )}
              <motion.div
                initial={{ opacity: 0, scale: 0.92, filter: 'blur(4px)' }}
                animate={{
                  opacity: stage >= 1 ? 1 : 0,
                  scale: stage >= 1 ? 1 : 0.92,
                  filter: stage >= 1 ? 'blur(0px)' : 'blur(4px)'
                }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <BrandLogo variant="intro" size={130} showGlow={stage >= 1} />
              </motion.div>
            </div>

            {/* Station Typography Hierarchy */}
            <div className="intro-text-group">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: stage >= 2 ? 1 : 0,
                  y: stage >= 2 ? 0 : 10
                }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 className="intro-brand-name font-display">CAMPUSWAVE</h1>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{
                  opacity: stage >= 3 ? 1 : 0,
                  y: stage >= 3 ? 0 : 6
                }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="intro-subtitle font-display">Your Campus. Your Voice.</p>
                <div className="intro-frequency-tag font-mono">104.2 FM • COLLEGE RADIO</div>
              </motion.div>
            </div>
          </div>

          <button
            type="button"
            className="intro-skip-button font-mono"
            onClick={onComplete}
            aria-label="Skip Station Intro"
          >
            <span>SKIP</span>
            <span className="skip-shortcut">ESC</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
