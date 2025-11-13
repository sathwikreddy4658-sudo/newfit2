import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function debugPriceIssue() {
  console.log('🔍 Debugging price validation issue...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Sign in as admin first
  console.log('1. Signing in as admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@freelit.com',
    password: 'admin123',
  });

  if (authError) {
    console.error('❌ Admin sign in failed:', authError.message);
    return;
  }

  console.log('✅ Signed in as admin\n');

  // Test different price scenarios
  const testCases = [
    { name: 'Empty string price', price: '', price_15g: 50, price_20g: 65 },
    { name: 'Null price', price: null, price_15g: 50, price_20g: 65 },
    { name: 'Undefined price', price: undefined, price_15g: 50, price_20g: 65 },
    { name: 'Whitespace price', price: '   ', price_15g: 50, price_20g: 65 },
  ];

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    console.log(`  Price value: ${JSON.stringify(testCase.price)}`);

    const productData = {
      name: `Test Product - ${testCase.name}`,
      category: 'protein_bars',
      price: testCase.price,
      price_15g: testCase.price_15g,
      price_20g: testCase.price_20g,
      stock: 100,
      nutrition: 'Test nutrition',
      is_hidden: false
    };

    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select();

      if (error) {
        console.log(`  ❌ Failed: ${error.message}`);
      } else {
        console.log(`  ✅ Success! Product ID: ${data[0].id}`);

        // Clean up
        await supabase.from('products').delete().eq('id', data[0].id);
        console.log(`  🧹 Cleaned up test product`);
      }
    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}`);
    }

    console.log('');
  }

  console.log('📋 Analysis:');
  console.log('The issue might be in the form validation logic.');
  console.log('Check if the form is sending empty strings instead of null/undefined.');
  console.log('The Zod schema allows optional price, but the form parsing might be wrong.');

  // Sign out
  await supabase.auth.signOut();
}

debugPriceIssue().catch(console.error);
