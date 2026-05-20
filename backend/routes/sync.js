const express = require('express');
const localDb = require('../db');
const config = require('../config');
const { isRemoteOnline } = require('../sync/remoteOnline');
const { pushOutbox, countPending } = require('../sync/pushOutbox');
const { pullFromRemote } = require('../sync/remoteBridge');
const { getRemoteMode } = require('../sync/remoteBridge');
const { getLastPullAt, setLastPullAt } = require('../sync/syncState');
const { get: dbGet } = require('../sync/dbUtil');

const router = express.Router();

/** GET /sync/status — for UI (no manual sync button; informational only) */
router.get('/status', async (req, res) => {
  try {
    const pending = await countPending();
    const lastPullAt = await getLastPullAt(localDb);
    const remoteReachable = await isRemoteOnline(req);
    const retryRow = await dbGet(
      localDb,
      `SELECT COUNT(*) AS c FROM Outbox WHERE retry_count > 0 AND retry_count < 8`,
      []
    ).catch(() => ({ c: 0 }));
    res.json({
      remoteReachable,
      remoteMode: getRemoteMode(),
      supabaseConfigured: config.useSupabase,
      pendingOutbox: pending,
      outboxWithRetries: retryRow?.c ?? 0,
      lastPullAt,
      conflictPolicy: 'last_write_wins + soft_delete_precedence',
      serverTime: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST /sync/push — drain Outbox to remote (simulated Postgres file until Step 13) */
router.post('/push', async (req, res) => {
  if (!(await isRemoteOnline(req))) {
    const pending = await countPending();
    return res.status(503).json({
      error: 'Remote database unreachable (offline). Changes stay in Outbox.',
      pushed: 0,
      failed: 0,
      remaining: pending,
      remoteReachable: false,
    });
  }

  try {
    const result = await pushOutbox();
    res.json({
      ...result,
      remoteReachable: true,
      remoteMode: getRemoteMode(),
      serverTime: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** GET /sync/pull?since=ISO — merge remote changes into local SQLite (LWW) */
router.get('/pull', async (req, res) => {
  if (!(await isRemoteOnline(req))) {
    return res.status(503).json({
      error: 'Remote database unreachable (offline).',
      remoteReachable: false,
    });
  }

  try {
    const since = req.query.since || (await getLastPullAt(localDb));
    const { serverTime, applied } = await pullFromRemote(localDb, since);
    await setLastPullAt(localDb, serverTime);
    res.json({
      serverTime,
      since,
      applied,
      remoteReachable: true,
      remoteMode: getRemoteMode(),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
