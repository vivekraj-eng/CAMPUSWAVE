import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './ConfirmationModal.css';

/**
 * Reusable Accessible Confirmation Modal
 * Used for destructive or sensitive administrative operations
 * (rejecting, archiving, deleting, changing roles).
 */
export default function ConfirmationModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you wish to proceed? This operation will update station database records.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  isLoading = false,
  onConfirm,
  onCancel
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="admin-modal-backdrop" onClick={() => !isLoading && onCancel()} role="presentation">
      <div
        className="admin-modal-container radio-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={modalRef}
      >
        <button
          type="button"
          className="admin-modal-close"
          onClick={onCancel}
          disabled={isLoading}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="admin-modal-header">
          <div className={`modal-icon-bubble ${isDanger ? 'danger' : 'warning'}`}>
            <AlertTriangle size={24} />
          </div>
          <h3 id="modal-title" className="modal-title font-display">{title}</h3>
        </div>

        <div className="admin-modal-body">
          <p className="modal-message">{message}</p>
        </div>

        <div className="admin-modal-actions font-mono">
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn-modal-confirm ${isDanger ? 'danger' : 'primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="spinner-inline">Processing...</span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
