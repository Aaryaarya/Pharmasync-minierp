const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { resolveConflict, shouldPushLocal, backoffMs } = require('../sync/conflict');

describe('resolveConflict — last-write-wins', () => {
  it('remote wins when remote updated_at is newer', () => {
    const local = { id: 1, name: 'Local', updated_at: '2026-01-01T10:00:00.000Z', deleted: 0 };
    const remote = { id: 1, name: 'Remote', updated_at: '2026-01-02T10:00:00.000Z', deleted: 0 };
    const r = resolveConflict(local, remote);
    assert.equal(r.source, 'remote');
    assert.equal(r.reason, 'last_write_wins_remote_newer');
  });

  it('local wins when local updated_at is newer', () => {
    const local = { id: 1, name: 'Local', updated_at: '2026-01-03T10:00:00.000Z', deleted: 0 };
    const remote = { id: 1, name: 'Remote', updated_at: '2026-01-02T10:00:00.000Z', deleted: 0 };
    const r = resolveConflict(local, remote);
    assert.equal(r.source, 'local');
  });
});

describe('resolveConflict — soft-delete precedence', () => {
  it('remote soft-delete wins on equal timestamp', () => {
    const ts = '2026-01-01T12:00:00.000Z';
    const local = { id: 1, updated_at: ts, deleted: 0 };
    const remote = { id: 1, updated_at: ts, deleted: 1 };
    const r = resolveConflict(local, remote);
    assert.equal(r.source, 'remote');
    assert.equal(r.reason, 'soft_delete_precedence');
  });

  it('newer local active beats older remote delete (LWW, not blind remote delete)', () => {
    const local = { id: 1, updated_at: '2026-01-05T12:00:00.000Z', deleted: 0 };
    const remote = { id: 1, updated_at: '2026-01-01T12:00:00.000Z', deleted: 1 };
    const r = resolveConflict(local, remote);
    assert.equal(r.source, 'local');
  });
});

describe('shouldPushLocal', () => {
  it('allows push when no remote row', () => {
    const r = shouldPushLocal({ id: 1, updated_at: '2026-01-01T00:00:00.000Z', deleted: 0 }, null);
    assert.equal(r.push, true);
  });

  it('blocks push when remote is newer', () => {
    const r = shouldPushLocal(
      { id: 1, updated_at: '2026-01-01T00:00:00.000Z', deleted: 0 },
      { id: 1, updated_at: '2026-01-02T00:00:00.000Z', deleted: 0 }
    );
    assert.equal(r.push, false);
  });
});

describe('backoffMs', () => {
  it('doubles up to cap', () => {
    assert.equal(backoffMs(0), 1000);
    assert.equal(backoffMs(1), 2000);
    assert.equal(backoffMs(10), 60000);
  });
});
