-- PharmaSync ERP — run this in Supabase SQL Editor (Step 13)
-- PostgreSQL remote database (mirrors local SQLite)

CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  price DOUBLE PRECISION NOT NULL,
  stock INTEGER NOT NULL,
  batch_no TEXT,
  expiry_date TEXT,
  image TEXT,
  updated_at TIMESTAMPTZ NOT NULL,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  synced BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS customers (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  updated_at TIMESTAMPTZ NOT NULL,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  synced BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS sales (
  id BIGINT PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id),
  total DOUBLE PRECISION NOT NULL,
  sale_date TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  synced BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS sale_items (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DOUBLE PRECISION NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_updated ON products(updated_at);
CREATE INDEX IF NOT EXISTS idx_customers_updated ON customers(updated_at);
CREATE INDEX IF NOT EXISTS idx_sales_updated ON sales(updated_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);

-- Optional: disable RLS for class project when using service_role from backend only
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; for anon key you would add policies here.
