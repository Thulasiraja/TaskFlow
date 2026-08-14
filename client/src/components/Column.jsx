import React, { useState } from 'react';
import TaskCard from './TaskCard.jsx';

export default function Column({ column, columns, onEdit, onDelete, onMove, onAddTask }) {
  const [dragOver, setDragOver] = useState(false);
  const dragEnabled = true;

  return (
    <div
      className={`column ${dragOver ? 'drag-over' : ''}`}
      onDragOver={(e) => {
        if (!dragEnabled) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const taskId = Number(e.dataTransfer.getData('text/plain'));
        if (taskId && !Number.isNaN(taskId)) {
          onMove(taskId, column.id);
        }
      }}
    >
      <div className="column-header">
        <h3>{column.name}</h3>
        <span className="task-count">{column.tasks.length}</span>
      </div>

      <div className="column-body">
        {column.tasks.length === 0 && <p className="empty-column">No tasks here.</p>}
        {column.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            columns={columns}
            onEdit={onEdit}
            onDelete={onDelete}
            onMove={onMove}
            dragEnabled={dragEnabled}
          />
        ))}
      </div>

      <button className="add-task-btn" onClick={() => onAddTask(column.id)}>
        + Add task
      </button>
    </div>
  );
}
