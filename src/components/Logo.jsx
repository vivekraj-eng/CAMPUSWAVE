import React from 'react';

export default function Logo({ size = 44, className = '', showGlow = false }) {
  return (
    <div
      className={`campus-wave-logo-badge ${showGlow ? 'with-glow' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/campus-wave-logo.png"
        alt="Campus Wave Radio Mascot"
        className="campus-wave-logo-img"
        loading="eager"
      />
      <style>{`
        .campus-wave-logo-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #111318;
          border: 1px solid rgba(200, 155, 92, 0.28);
          padding: 2px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          flex-shrink: 0;
          transition: transform 0.25s ease, border-color 0.25s ease;
        }
        .campus-wave-logo-badge.with-glow {
          box-shadow: 0 0 25px rgba(200, 155, 92, 0.25), 0 8px 30px rgba(0, 0, 0, 0.7);
          border-color: rgba(200, 155, 92, 0.45);
        }
        .campus-wave-logo-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: contrast(1.05) brightness(0.98);
        }
      `}</style>
    </div>
  );
}
