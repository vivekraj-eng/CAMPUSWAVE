import React from 'react';
import { Mail, Shield, LogOut, CheckCircle2 } from 'lucide-react';

/**
 * AccountCard
 * Provides a clean overview of the authenticated user's account session with a sign-out trigger.
 */
export default function AccountCard({ user, profile, onSignOut }) {
  const email = user?.email || profile?.email || 'Authenticated User';
  const role = profile?.role || 'student';

  return (
    <div className="radio-card dashboard-card account-card" id="account-section">
      <div className="dash-card-header font-mono">
        <div className="dash-header-title">
          <Shield size={16} />
          <span>ACCOUNT & ACCESS</span>
        </div>
      </div>

      <div className="account-card-body">
        <div className="account-info-row">
          <div className="account-info-field">
            <span className="field-label font-mono">AUTHENTICATED EMAIL</span>
            <div className="field-value email-value">
              <Mail size={14} />
              <span>{email}</span>
            </div>
          </div>

          <div className="account-info-field">
            <span className="field-label font-mono">ACCOUNT PRIVILEGE</span>
            <div className="field-value">
              <span className="role-tag font-mono">{role.toUpperCase()} LISTENER</span>
            </div>
          </div>

          <div className="account-info-field">
            <span className="field-label font-mono">SESSION INTEGRITY</span>
            <div className="field-value session-active font-mono">
              <CheckCircle2 size={14} />
              <span>ACTIVE SESSION</span>
            </div>
          </div>
        </div>

        <div className="account-action-row">
          <button
            type="button"
            className="btn-outline-danger font-mono"
            onClick={onSignOut}
            aria-label="Sign out of student account"
          >
            <LogOut size={14} />
            <span>SIGN OUT OF CAMPUSWAVE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
