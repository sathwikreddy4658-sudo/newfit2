#!/usr/bin/env node
/**
 * Check and fix pincodes table in Supabase
 * This script verifies if pincodes are properly marked as deliverable
 */

const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPincodes() {
  console.log('🔍 Checking pincodes table...\n');

  try {
    // Check total count
    const { count, error: countError } = await supabase
      .from('pincodes')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting pincodes:', countError.message);
      return;
    }

    console.log(`📊 Total pincodes in table: ${count || 0}`);

    // Check deliverable count
    const { data: deliverable, error: delError } = await supabase
      .from('pincodes')
      .select('pincode')
      .eq('delivery_available', true)
      .limit(10);

    if (!delError && deliverable && deliverable.length > 0) {
      console.log(`✅ Deliverable pincodes found: ${deliverable.map(p => p.pincode).join(', ')}`);
    } else {
      console.log('❌ No deliverable pincodes found! All pincodes marked as not deliverable.');
    }

    // Check a specific test pincode
    console.log('\n📌 Testing specific pincodes:');
    const testPincodes = [560001, 500067, 110001];

    for (const testPin of testPincodes) {
      const { data, error } = await supabase
        .from('pincodes')
        .select('*')
        .eq('pincode', testPin)
        .single();

      if (error) {
        console.log(`  ${testPin}: ❌ Not found in database`);
      } else if (data) {
        const status = data.delivery_available ? '✅' : '❌';
        console.log(`  ${testPin}: ${status} (${data.state}, delivery_available: ${data.delivery_available})`);
      }
    }

    // Suggest fix
    console.log('\n💡 DIAGNOSIS:');
    if (!count || count === 0) {
      console.log('   The pincodes table is EMPTY. You need to:');
      console.log('   1. Load the Shipneer pincodes CSV into Supabase');
      console.log('   2. Or manually insert test pincodes with delivery_available = true');
    } else if (!deliverable || deliverable.length === 0) {
      console.log('   The pincodes table HAS data but ALL are marked as delivery_available = false');
      console.log('   You need to update delivery_available to true for serviceable pincodes');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function suggestFix() {
  console.log('\n🔧 SUGGESTED FIX:');
  console.log('');
  console.log('Option 1: Insert test pincodes with delivery_available = true');
  console.log('');
  console.log(`  INSERT INTO pincodes (pincode, state, district, delivery_available, cod_available)
  VALUES
    (560001, 'KARNATAKA', 'Bangalore', true, true),
    (500067, 'TELANGANA', 'Hyderabad', true, true),
    (110001, 'DELHI', 'New Delhi', true, true);`);
  console.log('');
  console.log('Option 2: Update all existing pincodes to be deliverable');
  console.log('');
  console.log(`  UPDATE pincodes SET delivery_available = true WHERE delivery_available = false;`);
  console.log('');
  console.log('Option 3: Load Shipneer CSV data');
  console.log('   See: supabase/migrations/load_pincodes_from_csv.sql');
  console.log('');
}

async function main() {
  await checkPincodes();
  await suggestFix();
}

main().catch(console.error);
