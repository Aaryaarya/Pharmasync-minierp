const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const sqlite3 = require('sqlite3').verbose();
const { run, get } = require('../sync/dbUtil');
const { buildFailureUpdate, isEligibleForPush, MAX_RETRIES } = require('../sync/outboxRetry');

function openMemoryDb() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(':memory:', (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

describe('outbox retry — buildFailureUpdate', () => {
  it('increments retry_count and stores last_error', () => {
    const patch = buildFailureUpdate(0, 'Remote offline');
    assert.equal(patch.retry_count, 1);
    assert.equal(patch.last_error, 'Remote offline');
    assert.ok(patch.next_retry_at);
  });

  it('schedules next_retry_at in the future', () => {
    const before = Date.now();
    const patch = buildFailureUpdate(2, 'timeout');
    const at = new Date(patch.next_retry_at).getTime();
    assert.ok(at > before);
  });

  it('uses exponential backoff spacing between attempts', () => {
    const first = new Date(buildFailureUpdate(0, 'a').next_retry_at).getTime();
    const second = new Date(buildFailureUpdate(1, 'b').next_retry_at).getTime();
    const gapFirst = first - Date.now();
    const gapSecond = second - Date.now();
    assert.ok(gapSecond >= gapFirst);
  });
});

describe('outbox retry — isEligibleForPush', () => {
  it('skips rows that exceeded MAX_RETRIES', () => {
    assert.equal(isEligibleForPush({ retry_count: MAX_RETRIES, next_retry_at: null }), false);
  });

  it('includes fresh rows with no next_retry_at', () => {
    assert.equal(isEligibleForPush({ retry_count: 0, next_retry_at: null }), true);
  });

  it('defers rows until next_retry_at has passed', () => {
    const patch = buildFailureUpdate(1, 'fail');
    const row = { retry_count: patch.retry_count, next_retry_at: patch.next_retry_at };
    assert.equal(isEligibleForPush(row, new Date().toISOString()), false);
    assert.equal(isEligibleForPush(row, patch.next_retry_at), true);
  });
});

describe('outbox retry — SQLite persistence', () => {
  it('failed push update matches pushOutbox retry fields', async () => {
    const db = await openMemoryDb();
    await run(
      db,
      `CREATE TABLE Outbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        operation TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        next_retry_at TEXT,
        last_error TEXT
      )`
    );
    await run(
      db,
      `INSERT INTO Outbox (table_name, operation, payload, created_at, retry_count)
       VALUES ('Products', 'INSERT', '{"id":1}', '2026-01-01T00:00:00.000Z', 0)`
    );

    const patch = buildFailureUpdate(0, 'Simulated remote error');
    await run(
      db,
      `UPDATE Outbox SET retry_count = ?, last_error = ?, next_retry_at = ? WHERE id = 1`,
      [patch.retry_count, patch.last_error, patch.next_retry_at]
    );

    const row = await get(db, `SELECT * FROM Outbox WHERE id = 1`);
    assert.equal(row.retry_count, 1);
    assert.equal(row.last_error, 'Simulated remote error');
    assert.equal(row.next_retry_at, patch.next_retry_at);

    const pendingNow = await get(
      db,
      `SELECT COUNT(*) AS c FROM Outbox
       WHERE retry_count < ? AND (next_retry_at IS NULL OR next_retry_at <= ?)`,
      [MAX_RETRIES, new Date().toISOString()]
    );
    assert.equal(pendingNow.c, 0);

    const pendingLater = await get(
      db,
      `SELECT COUNT(*) AS c FROM Outbox
       WHERE retry_count < ? AND (next_retry_at IS NULL OR next_retry_at <= ?)`,
      [MAX_RETRIES, patch.next_retry_at]
    );
    assert.equal(pendingLater.c, 1);

    db.close();
  });
});
