// backend/routes/sales.js
// Creates sales with line items, server-side totals, and stock deduction (transaction).

const express = require('express');
const db = require('../db');
const outbox = require('../outbox');
const router = express.Router();

function rollbackAndError(db, res, err) {
  db.run('ROLLBACK', () => {
    res.status(err.status || 500).json({ error: err.message || 'Database error' });
  });
}

// List sales with customer name
router.get('/', (req, res) => {
  const sql = `
    SELECT s.*, c.name AS customer_name
    FROM Sales s
    LEFT JOIN Customers c ON s.customer_id = c.id
    WHERE s.deleted = 0
    ORDER BY s.id DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Single sale + line items + customer (for detail page)
router.get('/:id', (req, res) => {
  const id = req.params.id;
  db.get(
    `
    SELECT s.*, c.name AS customer_name, c.phone AS customer_phone, c.address AS customer_address
    FROM Sales s
    LEFT JOIN Customers c ON s.customer_id = c.id
    WHERE s.id = ? AND s.deleted = 0
    `,
    [id],
    (err, sale) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!sale) return res.status(404).json({ error: 'Sale not found' });

      db.all(
        `
        SELECT si.*, p.name AS product_name, p.batch_no, p.expiry_date, p.category
        FROM SaleItems si
        JOIN Products p ON si.product_id = p.id
        WHERE si.sale_id = ?
        ORDER BY si.id
        `,
        [id],
        (err2, items) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ sale, items });
        }
      );
    }
  );
});

/**
 * Body: { customer_id?: number|null, sale_date?: string (YYYY-MM-DD), items: [{ product_id, quantity }] }
 * Line prices and grand total are computed from Products at sale time.
 */
router.post('/', (req, res) => {
  const rawCustomer = req.body.customer_id;
  const customer_id =
    rawCustomer === undefined || rawCustomer === null || rawCustomer === ''
      ? null
      : parseInt(rawCustomer, 10);
  if (customer_id !== null && Number.isNaN(customer_id)) {
    return res.status(400).json({ error: 'Invalid customer_id' });
  }

  const sale_date = req.body.sale_date || new Date().toISOString().slice(0, 10);
  const itemsIn = req.body.items;

  if (!Array.isArray(itemsIn) || itemsIn.length === 0) {
    return res.status(400).json({ error: 'At least one line item is required' });
  }

  const normalizedLines = [];
  for (const it of itemsIn) {
    const pid = parseInt(it.product_id, 10);
    const qty = parseInt(it.quantity, 10);
    if (Number.isNaN(pid) || Number.isNaN(qty) || qty < 1) {
      return res.status(400).json({ error: 'Each line needs a valid product and quantity ≥ 1' });
    }
    normalizedLines.push({ product_id: pid, quantity: qty });
  }

  const updated_at = new Date().toISOString();

  const validateCustomer = (cb) => {
    if (customer_id == null) return cb(null);
    db.get('SELECT id FROM Customers WHERE id = ? AND deleted = 0', [customer_id], (e, row) => {
      if (e) return cb(e);
      if (!row) return cb(Object.assign(new Error('Customer not found'), { status: 400 }));
      cb(null);
    });
  };

  validateCustomer((cerr) => {
    if (cerr) {
      const status = cerr.status || 500;
      return res.status(status).json({ error: cerr.message });
    }

    const ids = [...new Set(normalizedLines.map((l) => l.product_id))];
    const placeholders = ids.map(() => '?').join(',');
    db.all(
      `SELECT id, name, price, stock FROM Products WHERE id IN (${placeholders}) AND deleted = 0`,
      ids,
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const map = Object.fromEntries(rows.map((r) => [r.id, r]));

        const needByProduct = {};
        for (const line of normalizedLines) {
          needByProduct[line.product_id] = (needByProduct[line.product_id] || 0) + line.quantity;
        }

        for (const pidStr of Object.keys(needByProduct)) {
          const pid = parseInt(pidStr, 10);
          const p = map[pid];
          if (!p) {
            return res.status(400).json({ error: `Product ${pid} not found or inactive` });
          }
          const need = needByProduct[pidStr];
          if (p.stock < need) {
            return res.status(400).json({ error: `Not enough stock for "${p.name}" (have ${p.stock}, need ${need})` });
          }
        }

        const resolved = [];
        for (const line of normalizedLines) {
          const p = map[line.product_id];
          const q = line.quantity;
          resolved.push({ product_id: p.id, quantity: q, price: p.price });
        }

        const total = resolved.reduce((sum, x) => sum + x.quantity * x.price, 0);

        db.serialize(() => {
          db.run('BEGIN IMMEDIATE');
          db.run(
            `INSERT INTO Sales (customer_id, total, sale_date, updated_at) VALUES (?, ?, ?, ?)`,
            [customer_id, total, sale_date, updated_at],
            function (insErr) {
              if (insErr) return rollbackAndError(db, res, insErr);
              const saleId = this.lastID;
              let i = 0;

              const next = () => {
                if (i >= resolved.length) {
                  return db.run('COMMIT', (comErr) => {
                    if (comErr) return res.status(500).json({ error: comErr.message });
                    outbox.enqueue(
                      'Sales',
                      'INSERT',
                      {
                        id: saleId,
                        customer_id,
                        total,
                        sale_date,
                        updated_at,
                        items: resolved,
                      },
                      (oe) => {
                        if (oe) console.error('[Outbox]', oe.message);
                        return res.json({ id: saleId, total });
                      }
                    );
                  });
                }
                const { product_id, quantity, price } = resolved[i];
                db.run(
                  `INSERT INTO SaleItems (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
                  [saleId, product_id, quantity, price],
                  function (itErr) {
                    if (itErr) return rollbackAndError(db, res, itErr);
                    db.run(
                      `UPDATE Products SET stock = stock - ?, updated_at = ? WHERE id = ? AND deleted = 0 AND stock >= ?`,
                      [quantity, updated_at, product_id, quantity],
                      function (stErr) {
                        if (stErr) return rollbackAndError(db, res, stErr);
                        if (this.changes === 0) {
                          return rollbackAndError(db, res, Object.assign(new Error('Stock update failed'), { status: 400 }));
                        }
                        i += 1;
                        next();
                      }
                    );
                  }
                );
              };

              next();
            }
          );
        });
      }
    );
  });
});

