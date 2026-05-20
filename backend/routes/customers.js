// backend/routes/customers.js

const express = require('express');
const db = require('../db');
const outbox = require('../outbox');
const router = express.Router();

// Get all customers (optional: ?search=term)
router.get('/', (req, res) => {
  const { search } = req.query;
  let sql = 'SELECT * FROM Customers WHERE deleted = 0';
  const params = [];

  if (search && String(search).trim()) {
    const term = `%${String(search).trim()}%`;
    sql += ` AND (
      LOWER(name) LIKE LOWER(?)
      OR LOWER(IFNULL(phone, '')) LIKE LOWER(?)
      OR LOWER(IFNULL(address, '')) LIKE LOWER(?)
    )`;
    params.push(term, term, term);
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add a new customer
router.post('/', (req, res) => {
  const { name, phone, address } = req.body;
  const updated_at = new Date().toISOString();
  db.run(
    `INSERT INTO Customers (name, phone, address, updated_at) VALUES (?, ?, ?, ?)`,
    [name, phone, address, updated_at],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const id = this.lastID;
      outbox.enqueue('Customers', 'INSERT', { id, name, phone, address, updated_at }, (oe) => {
        if (oe) console.error('[Outbox]', oe.message);
        res.json({ id });
      });
    }
  );
});

// Patient purchase history
router.get('/:id/history', (req, res) => {
  const customerId = parseInt(req.params.id, 10);
  if (Number.isNaN(customerId)) return res.status(400).json({ error: 'Invalid customer id' });

  db.get(`SELECT * FROM Customers WHERE id = ? AND deleted = 0`, [customerId], (err, customer) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const sql = `
      SELECT s.id, s.sale_date, s.total, s.updated_at, s.deleted,
             (SELECT COUNT(*) FROM SaleItems WHERE sale_id = s.id) AS line_count
      FROM Sales s
      WHERE s.customer_id = ? AND s.deleted = 0
      ORDER BY s.sale_date DESC, s.id DESC
    `;
    db.all(sql, [customerId], (err2, sales) => {
      if (err2) return res.status(500).json({ error: err2.message });
      const totalSpent = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
      res.json({
        customer,
        sales,
        summary: { purchaseCount: sales.length, totalSpent },
      });
    });
  });
});

// Edit a customer
router.put('/:id', (req, res) => {
  const { name, phone, address } = req.body;
  const updated_at = new Date().toISOString();
  db.run(
    `UPDATE Customers SET name=?, phone=?, address=?, updated_at=? WHERE id=?`,
    [name, phone, address, updated_at, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const changes = this.changes;
      const id = parseInt(req.params.id, 10);
      if (!changes) return res.json({ changes: 0 });
      outbox.enqueue('Customers', 'UPDATE', { id, name, phone, address, updated_at }, (oe) => {
        if (oe) console.error('[Outbox]', oe.message);
        res.json({ changes });
      });
    }
  );
});

// Soft delete a customer
router.delete('/:id', (req, res) => {
  const updated_at = new Date().toISOString();
  db.run(
    `UPDATE Customers SET deleted=1, updated_at=? WHERE id=?`,
    [updated_at, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const changes = this.changes;
      const id = parseInt(req.params.id, 10);
      if (!changes) return res.json({ changes: 0 });
      outbox.enqueue('Customers', 'SOFT_DELETE', { id, deleted: 1, updated_at }, (oe) => {
        if (oe) console.error('[Outbox]', oe.message);
        res.json({ changes });
      });
    }
  );
});

module.exports = router;
