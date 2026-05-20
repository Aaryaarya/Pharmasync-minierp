// Dev / assignment helper: inspect Outbox queue (no manual DB browser required).

const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  db.all(
    `SELECT id, table_name, operation, created_at, retry_count, payload FROM Outbox ORDER BY id DESC LIMIT ?`,
    [limit],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ count: rows.length, items: rows });
    }
  );
});

module.exports = router;
