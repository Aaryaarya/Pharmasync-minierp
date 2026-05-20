const config = require('../config');
const remoteDb = require('../remoteDb');
const { applyOutboxRow: applyOutboxRowSqlite } = require('./applyPush');
const { applyOutboxRowSupabase } = require('./applyPushSupabase');
const { pullFromRemote: pullFromSqlite } = require('./mergePull');
const { pullFromSupabase } = require('./pullSupabase');

function getRemoteMode() {
  return config.useSupabase ? 'supabase' : 'sqlite-file';
}

async function applyOutboxRow(row) {
  if (config.useSupabase) return applyOutboxRowSupabase(row);
  return applyOutboxRowSqlite(remoteDb, row);
}

async function pullFromRemote(localDb, since) {
  if (config.useSupabase) return pullFromSupabase(localDb, since);
  return pullFromSqlite(localDb, remoteDb, since);
}

module.exports = { applyOutboxRow, pullFromRemote, getRemoteMode };
