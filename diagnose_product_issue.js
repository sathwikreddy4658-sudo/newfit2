import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function diagnoseProductIssue() {
  console.log('🔍 Diagnosing Product Detail Issue\n');
  console.log('═══════════════════════════════════════\n');

  try {
    // Get all products
    console.log('✓ Fetching all products...\n');
    const { data: allProducts, error: fetchError } = await supabase
      .from('products')
      .select('id, name, is_hidden, category, created_at');

    if (fetchError) {
      console.error('❌ Error fetching products:', fetchError);
      return;
    }

    console.log(`Total products in database: ${allProducts.length}\n`);

    // Categorize products
    const hiddenProducts = allProducts.filter(p => p.is_hidden);
    const visibleProducts = allProducts.filter(p => !p.is_hidden);

    console.log(`📊 Product Status:`);
    console.log(`  ✅ Visible products: ${visibleProducts.length}`);
    console.log(`  🔒 Hidden products: ${hiddenProducts.length}\n`);

    if (visibleProducts.length > 0) {
      console.log('✅ Visible Products (shown on Products page):');
      visibleProducts.forEach(p => {
        console.log(`  - ${p.name} (Category: ${p.category})`);
      });
    }

    if (hiddenProducts.length > 0) {
      console.log('\n🔒 Hidden Products (NOT shown on Products page):');
      hiddenProducts.forEach(p => {
        console.log(`  - ${p.name} (Category: ${p.category}) [HIDDEN]`);
      });
    }

    console.log('\n═══════════════════════════════════════\n');

    // Check for products with case sensitivity issues
    console.log('✓ Checking for potential issues:\n');

    if (allProducts.length === 0) {
      console.log('⚠️  No products found in database');
      return;
    }

    // Test if ProductDetail query would work for first product
    const testProduct = allProducts[0];
    console.log(`Testing ProductDetail query with: "${testProduct.name}"`);

    const { data: testData, error: testError } = await supabase
      .from('products')
      .select('*')
      .eq('name', testProduct.name)
      .single();

    if (testError) {
      console.log(`❌ Query failed: ${testError.message}`);
      console.log(`\n💡 Issue identified: Name-based query is failing`);
    } else if (testData) {
      console.log(`✅ Query successful!`);
      console.log(`\n✅ Product can be fetched by name`);
    }

    console.log('\n═══════════════════════════════════════\n');
    console.log('📋 Possible Issues:\n');

    if (hiddenProducts.length > 0) {
      console.log('1. ⚠️  Some products are marked as HIDDEN');
      console.log('   - These won\'t appear on the Products page');
      console.log('   - But clicking them directly should still work\n');
    }

    if (allProducts.some(p => p.name?.trim() !== p.name)) {
      console.log('2. ⚠️  Some product names have leading/trailing spaces');
      console.log('   - This could cause matching issues\n');
    }

    console.log('3. 💡 Common causes of "Product Not Found":');
    console.log('   - Product was deleted from database');
    console.log('   - Product name changed in database');
    console.log('   - Product is hidden (is_hidden = true)');
    console.log('   - Database connection issue');
    console.log('   - Special characters in product name causing encoding issues\n');

    console.log('═══════════════════════════════════════\n');
    console.log('✅ Fix Summary:\n');
    console.log('1. Check if products you\'re testing are marked as hidden');
    console.log('2. Create a test product and try to access it');
    console.log('3. Check browser console for exact product name being searched');
    console.log('4. Verify the product exists in Supabase Table Editor\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

diagnoseProductIssue();
