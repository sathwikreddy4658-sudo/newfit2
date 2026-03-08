// Test script to check guest orders in database
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Loaded environment from .env');
console.log(`Supabase URL: ${SUPABASE_URL?.substring(0, 30)}...`);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAllOrders() {
  console.log('\n🔍 Checking ALL orders in database...\n');
  
  // Fetch all orders
  const { data: allOrders, error: allOrdersError } = await supabase
    .from('orders')
    .select('id, customer_name, customer_email, customer_phone, address, user_id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (allOrdersError) {
    console.error('❌ Error fetching all orders:', allOrdersError);
    return;
  }
  
  if (!allOrders || allOrders.length === 0) {
    console.log('⚠️  No orders found in database at all');
    return;
  }
  
  console.log(`✅ Found ${allOrders.length} orders total:\n`);
  
  // Statistics
  let guestCount = 0;
  let authenticatedCount = 0;
  let guestWithMissingData = 0;
  
  allOrders.forEach((order, index) => {
    const isGuest = !order.user_id;
    
    if (isGuest) {
      guestCount++;
    } else {
      authenticatedCount++;
    }
    
    if (isGuest && (!order.customer_name || !order.customer_phone)) {
      guestWithMissingData++;
    }
    
    console.log(`--- Order ${index + 1} ---`);
    console.log(`ID: ${order.id.slice(0, 8)}`);
    console.log(`Type: ${isGuest ? '👤 GUEST' : '👤 AUTHENTICATED'}`);
    console.log(`user_id: ${order.user_id ? order.user_id.slice(0, 8) + '...' : 'NULL'}`);
    console.log(`Status: ${order.status}`);
    console.log(`Created: ${new Date(order.created_at).toLocaleString()}`);
    console.log(`Name: ${order.customer_name || '[EMPTY] ❌'}`);
    console.log(`Email: ${order.customer_email || '[EMPTY] ❌'}`);
    console.log(`Phone: ${order.customer_phone || '[EMPTY] ❌'}`);
    console.log('');
  });
  
  // Summary
  console.log('\n════════════════════════════════════════');
  console.log('SUMMARY:');
  console.log(`Total Orders: ${allOrders.length}`);
  console.log(`Guest Orders: ${guestCount}`);
  console.log(`Authenticated Orders: ${authenticatedCount}`);
  
  if (guestCount > 0) {
    console.log(`\nGuest Orders with Missing Data: ${guestWithMissingData}`);
    if (guestWithMissingData > 0) {
      console.log('⚠️  ISSUE DETECTED: Some guest orders missing customer details!');
    } else {
      console.log('✅ All guest orders have complete customer data!');
    }
  } else {
    console.log('⚠️  No guest orders in database (only authenticated user orders)');
  }
}

checkAllOrders().catch(console.error);
