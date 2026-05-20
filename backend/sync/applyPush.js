const { run, get } = require('./dbUtil');

async function upsertProduct(remoteDb, p) {
  await run(
    remoteDb,
    `INSERT INTO Products (id, name, category, price, stock, batch_no, expiry_date, image, updated_at, deleted, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, category=excluded.category, price=excluded.price, stock=excluded.stock,
       batch_no=excluded.batch_no, expiry_date=excluded.expiry_date, image=excluded.image,
       updated_at=excluded.updated_at, deleted=excluded.deleted, synced=1`,
    [
      p.id,
      p.name,
      p.category ?? null,
      p.price,
      p.stock,
      p.batch_no ?? null,
      p.expiry_date ?? null,
      p.image ?? null,
      p.updated_at,
      p.deleted ?? 0,
    ]
  );
}

async function upsertCustomer(remoteDb, c) {
  await run(
    remoteDb,
    `INSERT INTO Customers (id, name, phone, address, updated_at, deleted, synced)
     VALUES (?, ?, ?, ?, ?, ?, 1)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, phone=excluded.phone, address=excluded.address,
       updated_at=excluded.updated_at, deleted=excluded.deleted, synced=1`,
    [c.id, c.name, c.phone ?? null, c.address ?? null, c.updated_at, c.deleted ?? 0]
  );
}

async function applySaleInsert(remoteDb, payload) {
  const { id, customer_id, total, sale_date, updated_at, items } = payload;
  const existing = await get(remoteDb, `SELECT id FROM Sales WHERE id = ?`, [id]);
  if (existing) {
    await run(remoteDb, `UPDATE Sales SET customer_id=?, total=?, sale_date=?, updated_at=?, deleted=0, synced=1 WHERE id=?`, [
      customer_id,
      total,
      sale_date,
      updated_at,
      id,
    ]);
    await run(remoteDb, `DELETE FROM SaleItems WHERE sale_id = ?`, [id]);
  } else {
    await run(
      remoteDb,
      `INSERT INTO Sales (id, customer_id, total, sale_date, updated_at, deleted, synced) VALUES (?, ?, ?, ?, ?, 0, 1)`,
      [id, customer_id, total, sale_date, updated_at]
    );
  }

  for (const it of items || []) {
    await run(
      remoteDb,
      `INSERT INTO SaleItems (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
      [id, it.product_id, it.quantity, it.price]
    );
    await run(
      remoteDb,
      `UPDATE Products SET stock = stock - ?, updated_at = ? WHERE id = ? AND deleted = 0`,
      [it.quantity, updated_at, it.product_id]
    );
  }
}

async function applySaleSoftDelete(remoteDb, payload) {
  const { id, updated_at, line_items } = payload;
  await run(remoteDb, `UPDATE Sales SET deleted = 1, updated_at = ?, synced = 1 WHERE id = ?`, [updated_at, id]);
  for (const it of line_items || []) {
    await run(
      remoteDb,
      `UPDATE Products SET stock = stock + ?, updated_at = ? WHERE id = ? AND deleted = 0`,
      [it.quantity, updated_at, it.product_id]
    );
  }
}

async function applyOutboxRow(remoteDb, row) {
  const payload = JSON.parse(row.payload);
  const { table_name, operation } = row;

  if (table_name === 'Products') {
    if (operation === 'SOFT_DELETE') {
      await run(remoteDb, `UPDATE Products SET deleted = 1, updated_at = ?, synced = 1 WHERE id = ?`, [
        payload.updated_at,
        payload.id,
      ]);
    } else {
      await upsertProduct(remoteDb, { ...payload, deleted: payload.deleted ?? 0 });
    }
    return;
  }

  if (table_name === 'Customers') {
    if (operation === 'SOFT_DELETE') {
      await run(remoteDb, `UPDATE Customers SET deleted = 1, updated_at = ? WHERE id = ?`, [
        payload.updated_at,
        payload.id,
      ]);
    } else {
      await upsertCustomer(remoteDb, { ...payload, deleted: payload.deleted ?? 0 });
    }
    return;
  }

  if (table_name === 'Sales') {
    if (operation === 'INSERT') await applySaleInsert(remoteDb, payload);
    else if (operation === 'SOFT_DELETE') await applySaleSoftDelete(remoteDb, payload);
    return;
  }

  throw new Error(`Unknown outbox table: ${table_name}`);
}

module.exports = { applyOutboxRow };
