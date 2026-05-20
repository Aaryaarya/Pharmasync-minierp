# PharmaSync ERP — Continuation Guide

Use this if the chat resets. Project path: `c:\Users\aryas\OneDrive\Desktop\pharmamate`

---

## How to run (every session)

**Terminal 1 — backend**
```powershell
cd c:\Users\aryas\OneDrive\Desktop\pharmamate\backend
npm run dev
```
Expected: `Backend server running on http://localhost:4000`

**Terminal 2 — frontend**
```powershell
cd c:\Users\aryas\OneDrive\Desktop\pharmamate\frontend
npm run dev
```
Open the URL shown (usually `http://localhost:5173`).

**Health:** `http://localhost:4000/health`  
**Outbox queue (dev):** `http://localhost:4000/outbox` — empty until you **add/edit/delete** after Step 11 + backend restart.

---

## Progress checklist (our 18 steps)

| Step | Topic | Status | What exists |
|------|--------|--------|-------------|
| 1 | Folder structure | DONE | `frontend/`, `backend/`, `database/`, `docs/` |
| 2 | React + Vite + Tailwind | DONE | `frontend/` |
| 3 | Node + Express | DONE | `backend/server.js` |
| 4 | SQLite + schema | DONE | `database/schema.sql`, `database/pharmasync.db` |
| 5 | API routes | DONE | `/products`, `/customers`, `/sales`, `/health` |
| 6 | Product module | DONE | `frontend/src/modules/products/*` |
| 7 | Customer module | DONE | `frontend/src/modules/customers/*` |
| 8 | Sales module | DONE | `frontend/src/modules/sales/*` |
| 9 | Stock on sale | DONE | Inside `backend/routes/sales.js` POST/DELETE |
| 10 | Dashboard | DONE | `backend/routes/dashboard.js`, `frontend/src/modules/dashboard/` |
| 11 | Outbox pattern | DONE | `backend/outbox.js`, enqueue on all writes, `GET /outbox` |
| **12** | **Auto sync (push/pull)** | **DONE** | `/sync/push`, `/sync/pull`, `syncService.js`, `SyncStatus` |
| **13** | Supabase PostgreSQL | **DONE** | See `docs/SUPABASE-SETUP.md` |
| **14** | Conflict + retries | **DONE** | `conflict.js`, push LWW, backoff, `npm test` |
| 15 | Pharmacy extras | TODO | Expiry alerts, refunds, patient history, etc. |
| 16 | PDF invoices (jsPDF) | TODO | Download invoice |
| 17 | Unit tests | TODO | Conflict, outbox retry, sale total |
| 18 | Docs + deployment | TODO | Setup guide, architecture, demo script |

**UI polish:** After functional steps (you agreed) — glassmorphism, spacing, mobile pass.

---

## Teacher “5 screens” vs your app

| Screen | Your app |
|--------|----------|
| Dashboard | Sidebar → Dashboard |
| Products | Sidebar → Products |
| Customers | Sidebar → Customers |
| New Sale | Sidebar → Sales → **New sale** tab |
| Sales history | Sidebar → Sales → **Sales history** + Details |

**Not required for marks yet:** true browser-offline (IndexedDB) — teacher often accepts **local SQLite + outbox on API** first, then Supabase in Step 13.

---

## Step 12 — what to build (automatic sync)

**Goal:** No manual Sync button. App syncs in the background when online.

### Backend (new)

1. **`backend/routes/sync.js`** mounted as `/sync` in `server.js`
2. **`POST /sync/push`**
   - Read pending rows from `Outbox` (oldest first, limit batch size e.g. 50)
   - Apply to **remote** (Step 12 stub: log + mark done; Step 13: real Supabase)
   - On success: **delete** outbox row OR move to `synced` log table
   - On failure: `retry_count++`, store last error (optional column or log)
3. **`GET /sync/pull?since=ISO_TIMESTAMP`**
   - Fetch changes from remote where `updated_at > since`
   - Upsert into local SQLite (`Products`, `Customers`, `Sales`, …)
   - Return `{ serverTime, applied: N }`
4. **`backend/sync/`** helpers: `pushOutbox()`, `pullRemote()`, `isRemoteConfigured()`

### Frontend (new)

1. **`frontend/src/services/syncService.js`**
   - `navigator.onLine` → when `online`, call push then pull
   - **Periodic sync** e.g. every 60s while tab open (only if online)
   - **Exponential backoff** on failures (1s, 2s, 4s … cap 60s)
   - No Sync button in UI
