const { getSupabase } = require('./supabaseClient');

function toBool(v) {
  return v === true || v === 1 || v === '1';
}

async function upsertProduct(sb, p) {
  const row = {
    id: p.id,
    name: p.name,
    category: p.category ?? null,
    price: p.price,
    stock: p.stock,
    batch_no: p.batch_no ?? null,
    expiry_date: p.expiry_date ?? null,
    image: p.image ?? null,
    updated_at: p.updated_at,
    deleted: toBool(p.deleted),
    synced: true,
  };
  const { error } = await sb.from('products').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

async function upsertCustomer(sb, c) {
  const row = {
    id: c.id,
    name: c.name,
    phone: c.phone ?? null,
    address: c.address ?? null,
    updated_at: c.updated_at,
    deleted: toBool(c.deleted),
    synced: true,
  };
  const { error } = await sb.from('customers').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

async function applySaleInsert(sb, payload) {
  const { id, customer_id, total, sale_date, updated_at, items } = payload;

  const { error: saleErr } = await sb.from('sales').upsert(
    {
      id,
      customer_id,
      total,
      sale_date,
      updated_at,
      deleted: false,
      synced: true,
    },
    { onConflict: 'id' }
  );
  if (saleErr) throw new Error(saleErr.message);

  await sb.from('sale_items').delete().eq('sale_id', id);

  for (const it of items || []) {
    const { error: itemErr } = await sb.from('sale_items').insert({
      sale_id: id,
      product_id: it.product_id,
      quantity: it.quantity,
      price: it.price,
    });
    if (itemErr) throw new Error(itemErr.message);

    const { data: prod } = await sb.from('products').select('stock').eq('id', it.product_id).single();
    if (prod) {
      const newStock = Math.max(0, (prod.stock || 0) - it.quantity);
      const { error: stErr } = await sb
        .from('products')
        .update({ stock: newStock, updated_at })
        .eq('id', it.product_id);
      if (stErr) throw new Error(stErr.message);
    }
  }
}

async function applySaleSoftDelete(sb, payload) {
  const { id, updated_at, line_items } = payload;
  const { error } = await sb.from('sales').update({ deleted: true, updated_at, synced: true }).eq('id', id);
  if (error) throw new Error(error.message);

  for (const it of line_items || []) {
    const { data: prod } = await sb.from('products').select('stock').eq('id', it.product_id).single();
    if (prod) {
      const { error: stErr } = await sb
        .from('products')
        .update({ stock: (prod.stock || 0) + it.quantity, updated_at })
        .eq('id', it.product_id);
      if (stErr) throw new Error(stErr.message);
    }
  }
}

async function applyOutboxRowSupabase(row) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured');

  const payload = JSON.parse(row.payload);
  const { table_name, operation } = row;

  if (table_name === 'Products') {
    if (operation === 'SOFT_DELETE') {
      const { error } = await sb
        .from('products')
        .update({ deleted: true, updated_at: payload.updated_at, synced: true })
        .eq('id', payload.id);
      if (error) throw new Error(error.message);
    } else {
      await upsertProduct(sb, { ...payload, deleted: payload.deleted ?? 0 });
    }
    return;
  }

  if (table_name === 'Customers') {
    if (operation === 'SOFT_DELETE') {
      const { error } = await sb
        .from('customers')
        .update({ deleted: true, updated_at: payload.updated_at, synced: true })
        .eq('id', payload.id);
      if (error) throw new Error(error.message);
    } else {
      await upsertCustomer(sb, { ...payload, deleted: payload.deleted ?? 0 });
    }
    return;
  }

  if (table_name === 'Sales') {
    if (operation === 'INSERT') await applySaleInsert(sb, payload);
    else if (operation === 'SOFT_DELETE') await applySaleSoftDelete(sb, payload);
    return;
  }

  throw new Error(`Unknown outbox table: ${table_name}`);
}

module.exports = { applyOutboxRowSupabase };
