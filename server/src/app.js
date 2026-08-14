// server/src/app.js
//
// Express app factory. Kept separate from server.js so tests can create
// an app instance wired to an in-memory/test database without starting
// an actual HTTP listener.

const express = require('express');
const cors = require('cors');

const boardRoutes = require('./routes/boards');
const taskRoutes = require('./routes/tasks');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

function createApp(db) {
    const app = express();

    app.use(cors());
    app.use(express.json());

    // Make the db connection available to controllers via req.app.locals.db
    app.locals.db = db;

    app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

    app.use('/api/boards', boardRoutes);
    app.use('/api/tasks', taskRoutes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

module.exports = createApp;
