// backend/db.js

const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Path to the SQLite database file
const dbPath = path.join(__dirname, '../database/pharmasync.db');

// Create and export the database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

module.exports = db;
