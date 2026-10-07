import React from 'react';
import { User, Mail, GraduationCap, Building2, Shield, AlertCircle } from 'lucide-react';

/**
 * StudentProfileCard
 * Displays real authenticated profile information.
 * Shows a subtle completion prompt when optional details are missing.
 * Never invents mock profile data.
 */
export default function StudentProfileCard({ profile, user }) {
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Campus Student';
  const email = user?.email || profile?.email || '';
  const department = profile?.department || '';
  const academicYear = profile?.year || profile?.academic_year || '';
  const roleName = profile?.role || 'student';

  const isProfileIncomplete = !department || !academicYear;

  return (
    <div className="radio-card dashboard-card profile-summary-card">
      <div className="card-top-tag font-mono">
        <span className="card-tag-bullet" />
        <span>STUDENT IDENTITY</span>
      </div>

      <div className="profile-identity-header">
        <div className="profile-avatar-frame">
          <div className="profile-avatar-inner">
            <User size={32} className="avatar-icon" />
          </div>
          <span className="avatar-ring-pulse" aria-hidden="true" />
        </div>

        <div className="profile-info-block">
          <div className="profile-role-badge font-mono">
            <Shield size={12} />
            <span>{roleName.toUpperCase()}</span>
          </div>
          <h2 className="profile-display-name font-display">{displayName}</h2>
          {email && (
            <div className="profile-email-row font-mono">
              <Mail size={13} />
              <span>{email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Real metadata attributes - only rendered if actually present */}
      <div className="profile-details-grid">
        {department && (
          <div className="detail-pill">
            <Building2 size={14} className="detail-icon" />
            <div className="detail-content">
              <span className="detail-label font-mono">DEPARTMENT</span>
              <span className="detail-val">{department}</span>
            </div>
          </div>
        )}

        {academicYear && (
          <div className="detail-pill">
            <GraduationCap size={14} className="detail-icon" />
            <div className="detail-content">
              <span className="detail-label font-mono">ACADEMIC YEAR</span>
              <span className="detail-val">{academicYear}</span>
            </div>
          </div>
        )}
      </div>

      {isProfileIncomplete && (
        <div className="profile-incomplete-notice font-mono">
          <AlertCircle size={14} />
          <span>Profile incomplete: Academic department and year are not yet recorded.</span>
        </div>
      )}
    </div>
  );
}
