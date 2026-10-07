import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Mic,
  FileText,
  Sliders,
  Radio,
  Share2,
  Palette,
  Calendar,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { applicationService } from '../services/application-service';
import { isSupabaseConfigured } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import FormField from './FormField';
import FormStatus from './FormStatus';
import './ApplicationForm.css';

export const TEAMS = [
  {
    id: 'Radio Jockey',
    name: 'Radio Jockey',
    subtitle: 'On-Air Host & Personality',
    icon: Mic,
    desc: 'Host live radio shows, curate playlist sets, and interview campus luminaries.'
  },
  {
    id: 'Content & Scriptwriting',
    name: 'Content & Scriptwriting',
    subtitle: 'Writers & Storytellers',
    icon: FileText,
    desc: 'Draft show concepts, radio dramas, campus news digests, and podcast narratives.'
  },
  {
    id: 'Audio Production',
    name: 'Audio Production',
    subtitle: 'Studio Engineers & Mixers',
    icon: Sliders,
    desc: 'Master studio podcasts, create station IDs and sweepers, and equalize broadcast audio.'
  },
  {
    id: 'Technical',
    name: 'Technical',
    subtitle: 'Broadcast Engineers & Web',
    icon: Radio,
    desc: 'Maintain Icecast streams, manage transmitter racks, and build station digital tools.'
  },
  {
    id: 'Social Media',
    name: 'Social Media',
    subtitle: 'Digital Marketing & Community',
    icon: Share2,
    desc: 'Grow our listener audience through live booth reels, TikTok coverage, and promo campaigns.'
  },
  {
    id: 'Design',
    name: 'Design',
    subtitle: 'Visual Identity & Creatives',
    icon: Palette,
    desc: 'Design show album art, gig posters, station merchandise, and digital artwork.'
  },
  {
    id: 'Event Management',
    name: 'Event Management',
    subtitle: 'Ground Operations & Shows',
    icon: Calendar,
    desc: 'Coordinate campus music festivals, live quad broadcasts, and open-mic concerts.'
  }
];

export const ACADEMIC_YEARS = [
  { value: '1st Year', label: '1st Year (Freshman)' },
  { value: '2nd Year', label: '2nd Year (Sophomore)' },
  { value: '3rd Year', label: '3rd Year (Junior)' },
  { value: '4th Year', label: '4th Year (Senior)' },
  { value: 'Postgraduate', label: 'Postgraduate / Masters / PhD' }
];

