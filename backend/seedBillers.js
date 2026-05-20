const db = require('./db');

const DEMO_BILLERS = [
  { id: 'biller1', password: '1234', name: 'Biller 1', role: 'biller' },
  { id: 'biller2', password: '1234', name: 'Biller 2', role: 'biller' },
];

function seedBillers() {
  db.run(
    `CREATE TABLE IF NOT EXISTS Billers (
      id TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'biller',
      active INTEGER DEFAULT 1
    )`,
    [],
    (err) => {
      if (err) {
        console.error('[Billers] table error:', err.message);
        return;
      }
      for (const b of DEMO_BILLERS) {
        db.run(
          `INSERT INTO Billers (id, password, name, role, active) VALUES (?, ?, ?, ?, 1)
           ON CONFLICT(id) DO UPDATE SET password=excluded.password, name=excluded.name, active=1`,
          [b.id, b.password, b.name, b.role]
        );
      }
      console.log('[Billers] Demo logins ready (biller1 / 1234)');
    }
  );
}

module.exports = { seedBillers };
