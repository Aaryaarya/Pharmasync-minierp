// backend/routes/products.js

const express = require('express');
const db = require('../db');
const outbox = require('../outbox');
const { validateProductBody } = require('../lib/validate');
const router = express.Router();

// Get all products (optional: ?search=term)
router.get('/', (req, res) => {
  const { search } = req.query;
  let sql = 'SELECT * FROM Products WHERE deleted = 0';
  const params = [];

  if (search && String(search).trim()) {
    const term = `%${String(search).trim()}%`;
    sql += ` AND (
      LOWER(name) LIKE LOWER(?)
      OR LOWER(category) LIKE LOWER(?)
      OR LOWER(batch_no) LIKE LOWER(?)
    )`;
    params.push(term, term, term);
  }

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add a new product
router.post('/', (req, res) => {
  const validated = validateProductBody(req.body);
  if (!validated.ok) return res.status(400).json({ error: validated.errors.join('; ') });
  const { name, category, price, stock, batch_no, expiry_date, image } = validated;
  const updated_at = new Date().toISOString();
  db.run(
    `INSERT INTO Products (name, category, price, stock, batch_no, expiry_date, image, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, category, price, stock, batch_no, expiry_date, image, updated_at],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const id = this.lastID;
      outbox.enqueue(
        'Products',
        'INSERT',
        { id, name, category, price, stock, batch_no, expiry_date, image: image ?? null, updated_at },
        (oe) => {
          if (oe) console.error('[Outbox]', oe.message);
          res.json({ id });
        }
      );
    }
  );
});

// Edit a product
router.put('/:id', (req, res) => {
  const validated = validateProductBody(req.body);
  if (!validated.ok) return res.status(400).json({ error: validated.errors.join('; ') });
  const { name, category, price, stock, batch_no, expiry_date, image } = validated;
  const updated_at = new Date().toISOString();
  db.run(
    `UPDATE Products SET name=?, category=?, price=?, stock=?, batch_no=?, expiry_date=?, image=?, updated_at=? WHERE id=?`,
    [name, category, price, stock, batch_no, expiry_date, image, updated_at, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const changes = this.changes;
      const id = parseInt(req.params.id, 10);
      if (!changes) return res.json({ changes: 0 });
      outbox.enqueue(
        'Products',
        'UPDATE',
        { id, name, category, price, stock, batch_no, expiry_date, image: image ?? null, updated_at },
        (oe) => {
          if (oe) console.error('[Outbox]', oe.message);
          res.json({ changes });
        }
      );
    }
  );
});

// Soft delete a product
router.delete('/:id', (req, res) => {
  const updated_at = new Date().toISOString();
  db.run(
    `UPDATE Products SET deleted=1, updated_at=? WHERE id=?`,
    [updated_at, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const changes = this.changes;
      const id = parseInt(req.params.id, 10);
      if (!changes) return res.json({ changes: 0 });
      outbox.enqueue('Products', 'SOFT_DELETE', { id, deleted: 1, updated_at }, (oe) => {
        if (oe) console.error('[Outbox]', oe.message);
        res.json({ changes });
      });
    }
  );
});

module.exports = router;
