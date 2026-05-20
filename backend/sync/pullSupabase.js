const { getSupabase } = require('./supabaseClient');
const { mergeProduct, mergeCustomer, mergeSale } = require('./mergePull');

function mapRow(r) {
  if (!r) return r;
  return {
    ...r,
    deleted: r.deleted === true || r.deleted === 1 ? 1 : 0,
    synced: 1,
  };
}

async function pullFromSupabase(localDb, since) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase is not configured');

  const serverTime = new Date().toISOString();
  const applied = { products: 0, customers: 0, sales: 0 };

  const { data: products, error: pErr } = await sb
    .from('products')
    .select('*')
    .gt('updated_at', since)
    .order('updated_at', { ascending: true });
  if (pErr) throw new Error(pErr.message);
  for (const row of products || []) {
    if (await mergeProduct(localDb, mapRow(row))) applied.products += 1;
  }

  const { data: customers, error: cErr } = await sb
    .from('customers')
    .select('*')
    .gt('updated_at', since)
    .order('updated_at', { ascending: true });
  if (cErr) throw new Error(cErr.message);
  for (const row of customers || []) {
    if (await mergeCustomer(localDb, mapRow(row))) applied.customers += 1;
  }

  const { data: sales, error: sErr } = await sb
    .from('sales')
    .select('*')
    .gt('updated_at', since)
    .order('updated_at', { ascending: true });
  if (sErr) throw new Error(sErr.message);

  for (const sale of sales || []) {
    const mappedSale = mapRow(sale);
    if (await mergeSale(localDb, null, mappedSale, sb)) applied.sales += 1;
  }

  return { serverTime, applied };
}

module.exports = { pullFromSupabase };
