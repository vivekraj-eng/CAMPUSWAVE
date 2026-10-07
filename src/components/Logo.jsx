import React from 'react';
import BrandLogo from './BrandLogo';

/**
 * Backward compatibility wrapper for BrandLogo
 */
export default function Logo({ size = 44, className = '', showGlow = false, variant = 'compact' }) {
  return (
    <BrandLogo
      variant={variant}
      size={size}
      showGlow={showGlow}
      className={className}
    />
  );
}
