import React from 'react';

const PRIORITIES = ['All', 'Low', 'Medium', 'High'];

export default function FilterBar({ priority, onPriorityChange, search, onSearchChange, onAddTask }) {
  return (
    <div className="toolbar">
      <button className="btn primary" onClick={onAddTask}>
        + Add Task
      </button>

      <div className="filter-group">
        <label htmlFor="priority-filter">Priority</label>
        <select
          id="priority-filter"
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <input
        type="search"
        className="search-input"
        placeholder="Search tasks by title..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}
