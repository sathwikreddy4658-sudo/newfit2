import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://osromibanfzzthdmhyzp.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcm9taWJhbmZ6enRoZG1oeXpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjgzMDMyOSwiZXhwIjoyMDc4NDA2MzI5fQ.I1P1jpiI5hHe5Hue57p1i8_kkQEC3a8tWtPJQUTpdTk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function deployCODFunction() {
  console.log('📦 Deploying confirm_cod_order function...');
  
  try {
    const sql = readFileSync('supabase/migrations/20251118120000_add_cod_confirmation.sql', 'utf8');
    
    const { error } = await supabase.rpc('exec', { sql_query: sql }).catch(async () => {
      // If rpc doesn't work, try direct query
      return await supabase.from('_dummy').select('*').limit(0).then(() => {
        throw new Error('Using alternative method...');
      });
    });

    if (error) {
      console.log('⚠️ Direct RPC failed, trying SQL editor approach...');
      console.log('\n📋 Please execute this SQL in Supabase SQL Editor:');
      console.log('https://supabase.com/dashboard/project/osromibanfzzthdmhyzp/sql\n');
      console.log(sql);
      console.log('\n✅ After executing, the COD orders will work properly!');
    } else {
      console.log('✅ Function deployed successfully!');
    }
  } catch (error) {
    console.log('⚠️ Automated deployment not available.');
    console.log('\n📋 Please manually execute this in Supabase Dashboard:');
    console.log('👉 Go to: https://supabase.com/dashboard/project/osromibanfzzthdmhyzp/sql');
    console.log('👉 Paste the SQL from: supabase/migrations/20251118120000_add_cod_confirmation.sql');
    console.log('👉 Click "Run"');
    console.log('\n✅ This will enable COD order confirmation!');
  }
}

deployCODFunction();
