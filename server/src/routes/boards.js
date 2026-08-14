// server/src/routes/boards.js

const express = require('express');
const { getBoard } = require('../controllers/boardController');

const router = express.Router();

router.get('/:boardId', getBoard);

module.exports = router;
