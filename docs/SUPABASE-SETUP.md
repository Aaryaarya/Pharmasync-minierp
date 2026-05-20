# Step 13 — Supabase setup (manual + connect backend)

Do these steps **in order**. You only do the Supabase website part once.

---

## Part A — Create Supabase account & project (you do this in the browser)

### 1. Sign up

1. Open **https://supabase.com**
2. Click **Start your project** / **Sign up**
3. Sign in with **GitHub** or **email** (student email is fine)

### 2. Create a new project

1. Click **New project**
2. **Organization:** use default or create one (e.g. `pharmasync`)
3. **Project name:** `pharmasync-erp` (any name is OK)
4. **Database password:** choose a **strong password** and **save it** in a notes file (you need it for direct DB access; our app uses API keys instead)
5. **Region:** pick closest to you (e.g. Southeast Asia / Mumbai if available)
6. Click **Create new project**
7. Wait **1–3 minutes** until status is **Active / healthy**

### 3. Run SQL schema (create tables)

1. In the left sidebar, open **SQL Editor**
2. Click **New query**
3. On your PC, open this file in Cursor:

   `database/supabase_schema.sql`

4. **Copy all** the SQL and paste into the Supabase SQL editor
5. Click **Run** (or Ctrl+Enter)
6. Expected: **Success. No rows returned**

### 4. Check tables exist

1. Left sidebar → **Table Editor**
2. You should see tables:

   - `products`
   - `customers`
   - `sales`
   - `sale_items`

   (They may be empty — that is normal.)

### 5. Get API keys (for backend)

1. Left sidebar → **Project Settings** (gear icon)
2. Click **API**
3. Copy and save these two values **in a safe place** (Notepad, password manager):

   | Name | Where | Use |
   |------|--------|-----|
   | **Project URL** | `Configuration` → URL | `SUPABASE_URL` |
   | **service_role** key | `Project API keys` → **service_role** (secret) | `SUPABASE_SERVICE_ROLE_KEY` |

**Important security**

- **Never** put `service_role` in the React frontend
- **Never** commit `backend/.env` to GitHub
- Only the **backend** uses `service_role`

The **anon** key is for public clients; we do **not** use it in this project step.

---

## Part B — Connect your backend (on your PC)

### 1. Create `.env` file

1. In folder `backend/`, copy the example file:

   - From: `backend/.env.example`
   - To: `backend/.env`

2. Edit `backend/.env` and paste your values:

```env
PORT=4000
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....(long key)
```

3. Save the file.

### 2. Install new packages

In PowerShell:

```powershell
cd c:\Users\aryas\OneDrive\Desktop\pharmamate\backend
npm install
```

(This installs `@supabase/supabase-js` and `dotenv`.)

### 3. Restart backend

```powershell
npm run dev
```

**Expected in terminal:**

```
Backend server running on http://localhost:4000
[Sync] Remote: Supabase PostgreSQL
```

If you still see `local file (pharmasync_remote.db)`, your `.env` is missing or keys are empty.

### 4. Check sync status

Open in browser:

`http://localhost:4000/sync/status`

**Expected (example):**

```json
{
  "remoteReachable": true,
  "remoteMode": "supabase",
  "supabaseConfigured": true,
  "pendingOutbox": 0,
  ...
}
```

---

## Part C — Test sync to Supabase

1. Start **frontend** (`npm run dev` in `frontend/`)
2. In the app, **add a new product** (or edit one)
3. Wait ~45 seconds **or** refresh the app (auto sync runs)
4. In Supabase → **Table Editor** → **products** → you should see the row

Also test:

- `http://localhost:4000/outbox` — should go to **empty** after successful push
- `POST http://localhost:4000/sync/push` — `{ "pushed": 1, ... }`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `remoteMode` is `sqlite-file` | Create `backend/.env` with both Supabase variables; restart backend |
| `remoteReachable: false` | Wrong URL/key; project paused; check Supabase dashboard |
| SQL error on schema | Run full `supabase_schema.sql` again in SQL Editor |
| Row not in Supabase | Check `/outbox` still has items; read backend terminal for errors |
| RLS / permission error | You must use **service_role** key, not anon |

---

## What changed in code (Step 13)

- Without `.env` → sync still uses `database/pharmasync_remote.db` (Step 12 demo file)
- With `.env` → push/pull use **real Supabase PostgreSQL**

---

## Next step

**Step 14** — conflict resolution & retry hardening (document LWW for your report).

When Part A + B work, tell your tutor: *"Local SQLite + Outbox push to Supabase PostgreSQL + pull merge."*
