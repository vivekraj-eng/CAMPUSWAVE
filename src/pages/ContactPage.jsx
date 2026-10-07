import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, Mail, MapPin, Radio, CheckCircle2, ArrowLeft, Loader2, MessageSquare } from 'lucide-react';
import { contactService } from '../services/contact-service';
import { isSupabaseConfigured } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import FormStatus from '../components/FormStatus';
import RadioWave from '../components/RadioWave';
import './ContactPage.css';

export default function ContactPage() {
  const { user, profile, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    name: profile?.full_name || '',
    email: user?.email || '',
    subject: '',
    message: ''
  });

  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Sync profile details if auth state updates
  useEffect(() => {
    if (profile?.full_name && !formData.name) {
      setFormData((prev) => ({ ...prev, name: profile.full_name }));
    }
    if (user?.email && !formData.email) {
      setFormData((prev) => ({ ...prev, email: user.email }));
    }
  }, [profile, user]);

  // Read authentic station configuration from environment if provided
  const stationEmail = import.meta.env.VITE_STATION_EMAIL || '';
  const stationLocation = import.meta.env.VITE_STATION_LOCATION || '';
  const stationFrequency = import.meta.env.VITE_STATION_FREQUENCY || '';

  const validate = () => {
    const errors = {};
    const collegeDomain = import.meta.env.VITE_COLLEGE_EMAIL_DOMAIN;

    if (!formData.name.trim()) {
      errors.name = 'Your name is required.';
    } else if (formData.name.trim().length > 80) {
      errors.name = 'Name cannot exceed 80 characters.';
    }

    if (!formData.email.trim()) {
      errors.email = 'College email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address.';
    } else if (collegeDomain && !formData.email.trim().toLowerCase().endsWith(collegeDomain.toLowerCase())) {
      errors.email = `Must be an official email ending with ${collegeDomain}.`;
    }

    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required.';
    } else if (formData.subject.trim().length > 120) {
      errors.subject = 'Subject cannot exceed 120 characters.';
    }

    if (!formData.message.trim()) {
      errors.message = 'Message content is required.';
    } else if (formData.message.trim().length < 15) {
      errors.message = 'Message must be at least 15 characters long.';
    } else if (formData.message.trim().length > 800) {
      errors.message = 'Message cannot exceed 800 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'submitting') return;

    setStatus('idle');
    setErrorMessage('');

    if (!validate()) return;

    setStatus('submitting');

    try {
      const res = await contactService.submitContactMessage({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        userId: user?.id || null
      });

      if (res.error) {
        setStatus('error');
        setErrorMessage(res.error.message || 'Failed to dispatch inquiry.');
      } else {
        setStatus('success');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || 'An unexpected transmission error occurred.');
    }
  };

  return (
    <div className="contact-page-layout">
      <div className="container contact-container">
        {/* Header */}
        <div className="section-masthead">
          <div className="section-eyebrow">
            <span className="section-eyebrow-line" />
            <span>DISPATCH & INQUIRIES</span>
          </div>
          <h1 className="section-title">CONTACT CAMPUSWAVE</h1>
          <p className="section-subtitle">
            Have questions for the station directors, feedback on our live broadcast, or collaboration inquiries? Send a direct dispatch to our studio desk.
          </p>
        </div>

        {/* Success State */}
        {status === 'success' ? (
          <div className="radio-card contact-success-card" role="status">
            <div className="contact-success-icon">
              <CheckCircle2 size={44} />
            </div>
            <div className="success-badge font-mono">DISPATCH CONFIRMATION</div>
            <h2 className="success-title font-display">MESSAGE SENT</h2>
            <p className="success-desc">
              Your message has been received by the CampusWave team.
            </p>
            <p className="success-note font-mono">
              Our station directors and broadcast staff review dispatches sent through this portal.
            </p>
            <div className="success-actions font-mono">
              <Link to="/" className="btn-primary">
                <ArrowLeft size={15} />
                <span>Back to CampusWave</span>
              </Link>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setStatus('idle');
                  setFormData((prev) => ({
                    ...prev,
                    subject: '',
                    message: ''
                  }));
                }}
              >
                <span>Send Another Message</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="contact-split-grid">
            {/* Left Column: Official Station Information (Only what is configured) */}
            <aside className="contact-info-col">
              <div className="radio-card contact-info-card">
                <div className="info-card-header font-mono">
                  <RadioWave count={3} isLive={true} />
                  <span>STUDIO HEADQUARTERS</span>
                </div>

                <h3 className="info-main-title font-display">Broadcast Studio Desk</h3>
                <p className="info-main-desc">
                  CampusWave operates from our campus media studio, delivering live transmissions, music rotations, and original podcast productions.
                </p>

                <div className="official-info-list">
                  {stationEmail && (
                    <div className="official-item">
                      <div className="official-icon">
                        <Mail size={16} />
                      </div>
                      <div className="official-content font-mono">
                        <span className="official-label">OFFICIAL INBOX</span>
                        <a href={`mailto:${stationEmail}`} className="official-val link">
                          {stationEmail}
                        </a>
                      </div>
                    </div>
                  )}

                  {stationLocation && (
                    <div className="official-item">
                      <div className="official-icon">
                        <MapPin size={16} />
                      </div>
                      <div className="official-content font-mono">
                        <span className="official-label">CAMPUS STUDIO LOCATION</span>
                        <span className="official-val">{stationLocation}</span>
                      </div>
                    </div>
                  )}

                  {stationFrequency && (
                    <div className="official-item">
                      <div className="official-icon">
                        <Radio size={16} />
                      </div>
                      <div className="official-content font-mono">
                        <span className="official-label">BROADCAST FREQUENCY</span>
                        <span className="official-val">{stationFrequency}</span>
                      </div>
                    </div>
                  )}

                  <div className="official-item dispatch-note">
                    <div className="official-icon">
                      <MessageSquare size={16} />
                    </div>
                    <div className="official-content font-mono">
                      <span className="official-label">DIRECT DISPATCH</span>
                      <span className="official-val text-muted">
                        Online submissions via this form route directly to our station administrative console.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Right Column: Contact Form */}
            <main className="contact-form-col">
              <div className="radio-card contact-form-card">
                <div className="contact-form-header">
                  <h2 className="form-heading font-display">Send a Transmission</h2>
                  <p className="form-subheading">
                    Please provide your contact details and message below.
                  </p>
                </div>

                {!isSupabaseConfigured && <FormStatus unconfigured={true} />}

                <FormStatus
                  status={status}
                  title="Message Transmission Error"
                  message={errorMessage}
                />

                <form onSubmit={handleSubmit} noValidate>
                  <div className="form-grid-2">
                    <FormField
                      id="contact-name"
                      label="Your Name"
                      required={true}
                      placeholder="e.g. Robin Taylor"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                      }}
                      error={fieldErrors.name}
                      maxLength={80}
                      disabled={status === 'submitting'}
                      autoComplete="name"
                    />

                    <FormField
                      id="contact-email"
                      label="College Email"
                      type="email"
                      required={true}
                      placeholder="e.g. robin@college.edu"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                      }}
                      error={fieldErrors.email}
                      maxLength={100}
                      disabled={status === 'submitting'}
                      autoComplete="email"
                    />
                  </div>

                  <FormField
                    id="contact-subject"
                    label="Subject"
                    required={true}
                    placeholder="e.g. Broadcast Inquiry / Campus Partnership"
                    value={formData.subject}
                    onChange={(e) => {
                      setFormData({ ...formData, subject: e.target.value });
                      if (fieldErrors.subject) setFieldErrors({ ...fieldErrors, subject: '' });
                    }}
                    error={fieldErrors.subject}
                    maxLength={120}
                    disabled={status === 'submitting'}
                  />

                  <FormField
                    id="contact-message"
                    label="Message"
                    type="textarea"
                    required={true}
                    rows={5}
                    placeholder="Type your message for the station directors (minimum 15 characters)..."
                    value={formData.message}
                    onChange={(e) => {
                      setFormData({ ...formData, message: e.target.value });
                      if (fieldErrors.message) setFieldErrors({ ...fieldErrors, message: '' });
                    }}
                    error={fieldErrors.message}
                    maxLength={800}
                    disabled={status === 'submitting'}
                    helperText="Please be as descriptive as possible regarding your inquiry."
                  />

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn-primary font-mono contact-submit-btn"
                      disabled={status === 'submitting' || !isSupabaseConfigured}
                      aria-busy={status === 'submitting'}
                    >
                      {status === 'submitting' ? (
                        <>
                          <Loader2 size={16} className="spin-icon" />
                          <span>DISPATCHING...</span>
                        </>
                      ) : (
                        <>
                          <Send size={15} />
                          <span>SEND DISPATCH</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
