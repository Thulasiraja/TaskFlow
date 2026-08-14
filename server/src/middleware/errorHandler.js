// server/src/middleware/errorHandler.js
//
// Central Express error handler. Ensures the frontend never sees a raw
// stack trace, and every unexpected failure still returns clean JSON.

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    console.error(`[error] ${req.method} ${req.originalUrl}:`, err.message);

    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || err.code === 'SQLITE_CONSTRAINT') {
        return res.status(400).json({ error: 'Invalid or missing related record.' });
    }

    const status = err.status || 500;
    const message = status === 500 ? 'Something went wrong on the server. Please try again.' : err.message;

    res.status(status).json({ error: message });
}

function notFoundHandler(req, res) {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

module.exports = { errorHandler, notFoundHandler, ApiError };
