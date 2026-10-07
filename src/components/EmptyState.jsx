import React from 'react';
import { Radio } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Radio,
  title = 'No Content Available',
  description = 'There are no active records in this section yet. Check back soon.',
  action = null,
  className = ''
}) {
  return (
    <div className={`empty-state-card ${className}`}>
      <div className="empty-state-icon">
        <Icon size={28} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {action && <div style={{ marginTop: '16px' }}>{action}</div>}
    </div>
  );
}
