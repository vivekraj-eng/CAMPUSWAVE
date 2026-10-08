import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Lock,
  Mail,
  User,
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Send,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/BrandLogo';

export default function AuthPage() {
  // Modes: 'signin' | 'signup' | 'forgot' | 'recovery'
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showResendBtn, setShowResendBtn] = useState(false);

  const {
    isAuthenticated,
    loading: authLoading,
    signIn,
    signUp,
    resetPassword,
    updatePassword,
    resendVerification
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryRedirect = new URLSearchParams(location.search).get('redirect');

  // Compute destination preserving redirect parameter or defaulting to /dashboard
  const getDestination = () => {
    const requested = queryRedirect || location.state?.from?.pathname;
    if (requested && requested !== '/login' && requested !== '/auth') {
      return requested;
    }
    return '/dashboard';
  };

  // Automatically navigate once Supabase confirms authenticated session and auth state is available
  useEffect(() => {
    if (!authLoading && isAuthenticated && mode !== 'recovery') {
      const destination = getDestination();
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, authLoading, mode, queryRedirect, location.state, navigate]);

  // Detect recovery, error callbacks, and verification state from URL query or hash
  useEffect(() => {
    const rawHash = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash;
    const hashParams = new URLSearchParams(rawHash);
    const searchParams = new URLSearchParams(location.search);

    // 1. Detect Supabase Auth callback errors (e.g. otp_expired)
    const urlErrorDesc = hashParams.get('error_description') || searchParams.get('error_description');
    const urlErrorCode = hashParams.get('error_code') || searchParams.get('error_code') || hashParams.get('error') || searchParams.get('error');

    if (urlErrorDesc) {
      const decoded = decodeURIComponent(urlErrorDesc.replace(/\+/g, ' '));
      if (urlErrorCode === 'otp_expired' || decoded.toLowerCase().includes('expired')) {
        setErrorMsg('The email verification link has expired or was already used. Please request a new verification email.');
        setShowResendBtn(true);
      } else {
        setErrorMsg(decoded);
      }
      return;
    }

    // 2. Detect recovery flow
    const type = hashParams.get('type') || searchParams.get('type');
    if (type === 'recovery') {
      setMode('recovery');
      return;
    }

    // 3. Detect email confirmation callback
    if (type === 'signup' || type === 'email_confirmation') {
      setSuccessMsg('Email confirmation confirmed! You may now sign in to CampusWave.');
    }
  }, [location.search]);

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setShowResendBtn(false);

    if (mode === 'recovery') {
      if (!password || password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }

      setLoading(true);
      try {
        const { error } = await updatePassword(password);
        if (error) {
          setErrorMsg(error.message || 'Failed to update password.');
        } else {
          setSuccessMsg('Your password has been updated successfully. Please sign in with your new password.');
          setPassword('');
          setConfirmPassword('');
          setTimeout(() => {
            setMode('signin');
            setSuccessMsg('');
          }, 2500);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Password update failed.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'forgot') {
      if (!email || !email.includes('@')) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }

      setLoading(true);
      try {
        const { error } = await resetPassword(email);
        if (error) {
          setErrorMsg(error.message || 'Unable to send password reset email.');
        } else {
          setSuccessMsg('Password reset link sent! Please check your email inbox to reset your password.');
        }
      } catch (err) {
        setErrorMsg(err.message || 'Error sending password reset email.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'signin') {
      if (!email || !password) {
        setErrorMsg('Please enter both email and password.');
        return;
      }

      setLoading(true);
      try {
        const res = await signIn(email, password);
        if (res.error) {
          const rawErr = (res.error.message || '').toLowerCase();
          if (rawErr.includes('email not confirmed')) {
            setErrorMsg('Please verify your email before signing in.');
            setShowResendBtn(true);
          } else if (rawErr.includes('invalid login credentials') || rawErr.includes('invalid_grant')) {
            setErrorMsg('Invalid email or password.');
          } else {
            setErrorMsg(res.error.message || 'Authentication failed. Please verify your credentials.');
          }
          setLoading(false);
          return;
        }

        // Supabase confirms sign-in succeeded
        if (res.session || res.user) {
          setSuccessMsg('Login successful. Entering CampusWave...');
          const destination = getDestination();
          navigate(destination, { replace: true });
        }
      } catch (err) {
        setErrorMsg(err.message || 'Sign in encountered an error.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'signup') {
      if (!fullName) {
        setErrorMsg('Full name is required for registration.');
        return;
      }
      if (!email || !email.includes('@')) {
        setErrorMsg('Please enter a valid college email address.');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }

      setLoading(true);
      try {
        const res = await signUp(email, password, fullName);
        if (res.error) {
          setErrorMsg(res.error.message || 'Registration failed.');
          setLoading(false);
          return;
        }

        if (res.requiresVerification) {
          setSuccessMsg('Account created! Please check your email to verify your account before signing in.');
          setLoading(false);
          return;
        }

        if (res.session || res.user) {
          setSuccessMsg('Account created successfully. Entering CampusWave...');
          const destination = getDestination();
          navigate(destination, { replace: true });
        }
      } catch (err) {
        setErrorMsg(err.message || 'Account registration failed.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await resendVerification(email);
      if (error) {
        const raw = (error.message || '').toLowerCase();
        if (raw.includes('rate limit')) {
          setErrorMsg('Email rate limit exceeded by Supabase Auth. Please wait a few minutes before trying again.');
        } else {
          setErrorMsg(error.message || 'Failed to resend confirmation email.');
        }
      } else {
        setSuccessMsg('Verification email resent! Please check your inbox.');
        setShowResendBtn(false);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error resending verification email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-layout">
      <div className="container auth-container">
        <div className="radio-card auth-card">
          <div className="auth-card-header">
            <BrandLogo variant="compact" size={56} showGlow={true} asLink={true} to="/" />
            <h1 className="auth-title font-display">
              {mode === 'signin' && 'Sign In to CampusWave'}
              {mode === 'signup' && 'Create Student Account'}
              {mode === 'forgot' && 'Reset Station Password'}
              {mode === 'recovery' && 'Set New Password'}
            </h1>
            <p className="auth-sub font-mono">
              104.2 FM • Autonomous Student Broadcasting Platform
            </p>
          </div>

          {/* Feedback Banners */}
          {errorMsg && (
            <div className="auth-alert error font-mono">
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="auth-alert success font-mono">
              <CheckCircle2 size={15} />
              <span>{successMsg}</span>
            </div>
          )}

          {showResendBtn && (
            <div style={{ marginBottom: '14px', textAlign: 'center' }}>
              <button
                type="button"
                className="btn-outline-purple font-mono"
                onClick={handleResendVerification}
                disabled={loading}
              >
                <Send size={13} />
                <span>Resend verification email</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {/* Full Name for Signup */}
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label" htmlFor="auth-name">Full Name</label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input
                    id="auth-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Alex Rivera"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Email Field (for signin, signup, forgot) */}
            {mode !== 'recovery' && (
              <div className="form-group">
                <label className="form-label" htmlFor="auth-email">College Email</label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon" />
                  <input
                    id="auth-email"
                    type="email"
                    className="form-input"
                    placeholder="student@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Password Field (for signin, signup, recovery) */}
            {mode !== 'forgot' && (
              <div className="form-group">
                <div className="form-label-row">
                  <label className="form-label" htmlFor="auth-pass">
                    {mode === 'recovery' ? 'New Password' : 'Password'}
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      className="forgot-link font-mono"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="input-with-icon">
                  <Lock size={16} className="input-icon" />
                  <input
                    id="auth-pass"
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Confirm Password (for recovery only) */}
            {mode === 'recovery' && (
              <div className="form-group">
                <label className="form-label" htmlFor="auth-confirm-pass">Confirm New Password</label>
                <div className="input-with-icon">
                  <KeyRound size={16} className="input-icon" />
                  <input
                    id="auth-confirm-pass"
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary auth-submit-btn font-mono"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin-icon" />
                  <span>
                    {mode === 'signin' && 'SIGNING IN...'}
                    {mode === 'signup' && 'CREATING ACCOUNT...'}
                    {mode === 'forgot' && 'SENDING RESET LINK...'}
                    {mode === 'recovery' && 'UPDATING PASSWORD...'}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'signin' && 'SIGN IN'}
                    {mode === 'signup' && 'CREATE ACCOUNT'}
                    {mode === 'forgot' && 'SEND RESET LINK'}
                    {mode === 'recovery' && 'UPDATE PASSWORD'}
                  </span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Mode Switchers */}
          {mode === 'signin' && (
            <div className="auth-toggle-row font-mono">
              <span>Don't have an account?</span>
              <button
                type="button"
                className="toggle-mode-btn"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
              >
                Register now
              </button>
            </div>
          )}

          {mode === 'signup' && (
            <div className="auth-toggle-row font-mono">
              <span>Already registered?</span>
              <button
                type="button"
                className="toggle-mode-btn"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
              >
                Sign in instead
              </button>
            </div>
          )}

          {(mode === 'forgot' || mode === 'recovery') && (
            <div className="auth-toggle-row font-mono">
              <button
                type="button"
                className="toggle-mode-btn back-btn"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
              >
                <ArrowLeft size={13} />
                <span>Back to Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .auth-page-layout {
          padding: 60px 0 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .auth-container {
          max-width: 480px;
        }
        .auth-card {
          padding: 40px 32px;
        }
        .auth-card-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 28px;
        }
        .auth-title {
          font-size: 1.6rem;
          font-weight: 800;
          color: #FFFFFF;
          margin: 14px 0 4px;
        }
        .auth-sub {
          font-size: 0.72rem;
          color: var(--accent-purple-bright);
          letter-spacing: 0.08em;
        }
        .form-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .forgot-link {
          background: none;
          border: none;
          color: var(--accent-purple-bright);
          font-size: 0.72rem;
          cursor: pointer;
          transition: color var(--transition-fast);
          padding: 0;
        }
        .forgot-link:hover {
          color: #FFFFFF;
          text-decoration: underline;
        }
        .input-with-icon {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }
        .input-with-icon .form-input {
          padding-left: 42px;
        }
        .auth-submit-btn {
          width: 100%;
          padding: 13px;
          margin-top: 10px;
        }
        .auth-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          margin-bottom: 18px;
          line-height: 1.4;
        }
        .auth-alert.error {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #F87171;
        }
        .auth-alert.success {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #34D399;
        }
        .auth-toggle-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--border-subtle);
        }
        .toggle-mode-btn {
          color: var(--accent-purple-bright);
          font-weight: 700;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
        }
        .toggle-mode-btn:hover {
          text-decoration: underline;
        }
        .toggle-mode-btn.back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .spin-icon {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
