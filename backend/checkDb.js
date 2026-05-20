// Quick check: lists tables and product count. Run: node checkDb.js
const db = require('./db');

db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", [], (err, tables) => {
  if (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
  console.log('Tables:', tables.map((t) => t.name).join(', '));

  db.get('SELECT COUNT(*) AS count FROM Products WHERE deleted = 0', [], (err2, row) => {
    if (err2) console.error('Products count error:', err2.message);
    else console.log('Active products:', row.count);
    db.close();
  });
});
