require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

module.exports = {
  port: process.env.PORT || 4000,
  supabaseUrl,
  supabaseServiceKey,
  useSupabase: Boolean(supabaseUrl && supabaseServiceKey),
};
