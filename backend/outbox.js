/**
 * Outbox queue for offline-first / sync (Steps 11–12).
 * Each successful local mutation appends one row for later push to PostgreSQL.
 */
const db = require('./db');

/**
 * @param {string} table_name - e.g. Products, Customers, Sales
 * @param {string} operation - INSERT | UPDATE | SOFT_DELETE
 * @param {object} payload - JSON-serializable sync payload (include primary keys + timestamps)
 * @param {(err: Error|null) => void} [callback]
 */
function enqueue(table_name, operation, payload, callback) {
  let json;
  try {
    json = JSON.stringify(payload);
  } catch (e) {
    const err = new Error(`Outbox payload not serializable: ${e.message}`);
    console.error('[Outbox]', err.message);
    if (callback) callback(err);
    return;
  }
  const created_at = new Date().toISOString();
  db.run(
    `INSERT INTO Outbox (table_name, operation, payload, created_at, retry_count) VALUES (?, ?, ?, ?, 0)`,
    [table_name, operation, json, created_at],
    (err) => {
      if (err) console.error('[Outbox] enqueue failed:', err.message);
      if (callback) callback(err);
    }
  );
}

module.exports = { enqueue };
