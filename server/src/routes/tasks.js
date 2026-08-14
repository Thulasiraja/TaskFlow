// server/src/routes/tasks.js

const express = require('express');
const controller = require('../controllers/taskController');
const {
    validateCreateTask,
    validateUpdateTask,
    validateMoveTask,
    validatePriorityParam,
} = require('../middleware/validate');

const router = express.Router();

router.get('/', controller.listTasks);
router.get('/priority/:priority', validatePriorityParam, controller.getTasksByPriority);
router.post('/', validateCreateTask, controller.createTask);
router.put('/:id', validateUpdateTask, controller.updateTask);
router.delete('/:id', controller.deleteTask);
router.patch('/:id/move', validateMoveTask, controller.moveTask);

module.exports = router;
