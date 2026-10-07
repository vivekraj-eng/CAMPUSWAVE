import React, { useState, useEffect } from 'react';
import { Send, Music2, Loader2, Sparkles } from 'lucide-react';
import { requestService } from '../services/request-service';
import { isSupabaseConfigured } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import FormField from './FormField';
import FormStatus from './FormStatus';

export default function RequestForm({ onSubmitted }) {
  const { user, profile } = useAuth();

  const [formData, setFormData] = useState({
    studentName: profile?.full_name || '',
    studentEmail: user?.email || '',
    songTitle: '',
    artistName: '',
    dedication: '',
    messageToRj: ''
  });

  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Sync profile details when auth state updates
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

    if (!formData.songTitle.trim()) {
      errors.songTitle = 'Song title is required.';
    } else if (formData.songTitle.trim().length > 120) {
      errors.songTitle = 'Song title cannot exceed 120 characters.';
    }

    if (formData.artistName.trim().length > 100) {
      errors.artistName = 'Artist name cannot exceed 100 characters.';
    }

    if (formData.dedication.trim().length > 200) {
      errors.dedication = 'Dedication cannot exceed 200 characters.';
    }

    if (formData.messageToRj.trim().length > 300) {
      errors.messageToRj = 'Message to the RJ cannot exceed 300 characters.';
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
      const res = await requestService.submitSongRequest({
        studentName: formData.studentName,
        studentEmail: formData.studentEmail,
        userId: user?.id || null,
        songTitle: formData.songTitle,
        artistName: formData.artistName,
        dedication: formData.dedication,
        messageToRj: formData.messageToRj
      });

      if (res.error) {
        setStatus('error');
        setErrorMessage(res.error.message || 'Submission failed. Please check your connection.');
      } else {
        setStatus('success');
        setFormData((prev) => ({
          ...prev,
          songTitle: '',
          artistName: '',
          dedication: '',
          messageToRj: ''
        }));
        if (onSubmitted) onSubmitted(res.data);
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || 'An unexpected error occurred during submission.');
    }
  };

  return (
    <div className="request-form-wrapper">
      {!isSupabaseConfigured && <FormStatus unconfigured={true} />}

      <FormStatus
        status={status}
        title={status === 'success' ? 'Transmission Queued Successfully!' : 'Transmission Error'}
        message={
          status === 'success'
            ? 'Your track request has been securely delivered to the broadcast console. The on-air RJ will review it during live rotation.'
            : errorMessage
        }
      />

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid-2">
          <FormField
            id="song-student-name"
            label="Student Name"
            required={true}
            placeholder="e.g. Alex Rivera"
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
            id="song-student-email"
            label="College Email"
            type="email"
            required={true}
            placeholder="e.g. alex@college.edu"
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
            id="song-title"
            label="Song Title"
            required={true}
            placeholder="e.g. Midnight City"
            value={formData.songTitle}
            onChange={(e) => {
              setFormData({ ...formData, songTitle: e.target.value });
              if (fieldErrors.songTitle) setFieldErrors({ ...fieldErrors, songTitle: '' });
            }}
            error={fieldErrors.songTitle}
            maxLength={120}
            disabled={status === 'submitting'}
          />

          <FormField
            id="song-artist"
            label="Artist / Band (Optional)"
            placeholder="e.g. M83"
            value={formData.artistName}
            onChange={(e) => {
              setFormData({ ...formData, artistName: e.target.value });
              if (fieldErrors.artistName) setFieldErrors({ ...fieldErrors, artistName: '' });
            }}
            error={fieldErrors.artistName}
            maxLength={100}
            disabled={status === 'submitting'}
          />
        </div>

        <FormField
          id="song-dedication"
          label="Dedication (Optional)"
          placeholder="e.g. Dedicated to the dorm room study group"
          value={formData.dedication}
          onChange={(e) => {
            setFormData({ ...formData, dedication: e.target.value });
            if (fieldErrors.dedication) setFieldErrors({ ...fieldErrors, dedication: '' });
          }}
          error={fieldErrors.dedication}
          maxLength={200}
          disabled={status === 'submitting'}
          helperText="Who would you like this song played for?"
        />

        <FormField
          id="song-message-rj"
          label="Message to the RJ (Optional)"
          type="textarea"
          rows={3}
          placeholder="e.g. Can you play this during the evening chillout segment? Love the station!"
          value={formData.messageToRj}
          onChange={(e) => {
            setFormData({ ...formData, messageToRj: e.target.value });
            if (fieldErrors.messageToRj) setFieldErrors({ ...fieldErrors, messageToRj: '' });
          }}
          error={fieldErrors.messageToRj}
          maxLength={300}
          disabled={status === 'submitting'}
          helperText="Private studio note seen only by the on-air DJ."
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
                <span>QUEUING TRANSMISSION...</span>
              </>
            ) : (
              <>
                <Music2 size={15} />
                <span>SUBMIT SONG REQUEST</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
