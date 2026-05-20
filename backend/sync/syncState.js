const { run, get } = require('./dbUtil');

const KEY_LAST_PULL = 'last_pull_at';
const DEFAULT_SINCE = '1970-01-01T00:00:00.000Z';

async function ensureSyncMetaTable(db) {
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS SyncMeta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`
  );
}

async function getLastPullAt(db) {
  await ensureSyncMetaTable(db);
  const row = await get(db, `SELECT value FROM SyncMeta WHERE key = ?`, [KEY_LAST_PULL]);
  return row ? row.value : DEFAULT_SINCE;
}

async function setLastPullAt(db, iso) {
  await ensureSyncMetaTable(db);
  await run(
    db,
    `INSERT INTO SyncMeta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [KEY_LAST_PULL, iso]
  );
}

module.exports = { getLastPullAt, setLastPullAt, DEFAULT_SINCE };
