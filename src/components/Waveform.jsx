import React, { useEffect, useRef } from 'react';
import './Waveform.css';

export default function Waveform({
  isPlaying = false,
  isOffline = false,
  isConnecting = false,
  getWaveformData = null,
  height = 56,
  barsCount = 44,
  className = ''
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let step = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;

      ctx.clearRect(0, 0, w, h);

      if (isPlaying && !prefersReducedMotion) {
        step += 0.045;
      } else if (isConnecting && !prefersReducedMotion) {
        step += 0.02;
      }

      const freqData = getWaveformData ? getWaveformData() : null;
      const barWidth = (w / barsCount) * 0.55;
      const gap = (w / barsCount) * 0.45;

      for (let i = 0; i < barsCount; i++) {
        const x = i * (barWidth + gap) + gap / 2;
        let barH;

        if (isOffline) {
          barH = 2; // Baseline resting state
        } else if (isPlaying && !prefersReducedMotion) {
          if (freqData && freqData.length > 0) {
            const rawVal = freqData[i % freqData.length] / 255;
            barH = Math.max(4, rawVal * (h * 0.8));
          } else {
            const s1 = Math.sin(i * 0.28 + step) * 0.5 + 0.5;
            const s2 = Math.cos(i * 0.14 - step * 0.8) * 0.5 + 0.5;
            barH = 5 + (s1 * 0.6 + s2 * 0.4) * (h * 0.75);
          }
        } else if (isConnecting && !prefersReducedMotion) {
          const sweep = Math.sin(i * 0.2 + step * 2) * 0.5 + 0.5;
          barH = 3 + sweep * 14;
        } else {
          // Standing standby: static baseline, no fake oscillation
          barH = 3;
        }

        const y = h / 2 - barH / 2;
        const isAccentPurple = i % 4 === 0;
        const isAccentBlue = i % 4 === 2;

        ctx.fillStyle = isOffline
          ? 'rgba(104, 113, 132, 0.45)'
          : isAccentPurple
          ? 'rgba(167, 139, 250, 0.9)'
          : isAccentBlue
          ? 'rgba(112, 165, 255, 0.85)'
          : 'rgba(245, 247, 250, 0.45)';

        ctx.fillRect(x, y, barWidth, barH);
      }

      if ((isPlaying || isConnecting) && !prefersReducedMotion) {
        animationId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isPlaying, isOffline, isConnecting, getWaveformData, barsCount]);

  return (
    <div
      className={`waveform-container ${isOffline ? 'is-offline' : ''} ${className}`}
      style={{ height }}
      role="img"
      aria-label={
        isOffline
          ? 'Audio waveform at rest (radio offline)'
          : isPlaying
          ? 'Audio waveform playing campus radio stream'
          : 'Audio waveform on standby'
      }
    >
      <canvas ref={canvasRef} className="waveform-canvas-el" />
    </div>
  );
}
