// server/src/controllers/boardController.js

const queries = require('../db/queries');
const { ApiError } = require('../middleware/errorHandler');

function getBoard(req, res, next) {
    try {
        const db = req.app.locals.db;
        const boardId = Number(req.params.boardId);

        const board = queries.getBoardWithColumnsAndTasks(db, boardId);
        if (!board) {
            throw new ApiError(404, `Board ${boardId} not found.`);
        }

        const taskCounts = queries.countTasksPerColumn(db, boardId);
        const countByColumn = Object.fromEntries(taskCounts.map((c) => [c.column_id, c.task_count]));

        board.columns = board.columns.map((col) => ({
            ...col,
            taskCount: countByColumn[col.id] ?? col.tasks.length,
        }));

        res.json(board);
    } catch (err) {
        next(err);
    }
}

module.exports = { getBoard };
