/**
 * Shared request validation (Step 17 — no negative quantities).
 */

function parseNonNegativeInt(value, fieldLabel) {
  if (value === undefined || value === null || value === '') {
    return { ok: false, error: `${fieldLabel} is required` };
  }
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    return { ok: false, error: `${fieldLabel} must be a non-negative whole number` };
  }
  return { ok: true, value: n };
}

function parsePositiveInt(value, fieldLabel) {
  const base = parseNonNegativeInt(value, fieldLabel);
  if (!base.ok) return base;
  if (base.value < 1) {
    return { ok: false, error: `${fieldLabel} must be at least 1` };
  }
  return base;
}

function parseNonNegativePrice(value, fieldLabel = 'Price') {
  if (value === undefined || value === null || value === '') {
    return { ok: false, error: `${fieldLabel} is required` };
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, error: `${fieldLabel} must be zero or greater` };
  }
  return { ok: true, value: n };
}

function validateProductBody(body) {
  const errors = [];
  if (!body.name || !String(body.name).trim()) errors.push('Product name is required');

  const stock = parseNonNegativeInt(body.stock, 'Stock');
  if (!stock.ok) errors.push(stock.error);

  const price = parseNonNegativePrice(body.price, 'Price');
  if (!price.ok) errors.push(price.error);

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    name: String(body.name).trim(),
    category: body.category ?? null,
    price: price.value,
    stock: stock.value,
    batch_no: body.batch_no ?? null,
    expiry_date: body.expiry_date ?? null,
    image: body.image ?? null,
  };
}

module.exports = {
  parseNonNegativeInt,
  parsePositiveInt,
  parseNonNegativePrice,
  validateProductBody,
};
