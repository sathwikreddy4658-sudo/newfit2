import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://oikibnfnhauymhfpxiwi.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pa2libmZuaGF1eW1oZnB4aXdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc4OTk1OCwiZXhwIjoyMDg3MzY1OTU4fQ.pIWEsWC7-C-Jk1uyKF6MZ2Nz65cW_w7W7mObY5AZGlI';

async function fixCODFunction() {
  console.log('🔧 Fixing COD function in database...\n');
  
  const sql = readFileSync('supabase/migrations/20251118120000_add_cod_confirmation.sql', 'utf8');
  
  console.log('📋 Go to: https://supabase.com/dashboard/project/osromibanfzzthdmhyzp/sql');
  console.log('📋 Copy and paste this SQL:\n');
  console.log('─────────────────────────────────────────────────────────');
  console.log(sql);
  console.log('─────────────────────────────────────────────────────────');
  console.log('\n✅ Click "Run" to update the function!');
  console.log('✅ This will fix COD orders immediately!\n');
}

fixCODFunction();
