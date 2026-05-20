const localDb = require('../db');
const { run, get, all } = require('./dbUtil');
const { applyOutboxRow } = require('./remoteBridge');
const { fetchRemoteRow } = require('./remoteRead');
const { shouldPushLocal } = require('./conflict');
const { buildFailureUpdate, MAX_RETRIES: OUTBOX_MAX_RETRIES } = require('./outboxRetry');
const { mergeProduct, mergeCustomer, mergeSale } = require('./mergePull');
const { getSupabase } = require('./supabaseClient');
const config = require('../config');

const MAX_BATCH = 50;
const MAX_RETRIES = OUTBOX_MAX_RETRIES;

async function countPending() {
  const now = new Date().toISOString();
  const row = await get(
    localDb,
    `SELECT COUNT(*) AS c FROM Outbox WHERE retry_count < ? AND (next_retry_at IS NULL OR next_retry_at <= ?)`,
    [MAX_RETRIES, now]
  );
  return row ? row.c : 0;
}

async function reconcileRemoteWins(tableName, remoteRow) {
  if (!remoteRow) return;
  if (tableName === 'Products') await mergeProduct(localDb, remoteRow);
  else if (tableName === 'Customers') await mergeCustomer(localDb, remoteRow);
  else if (tableName === 'Sales') {
    const sb = config.useSupabase ? getSupabase() : null;
    await mergeSale(localDb, config.useSupabase ? null : require('../remoteDb'), remoteRow, sb);
  }
}

async function markEntitySynced(tableName, id) {
  if (!id) return;
  if (tableName === 'Products') await run(localDb, `UPDATE Products SET synced = 1 WHERE id = ?`, [id]);
  else if (tableName === 'Customers') await run(localDb, `UPDATE Customers SET synced = 1 WHERE id = ?`, [id]);
  else if (tableName === 'Sales') await run(localDb, `UPDATE Sales SET synced = 1 WHERE id = ?`, [id]);
}

async function pushOutbox() {
  const now = new Date().toISOString();
  const rows = await all(
    localDb,
    `SELECT * FROM Outbox
     WHERE retry_count < ?
       AND (next_retry_at IS NULL OR next_retry_at <= ?)
     ORDER BY id ASC
     LIMIT ?`,
    [MAX_RETRIES, now, MAX_BATCH]
  );

  let pushed = 0;
  let failed = 0;
  let remoteWon = 0;
  const errors = [];
  const conflictLog = [];

  for (const row of rows) {
    try {
      const payload = JSON.parse(row.payload);
      const entityId = payload.id;

      if (entityId != null && row.table_name !== 'Sales') {
        const remoteRow = await fetchRemoteRow(row.table_name, entityId);
        const check = shouldPushLocal(
          {
            ...payload,
            deleted: row.operation === 'SOFT_DELETE' ? 1 : payload.deleted ?? 0,
          },
          remoteRow
        );

        if (!check.push && remoteRow) {
          await reconcileRemoteWins(row.table_name, remoteRow);
          await run(localDb, `DELETE FROM Outbox WHERE id = ?`, [row.id]);
          await markEntitySynced(row.table_name, entityId);
          remoteWon += 1;
          conflictLog.push({ outboxId: row.id, table: row.table_name, id: entityId, reason: check.reason });
          continue;
        }
      }

      if (entityId != null && row.table_name === 'Sales') {
        const remoteRow = await fetchRemoteRow('Sales', entityId);
        const check = shouldPushLocal(
          {
            ...payload,
            deleted: row.operation === 'SOFT_DELETE' ? 1 : 0,
          },
          remoteRow
        );
        if (!check.push && remoteRow) {
          await reconcileRemoteWins('Sales', remoteRow);
          await run(localDb, `DELETE FROM Outbox WHERE id = ?`, [row.id]);
          await markEntitySynced('Sales', entityId);
          remoteWon += 1;
          conflictLog.push({ outboxId: row.id, table: 'Sales', id: entityId, reason: check.reason });
          continue;
        }
      }

      await applyOutboxRow(row);
      await run(localDb, `DELETE FROM Outbox WHERE id = ?`, [row.id]);
      await markEntitySynced(row.table_name, entityId);
      pushed += 1;
    } catch (e) {
      failed += 1;
      const patch = buildFailureUpdate(row.retry_count, e.message);
      errors.push({ outboxId: row.id, message: e.message, nextRetryAt: patch.next_retry_at });
      await run(
        localDb,
        `UPDATE Outbox SET retry_count = ?, last_error = ?, next_retry_at = ? WHERE id = ?`,
        [patch.retry_count, patch.last_error, patch.next_retry_at, row.id]
      );
    }
  }

  const remaining = await countPending();
  return { pushed, failed, remaining, remoteWon, errors, conflicts: conflictLog };
}

module.exports = { pushOutbox, countPending, MAX_RETRIES };
