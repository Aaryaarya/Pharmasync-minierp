# Step 14 — Conflict resolution & retries

## Rules (assignment)

### 1. Last-write-wins (LWW)

Every row has `updated_at` (ISO timestamp).

When **local** and **remote** disagree:

- **Newer `updated_at` wins**
- Implemented in `backend/sync/conflict.js` → `resolveConflict()`

Used on:

- **Pull** — merge remote rows into SQLite
- **Push** — before applying Outbox, compare payload vs Supabase row

### 2. Soft-delete precedence

If both sides have the **same** `updated_at`:

- A row with `deleted = 1` (soft delete) wins over an active row
- If both deleted → remote wins
- If neither deleted → remote wins (server tie-break)

If timestamps differ, **newer timestamp still wins** (even over delete).

Example: remote deleted at 10:00, local edited at 11:00 → **local edit wins**.

### 3. Outbox retry + exponential backoff

On push failure:

- `retry_count` increases
- `next_retry_at` = now + backoff (1s, 2s, 4s … max 60s)
- Row is skipped until `next_retry_at` passes
- After 8 failures, row stops retrying (stays in Outbox for inspection)

Frontend also backs off sync interval on errors (Step 12).

## Push conflict flow

```
Outbox row ready?
    → Fetch remote row by id
    → shouldPushLocal(local payload, remote)?
         NO  → remote wins: update local SQLite, delete outbox row
         YES → apply to Supabase, delete outbox row
```

Response includes `remoteWon` count and `conflicts[]` log.

## Run unit tests

```powershell
cd backend
npm test
```

Tests: `backend/tests/conflict.test.js`, `backend/tests/salesTotal.test.js`

## For your report / viva

> We use optimistic local writes with an Outbox queue. On sync, push compares each change with the server copy using last-write-wins on `updated_at`. Soft deletes take precedence when timestamps tie. Failed pushes retry with exponential backoff without a manual sync button.
