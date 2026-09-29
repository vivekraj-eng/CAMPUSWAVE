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

    const render = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;

      ctx.clearRect(0, 0, w, h);

      step += isPlaying ? 0.045 : 0.01;
      const freqData = getWaveformData ? getWaveformData() : null;

      const barWidth = (w / barsCount) * 0.55;
      const gap = (w / barsCount) * 0.45;

      for (let i = 0; i < barsCount; i++) {
        const x = i * (barWidth + gap) + gap / 2;
        let barH;

        if (isOffline) {
          barH = 2; // Resting state
        } else if (isPlaying) {
          if (freqData && freqData.length > 0) {
            const rawVal = freqData[i % freqData.length] / 255;
            barH = Math.max(4, rawVal * (h * 0.8));
          } else {
            const s1 = Math.sin(i * 0.28 + step) * 0.5 + 0.5;
            const s2 = Math.cos(i * 0.14 - step * 0.8) * 0.5 + 0.5;
            barH = 5 + (s1 * 0.6 + s2 * 0.4) * (h * 0.75);
          }
        } else if (isConnecting) {
          const sweep = Math.sin(i * 0.2 + step * 2) * 0.5 + 0.5;
          barH = 3 + sweep * 16;
        } else {
          const gentle = Math.sin(i * 0.2 + step) * 0.5 + 0.5;
          barH = 3 + gentle * 6;
        }

        const y = h / 2 - barH / 2;
        const isAccent = i % 3 === 0;

        ctx.fillStyle = isOffline
          ? 'rgba(94, 98, 107, 0.4)'
          : isAccent
          ? 'rgba(216, 171, 110, 0.85)'
          : 'rgba(245, 244, 240, 0.45)';

        ctx.fillRect(x, y, barWidth, barH);
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
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
