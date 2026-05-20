// backend/initDb.js

const fs = require('fs');
const path = require('path');
const db = require('./db');

const schemaPath = path.join(__dirname, '../database/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

db.exec(schema, (err) => {
  if (err) {
    console.error('Error initializing database schema:', err.message);
  } else {
    console.log('Database schema initialized successfully.');
  }
  db.close();
});
