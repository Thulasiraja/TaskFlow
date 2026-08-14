// server/src/middleware/validate.js

const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

/**
 * Validates the body of a task create request.
 * Rejects missing / empty / whitespace-only titles, per the assignment spec.
 */
function validateCreateTask(req, res, next) {
    const { title, priority, columnId } = req.body;
    const errors = [];

    if (typeof title !== 'string' || title.trim().length === 0) {
        errors.push('Task title is required.');
    }

    if (columnId === undefined || columnId === null || Number.isNaN(Number(columnId))) {
        errors.push('A valid columnId is required.');
    }

    if (priority !== undefined && priority !== null && !VALID_PRIORITIES.includes(priority)) {
        errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}.`);
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: errors[0], errors });
    }

    next();
}

/**
 * Validates the body of a task update request.
 * Fields are optional individually, but if present must be well-formed.
 */
function validateUpdateTask(req, res, next) {
    const { title, priority } = req.body;
    const errors = [];

    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
        errors.push('Task title cannot be empty.');
    }

    if (priority !== undefined && priority !== null && !VALID_PRIORITIES.includes(priority)) {
        errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}.`);
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: errors[0], errors });
    }

    next();
}

function validateMoveTask(req, res, next) {
    const { columnId } = req.body;
    if (columnId === undefined || columnId === null || Number.isNaN(Number(columnId))) {
        return res.status(400).json({ error: 'A valid columnId is required.' });
    }
    next();
}

function validatePriorityParam(req, res, next) {
    const { priority } = req.params;
    if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({ error: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}.` });
    }
    next();
}

module.exports = {
    VALID_PRIORITIES,
    validateCreateTask,
    validateUpdateTask,
    validateMoveTask,
    validatePriorityParam,
};
