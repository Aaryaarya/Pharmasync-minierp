const config = require('../config');
const remoteDb = require('../remoteDb');
const { getSupabase } = require('./supabaseClient');
const { get } = require('./dbUtil');

const TABLE_MAP = {
  Products: { sqlite: 'Products', supabase: 'products' },
  Customers: { sqlite: 'Customers', supabase: 'customers' },
  Sales: { sqlite: 'Sales', supabase: 'sales' },
};

async function fetchRemoteRow(tableName, id) {
  if (id == null) return null;

  if (config.useSupabase) {
    const sb = getSupabase();
    const table = TABLE_MAP[tableName]?.supabase;
    if (!sb || !table) return null;
    const { data, error } = await sb.from(table).select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  const sqliteTable = TABLE_MAP[tableName]?.sqlite || tableName;
  return get(remoteDb, `SELECT * FROM ${sqliteTable} WHERE id = ?`, [id]);
}

module.exports = { fetchRemoteRow };
