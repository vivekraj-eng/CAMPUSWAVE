import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import RadioWave from './RadioWave';
import './IntroAnimation.css';

export default function IntroAnimation({ onComplete }) {
  const [stage, setStage] = useState(0); // 0: dark, 1: logo + waves, 2: typography, 3: exit
  const canvasRef = useRef(null);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    const t1 = setTimeout(() => setStage(1), 250);
    const t2 = setTimeout(() => setStage(2), 1400);
    const t3 = setTimeout(() => setStage(3), 3200);
    const t4 = setTimeout(() => onComplete(), 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  // Subtle acoustic particle drift
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

    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.1 + 0.3,
      alpha: Math.random() * 0.35 + 0.1,
      speedY: -(Math.random() * 0.35 + 0.1)
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y += p.speedY;
        if (p.y < 0) p.y = canvas.height;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 155, 92, ${p.alpha * 0.4})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <AnimatePresence>
      {stage < 4 && (
        <motion.div
          className="intro-animation-backdrop"
          initial={{ opacity: 1 }}
          animate={{ opacity: stage === 3 ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-label="Campus Wave Station Ident Intro"
        >
          <canvas ref={canvasRef} className="intro-particle-canvas" />

          <div className="intro-core">
            {/* Logo with restrained scale & depth motion */}
            <div className="intro-logo-relative">
              {stage >= 1 && (
                <RadioWave isPlaying={true} size={320} className="intro-radio-wave" />
              )}
              <motion.div
                initial={{ opacity: 0, scale: 0.88, filter: 'blur(6px)' }}
                animate={{
                  opacity: stage >= 1 ? 1 : 0,
                  scale: stage >= 1 ? 1 : 0.88,
                  filter: stage >= 1 ? 'blur(0px)' : 'blur(6px)'
                }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <Logo size={140} showGlow={stage >= 1} />
              </motion.div>
            </div>

            {/* Typography */}
            <motion.div
              className="intro-text-group"
              initial={{ opacity: 0, y: 14 }}
              animate={{
                opacity: stage >= 2 ? 1 : 0,
                y: stage >= 2 ? 0 : 14
              }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="intro-brand-name font-display">CAMPUS WAVE</h1>
              <p className="intro-subtitle font-mono">RADIO • VOICES • COMMUNITY</p>
            </motion.div>
          </div>

          <button
            type="button"
            className="intro-skip-button font-mono"
            onClick={onComplete}
            aria-label="Skip Station Ident"
          >
            SKIP IDENT
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
