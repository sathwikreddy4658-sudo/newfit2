// Test Telegram Notification Setup
// Run this to verify all components are in place

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your URL
const SUPABASE_SERVICE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // Replace with your service role key

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testTelegramSetup() {
  console.log('🔍 Testing Telegram Notification Setup...\n');

  // 1. Check if trigger exists
  console.log('1️⃣ Checking database trigger...');
  const { data: triggers, error: triggerError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT trigger_name, event_manipulation, action_statement 
      FROM information_schema.triggers 
      WHERE trigger_name = 'trigger_telegram_new_order';
    `
  });

  if (triggerError) {
    console.log('❌ Could not check triggers (might need direct SQL access)');
    console.log('   Error:', triggerError.message);
  } else {
    console.log('✅ Trigger check completed');
  }

  // 2. Check if function exists
  console.log('\n2️⃣ Checking notify_telegram_new_order function...');
  const { data: functions, error: funcError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_name = 'notify_telegram_new_order';
    `
  });

  if (funcError) {
    console.log('❌ Could not check functions (might need direct SQL access)');
    console.log('   Error:', funcError.message);
  } else {
    console.log('✅ Function check completed');
  }

  // 3. Test creating an order
  console.log('\n3️⃣ Testing order creation with Telegram notification...');
  
  // Get a user ID
  const { data: users } = await supabase.auth.admin.listUsers();
  if (!users || users.users.length === 0) {
    console.log('❌ No users found. Please create a user first.');
    return;
  }

  const testUserId = users.users[0].id;
  console.log(`   Using test user: ${testUserId}`);

  // Create test order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: testUserId,
      total_price: 999.00,
      payment_id: 'TELEGRAM-TEST-' + Date.now(),
      address: '123 Test Street, Test City, Test State - 123456',
      status: 'pending',
      payment_method: 'cod'
    })
    .select()
    .single();

  if (orderError) {
    console.log('❌ Order creation failed:', orderError.message);
    return;
  }

  console.log('✅ Test order created:', order.id);
  console.log('   Check your Telegram (@orderfreelitbot) for notification!');
  console.log('   Waiting 5 seconds...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('4️⃣ Cleaning up test order...');
  await supabase.from('orders').delete().eq('id', order.id);
  console.log('✅ Test order deleted\n');

  console.log('📝 If you did NOT receive a Telegram message, check:');
  console.log('   1. Supabase Dashboard → Settings → Edge Functions → Secrets');
  console.log('      - TELEGRAM_BOT_TOKEN = 8543969612:AAEOFzw8LMW0j1jzi38sn8OluwrxU_HqYDc');
  console.log('      - TELEGRAM_CHAT_ID = 5658170910');
  console.log('      - SUPABASE_URL = your project URL');
  console.log('      - SUPABASE_SERVICE_ROLE_KEY = your service role key');
  console.log('      - SITE_URL = your website URL');
  console.log('   2. Database trigger must be created (run migration SQL)');
  console.log('   3. Check Supabase Edge Functions logs for errors');
}

testTelegramSetup().catch(console.error);
