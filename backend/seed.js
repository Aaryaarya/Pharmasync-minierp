const db = require('./db');

const products = [
  { name: 'Paracetamol 650mg', category: 'Pain Relief', price: 50.0, stock: 1250, batch_no: 'B001', expiry_date: '2027-12-31' },
  { name: 'Amoxicillin 500mg', category: 'Antibiotics', price: 120.0, stock: 890, batch_no: 'B002', expiry_date: '2026-06-15' },
  { name: 'Cetirizine 10mg', category: 'Allergy', price: 35.0, stock: 720, batch_no: 'B003', expiry_date: '2028-01-20' },
  { name: 'Ibuprofen 400mg', category: 'Pain Relief', price: 40.0, stock: 650, batch_no: 'B004', expiry_date: '2026-11-10' },
  { name: 'Vitamin C 500mg', category: 'Vitamins', price: 25.0, stock: 540, batch_no: 'B005', expiry_date: '2027-08-05' },
  { name: 'Azithromycin 500mg', category: 'Antibiotics', price: 150.0, stock: 8, batch_no: 'B006', expiry_date: '2025-10-10' },
  { name: 'Cough Syrup 100ml', category: 'Cold & Flu', price: 85.0, stock: 5, batch_no: 'B007', expiry_date: '2025-12-01' },
];

const customers = [
  { name: 'Pachu', phone: '9876543210' },
  { name: 'Arya', phone: '8765432109' },
  { name: 'Anu', phone: '7654321098' },
  { name: 'Patient 1', phone: '6543210987' },
  { name: 'Patient 2', phone: '5432109876' },
];

function run(sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

async function seed() {
  const now = new Date().toISOString();
  console.log("Seeding data...");

  let productIds = [];
  for (let p of products) {
    let id = await run(`INSERT INTO Products (name, category, price, stock, batch_no, expiry_date, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`, [p.name, p.category, p.price, p.stock, p.batch_no, p.expiry_date, now]);
    productIds.push(id);
  }

  let customerIds = [];
  for (let c of customers) {
    let id = await run(`INSERT INTO Customers (name, phone, updated_at) VALUES (?, ?, ?)`, [c.name, c.phone, now]);
    customerIds.push(id);
  }

  // Create 35 random sales over the last 14 days to make the graph look good
  for (let i = 0; i < 35; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const saleDate = `${y}-${m}-${day}`;

    const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
    
    // Pick 1 to 3 products
    const itemsCount = Math.floor(Math.random() * 3) + 1;
    let saleTotal = 0;
    let saleItems = [];
    for (let j = 0; j < itemsCount; j++) {
      const pidIndex = Math.floor(Math.random() * productIds.length);
      const pid = productIds[pidIndex];
      const prod = products[pidIndex];
      const qty = Math.floor(Math.random() * 3) + 1;
      saleTotal += prod.price * qty;
      saleItems.push({ pid, qty, price: prod.price });
    }

    const saleId = await run(`INSERT INTO Sales (customer_id, total, sale_date, updated_at) VALUES (?, ?, ?, ?)`, [customerId, saleTotal, saleDate, now]);
    
    for (let item of saleItems) {
      await run(`INSERT INTO SaleItems (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`, [saleId, item.pid, item.qty, item.price]);
    }
  }

  console.log("Seeding complete!");
}

seed().then(() => process.exit(0)).catch(console.error);
