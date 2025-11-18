import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://osromibanfzzthdmhyzp.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcm9taWJhbmZ6enRoZG1oeXpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjgzMDMyOSwiZXhwIjoyMDc4NDA2MzI5fQ.I1P1jpiI5hHe5Hue57p1i8_kkQEC3a8tWtPJQUTpdTk';

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
