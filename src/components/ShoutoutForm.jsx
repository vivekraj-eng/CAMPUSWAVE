import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import { requestService } from '../services/request-service';
import { isSupabaseConfigured } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import FormField from './FormField';
import FormStatus from './FormStatus';

export default function ShoutoutForm({ onSubmitted }) {
  const { user, profile } = useAuth();

  const [formData, setFormData] = useState({
    studentName: profile?.full_name || '',
    studentEmail: user?.email || '',
    recipientName: '',
    message: '',
    dedication: ''
  });

  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (profile?.full_name && !formData.studentName) {
      setFormData((prev) => ({ ...prev, studentName: profile.full_name }));
    }
    if (user?.email && !formData.studentEmail) {
      setFormData((prev) => ({ ...prev, studentEmail: user.email }));
    }
  }, [profile, user]);

  const validate = () => {
    const errors = {};
    const collegeDomain = import.meta.env.VITE_COLLEGE_EMAIL_DOMAIN;

    if (!formData.studentName.trim()) {
      errors.studentName = 'Student name is required.';
    } else if (formData.studentName.trim().length > 80) {
      errors.studentName = 'Name cannot exceed 80 characters.';
    }

    if (!formData.studentEmail.trim()) {
      errors.studentEmail = 'College email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.studentEmail.trim())) {
      errors.studentEmail = 'Please provide a valid email address.';
    } else if (collegeDomain && !formData.studentEmail.trim().toLowerCase().endsWith(collegeDomain.toLowerCase())) {
      errors.studentEmail = `Must be an official college email ending with ${collegeDomain}.`;
    }

    if (formData.recipientName.trim().length > 80) {
      errors.recipientName = 'Recipient name cannot exceed 80 characters.';
    }

    if (!formData.message.trim()) {
      errors.message = 'Shout-out message is required.';
    } else if (formData.message.trim().length < 8) {
      errors.message = 'Message must be at least 8 characters long.';
    } else if (formData.message.trim().length > 300) {
      errors.message = 'Message cannot exceed 300 characters.';
    }

    if (formData.dedication.trim().length > 200) {
      errors.dedication = 'Dedication cannot exceed 200 characters.';
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
      const res = await requestService.submitShoutout({
        studentName: formData.studentName,
        studentEmail: formData.studentEmail,
        userId: user?.id || null,
        recipientName: formData.recipientName,
        message: formData.message,
        dedication: formData.dedication
      });

      if (res.error) {
        setStatus('error');
        setErrorMessage(res.error.message || 'Submission failed. Please check your connection.');
      } else {
        setStatus('success');
        setFormData((prev) => ({
          ...prev,
          recipientName: '',
          message: '',
          dedication: ''
        }));
        if (onSubmitted) onSubmitted(res.data);
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || 'An unexpected error occurred during submission.');
    }
  };

  return (
    <div className="shoutout-form-wrapper">
      {!isSupabaseConfigured && <FormStatus unconfigured={true} />}

      <FormStatus
        status={status}
        title={status === 'success' ? 'Shout-out Queued for Broadcast!' : 'Transmission Error'}
        message={
          status === 'success'
            ? 'Your shout-out has been delivered to the studio console. Listen live on CampusWave 104.2 FM to hear it on air.'
            : errorMessage
        }
      />

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid-2">
          <FormField
            id="so-student-name"
            label="Student Name"
            required={true}
            placeholder="e.g. Maya Lin"
            value={formData.studentName}
            onChange={(e) => {
              setFormData({ ...formData, studentName: e.target.value });
              if (fieldErrors.studentName) setFieldErrors({ ...fieldErrors, studentName: '' });
            }}
            error={fieldErrors.studentName}
            maxLength={80}
            disabled={status === 'submitting'}
            autoComplete="name"
          />

          <FormField
            id="so-student-email"
            label="College Email"
            type="email"
            required={true}
            placeholder="e.g. maya@college.edu"
            value={formData.studentEmail}
            onChange={(e) => {
              setFormData({ ...formData, studentEmail: e.target.value });
              if (fieldErrors.studentEmail) setFieldErrors({ ...fieldErrors, studentEmail: '' });
            }}
            error={fieldErrors.studentEmail}
            maxLength={100}
            disabled={status === 'submitting'}
            autoComplete="email"
          />
        </div>

        <div className="form-grid-2">
          <FormField
            id="so-recipient-name"
            label="Recipient Name (Optional)"
            placeholder="e.g. Jordan or The Robotics Crew"
            value={formData.recipientName}
            onChange={(e) => {
              setFormData({ ...formData, recipientName: e.target.value });
              if (fieldErrors.recipientName) setFieldErrors({ ...fieldErrors, recipientName: '' });
            }}
            error={fieldErrors.recipientName}
            maxLength={80}
            disabled={status === 'submitting'}
            helperText="Who is this shout-out directed to?"
          />

          <FormField
            id="so-dedication"
            label="Dedication / Context (Optional)"
            placeholder="e.g. For acing the midterms or club anniversary"
            value={formData.dedication}
            onChange={(e) => {
              setFormData({ ...formData, dedication: e.target.value });
              if (fieldErrors.dedication) setFieldErrors({ ...fieldErrors, dedication: '' });
            }}
            error={fieldErrors.dedication}
            maxLength={200}
            disabled={status === 'submitting'}
            helperText="Occasion or context for the booth."
          />
        </div>

        <FormField
          id="so-message"
          label="Shout-out Message"
          type="textarea"
          required={true}
          rows={4}
          placeholder="Type your message to be announced live on air (e.g. Happy 21st Birthday Alex! From everyone at Newton Hall)..."
          value={formData.message}
          onChange={(e) => {
            setFormData({ ...formData, message: e.target.value });
            if (fieldErrors.message) setFieldErrors({ ...fieldErrors, message: '' });
          }}
          error={fieldErrors.message}
          maxLength={300}
          disabled={status === 'submitting'}
          helperText="Broadcasted across the campus stream upon DJ review."
        />

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary font-mono submit-button"
            disabled={status === 'submitting' || !isSupabaseConfigured}
            aria-busy={status === 'submitting'}
          >
            {status === 'submitting' ? (
              <>
                <Loader2 size={16} className="spin-icon" />
                <span>DELIVERING TO BOOTH...</span>
              </>
            ) : (
              <>
                <MessageSquare size={15} />
                <span>SEND SHOUT-OUT TO BOOTH</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
