# 💊 PharmaSync ERP (Pharmamate)


**PharmaSync ERP** is a modern, offline-first mini-ERP and Point of Sale (POS) system designed specifically for retail pharmacies. Designed with an offline-first architecture, PharmaSync ERP handles intermittent network connections gracefully by caching operations in a local SQLite outbox queue and synchronizing them to a remote cloud database (Supabase PostgreSQL) using robust timestamp-based conflict resolution algorithms.

---

## ✨ Features

* **Offline-First Synchronization**: Continued capability to run sales transactions, update inventories, and add customers when offline. Features a local `Outbox` table acting as a queue to automatically push changes when back online.
* **Conflict Resolution**: Client-server sync algorithm implementing:
  * Last-Write-Wins (using ISO timestamps).
  * Soft-delete precedence (tombstones win ties).
  * Remote-server wins on equal ties.
* **Point of Sale (POS) & Billing**: Real-time invoice generation, product selection, automatically computed totals, discounts, and customer details mapping.
* **PDF Invoice Downloads**: Native client-side PDF invoice generation and download powered by `jsPDF`.
* **Inventory & Expiry Warnings**: Tracks batches, stock counts, and medicine expiry dates. Highlights low-stock medicines and near-expiry drugs with visual status badges (normal, low stock, expired, or warning).
* **Interactive Business Dashboard**: Provides insights via visual charts (using `Recharts`) on daily earnings, sales count, low stock counts, and expiring items.
* **Authentication & User Management**: Session management for Billers with demo login credentials.

---

## 🛠️ Tech Stack

* **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React (Icons), Recharts (Data Visualizations), jsPDF (PDF reports).
* **Backend**: Node.js, Express, SQLite3 (local DB & outbox driver), Supabase JS client.
* **Database**: 
  * **Local / Edge**: SQLite3 (`database/pharmasync.db`)
  * **Remote / Cloud**: Supabase PostgreSQL (mirrors local SQLite schema structure)

---

## 📁 Project Structure

```text
pharmamate/
├── database/                   # Database schemas and local SQLite storage
│   ├── pharmasync.db           # Local SQLite database file (auto-generated)
│   ├── pharmasync_remote.db    # Mock remote SQLite database for offline testing
│   ├── schema.sql              # SQLite local schema definitions
│   └── supabase_schema.sql     # Supabase PostgreSQL schema scripts
│
├── backend/                    # Node.js + Express backend server
│   ├── config.js               # Environment variables configuration
│   ├── db.js                   # Local SQLite connection setup
│   ├── server.js               # Express application entrypoint
│   ├── routes/                 # Express routing (auth, sales, products, sync, etc.)
│   ├── sync/                   # Sync protocol, outbox retries, conflict resolution
│   └── tests/                  # Backend unit/integration tests
│
└── frontend/                   # Vite + React frontend web application
    ├── src/
    │   ├── components/         # Shared UI badges, layouts, tables, and widgets
    │   ├── context/            # Auth and application state contexts
    │   ├── modules/            # App modules (POS, Dashboard, Inventory, Invoices)
    │   ├── services/           # API services and sync loop scheduler
    │   ├── utils/              # Data parsing, formatting, and validation helpers
    │   ├── App.jsx             # Main shell and routing controller
    │   └── index.css           # Global custom themes and Tailwind styling
    ├── index.html
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* NPM or Yarn

---

### Step 1: Clone and Setup Workspace

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/Aaryaarya/Pharmasync-minierp.git
   cd Pharmasync-minierp
   ```

2. Initialize the database schema for the local SQLite database:
   ```bash
   cd backend
   npm install
   node initDb.js
   ```

3. Seed initial mockup data (e.g., sample drugs, patients, and 14 days of sales trends):
   ```bash
   node seed.js
   ```

---

### Step 2: Configure Environment Variables

Create a `.env` file in the `backend/` directory to configure the backend ports and Supabase integration:

```ini
PORT=4000
# Leave these blank to use the mock SQLite local file database (pharmasync_remote.db) as your cloud database.
# Fill them with your Supabase credentials to synchronize to Supabase PostgreSQL.
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Create a `.env` file in the `frontend/` directory (optional, if your backend port changes):

```ini
VITE_API_URL=http://localhost:4000
```

---

### Step 3: Run the Servers

#### Running Backend

From the `backend/` directory:
```bash
# Start backend in development mode (using nodemon)
npm run dev
```

The backend server will run on [http://localhost:4000](http://localhost:4000).

#### Running Frontend

Open a new terminal session, navigate to the `frontend/` directory:
```bash
npm install
# Start Vite development server
npm run dev
```

The frontend web app will run on [http://localhost:5173](http://localhost:5173) (or the port specified by Vite).

---

## 🔑 Demo Account Credentials

Use the following logins to test the POS and ERP dashboards:

* **Biller ID**: `biller1`
* **Password**: `1234`

---

