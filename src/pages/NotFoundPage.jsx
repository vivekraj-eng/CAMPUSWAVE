import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, ArrowLeft, Play } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import './NotFoundPage.css';

export default function NotFoundPage() {
  return (
    <div className="not-found-page-layout">
      <div className="container not-found-container">
        <div className="radio-card not-found-card">
          <div className="not-found-badge font-mono">
            <Radio size={14} className="text-cyan" />
            <span>FREQUENCY OFF THE DIAL</span>
          </div>

          <div className="not-found-code font-display">404</div>

          <h1 className="not-found-title font-display">Carrier Frequency Not Detected</h1>
          <p className="not-found-desc">
            The broadcast transmission or page address you attempted to tune into does not exist on the CampusWave 104.2 FM station network.
          </p>

          <div className="not-found-actions font-mono">
            <Link to="/" className="btn-primary">
              <ArrowLeft size={15} />
              <span>RETURN TO STATION HOME</span>
            </Link>
            <Link to="/live" className="btn-secondary">
              <Play size={14} fill="currentColor" />
              <span>TUNE IN LIVE</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
