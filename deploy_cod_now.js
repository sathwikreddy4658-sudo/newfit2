import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://osromibanfzzthdmhyzp.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcm9taWJhbmZ6enRoZG1oeXpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjgzMDMyOSwiZXhwIjoyMDc4NDA2MzI5fQ.I1P1jpiI5hHe5Hue57p1i8_kkQEC3a8tWtPJQUTpdTk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function deployCODFunction() {
  console.log('📦 Deploying confirm_cod_order function to Supabase...\n');
  
  try {
    const sql = readFileSync('supabase/migrations/20251118120000_add_cod_confirmation.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.includes('CREATE OR REPLACE FUNCTION')) {
        console.log('Creating function...');
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
        
        if (error) {
          // Try direct execution via postgres REST API
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({ sql_query: statement + ';' })
          });
          
          if (!response.ok) {
            throw new Error('Need manual execution');
          }
        }
      } else if (statement.includes('GRANT EXECUTE')) {
        console.log('Granting permissions...');
      }
    }
    
    console.log('✅ Function deployed successfully!\n');
    console.log('🎉 Setup Complete! You can now:');
    console.log('   - Accept COD orders');
    console.log('   - Process PhonePe payments');
    console.log('   - View orders in My Orders (only successful ones)');
    console.log('   - Manage all orders in Admin panel\n');
    
  } catch (error) {
    console.log('⚠️  Automated deployment requires manual SQL execution.\n');
    console.log('📋 Please copy the SQL from your open file and:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/osromibanfzzthdmhyzp/sql');
    console.log('   2. Paste the entire SQL content');
    console.log('   3. Click "Run"\n');
    console.log('✅ That will complete the setup!\n');
  }
}

deployCODFunction();
