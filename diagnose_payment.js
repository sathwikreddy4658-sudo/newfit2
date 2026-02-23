// Test script to diagnose payment issues
// Run this after a failed payment to see what's happening

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oikibnfnhauymhfpxiwi.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pa2libmZuaGF1eW1oZnB4aXdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc4OTk1OCwiZXhwIjoyMDg3MzY1OTU4fQ.pIWEsWC7-C-Jk1uyKF6MZ2Nz65cW_w7W7mObY5AZGlI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function diagnosePayment(transactionId) {
  console.log('\n🔍 Diagnosing Payment:', transactionId);
  console.log('═══════════════════════════════════════════════════════\n');

  // Check payment transaction
  const { data: tx, error: txError } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('merchant_transaction_id', transactionId)
    .maybeSingle();

  if (txError) {
    console.log('❌ Error fetching transaction:', txError.message);
  } else if (!tx) {
    console.log('❌ Transaction not found in database');
  } else {
    console.log('✅ Transaction found:');
    console.log('   ID:', tx.id);
    console.log('   Status:', tx.status);
    console.log('   Order ID:', tx.order_id);
    console.log('   Amount:', tx.amount);
    console.log('   Created:', tx.created_at);
    console.log('   Updated:', tx.updated_at);
  }

  // Check order if we have order_id
  if (tx && tx.order_id) {
    console.log('\n📦 Checking Order:', tx.order_id);
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', tx.order_id)
      .single();

    if (orderError) {
      console.log('   ❌ Error:', orderError.message);
    } else {
      console.log('   Status:', order.status);
      console.log('   Payment Method:', order.payment_method);
      console.log('   Payment ID:', order.payment_id);
      console.log('   Total Amount:', order.total_amount);
      console.log('   Items:', order.order_items.length);
      console.log('   Created:', order.created_at);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
}

async function checkCODFunction() {
  console.log('\n🔧 Checking COD Function...\n');
  
  try {
    // Try to call the function with a test UUID
    const { error } = await supabase.rpc('confirm_cod_order', {
      p_order_id: '00000000-0000-0000-0000-000000000000',
      p_payment_id: 'TEST'
    });

    if (error) {
      if (error.message.includes('Order not found')) {
        console.log('✅ COD function exists and is working');
        console.log('   (Test returned expected "order not found" error)');
      } else if (error.message.includes('does not exist')) {
        console.log('❌ COD function NOT deployed');
        console.log('   Run: node deploy_cod_now.js');
      } else {
        console.log('⚠️  COD function error:', error.message);
      }
    } else {
      console.log('✅ COD function working');
    }
  } catch (e) {
    console.log('❌ Error testing COD function:', e.message);
  }
  
  console.log('\n═══════════════════════════════════════════════════════\n');
}

// Get transaction ID from command line
const transactionId = process.argv[2];

if (!transactionId || transactionId === 'test-cod') {
  checkCODFunction();
} else {
  diagnosePayment(transactionId).then(() => process.exit(0));
}
