import React from 'react';
import { CheckCircle2, AlertCircle, Loader2, Database, AlertTriangle } from 'lucide-react';
import './FormStatus.css';

export default function FormStatus({
  status, // 'idle' | 'submitting' | 'success' | 'error'
  title = '',
  message = '',
  unconfigured = false,
  className = ''
}) {
  if (unconfigured) {
    return (
      <div className={`form-status-banner warning font-mono ${className}`} role="alert">
        <Database size={18} className="status-banner-icon flex-shrink-0" />
        <div className="status-banner-content">
          <strong className="status-banner-title">Database Disconnected (Setup Required)</strong>
          <p className="status-banner-text">
            Live submissions require a configured Supabase backend. Please set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your environment before submitting.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'submitting') {
    return (
      <div className={`form-status-banner submitting font-mono ${className}`} role="status">
        <Loader2 size={18} className="status-banner-icon spin-icon flex-shrink-0" />
        <div className="status-banner-content">
          <strong className="status-banner-title">{title || 'Transmitting to studio...'}</strong>
          <p className="status-banner-text">{message || 'Securely routing transmission to the broadcast desk.'}</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className={`form-status-banner success font-mono ${className}`} role="status">
        <CheckCircle2 size={18} className="status-banner-icon flex-shrink-0" />
        <div className="status-banner-content">
          <strong className="status-banner-title">{title || 'Transmission successful!'}</strong>
          <p className="status-banner-text">{message}</p>
        </div>
      </div>
    );
  }

  if (status === 'error' && message) {
    return (
      <div className={`form-status-banner error font-mono ${className}`} role="alert">
        <AlertCircle size={18} className="status-banner-icon flex-shrink-0" />
        <div className="status-banner-content">
          <strong className="status-banner-title">{title || 'Transmission Error'}</strong>
          <p className="status-banner-text">{message}</p>
        </div>
      </div>
    );
  }

  return null;
}
