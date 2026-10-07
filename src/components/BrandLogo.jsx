import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/campus-wave-logo.png';
import './BrandLogo.css';

/**
 * CampusWave BrandLogo Component
 * 
 * Reusable brand identity emblem & masthead for CampusWave 104.2 FM.
 * Uses the authentic station mascot (T-Rex DJ radio emblem).
 * 
 * Variants:
 *  - 'navbar'  : Circular badge emblem + 2-line "CAMPUS WAVE" wordmark + "104.2 FM • COLLEGE RADIO" metadata
 *  - 'hero'    : Prominent radio transmission emblem with radar wave rings & frequency indicators
 *  - 'footer'  : Balanced station seal masthead with frequency tag
 *  - 'compact' : Icon-only circular badge emblem
 */
export default function BrandLogo({
  variant = 'navbar',
  size,
  showGlow = false,
  showMetadata = true,
  className = '',
  asLink = false,
  to = '/'
}) {
  const isGlowing = showGlow;

  // Custom emblem dimension if provided
  const emblemStyle = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  const emblemNode = (
    <div
      className={`cw-logo-emblem-frame ${isGlowing ? 'glowing' : ''}`}
      style={emblemStyle}
    >
      <img
        src={logoImg}
        alt="CampusWave 104.2 FM Radio Mascot"
        className="cw-logo-img"
        loading="eager"
        width={size || (variant === 'hero' ? 172 : 46)}
        height={size || (variant === 'hero' ? 172 : 46)}
      />
      <div className="cw-logo-emblem-ring" aria-hidden="true" />
    </div>
  );

  let content = null;

  if (variant === 'compact') {
    content = emblemNode;
  } else if (variant === 'intro') {
    content = (
      <div className={`cw-brand-logo cw-brand-intro ${className}`}>
        {emblemNode}
      </div>
    );
  } else if (variant === 'hero') {
    content = (
      <div className={`cw-brand-logo cw-brand-hero ${className}`}>
        <div className="cw-hero-radar-ring cw-hero-ring-1" aria-hidden="true" />
        <div className="cw-hero-radar-ring cw-hero-ring-2" aria-hidden="true" />
        {isGlowing && <div className="cw-hero-signal-marker" title="Transmitting Live" />}
        {emblemNode}
      </div>
    );
  } else if (variant === 'footer') {
    content = (
      <div className={`cw-brand-logo cw-brand-footer ${className}`}>
        {emblemNode}
        <div className="cw-wordmark-block">
          <div className="cw-wordmark-title">
            <span className="cw-wordmark-line1">CAMPUS</span>
            <span className="cw-wordmark-line2">WAVE</span>
          </div>
          {showMetadata && (
            <div className="cw-metadata-freq">
              <span>104.2 FM</span>
              <span className="cw-meta-dot">•</span>
              <span>COLLEGE RADIO</span>
            </div>
          )}
        </div>
      </div>
    );
  } else {
    // Default: 'navbar'
    content = (
      <div className={`cw-brand-logo cw-brand-navbar ${className}`}>
        {emblemNode}
        <div className="cw-wordmark-block">
          <div className="cw-wordmark-title">
            <span className="cw-wordmark-line1">CAMPUS</span>
            <span className="cw-wordmark-line2">WAVE</span>
          </div>
          {showMetadata && (
            <div className="cw-metadata-freq">
              <span>104.2 FM</span>
              <span className="cw-meta-dot">•</span>
              <span>COLLEGE RADIO</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (asLink) {
    return (
      <Link to={to} className="cw-brand-link" aria-label="CampusWave 104.2 FM Home">
        {content}
      </Link>
    );
  }

  return content;
}
