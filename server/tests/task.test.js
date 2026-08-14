// server/tests/task.test.js
//
// Uses a fresh in-memory-style SQLite file per test run (not the real
// dev database) so tests never touch real data and can run repeatedly.

const path = require('path');
const fs = require('fs');
const request = require('supertest');

const TEST_DB_PATH = path.join(__dirname, 'test.db');
process.env.TASKFLOW_DB_PATH = TEST_DB_PATH;

const { createConnection, initializeSchema } = require('../src/db/database');
const queries = require('../src/db/queries');
const createApp = require('../src/app');

let db;
let app;
let boardId;
let todoColumnId;
let inProgressColumnId;

beforeAll(() => {
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
    db = createConnection(TEST_DB_PATH);
    initializeSchema(db);
    app = createApp(db);
});

afterAll(() => {
    db.close();
    if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
});

beforeEach(() => {
    // Reset tables between tests for isolation.
    db.exec('DELETE FROM tasks; DELETE FROM columns; DELETE FROM boards;');
    boardId = db.prepare('INSERT INTO boards (name) VALUES (?)').run('Test Board').lastInsertRowid;
    todoColumnId = db
        .prepare('INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)')
        .run(boardId, 'To Do', 0).lastInsertRowid;
    inProgressColumnId = db
        .prepare('INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)')
        .run(boardId, 'In Progress', 1).lastInsertRowid;
});

describe('TEST 1: Creating a task without a title must fail', () => {
    test('rejects a missing title', async () => {
        const res = await request(app)
            .post('/api/tasks')
            .send({ columnId: todoColumnId, description: 'no title here' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/title/i);
    });

    test('rejects an empty string title', async () => {
        const res = await request(app).post('/api/tasks').send({ columnId: todoColumnId, title: '' });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/title/i);
    });

    test('rejects a whitespace-only title', async () => {
        const res = await request(app).post('/api/tasks').send({ columnId: todoColumnId, title: '   ' });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/title/i);
    });

    test('accepts a valid title and persists the task', async () => {
        const res = await request(app)
            .post('/api/tasks')
            .send({ columnId: todoColumnId, title: 'Write tests', priority: 'High' });

        expect(res.status).toBe(201);
        expect(res.body.title).toBe('Write tests');
        expect(res.body.priority).toBe('High');
    });
});

describe('TEST 2: Moving a task must update its column/status correctly', () => {
    test('moves a task from To Do to In Progress', async () => {
        const created = await request(app)
            .post('/api/tasks')
            .send({ columnId: todoColumnId, title: 'Move me' });

        const taskId = created.body.id;

        const moveRes = await request(app)
            .patch(`/api/tasks/${taskId}/move`)
            .send({ columnId: inProgressColumnId });

        expect(moveRes.status).toBe(200);
        expect(moveRes.body.column_id).toBe(inProgressColumnId);

        // Confirm the change persisted in the database, not just the response.
        const persisted = queries.getTaskById(db, taskId);
        expect(persisted.column_id).toBe(inProgressColumnId);
    });

    test('returns 400 when moving to a non-existent column', async () => {
        const created = await request(app)
            .post('/api/tasks')
            .send({ columnId: todoColumnId, title: 'Stay put' });

        const res = await request(app)
            .patch(`/api/tasks/${created.body.id}/move`)
            .send({ columnId: 999999 });

        expect(res.status).toBe(400);
    });
});

describe('TEST 3: Database-layer query returns correct results using known seed data', () => {
    beforeEach(() => {
        db.prepare(
            'INSERT INTO tasks (column_id, title, priority) VALUES (?, ?, ?)'
        ).run(todoColumnId, 'Low priority task', 'Low');
        db.prepare(
            'INSERT INTO tasks (column_id, title, priority) VALUES (?, ?, ?)'
        ).run(todoColumnId, 'High priority task A', 'High');
        db.prepare(
            'INSERT INTO tasks (column_id, title, priority) VALUES (?, ?, ?)'
        ).run(inProgressColumnId, 'High priority task B', 'High');
    });

    test('countTasksPerColumn returns correct counts per column', () => {
        const counts = queries.countTasksPerColumn(db, boardId);
        const todoCount = counts.find((c) => c.column_id === todoColumnId);
        const inProgressCount = counts.find((c) => c.column_id === inProgressColumnId);

        expect(todoCount.task_count).toBe(2);
        expect(inProgressCount.task_count).toBe(1);
    });

    test('getTasksByPriority returns only High priority tasks, newest first', () => {
        const highPriorityTasks = queries.getTasksByPriority(db, 'High');

        expect(highPriorityTasks).toHaveLength(2);
        expect(highPriorityTasks.every((t) => t.priority === 'High')).toBe(true);
        // Most recently inserted ('High priority task B') should come first.
        expect(highPriorityTasks[0].title).toBe('High priority task B');
    });
});