2. **`frontend/src/services/api.js`** — add `syncPushUrl`, `syncPullUrl`
3. Wire sync in **`App.jsx`** or **`main.jsx`** (start on mount)
4. **Optimistic UI (light):** keep current flow (write → API → refresh). Optional: show tiny “Syncing…” / “Offline — changes queued” in sidebar (not a button)

### Verify Step 12 (before Supabase)

- Add product → `GET /outbox` has 1 row
- Call `POST /sync/push` → outbox count drops (stub marks processed)
- Disconnect network in DevTools → add customer → still works locally, outbox grows
- Go online → push runs automatically, queue drains

### Verify Step 12 (after Step 13)

- Two browsers / machines: change on A, pull on B, data matches
- Conflict: two edits same row → **last-write-wins** by server `updated_at` (Step 14)

---

## Step 13 — Supabase (manual — you do once)

1. Create project at [supabase.com](https://supabase.com)
2. SQL Editor: run schema matching `database/schema.sql` (PostgreSQL types)
3. Add tables: `sync_state` or `last_pull_at` if needed
4. Backend `.env` (do not commit secrets):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (backend only)
5. Replace sync stub with real insert/update to Postgres
6. **When to test “real” offline:** after Step 12 + 13 both work

---

## Step 14 — conflict + retries

- Compare `updated_at` (server wins if newer)
- Soft delete: if `deleted=1` on server, local row hidden
- Outbox: skip or merge if remote already newer
- Unit tests for LWW + retry (Step 17)

---

## Step 15 — pharmacy extras (pick what teacher stresses)

- Low stock / expiry notifications (dashboard hooks exist for low stock)
- Batch + expiry already on products
- Refunds/returns (new sale type or negative sale)
- Patient purchase history (query sales by `customer_id`)
- GST on invoice (Step 16 PDF)
- Retail vs wholesale (price tier — optional)

---

## Step 16 — PDF invoice

- jsPDF in `SaleDetail.jsx` — “Download PDF”
- GST lines if required

---

## Step 17 — unit tests

Minimum 3:
1. Conflict resolution (LWW)
2. Outbox retry / backoff
3. Sales total calculation

Suggested: `backend/tests/` with Node test runner or Jest.

---

## Step 18 — deliverables

1. Working app (README run instructions)
2. This guide + setup guide
3. Schema explanation (`database/schema.sql`)
4. Sync logic diagram (outbox → push → pull)
5. Offline validation steps (DevTools offline + outbox)
6. Architecture (frontend / API / SQLite / Supabase)
7. Demo video script (2–3 min: offline add → online sync)

---

## Key file map

```
pharmamate/
├── backend/
│   ├── server.js          # routes mount
│   ├── db.js              # SQLite connection
│   ├── outbox.js          # enqueue()
│   └── routes/
│       ├── products.js
│       ├── customers.js
│       ├── sales.js
│       ├── dashboard.js
│       └── outbox.js      # GET /outbox only
├── database/
│   ├── schema.sql
│   └── pharmasync.db      # do not open in Cursor (binary)
├── frontend/src/
│   ├── App.jsx            # sidebar + sections
│   ├── services/api.js
│   └── modules/
│       ├── dashboard/
│       ├── products/
│       ├── customers/
│       └── sales/
└── docs/
    └── CONTINUATION-GUIDE.md  # this file
```

---

## Common issues

| Problem | Fix |
|---------|-----|
| `/outbox` empty | Restart backend; **new** add/edit after Step 11 |
| 413 on upload | Images removed — ignore |
| Can't open `.db` in editor | Use DB Browser for SQLite or API |
| CORS errors | Backend must be running on :4000 |
| Stock wrong after sale | Check `POST /sales`; void restores stock |

---

## What to tell the AI next

> “Continue PharmaSync from docs/CONTINUATION-GUIDE.md — implement **Step 12** (sync push/pull + frontend auto sync, no manual button).”

---

*Last updated: after Step 12 (auto sync). Next: Step 13 (Supabase).*

### Step 12 test commands

1. Add a product in the UI.
2. `GET http://localhost:4000/outbox` — should have rows, then after ~45s or refresh app, rows drain.
3. `POST http://localhost:4000/sync/push` — `{ pushed, remaining }`.
4. Simulate remote offline: set env `REMOTE_OFFLINE=1`, restart backend, push returns 503, outbox grows.
5. Remote mirror file: `database/pharmasync_remote.db` (simulates PostgreSQL until Step 13).
