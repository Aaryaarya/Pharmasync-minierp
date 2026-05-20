const { all, run } = require('./dbUtil');

async function migrateOutboxColumns(db) {
  const cols = await all(db, `PRAGMA table_info(Outbox)`);
  const names = new Set(cols.map((c) => c.name));
  if (!names.has('next_retry_at')) {
    await run(db, `ALTER TABLE Outbox ADD COLUMN next_retry_at TEXT`);
  }
  if (!names.has('last_error')) {
    await run(db, `ALTER TABLE Outbox ADD COLUMN last_error TEXT`);
  }
}

module.exports = { migrateOutboxColumns };
