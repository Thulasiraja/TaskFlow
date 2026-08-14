import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Board from './components/Board.jsx';
import FilterBar from './components/FilterBar.jsx';
import TaskForm from './components/TaskForm.jsx';
import ErrorMessage from './components/ErrorMessage.jsx';
import { api } from './services/api.js';

const BOARD_ID = 1; // TaskFlow ships with a single demo board.

export default function App() {
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [priorityFilter, setPriorityFilter] = useState('All');
  const [search, setSearch] = useState('');

  const [formState, setFormState] = useState(null); // { mode: 'create'|'edit', columnId?, task? }

  const loadBoard = useCallback(async () => {
    try {
      setError('');
      const data = await api.getBoard(BOARD_ID);
      setBoard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  // Derive the filtered/searched view without touching the source-of-truth board state,
  // so filters never risk desyncing from what's actually in the database.
  const visibleColumns = useMemo(() => {
    if (!board) return [];
    const query = search.trim().toLowerCase();

    return board.columns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((task) => {
        const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
        const matchesSearch = query.length === 0 || task.title.toLowerCase().includes(query);
        return matchesPriority && matchesSearch;
      }),
    }));
  }, [board, priorityFilter, search]);

  const handleAddTask = (columnId) => {
    setFormState({ mode: 'create', columnId: columnId ?? board.columns[0]?.id });
  };

  const handleEditTask = (task) => {
    setFormState({ mode: 'edit', task });
  };

  const handleFormSubmit = async (values) => {
    if (formState.mode === 'create') {
      await api.createTask({ ...values, columnId: formState.columnId });
    } else {
      await api.updateTask(formState.task.id, values);
    }
    setFormState(null);
    await loadBoard();
  };

  const handleDelete = async (task) => {
    const confirmed = window.confirm(`Delete "${task.title}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await api.deleteTask(task.id);
      await loadBoard();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMove = async (taskId, columnId) => {
    try {
      await api.moveTask(taskId, columnId);
      await loadBoard();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>TaskFlow</h1>
      </header>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {loading && <p className="loading-state">Loading board...</p>}

      {!loading && !board && !error && (
        <p className="loading-state">No board found. Run the seed script to create one.</p>
      )}

      {!loading && board && (
        <>
          <FilterBar
            priority={priorityFilter}
            onPriorityChange={setPriorityFilter}
            search={search}
            onSearchChange={setSearch}
            onAddTask={() => handleAddTask()}
          />

          <Board
            columns={visibleColumns}
            onEdit={handleEditTask}
            onDelete={handleDelete}
            onMove={handleMove}
            onAddTask={handleAddTask}
          />
        </>
      )}

      {formState && (
        <TaskForm
          mode={formState.mode}
          initialValues={formState.mode === 'edit' ? formState.task : null}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormState(null)}
        />
      )}
    </div>
  );
}
