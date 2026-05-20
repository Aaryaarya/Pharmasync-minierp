const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

let client = null;

function getSupabase() {
  if (!config.useSupabase) return null;
  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/** Quick health check for sync status */
async function pingSupabase() {
  const sb = getSupabase();
  if (!sb) return { ok: false, reason: 'not_configured' };
  const { error } = await sb.from('products').select('id').limit(1);
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

module.exports = { getSupabase, pingSupabase };
