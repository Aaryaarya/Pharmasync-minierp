const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const router = express.Router();

const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || 'pharmasync-demo-secret-change-in-production';

function signToken(billerId) {
  const payload = JSON.stringify({ billerId, iat: Date.now() });
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ payload, sig })).toString('base64url');
}

function verifyToken(token) {
  try {
    const { payload, sig } = JSON.parse(Buffer.from(token, 'base64url').toString());
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex');
    if (sig !== expected) return null;
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/** POST /auth/login  body: { billerId, password } */
router.post('/login', (req, res) => {
  const billerId = String(req.body.billerId || req.body.biller_id || '').trim();
  const password = String(req.body.password || '');

  if (!billerId || !password) {
    return res.status(400).json({ error: 'Biller ID and password are required' });
  }

  db.get(`SELECT * FROM Billers WHERE id = ? AND active = 1`, [billerId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row || row.password !== password) {
      return res.status(401).json({ error: 'Invalid biller ID or password' });
    }
    const token = signToken(row.id);
    res.json({
      token,
      billerId: row.id,
      name: row.name,
      role: row.role || 'biller',
    });
  });
});

/** GET /auth/me  header: Authorization: Bearer <token> */
router.get('/me', (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const data = verifyToken(token);
  if (!data) return res.status(401).json({ error: 'Invalid or expired session' });

  db.get(`SELECT id, name, role FROM Billers WHERE id = ? AND active = 1`, [data.billerId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Biller not found' });
    res.json({ billerId: row.id, name: row.name, role: row.role });
  });
});

module.exports = { router, verifyToken };
