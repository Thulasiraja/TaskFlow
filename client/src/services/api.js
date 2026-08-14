// client/src/services/api.js
//
// Thin wrapper around fetch for all backend calls. Every function throws
// an Error with a user-friendly message on failure, so components can
// just try/catch and show it -- no raw stack traces reach the UI.

const BASE_URL = '/api';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (networkErr) {
    throw new Error('Could not reach the server. Please check your connection and try again.');
  }

  if (res.status === 204) return null;

  let body = null;
  try {
    body = await res.json();
  } catch {
    // no JSON body (e.g. some error pages) - fall through with generic message
  }

  if (!res.ok) {
    throw new Error(body?.error || `Request failed with status ${res.status}.`);
  }

  return body;
}

export const api = {
  getBoard: (boardId) => request(`/boards/${boardId}`),

  createTask: (task) =>
    request('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    }),

  updateTask: (id, updates) =>
    request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteTask: (id) =>
    request(`/tasks/${id}`, {
      method: 'DELETE',
    }),

  moveTask: (id, columnId) =>
    request(`/tasks/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ columnId }),
    }),

  getTasksByPriority: (priority) => request(`/tasks/priority/${priority}`),
};
