// Simulated remote PostgreSQL (Step 12) — separate SQLite file until Supabase (Step 13).

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const remotePath = path.join(__dirname, '../database/pharmasync_remote.db');
const schemaPath = path.join(__dirname, '../database/schema.sql');

const remoteDb = new sqlite3.Database(remotePath, (err) => {
  if (err) {
    console.error('[RemoteDB] Failed to connect:', err.message);
    return;
  }
  console.log('[RemoteDB] Connected (simulated cloud DB):', remotePath);
  const schema = fs.readFileSync(schemaPath, 'utf8');
  remoteDb.exec(schema, (e) => {
    if (e) console.error('[RemoteDB] Schema init error:', e.message);
  });
});

module.exports = remoteDb;
