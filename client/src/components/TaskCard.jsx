import React from 'react';

const PRIORITY_CLASS = {
  Low: 'priority-low',
  Medium: 'priority-medium',
  High: 'priority-high',
};

function formatDate(dateStr) {
  // SQLite datetime('now') returns 'YYYY-MM-DD HH:MM:SS' (UTC)
  const iso = dateStr.replace(' ', 'T') + 'Z';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TaskCard({ task, columns, onEdit, onDelete, onMove, dragEnabled }) {
  const otherColumns = columns.filter((c) => c.id !== task.column_id);

  return (
    <div
      className="task-card"
      draggable={dragEnabled}
      onDragStart={(e) => {
        if (!dragEnabled) return;
        e.dataTransfer.setData('text/plain', String(task.id));
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
      <div className="task-card-header">
        <span className={`priority-badge ${PRIORITY_CLASS[task.priority] || ''}`}>{task.priority}</span>
        <span className="task-date">{formatDate(task.created_at)}</span>
      </div>

      <h4 className="task-title">{task.title}</h4>
      {task.description && <p className="task-description">{task.description}</p>}

      <div className="task-card-footer">
        {otherColumns.length > 0 && (
          <select
            className="move-select"
            value=""
            onChange={(e) => {
              if (e.target.value) onMove(task.id, Number(e.target.value));
            }}
            aria-label={`Move "${task.title}" to another column`}
          >
            <option value="" disabled>
              Move to...
            </option>
            {otherColumns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        <div className="task-actions">
          <button className="icon-btn" onClick={() => onEdit(task)} aria-label="Edit task">
            Edit
          </button>
          <button className="icon-btn danger" onClick={() => onDelete(task)} aria-label="Delete task">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
