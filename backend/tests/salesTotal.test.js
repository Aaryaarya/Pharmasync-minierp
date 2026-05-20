const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

/** Same formula as backend/routes/sales.js */
function calculateSaleTotal(lines) {
  return lines.reduce((sum, x) => sum + x.quantity * x.price, 0);
}

describe('sales total calculation', () => {
  it('sums quantity * price for multiple lines', () => {
    const total = calculateSaleTotal([
      { quantity: 2, price: 50 },
      { quantity: 1, price: 120.5 },
    ]);
    assert.equal(total, 220.5);
  });

  it('empty lines is zero', () => {
    assert.equal(calculateSaleTotal([]), 0);
  });
});
