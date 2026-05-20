const express = require('express');
const db = require('../db');
const router = express.Router();

const LOW_STOCK_THRESHOLD = 10;

function localDateString(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(isoDateStr, deltaDays) {
  const [y, m, d] = isoDateStr.split('-').map((x) => parseInt(x, 10));
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  return localDateString(dt);
}

/** GET /pharmacy/alerts — low stock, expiring tomorrow, expired, out of stock */
router.get('/alerts', (req, res) => {
  const today = localDateString();
  const tomorrow = addDays(today, 1);

  const queries = {
    lowStock: `SELECT id, name, stock, category, batch_no, expiry_date FROM Products
               WHERE deleted = 0 AND stock > 0 AND stock <= ? ORDER BY stock ASC`,
    outOfStock: `SELECT id, name, stock, category, batch_no, expiry_date FROM Products
                 WHERE deleted = 0 AND stock = 0 ORDER BY name ASC`,
    expiringTomorrow: `SELECT id, name, stock, category, batch_no, expiry_date FROM Products
                       WHERE deleted = 0 AND expiry_date = ? ORDER BY name ASC`,
    expired: `SELECT id, name, stock, category, batch_no, expiry_date FROM Products
              WHERE deleted = 0 AND expiry_date IS NOT NULL AND expiry_date < ? ORDER BY expiry_date ASC`,
  };

  db.all(queries.lowStock, [LOW_STOCK_THRESHOLD], (e1, lowStock) => {
    if (e1) return res.status(500).json({ error: e1.message });
    db.all(queries.outOfStock, [], (e2, outOfStock) => {
      if (e2) return res.status(500).json({ error: e2.message });
      db.all(queries.expiringTomorrow, [tomorrow], (e3, expiringTomorrow) => {
        if (e3) return res.status(500).json({ error: e3.message });
        db.all(queries.expired, [today], (e4, expired) => {
          if (e4) return res.status(500).json({ error: e4.message });
          res.json({
            asOf: today,
            lowStockThreshold: LOW_STOCK_THRESHOLD,
            counts: {
              lowStock: lowStock.length,
              outOfStock: outOfStock.length,
              expiringTomorrow: expiringTomorrow.length,
              expired: expired.length,
            },
            lowStock,
            outOfStock,
            expiringTomorrow,
            expired,
          });
        });
      });
    });
  });
});

/** GET /pharmacy/refunds — voided sales (returns) */
router.get('/refunds', (req, res) => {
  const sql = `
    SELECT s.*, c.name AS customer_name
    FROM Sales s
    LEFT JOIN Customers c ON s.customer_id = c.id
    WHERE s.deleted = 1
    ORDER BY s.updated_at DESC
    LIMIT 100
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