export default function ApplicationForm({ onSubmitted }) {
  const { user, profile, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    collegeEmail: user?.email || '',
    phone: profile?.phone || '',
    department: profile?.department || '',
    academicYear: profile?.year || '1st Year',
    preferredTeam: 'Radio Jockey',
    skillsInterests: '',
    introduction: ''
  });

  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [existingApp, setExistingApp] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(false);

  // Sync profile details when auth state updates
  useEffect(() => {
    if (profile?.full_name && !formData.fullName) {
      setFormData((prev) => ({ ...prev, fullName: profile.full_name }));
    }
    if (user?.email && !formData.collegeEmail) {
      setFormData((prev) => ({ ...prev, collegeEmail: user.email }));
    }
    if (profile?.phone && !formData.phone) {
      setFormData((prev) => ({ ...prev, phone: profile.phone }));
    }
    if (profile?.department && !formData.department) {
      setFormData((prev) => ({ ...prev, department: profile.department }));
    }
  }, [profile, user]);

  // Check if this student already has a pending application on file
  useEffect(() => {
    let isMounted = true;
    async function checkExisting() {
      if (!isSupabaseConfigured || (!user?.id && !formData.collegeEmail)) {
        return;
      }
      setCheckingExisting(true);
      try {
        const { hasPending, application } = await applicationService.checkPendingApplication(
          user?.id || null,
          formData.collegeEmail || null
        );
        if (isMounted && hasPending && application) {
          setExistingApp(application);
        }
      } catch (err) {
        console.warn('Pending application check:', err.message);
      } finally {
        if (isMounted) setCheckingExisting(false);
      }
    }
    checkExisting();
    return () => {
      isMounted = false;
    };
  }, [user?.id, formData.collegeEmail]);

  const validatePhone = (phone) => {
    const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    return cleaned.length >= 7 && cleaned.length <= 15 && /^\d+$/.test(cleaned);
  };

  const validate = () => {
    const errors = {};
    const collegeDomain = import.meta.env.VITE_COLLEGE_EMAIL_DOMAIN;

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required.';
    } else if (formData.fullName.trim().length > 80) {
      errors.fullName = 'Full name cannot exceed 80 characters.';
    }

    if (!formData.collegeEmail.trim()) {
      errors.collegeEmail = 'College email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.collegeEmail.trim())) {
      errors.collegeEmail = 'Please provide a valid college email address.';
    } else if (collegeDomain && !formData.collegeEmail.trim().toLowerCase().endsWith(collegeDomain.toLowerCase())) {
      errors.collegeEmail = `Must be an official college email ending with ${collegeDomain}.`;
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required for team interview coordination.';
    } else if (!validatePhone(formData.phone.trim())) {
      errors.phone = 'Please provide a valid phone number (at least 7 digits).';
    }

    if (!formData.department.trim()) {
      errors.department = 'Academic department is required.';
    } else if (formData.department.trim().length > 60) {
      errors.department = 'Department name is too long.';
    }

    if (!formData.academicYear) {
      errors.academicYear = 'Current academic year is required.';
    }

    if (!formData.preferredTeam) {
      errors.preferredTeam = 'Please select your preferred team.';
    }

    if (formData.skillsInterests.trim().length > 300) {
      errors.skillsInterests = 'Skills and interests cannot exceed 300 characters.';
    }

    if (!formData.introduction.trim()) {
      errors.introduction = 'Short introduction is required.';
    } else if (formData.introduction.trim().length < 25) {
      errors.introduction = 'Please provide at least 25 characters introducing yourself and your goals.';
    } else if (formData.introduction.trim().length > 700) {
      errors.introduction = 'Introduction cannot exceed 700 characters.';
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
      const res = await applicationService.submitApplication({
        userId: user?.id || null,
        fullName: formData.fullName,
        collegeEmail: formData.collegeEmail,
        phone: formData.phone,
        department: formData.department,
        academicYear: formData.academicYear,
        preferredTeam: formData.preferredTeam,
        skillsInterests: formData.skillsInterests,
        introduction: formData.introduction
      });

      if (res.error) {
        if (res.error.code === 'DUPLICATE_APPLICATION') {
          setExistingApp(res.error.existingApplication || true);
          setStatus('idle');
        } else {
          setStatus('error');
          setErrorMessage(res.error.message || 'Application failed to submit.');
        }
      } else {
        setStatus('success');
        if (onSubmitted) onSubmitted(res.data);
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || 'An unexpected error occurred during submission.');
    }
  };

  // If user already has an active pending application on file
  if (existingApp) {
    return (
      <div className="radio-card app-existing-card font-mono" role="status">
        <div className="existing-icon-badge">
          <Clock size={36} className="text-accent-blue" />
        </div>
        <h2 className="existing-title font-display">Active Application On File</h2>
        <p className="existing-desc">
          You currently have a pending application submitted for the{' '}
          <strong className="text-white">
            {typeof existingApp === 'object' && existingApp.preferred_team ? existingApp.preferred_team : formData.preferredTeam}
          </strong>{' '}
          team.
        </p>
        <div className="existing-callout">
          <div className="callout-item">
            <span className="callout-label">STATUS</span>
            <span className="callout-value badge-pending">PENDING GUILD REVIEW</span>
          </div>
          {typeof existingApp === 'object' && existingApp.created_at && (
            <div className="callout-item">
              <span className="callout-label">SUBMITTED ON</span>
              <span className="callout-value text-white">
                {new Date(existingApp.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          )}
        </div>
        <p className="existing-note">
          To maintain fairness, each candidate may hold one active recruitment submission at a time. The executive station directors review submissions weekly.
        </p>
        <div className="existing-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary">
              <UserCheck size={16} />
              <span>VIEW IN STUDENT DASHBOARD</span>
            </Link>
          ) : (
            <Link to="/login?redirect=/join" className="btn-primary">
              <UserCheck size={16} />
              <span>SIGN IN TO TRACK STATUS</span>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Application received confirmation screen
  if (status === 'success') {
    return (
      <div className="radio-card app-success-card" role="status">
        <div className="success-icon-badge">
          <CheckCircle2 size={44} />
        </div>
        <div className="success-header">
          <span className="badge-tag font-mono">RECRUITMENT SUBMISSION RECORDED</span>
          <h2 className="success-heading font-display">Application Received!</h2>
        </div>
        <p className="success-summary">
          Thank you, <strong>{formData.fullName}</strong>. Your candidate file for the{' '}
          <strong>{formData.preferredTeam}</strong> guild has been securely registered in the CampusWave database.
        </p>

        <div className="success-notice-box font-mono">
          <div className="notice-title">IMPORTANT CANDIDATE INFORMATION:</div>
          <ul className="notice-list">
            <li>Submissions are currently under initial review with status: <strong>Pending Review</strong>.</li>
            <li>This submission confirms receipt of your portfolio and does not imply automatic admission to the studio.</li>
            <li>Our executive station leads review candidate batches on a weekly schedule.</li>
            <li>Shortlisted students will be contacted via <strong>{formData.collegeEmail}</strong> and WhatsApp for studio audiotests/interviews.</li>
          </ul>
        </div>

        <div className="success-actions font-mono">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary">
              <span>VIEW STATUS ON DASHBOARD</span>
              <ArrowRight size={15} />
            </Link>
          ) : (
            <Link to="/login?redirect=/dashboard" className="btn-primary">
              <span>SIGN IN TO LINK PORTFOLIO</span>
              <ArrowRight size={15} />
            </Link>
          )}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setStatus('idle');
              setFormData({
                fullName: profile?.full_name || '',
                collegeEmail: user?.email || '',
                phone: '',
                department: '',
                academicYear: '1st Year',
                preferredTeam: 'Radio Jockey',
                skillsInterests: '',
                introduction: ''
              });
            }}
          >
            <span>SUBMIT ANOTHER APPLICATION</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="application-form-container">
      {!isSupabaseConfigured && <FormStatus unconfigured={true} />}

      <FormStatus
        status={status}
        title="Application Submission Failed"
        message={errorMessage}
      />

      <form onSubmit={handleSubmit} noValidate>
        {/* Section 1: Candidate Identification */}
        <div className="form-subheading">
          <span className="subheading-num font-mono">01</span>
          <span className="subheading-text">Candidate Information</span>
        </div>

        <div className="form-grid-2">
          <FormField
            id="app-full-name"
            label="Full Name"
            required={true}
            placeholder="e.g. Jordan Smith"
            value={formData.fullName}
            onChange={(e) => {
              setFormData({ ...formData, fullName: e.target.value });
              if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: '' });
            }}
            error={fieldErrors.fullName}
            maxLength={80}
            disabled={status === 'submitting'}
            autoComplete="name"
          />

          <FormField
            id="app-college-email"
            label="Official College Email"
            type="email"
            required={true}
            placeholder="e.g. jordan@college.edu"
            value={formData.collegeEmail}
            onChange={(e) => {
              setFormData({ ...formData, collegeEmail: e.target.value });
              if (fieldErrors.collegeEmail) setFieldErrors({ ...fieldErrors, collegeEmail: '' });
            }}
            error={fieldErrors.collegeEmail}
            maxLength={100}
            disabled={status === 'submitting'}
            autoComplete="email"
            helperText="We will communicate audition schedules to this address."
          />
        </div>

        <div className="form-grid-3">
          <FormField
            id="app-phone"
            label="Phone Number"
            type="tel"
            required={true}
            placeholder="e.g. +1 555-0199"
            value={formData.phone}
            onChange={(e) => {
              setFormData({ ...formData, phone: e.target.value });
              if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
            }}
            error={fieldErrors.phone}
            maxLength={20}
            disabled={status === 'submitting'}
            autoComplete="tel"
          />

          <FormField
            id="app-department"
            label="Department / Major"
            required={true}
            placeholder="e.g. Computer Science"
            value={formData.department}
            onChange={(e) => {
              setFormData({ ...formData, department: e.target.value });
              if (fieldErrors.department) setFieldErrors({ ...fieldErrors, department: '' });
            }}
            error={fieldErrors.department}
            maxLength={60}
            disabled={status === 'submitting'}
          />

          <FormField
            id="app-academic-year"
            label="Academic Year"
            type="select"
            required={true}
            options={ACADEMIC_YEARS}
            value={formData.academicYear}
            onChange={(e) => {
              setFormData({ ...formData, academicYear: e.target.value });
              if (fieldErrors.academicYear) setFieldErrors({ ...fieldErrors, academicYear: '' });
            }}
            error={fieldErrors.academicYear}
            disabled={status === 'submitting'}
          />
        </div>

        {/* Section 2: Team Guild Preference */}
        <div className="form-subheading">
          <span className="subheading-num font-mono">02</span>
          <span className="subheading-text">Select Preferred Team Guild *</span>
        </div>

        <div className="team-selector-grid" role="radiogroup" aria-label="Preferred Team Selection">
          {TEAMS.map((t) => {
            const Icon = t.icon;
            const isSelected = formData.preferredTeam === t.id;
            return (
              <button
                type="button"
                key={t.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                className={`team-select-card ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setFormData({ ...formData, preferredTeam: t.id });
                  if (fieldErrors.preferredTeam) setFieldErrors({ ...fieldErrors, preferredTeam: '' });
                }}
                disabled={status === 'submitting'}
              >
                <div className="team-select-header">
                  <div className="team-icon-bubble">
                    <Icon size={18} />
                  </div>
                  <span className="team-radio-indicator">
                    <span className="team-radio-inner" />
                  </span>
                </div>
                <div className="team-select-name font-display">{t.name}</div>
                <div className="team-select-sub font-mono">{t.subtitle}</div>
                <div className="team-select-desc">{t.desc}</div>
              </button>
            );
          })}
        </div>
        {fieldErrors.preferredTeam && (
          <div className="form-field-error font-mono" style={{ marginTop: 8 }}>
            {fieldErrors.preferredTeam}
          </div>
        )}

        {/* Section 3: Experience & Statement */}
        <div className="form-subheading" style={{ marginTop: 28 }}>
          <span className="subheading-num font-mono">03</span>
          <span className="subheading-text">Background & Creative Introduction</span>
        </div>

        <FormField
          id="app-skills"
          label="Skills & Creative Tools (Optional)"
          placeholder="e.g. Adobe Premiere, Audacity, FL Studio, Canva, Event Logistics, Public Speaking"
          value={formData.skillsInterests}
          onChange={(e) => {
            setFormData({ ...formData, skillsInterests: e.target.value });
            if (fieldErrors.skillsInterests) setFieldErrors({ ...fieldErrors, skillsInterests: '' });
          }}
          error={fieldErrors.skillsInterests}
          maxLength={300}
          disabled={status === 'submitting'}
          helperText="Relevant technical tools, microphones, software or past club experiences."
        />

        <FormField
          id="app-intro"
          label="Short Introduction & Why You Want to Join"
          type="textarea"
          required={true}
          rows={5}
          placeholder="Tell us about yourself, why you want to contribute to CampusWave 104.2 FM, and what kind of show, sound or energy you would bring to the station (minimum 25 characters)..."
          value={formData.introduction}
          onChange={(e) => {
            setFormData({ ...formData, introduction: e.target.value });
            if (fieldErrors.introduction) setFieldErrors({ ...fieldErrors, introduction: '' });
          }}
          error={fieldErrors.introduction}
          maxLength={700}
          disabled={status === 'submitting'}
          helperText="Our executive directors read every word. Be authentic!"
        />

        <div className="application-footer-bar">
          <div className="application-meta-note font-mono">
            <span>• 104.2 FM Guild Recruitment</span>
            <span className="separator">/</span>
            <span>All college departments eligible</span>
          </div>

          <button
            type="submit"
            className="btn-primary font-mono application-submit-btn"
            disabled={status === 'submitting' || !isSupabaseConfigured || checkingExisting}
            aria-busy={status === 'submitting'}
          >
            {status === 'submitting' ? (
              <>
                <Loader2 size={16} className="spin-icon" />
                <span>LOGGING CANDIDACY...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>SUBMIT APPLICATION FOR REVIEW</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
