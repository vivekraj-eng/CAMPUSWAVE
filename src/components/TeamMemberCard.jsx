import React from 'react';
import { User, ExternalLink, Mail } from 'lucide-react';
import './TeamMemberCard.css';

export default function TeamMemberCard({ member }) {
  if (!member) return null;

  const { name, role, department, bio, photo_url, social_link } = member;

  const isEmail = social_link && social_link.includes('@') && !social_link.startsWith('http');
  const href = isEmail ? `mailto:${social_link}` : social_link;

  return (
    <div className="radio-card team-member-card">
      <div className="member-avatar-container">
        {photo_url ? (
          <img
            src={photo_url}
            alt={`${name} — ${role}`}
            className="member-avatar-img"
            loading="lazy"
          />
        ) : (
          <div className="member-avatar-placeholder" aria-label={`Avatar for ${name}`}>
            <User size={40} className="avatar-placeholder-icon" />
          </div>
        )}
        <div className="member-avatar-ring" aria-hidden="true" />
      </div>

      <div className="member-details">
        <h3 className="member-name font-display">{name}</h3>
        <div className="member-role-tag font-mono">{role}</div>
        {department && <div className="member-dept font-mono">{department}</div>}
        {bio && <p className="member-bio-text">{bio}</p>}

        {social_link && (
          <div className="member-contact-row font-mono">
            <a
              href={href}
              target={isEmail ? '_self' : '_blank'}
              rel="noopener noreferrer"
              className="member-contact-btn"
              aria-label={`Connect with ${name}`}
            >
              {isEmail ? <Mail size={13} /> : <ExternalLink size={13} />}
              <span>{isEmail ? 'EMAIL HOST' : 'CONNECT'}</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
