const config = require('../config');
const { pingSupabase } = require('./supabaseClient');

async function isRemoteOnline(req) {
  const env = process.env.REMOTE_OFFLINE;
  if (env === '1' || env === 'true') return false;
  if (req && String(req.headers['x-simulate-remote-offline'] || '') === '1') return false;

  if (config.useSupabase) {
    const ping = await pingSupabase();
    return ping.ok;
  }

  return true;
}

module.exports = { isRemoteOnline };
