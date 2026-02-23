import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oikibnfnhauymhfpxiwi.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pa2libmZuaGF1eW1oZnB4aXdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc4OTk1OCwiZXhwIjoyMDg3MzY1OTU4fQ.pIWEsWC7-C-Jk1uyKF6MZ2Nz65cW_w7W7mObY5AZGlI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkOrders() {
  console.log('🔍 Checking orders in database...\n');
  
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.log('❌ Error fetching orders:', error.message);
    return;
  }

  console.log(`✅ Found ${orders.length} orders:\n`);
  
  orders.forEach((order, i) => {
    console.log(`${i + 1}. Order ${order.id.slice(0, 8)}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Customer: ${order.customer_name || 'N/A'}`);
    console.log(`   Total: ₹${order.total_price}`);
    console.log(`   Payment ID: ${order.payment_id || 'N/A'}`);
    console.log(`   Created: ${new Date(order.created_at).toLocaleString()}`);
    console.log('');
  });

  // Now check RLS policies
  console.log('\n🔒 Checking RLS Policies...\n');
  console.log('📋 Go to: https://supabase.com/dashboard/project/osromibanfzzthdmhyzp/sql');
  console.log('📋 Run this to allow admins to view all orders:\n');
  console.log(`-- Allow admins to select all orders
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );`);
}

checkOrders();
