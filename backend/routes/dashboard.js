// backend/routes/dashboard.js — aggregated KPIs for the ERP dashboard (SQLite).

const express = require('express');
const db = require('../db');
const router = express.Router();

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

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

/** Fill missing calendar days with zeros for charts */
function fillDays(fromStr, toStr, rows) {
  const map = Object.fromEntries(rows.map((r) => [r.date, { total: Number(r.total) || 0, count: Number(r.count) || 0 }]));
  const out = [];
  let cur = fromStr;
  while (cur <= toStr) {
    const cell = map[cur] || { total: 0, count: 0 };
    out.push({ date: cur, total: cell.total, count: cell.count });
    cur = addDays(cur, 1);
  }
  return out;
}

router.get('/summary', async (req, res) => {
  try {
    const todayStr = localDateString();
    const lowStockThreshold = 10;
    const chartDays = 14;
    const chartFrom = addDays(todayStr, -(chartDays - 1));

    const todayRow = await get(
      `SELECT COUNT(*) AS cnt, COALESCE(SUM(total), 0) AS value FROM Sales WHERE deleted = 0 AND sale_date = ?`,
      [todayStr]
    );

    const revenueRow = await get(`SELECT COALESCE(SUM(total), 0) AS value FROM Sales WHERE deleted = 0`, []);

    const productRow = await get(`SELECT COUNT(*) AS cnt FROM Products WHERE deleted = 0`, []);
    const customerRow = await get(`SELECT COUNT(*) AS cnt FROM Customers WHERE deleted = 0`, []);

    const lowStockRow = await get(
      `SELECT COUNT(*) AS cnt FROM Products WHERE deleted = 0 AND stock <= ?`,
      [lowStockThreshold]
    );

    const lowStockProducts = await all(
      `SELECT id, name, stock, category, batch_no FROM Products WHERE deleted = 0 AND stock <= ? ORDER BY stock ASC, name ASC LIMIT 20`,
      [lowStockThreshold]
    );

    const recentSales = await all(
      `
      SELECT s.id, s.sale_date, s.total, c.name AS customer_name
      FROM Sales s
      LEFT JOIN Customers c ON s.customer_id = c.id
      WHERE s.deleted = 0
      ORDER BY s.id DESC
      LIMIT 10
      `,
      []
    );

    const salesByDayRaw = await all(
      `
      SELECT sale_date AS date, COALESCE(SUM(total), 0) AS total, COUNT(*) AS count
      FROM Sales
      WHERE deleted = 0 AND sale_date >= ? AND sale_date <= ?
      GROUP BY sale_date
      ORDER BY sale_date ASC
      `,
      [chartFrom, todayStr]
    );

    const topSellingProducts = await all(
      `
      SELECT p.name, SUM(si.quantity) as qty, SUM(si.quantity * si.price) as revenue
      FROM SaleItems si
      JOIN Sales s ON si.sale_id = s.id
      JOIN Products p ON si.product_id = p.id
      WHERE s.deleted = 0 AND s.sale_date >= ? AND s.sale_date <= ?
      GROUP BY p.id
      ORDER BY revenue DESC
      LIMIT 5
      `,
      [chartFrom, todayStr]
    );

    const salesByDay = fillDays(chartFrom, todayStr, salesByDayRaw);

    res.json({
      asOf: new Date().toISOString(),
      todayDate: todayStr,
      todaySalesCount: todayRow.cnt || 0,
      todaySalesValue: todayRow.value || 0,
      totalRevenue: revenueRow.value || 0,
      productCount: productRow.cnt || 0,
      customerCount: customerRow.cnt || 0,
      lowStockThreshold,
      lowStockCount: lowStockRow.cnt || 0,
      lowStockProducts,
      recentSales,
      salesByDay,
      topSellingProducts,
    });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Dashboard query failed' });
  }
});

module.exports = router;