// Soft-delete sale and restore stock
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  const updated_at = new Date().toISOString();

  db.all('SELECT product_id, quantity FROM SaleItems WHERE sale_id = ?', [id], (err, items) => {
    if (err) return res.status(500).json({ error: err.message });

    db.serialize(() => {
      db.run('BEGIN IMMEDIATE');
      db.run(
        `UPDATE Sales SET deleted = 1, updated_at = ? WHERE id = ? AND deleted = 0`,
        [updated_at, id],
        function (uErr) {
          if (uErr) return rollbackAndError(db, res, uErr);
          if (this.changes === 0) {
            db.run('ROLLBACK', () => res.status(404).json({ error: 'Sale not found' }));
            return;
          }

          let i = 0;
          const next = () => {
            if (i >= items.length) {
              return db.run('COMMIT', (cErr) => {
                if (cErr) return res.status(500).json({ error: cErr.message });
                const sid = parseInt(id, 10);
                outbox.enqueue('Sales', 'SOFT_DELETE', { id: sid, deleted: 1, updated_at, line_items: items }, (oe) => {
                  if (oe) console.error('[Outbox]', oe.message);
                  res.json({ ok: true });
                });
              });
            }
            const it = items[i];
            db.run(
              `UPDATE Products SET stock = stock + ?, updated_at = ? WHERE id = ? AND deleted = 0`,
              [it.quantity, updated_at, it.product_id],
              function (rErr) {
                if (rErr) return rollbackAndError(db, res, rErr);
                i += 1;
                next();
              }
            );
          };
          next();
        }
      );
    });
  });
});

module.exports = router;
