// server/src/controllers/taskController.js

const queries = require('../db/queries');
const { ApiError } = require('../middleware/errorHandler');

function listTasks(req, res, next) {
    try {
        const db = req.app.locals.db;
        res.json(queries.getAllTasks(db));
    } catch (err) {
        next(err);
    }
}

function getTasksByPriority(req, res, next) {
    try {
        const db = req.app.locals.db;
        const { priority } = req.params;
        res.json(queries.getTasksByPriority(db, priority));
    } catch (err) {
        next(err);
    }
}

function createTask(req, res, next) {
    try {
        const db = req.app.locals.db;
        const { columnId, title, description, priority } = req.body;

        const column = queries.getColumnById(db, Number(columnId));
        if (!column) {
            throw new ApiError(400, `Column ${columnId} does not exist.`);
        }

        const task = queries.createTask(db, {
            columnId: Number(columnId),
            title: title.trim(),
            description: description ? String(description).trim() : null,
            priority,
        });

        res.status(201).json(task);
    } catch (err) {
        next(err);
    }
}

function updateTask(req, res, next) {
    try {
        const db = req.app.locals.db;
        const id = Number(req.params.id);
        const { title, description, priority } = req.body;

        const updated = queries.updateTask(db, id, {
            title: title !== undefined ? title.trim() : undefined,
            description: description !== undefined ? (description ? String(description).trim() : null) : undefined,
            priority,
        });

        if (!updated) {
            throw new ApiError(404, `Task ${id} not found.`);
        }

        res.json(updated);
    } catch (err) {
        next(err);
    }
}

function deleteTask(req, res, next) {
    try {
        const db = req.app.locals.db;
        const id = Number(req.params.id);

        const deleted = queries.deleteTask(db, id);
        if (!deleted) {
            throw new ApiError(404, `Task ${id} not found.`);
        }

        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

function moveTask(req, res, next) {
    try {
        const db = req.app.locals.db;
        const id = Number(req.params.id);
        const { columnId } = req.body;

        const column = queries.getColumnById(db, Number(columnId));
        if (!column) {
            throw new ApiError(400, `Column ${columnId} does not exist.`);
        }

        const moved = queries.moveTask(db, id, Number(columnId));
        if (!moved) {
            throw new ApiError(404, `Task ${id} not found.`);
        }

        res.json(moved);
    } catch (err) {
        next(err);
    }
}

module.exports = { listTasks, getTasksByPriority, createTask, updateTask, deleteTask, moveTask };
