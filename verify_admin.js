import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oikibnfnhauymhfpxiwi.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pa2libmZuaGF1eW1oZnB4aXdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc4OTk1OCwiZXhwIjoyMDg3MzY1OTU4fQ.pIWEsWC7-C-Jk1uyKF6MZ2Nz65cW_w7W7mObY5AZGlI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyAdminSetup() {
  console.log('🔍 Verifying admin setup...\n');

  // Check if is_admin column exists
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, is_admin')
    .limit(5);

  console.log('✅ Profiles with is_admin column:');
  profiles?.forEach(p => {
    console.log(`   ${p.email}: ${p.is_admin ? '✓ ADMIN' : '✗ not admin'}`);
  });

  // Check if admin user exists
  const { data: admin } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'admin@freelit.com')
    .single();

  console.log('\n📋 Admin user (admin@freelit.com):');
  if (admin) {
    console.log(`   ✅ Found: ${admin.name}`);
    console.log(`   is_admin: ${admin.is_admin}`);
    
    if (!admin.is_admin) {
      console.log('\n⚠️  Admin flag not set! Run this SQL:');
      console.log(`   UPDATE profiles SET is_admin = true WHERE email = 'admin@freelit.com';\n`);
    }
  } else {
    console.log('   ❌ Not found');
  }

  // Check orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, customer_name')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('\n📦 Recent orders (using service role):');
  console.log(`   Found: ${orders?.length || 0} orders`);
  orders?.forEach(o => {
    console.log(`   - ${o.status}: ${o.customer_name || 'N/A'} (${o.id.slice(0,8)})`);
  });

  console.log('\n');
}

verifyAdminSetup();
