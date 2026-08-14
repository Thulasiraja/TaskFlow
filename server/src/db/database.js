// server/src/db/database.js

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH =
    process.env.TASKFLOW_DB_PATH ||
    path.join(__dirname, '..', '..', 'database', 'taskflow.db');

function createConnection(dbPath = DB_PATH) {
    const db = new DatabaseSync(dbPath, {
        enableForeignKeyConstraints: true
    });

    return db;
}

function initializeSchema(db) {
    const schemaPath = path.join(
        __dirname,
        '..',
        '..',
        'database',
        'schema.sql'
    );

    const schema = fs.readFileSync(schemaPath, 'utf8');

    db.exec(schema);
}

module.exports = {
    createConnection,
    initializeSchema,
    DB_PATH
};