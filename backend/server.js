// backend/server.js

const express = require('express');
const cors = require('cors');
const config = require('./config');
const db = require('./db');
const { run } = require('./sync/dbUtil');
const app = express();
const PORT = config.port;

app.use(cors());
app.use(express.json());

run(db, `CREATE TABLE IF NOT EXISTS SyncMeta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`).catch(() => {});
require('./sync/outboxMigrate').migrateOutboxColumns(db).catch((e) => console.error('[Outbox migrate]', e.message));
require('./seedBillers').seedBillers();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'PharmaSync ERP backend is running.' });
});


// API routes
app.use('/products', require('./routes/products'));
app.use('/customers', require('./routes/customers'));
app.use('/sales', require('./routes/sales'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/outbox', require('./routes/outbox'));
app.use('/sync', require('./routes/sync'));
app.use('/auth', require('./routes/auth').router);
app.use('/pharmacy', require('./routes/pharmacy'));
// Load remote DB connection (simulated cloud until Supabase in Step 13)
require('./remoteDb');

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  if (config.useSupabase) {
    console.log('[Sync] Remote: Supabase PostgreSQL');
  } else {
    console.log('[Sync] Remote: local file (pharmasync_remote.db) — add backend/.env for Supabase');
  }
});
