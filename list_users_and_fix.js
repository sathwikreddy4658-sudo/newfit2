import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function listUsersAndFix() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Checking Users and Fixing Products');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  console.log('📋 Current situation:');
  console.log('   - Products are hidden (is_hidden = true)');
  console.log('   - Admin credentials are not working');
  console.log('   - Need to fix products to be visible\n');
  
  console.log('🔍 Checking what we can access...\n');
  
  // Try to get products (should work with public read access)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, is_hidden, category');
  
  if (productsError) {
    console.error('❌ Cannot read products:', productsError.message);
  } else {
    console.log(`✅ Found ${products.length} product(s):`);
    products.forEach(p => {
      const status = p.is_hidden ? '🔒 HIDDEN' : '✅ VISIBLE';
      console.log(`   ${status} - ${p.name} (${p.category})`);
    });
  }
  
  console.log('\n' + '═'.repeat(55));
  console.log('\n🎯 SOLUTION:\n');
  console.log('Since we cannot update products programmatically due to RLS policies,');
  console.log('you need to run this SQL directly in your Supabase Dashboard:\n');
  console.log('─'.repeat(55));
  console.log('UPDATE public.products');
  console.log('SET is_hidden = false');
  console.log('WHERE is_hidden = true;');
  console.log('');
  console.log('ALTER TABLE public.products');
  console.log('ALTER COLUMN is_hidden SET DEFAULT false;');
  console.log('─'.repeat(55));
  console.log('\n📍 Steps to fix:');
  console.log('   1. Go to https://supabase.com/dashboard');
  console.log('   2. Select your project');
  console.log('   3. Click "SQL Editor" in the left sidebar');
  console.log('   4. Click "New Query"');
  console.log('   5. Copy and paste the SQL above');
  console.log('   6. Click "Run" or press Ctrl+Enter');
  console.log('   7. Refresh your website - products should appear!\n');
  
  console.log('💡 For authentication issues:');
  console.log('   - Make sure admin account exists and email is verified');
  console.log('   - Check Supabase Dashboard → Authentication → Users');
  console.log('   - You can manually verify emails there if needed\n');
}

listUsersAndFix().catch(console.error);
