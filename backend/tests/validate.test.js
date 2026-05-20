const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  parseNonNegativeInt,
  parsePositiveInt,
  validateProductBody,
} = require('../lib/validate');

describe('quantity validation', () => {
  it('rejects negative stock', () => {
    const r = parseNonNegativeInt(-5, 'Stock');
    assert.equal(r.ok, false);
  });

  it('rejects fractional stock', () => {
    const r = parseNonNegativeInt(2.5, 'Stock');
    assert.equal(r.ok, false);
  });

  it('accepts zero stock', () => {
    const r = parseNonNegativeInt(0, 'Stock');
    assert.equal(r.ok, true);
    assert.equal(r.value, 0);
  });

  it('sale line quantity must be at least 1', () => {
    assert.equal(parsePositiveInt(0, 'Quantity').ok, false);
    assert.equal(parsePositiveInt(-1, 'Quantity').ok, false);
    assert.equal(parsePositiveInt(3, 'Quantity').ok, true);
  });
});

describe('validateProductBody', () => {
  it('rejects negative price and stock in one payload', () => {
    const r = validateProductBody({ name: 'Paracetamol', price: -10, stock: -1 });
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => e.includes('Stock')));
    assert.ok(r.errors.some((e) => e.includes('Price')));
  });

  it('accepts valid product fields', () => {
    const r = validateProductBody({ name: 'Aspirin', price: 12.5, stock: 100 });
    assert.equal(r.ok, true);
    assert.equal(r.stock, 100);
    assert.equal(r.price, 12.5);
  });
});
