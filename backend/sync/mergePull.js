const { run, get, all } = require('./dbUtil');
const { resolveConflict } = require('./conflict');

async function mergeProduct(localDb, remoteRow) {
  const local = await get(localDb, `SELECT * FROM Products WHERE id = ?`, [remoteRow.id]);
  const { winner, source } = resolveConflict(local, remoteRow);
  if (!winner) return false;
  await run(
    localDb,
    `INSERT INTO Products (id, name, category, price, stock, batch_no, expiry_date, image, updated_at, deleted, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, category=excluded.category, price=excluded.price, stock=excluded.stock,
       batch_no=excluded.batch_no, expiry_date=excluded.expiry_date, image=excluded.image,
       updated_at=excluded.updated_at, deleted=excluded.deleted, synced=1`,
    [
      winner.id,
      winner.name,
      winner.category,
      winner.price,
      winner.stock,
      winner.batch_no,
      winner.expiry_date,
      winner.image,
      winner.updated_at,
      winner.deleted,
    ]
  );
  return source === 'remote';
}

async function mergeCustomer(localDb, remoteRow) {
  const local = await get(localDb, `SELECT * FROM Customers WHERE id = ?`, [remoteRow.id]);
  const { winner, source } = resolveConflict(local, remoteRow);
  if (!winner) return false;
  await run(
    localDb,
    `INSERT INTO Customers (id, name, phone, address, updated_at, deleted, synced)
     VALUES (?, ?, ?, ?, ?, ?, 1)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, phone=excluded.phone, address=excluded.address,
       updated_at=excluded.updated_at, deleted=excluded.deleted, synced=1`,
    [winner.id, winner.name, winner.phone, winner.address, winner.updated_at, winner.deleted]
  );
  return source === 'remote';
}

async function mergeSale(localDb, remoteDb, remoteSale, supabaseClient = null) {
  const local = await get(localDb, `SELECT * FROM Sales WHERE id = ?`, [remoteSale.id]);
  const { winner, source } = resolveConflict(local, remoteSale);
  if (!winner) return false;

  await run(
    localDb,
    `INSERT INTO Sales (id, customer_id, total, sale_date, updated_at, deleted, synced)
     VALUES (?, ?, ?, ?, ?, ?, 1)
     ON CONFLICT(id) DO UPDATE SET
       customer_id=excluded.customer_id, total=excluded.total, sale_date=excluded.sale_date,
       updated_at=excluded.updated_at, deleted=excluded.deleted, synced=1`,
    [
      winner.id,
      winner.customer_id,
      winner.total,
      winner.sale_date,
      winner.updated_at,
      winner.deleted,
    ]
  );

  if (source === 'remote' && Number(winner.deleted) === 0) {
    let items = [];
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from('sale_items').select('*').eq('sale_id', remoteSale.id);
      if (error) throw new Error(error.message);
      items = data || [];
    } else if (remoteDb) {
      items = await all(remoteDb, `SELECT * FROM SaleItems WHERE sale_id = ?`, [remoteSale.id]);
    }
    await run(localDb, `DELETE FROM SaleItems WHERE sale_id = ?`, [remoteSale.id]);
    for (const it of items) {
      await run(
        localDb,
        `INSERT INTO SaleItems (id, sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET sale_id=excluded.sale_id, product_id=excluded.product_id,
         quantity=excluded.quantity, price=excluded.price`,
        [it.id, it.sale_id, it.product_id, it.quantity, it.price]
      );
    }
  }

  return source === 'remote';
}

async function pullFromRemote(localDb, remoteDb, since) {
  const serverTime = new Date().toISOString();
  const applied = { products: 0, customers: 0, sales: 0 };

  const products = await all(
    remoteDb,
    `SELECT * FROM Products WHERE updated_at > ? ORDER BY updated_at ASC`,
    [since]
  );
  for (const row of products) {
    if (await mergeProduct(localDb, row)) applied.products += 1;
  }

  const customers = await all(
    remoteDb,
    `SELECT * FROM Customers WHERE updated_at > ? ORDER BY updated_at ASC`,
    [since]
  );
  for (const row of customers) {
    if (await mergeCustomer(localDb, row)) applied.customers += 1;
  }

  const sales = await all(
    remoteDb,
    `SELECT * FROM Sales WHERE updated_at > ? ORDER BY updated_at ASC`,
    [since]
  );
  for (const row of sales) {
    if (await mergeSale(localDb, remoteDb, row)) applied.sales += 1;
  }

  return { serverTime, applied };
}

module.exports = { pullFromRemote, mergeProduct, mergeCustomer, mergeSale };
