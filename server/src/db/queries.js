// server/src/db/queries.js
//
// Repository layer. All raw SQL lives here so routes/controllers stay thin
// and every query is easy to find/review in one place.

/**
 * Get a board by id along with its columns and tasks, grouped by column.
 */
function getBoardWithColumnsAndTasks(db, boardId) {
    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(boardId);
    if (!board) return null;

    const columns = db
        .prepare('SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC')
        .all(boardId);

    const tasksStmt = db.prepare('SELECT * FROM tasks WHERE column_id = ? ORDER BY created_at DESC, id DESC');
    const columnsWithTasks = columns.map((col) => ({
        ...col,
        tasks: tasksStmt.all(col.id),
    }));

    return { ...board, columns: columnsWithTasks };
}

/**
 * Required query #1: Count tasks per column on a board.
 * Uses a JOIN + GROUP BY rather than fetching every row and counting in JS.
 */
function countTasksPerColumn(db, boardId) {
    return db
        .prepare(
            `SELECT c.id AS column_id, c.name AS column_name, COUNT(t.id) AS task_count
             FROM columns c
             LEFT JOIN tasks t ON t.column_id = c.id
             WHERE c.board_id = ?
             GROUP BY c.id
             ORDER BY c.position ASC`
        )
        .all(boardId);
}

/**
 * Required query #2: Get tasks with a given priority, newest first.
 */
function getTasksByPriority(db, priority) {
    return db
        .prepare(
            `SELECT t.*, c.name AS column_name
             FROM tasks t
             JOIN columns c ON c.id = t.column_id
             WHERE t.priority = ?
             ORDER BY t.created_at DESC, t.id DESC`
        )
        .all(priority);
}

function getAllTasks(db) {
    return db
        .prepare(
            `SELECT t.*, c.name AS column_name
             FROM tasks t
             JOIN columns c ON c.id = t.column_id
             ORDER BY t.created_at DESC, t.id DESC`
        )
        .all();
}

function getTaskById(db, id) {
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

function getColumnById(db, id) {
    return db.prepare('SELECT * FROM columns WHERE id = ?').get(id);
}

function createTask(db, { columnId, title, description, priority }) {
    const stmt = db.prepare(
        `INSERT INTO tasks (column_id, title, description, priority)
         VALUES (?, ?, ?, ?)`
    );
    const result = stmt.run(columnId, title, description || null, priority || 'Medium');
    return getTaskById(db, result.lastInsertRowid);
}

function updateTask(db, id, { title, description, priority }) {
    const existing = getTaskById(db, id);
    if (!existing) return null;

    const stmt = db.prepare(
        `UPDATE tasks SET title = ?, description = ?, priority = ? WHERE id = ?`
    );
    stmt.run(
        title !== undefined ? title : existing.title,
        description !== undefined ? description : existing.description,
        priority !== undefined ? priority : existing.priority,
        id
    );
    return getTaskById(db, id);
}

function deleteTask(db, id) {
    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
}

function moveTask(db, id, columnId) {
    const existing = getTaskById(db, id);
    if (!existing) return null;

    const stmt = db.prepare('UPDATE tasks SET column_id = ? WHERE id = ?');
    stmt.run(columnId, id);
    return getTaskById(db, id);
}

module.exports = {
    getBoardWithColumnsAndTasks,
    countTasksPerColumn,
    getTasksByPriority,
    getAllTasks,
    getTaskById,
    getColumnById,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
};
