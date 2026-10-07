import React from 'react';
import './FormField.css';

export default function FormField({
  id,
  label,
  type = 'text',
  required = false,
  error = '',
  helperText = '',
  value = '',
  onChange,
  placeholder = '',
  maxLength,
  rows = 4,
  options = [], // for select type: [{ value, label }]
  disabled = false,
  autoComplete,
  className = '',
  children
}) {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`form-field-group ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <div className="form-field-label-row">
          <label htmlFor={id} className="form-field-label">
            {label}
            {required && <span className="field-required" aria-hidden="true"> *</span>}
          </label>
          {maxLength && (
            <span className="field-char-count font-mono" aria-hidden="true">
              {String(value || '').length} / {maxLength}
            </span>
          )}
        </div>
      )}

      {children ? (
        children
      ) : type === 'textarea' ? (
        <textarea
          id={id}
          className="form-field-textarea"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          required={required}
        />
      ) : type === 'select' ? (
        <select
          id={id}
          className="form-field-select"
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          required={required}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          className="form-field-input"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          required={required}
        />
      )}

      {error ? (
        <div id={errorId} className="form-field-error font-mono" role="alert">
          {error}
        </div>
      ) : helperText ? (
        <div id={helperId} className="form-field-helper">
          {helperText}
        </div>
      ) : null}
    </div>
  );
}
