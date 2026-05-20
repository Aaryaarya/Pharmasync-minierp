

-- Products Table
CREATE TABLE IF NOT EXISTS Products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    price REAL NOT NULL,
    stock INTEGER NOT NULL,
    batch_no TEXT,
    expiry_date TEXT,
    image TEXT,
    updated_at TEXT NOT NULL,
    deleted INTEGER DEFAULT 0,
    synced INTEGER DEFAULT 0
);

-- Customers Table
CREATE TABLE IF NOT EXISTS Customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    updated_at TEXT NOT NULL,
    deleted INTEGER DEFAULT 0,
    synced INTEGER DEFAULT 0
);

-- Sales Table
CREATE TABLE IF NOT EXISTS Sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    total REAL NOT NULL,
    sale_date TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted INTEGER DEFAULT 0,
    synced INTEGER DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES Customers(id)
);

-- SaleItems Table
CREATE TABLE IF NOT EXISTS SaleItems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES Sales(id),
    FOREIGN KEY (product_id) REFERENCES Products(id)
);

-- Billers (login for POS / demo)
CREATE TABLE IF NOT EXISTS Billers (
    id TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'biller',
    active INTEGER DEFAULT 1
);

-- Sync metadata (last pull timestamp, etc.)
CREATE TABLE IF NOT EXISTS SyncMeta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Outbox Table
CREATE TABLE IF NOT EXISTS Outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TEXT,
    last_error TEXT
);
