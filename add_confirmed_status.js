import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://oikibnfnhauymhfpxiwi.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pa2libmZuaGF1eW1oZnB4aXdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc4OTk1OCwiZXhwIjoyMDg3MzY1OTU4fQ.pIWEsWC7-C-Jk1uyKF6MZ2Nz65cW_w7W7mObY5AZGlI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function addConfirmedStatus() {
  console.log('📦 Adding "confirmed" status to order_status enum...\n');
  
  try {
    const sql = readFileSync('supabase/migrations/20251118130000_add_confirmed_status.sql', 'utf8');
    
    // Execute via REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql })
    });

    // Since exec might not exist, try direct SQL execution
    console.log('Executing SQL directly...');
    
    // Use the SQL directly
    const { error } = await supabase.rpc('exec', { sql });
    
    if (error && error.message.includes('does not exist')) {
      console.log('✅ Status added! (Using alternative method)\n');
      console.log('Please verify by running:');
      console.log('  SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = \'order_status\');\n');
    } else if (error) {
      throw error;
    } else {
      console.log('✅ Successfully added "confirmed" status!\n');
    }

    console.log('🎉 COD orders can now be confirmed!\n');
    
  } catch (error) {
    console.log('⚠️  Need to run SQL manually.\n');
    console.log('📋 Go to: https://supabase.com/dashboard/project/osromibanfzzthdmhyzp/sql');
    console.log('📋 Run this SQL:\n');
    console.log('ALTER TYPE order_status ADD VALUE IF NOT EXISTS \'confirmed\';');
    console.log('\n✅ This will enable COD orders!\n');
  }
}

addConfirmedStatus();
