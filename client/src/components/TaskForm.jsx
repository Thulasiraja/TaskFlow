import React, { useState } from 'react';

const PRIORITIES = ['Low', 'Medium', 'High'];

export default function TaskForm({ mode, initialValues, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [priority, setPriority] = useState(initialValues?.priority || 'Medium');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (title.trim().length === 0) {
      setError('Task title is required.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), priority });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{mode === 'edit' ? 'Edit Task' : 'Add Task'}</h3>

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Title *</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Write project README"
              autoFocus
            />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={3}
            />
          </label>

          <label className="field">
            <span>Priority</span>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={submitting}>
              {submitting ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
