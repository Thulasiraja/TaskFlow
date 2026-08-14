// server/database/seed.js
//
// Resets and seeds the database with a demo board, its three columns,
// and a handful of realistic sample tasks. Run with: npm run db:seed

const path = require('path');
const { createConnection, initializeSchema } = require('../src/db/database');

function seed(db) {
    initializeSchema(db); // drops + recreates tables, so this is always a clean slate

    const insertBoard = db.prepare('INSERT INTO boards (name) VALUES (?)');
    const boardId = insertBoard.run('TaskFlow Demo Board').lastInsertRowid;

    const insertColumn = db.prepare(
        'INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)'
    );
    const todoId = insertColumn.run(boardId, 'To Do', 0).lastInsertRowid;
    const inProgressId = insertColumn.run(boardId, 'In Progress', 1).lastInsertRowid;
    const doneId = insertColumn.run(boardId, 'Done', 2).lastInsertRowid;

    const insertTask = db.prepare(
        `INSERT INTO tasks (column_id, title, description, priority) VALUES (?, ?, ?, ?)`
    );

    insertTask.run(
        todoId,
        'Create project structure',
        'Set up the client/server folders, install dependencies, and wire up the dev scripts.',
        'Medium'
    );
    insertTask.run(
        todoId,
        'Test application',
        'Write and run backend tests covering validation, moving tasks, and the database layer.',
        'Low'
    );
    insertTask.run(
        inProgressId,
        'Build API',
        'Implement REST endpoints for boards and tasks with validation and error handling.',
        'High'
    );
    insertTask.run(
        doneId,
        'Build React UI',
        'Board, Column, and TaskCard components with create/edit/delete/move and filtering.',
        'High'
    );

    console.log(`Seeded board "${boardId}" with 3 columns and 4 tasks.`);
}

if (require.main === module) {
    const db = createConnection();
    seed(db);
    db.close();
}

module.exports = { seed };
