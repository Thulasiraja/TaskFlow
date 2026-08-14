import React from 'react';
import Column from './Column.jsx';

export default function Board({ columns, onEdit, onDelete, onMove, onAddTask }) {
  return (
    <div className="board">
      {columns.map((column) => (
        <Column
          key={column.id}
          column={column}
          columns={columns}
          onEdit={onEdit}
          onDelete={onDelete}
          onMove={onMove}
          onAddTask={onAddTask}
        />
      ))}
    </div>
  );
}
