// server/server.js
//
// Entry point: opens the SQLite connection and starts the HTTP server.

const createApp = require('./src/app');
const { createConnection, initializeSchema, DB_PATH } = require('./src/db/database');
const fs = require('fs');

const PORT = process.env.PORT || 4000;

// If the database file doesn't exist yet, create it from schema.sql so a
// fresh clone "just works" once `npm run db:setup` (or an equivalent) runs.
const dbExists = fs.existsSync(DB_PATH);
const db = createConnection();

if (!dbExists) {
    console.log('No database found - initializing schema...');
    initializeSchema(db);
}

const app = createApp(db);

app.listen(PORT, () => {
    console.log(`TaskFlow API listening on http://localhost:${PORT}`);
});
