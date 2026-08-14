import React from 'react';

export default function ErrorMessage({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="error-banner" role="alert">
      <span>{message}</span>
      {onDismiss && (
        <button className="dismiss-btn" onClick={onDismiss} aria-label="Dismiss error">
          &times;
        </button>
      )}
    </div>
  );
}
