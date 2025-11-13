import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function fixProductsAsAdmin() {
  console.log('🔧 Fixing products with admin authentication...\n');
  
  // Admin credentials
  const ADMIN_EMAIL = 'admin@freelit.com';
  const ADMIN_PASSWORD = 'admin123';
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  try {
    // Sign in as admin
    console.log('1. Signing in as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    
    if (authError) {
      console.error('❌ Failed to sign in as admin:', authError.message);
      console.log('\n⚠️  Please update ADMIN_EMAIL and ADMIN_PASSWORD in the script with your admin credentials.');
      return;
    }
    
    console.log('✅ Signed in as admin\n');
    
    // Update products
    console.log('2. Updating products to be visible...');
    const { data: updateData, error: updateError } = await supabase
      .from('products')
      .update({ is_hidden: false })
      .eq('is_hidden', true)
      .select();
    
    if (updateError) {
      console.error('❌ Failed to update products:', updateError.message);
      return;
    }
    
    console.log(`✅ Updated ${updateData.length} product(s) to be visible\n`);
    
    // Verify the changes
    console.log('3. Verifying changes...');
    const { data: allProducts, error: fetchError } = await supabase
      .from('products')
      .select('name, is_hidden, category');
    
    if (fetchError) {
      console.error('❌ Failed to fetch products:', fetchError);
      return;
    }
    
    console.log('\nAll products:');
    allProducts.forEach(p => {
      const status = p.is_hidden ? '❌ HIDDEN' : '✅ VISIBLE';
      console.log(`  ${status} - ${p.name} (${p.category})`);
    });
    
    const visibleCount = allProducts.filter(p => !p.is_hidden).length;
    console.log(`\n📊 Summary: ${visibleCount}/${allProducts.length} products are visible`);
    
    if (visibleCount === allProducts.length) {
      console.log('\n🎉 SUCCESS! All products are now visible on the website!');
    }
    
    // Sign out
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

console.log('═══════════════════════════════════════════════════════');
console.log('  Product Visibility Fix Script');
console.log('═══════════════════════════════════════════════════════\n');

fixProductsAsAdmin().catch(console.error);
