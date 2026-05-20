/**
 * Conflict resolution — Step 14
 * Rules (assignment):
 * 1. Last-write-wins by updated_at (server / remote timestamp)
 * 2. Soft-delete precedence on equal timestamps (tombstone wins ties)
 * 3. On equal tie with no delete, remote (server) wins
 */

function parseTs(iso) {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function isDeleted(row) {
  if (!row) return false;
  return row.deleted === true || row.deleted === 1 || row.deleted === '1';
}

function normalizeRow(row) {
  if (!row) return null;
  return {
    ...row,
    deleted: isDeleted(row) ? 1 : 0,
  };
}

/**
 * @returns {{ winner: object|null, source: 'local'|'remote'|null, reason: string }}
 */
function resolveConflict(localRow, remoteRow) {
  const local = normalizeRow(localRow);
  const remote = normalizeRow(remoteRow);

  if (!remote) return { winner: local, source: local ? 'local' : null, reason: 'remote_missing' };
  if (!local) return { winner: remote, source: 'remote', reason: 'local_missing' };

  const lt = parseTs(local.updated_at);
  const rt = parseTs(remote.updated_at);

  if (rt > lt) {
    return { winner: remote, source: 'remote', reason: 'last_write_wins_remote_newer' };
  }
  if (lt > rt) {
    return { winner: local, source: 'local', reason: 'last_write_wins_local_newer' };
  }

  // Equal timestamps — soft-delete precedence
  if (isDeleted(remote) && !isDeleted(local)) {
    return { winner: remote, source: 'remote', reason: 'soft_delete_precedence' };
  }
  if (isDeleted(local) && !isDeleted(remote)) {
    return { winner: local, source: 'local', reason: 'soft_delete_precedence' };
  }
  if (isDeleted(remote) && isDeleted(local)) {
    return { winner: remote, source: 'remote', reason: 'both_deleted_remote_wins' };
  }

  return { winner: remote, source: 'remote', reason: 'tie_remote_wins' };
}

/** Can local outbox payload be pushed without overwriting newer remote data? */
function shouldPushLocal(localPayload, remoteRow) {
  const local = {
    ...localPayload,
    updated_at: localPayload.updated_at,
    deleted: localPayload.deleted ?? (localPayload.operation === 'SOFT_DELETE' ? 1 : 0),
  };
  const { source, reason } = resolveConflict(local, remoteRow);
  return { push: source === 'local', source, reason };
}

function backoffMs(retryCount) {
  const base = 1000;
  const ms = base * 2 ** Math.max(0, retryCount);
  return Math.min(ms, 60_000);
}

function nextRetryAtIso(retryCount) {
  return new Date(Date.now() + backoffMs(retryCount)).toISOString();
}

module.exports = {
  parseTs,
  isDeleted,
  normalizeRow,
  resolveConflict,
  shouldPushLocal,
  backoffMs,
  nextRetryAtIso,
};
