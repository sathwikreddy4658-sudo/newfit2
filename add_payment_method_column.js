import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oikibnfnhauymhfpxiwi.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pa2libmZuaGF1eW1oZnB4aXdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc4OTk1OCwiZXhwIjoyMDg3MzY1OTU4fQ.pIWEsWC7-C-Jk1uyKF6MZ2Nz65cW_w7W7mObY5AZGlI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function addPaymentMethodColumn() {
  console.log('📦 Adding payment_method column to orders table...\n');
  
  try {
    // Execute via raw SQL using the REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        sql: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;'
      })
    });

    console.log('✅ Column added successfully!\n');
    console.log('🎉 COD and PhonePe orders can now track payment method!\n');
    
  } catch (error) {
    console.log('⚠️  Using manual approach...\n');
    console.log('📋 Go to: https://supabase.com/dashboard/project/osromibanfzzthdmhyzp/sql');
    console.log('📋 Run this SQL:\n');
    console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;');
    console.log('\n✅ This will enable payment method tracking!\n');
  }
}

addPaymentMethodColumn();
