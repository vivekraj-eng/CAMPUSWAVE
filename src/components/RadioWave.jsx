import React from 'react';
import './RadioWave.css';

export default function RadioWave({ isPlaying = false, size = 380, className = '' }) {
  return (
    <div
      className={`radio-wave-wrapper ${isPlaying ? 'is-active' : 'is-idle'} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div className="wave-ring wave-ring-1" />
      <div className="wave-ring wave-ring-2" />
      <div className="wave-ring wave-ring-3" />
    </div>
  );
}
