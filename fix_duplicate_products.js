import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function findAndFixDuplicates() {
  console.log('🔍 Finding Duplicate Products\n');
  console.log('═══════════════════════════════════════\n');

  try {
    // Get all products
    const { data: allProducts, error: fetchError } = await supabase
      .from('products')
      .select('id, name, category, price_15g, price_20g, stock, created_at');

    if (fetchError) {
      console.error('❌ Error fetching products:', fetchError);
      return;
    }

    // Group by name to find duplicates
    const nameGroups = {};
    allProducts.forEach(product => {
      if (!nameGroups[product.name]) {
        nameGroups[product.name] = [];
      }
      nameGroups[product.name].push(product);
    });

    // Find duplicates
    const duplicates = Object.entries(nameGroups).filter(([_, products]) => products.length > 1);

    if (duplicates.length === 0) {
      console.log('✅ No duplicate product names found!\n');
      return;
    }

    console.log(`⚠️  Found ${duplicates.length} products with duplicate names:\n`);

    duplicates.forEach(([name, products]) => {
      console.log(`📌 Product Name: "${name}" (${products.length} duplicates)`);
      products.forEach((p, index) => {
        console.log(`   ${index + 1}. ID: ${p.id}`);
        console.log(`      Created: ${new Date(p.created_at).toLocaleString()}`);
        console.log(`      Price 15g: ₹${p.price_15g}, Price 20g: ₹${p.price_20g}`);
        console.log(`      Stock: ${p.stock}`);
      });
      console.log('');
    });

    console.log('═══════════════════════════════════════\n');
    console.log('📋 To Fix:\n');
    console.log('Option 1: Delete duplicate via Supabase Dashboard');
    console.log('  1. Go to: https://app.supabase.com');
    console.log('  2. Click your project');
    console.log('  3. Table Editor → products');
    console.log('  4. Find the duplicate products');
    console.log('  5. Delete the older one (keep the newer one)');
    console.log('  6. Refresh your app\n');

    console.log('Option 2: Use the automatic fix script below\n');

    // Ask which ones to delete
    console.log('💡 Recommendation: Delete all but the NEWEST version of each product\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function deleteDuplicateProducts() {
  console.log('🗑️  Auto-deleting Duplicate Products\n');
  console.log('═══════════════════════════════════════\n');
  console.log('⚠️  This will keep the NEWEST product and delete older duplicates\n');

  try {
    const { data: allProducts, error: fetchError } = await supabase
      .from('products')
      .select('id, name, created_at');

    if (fetchError) {
      console.error('❌ Error:', fetchError);
      return;
    }

    // Group by name
    const nameGroups = {};
    allProducts.forEach(product => {
      if (!nameGroups[product.name]) {
        nameGroups[product.name] = [];
      }
      nameGroups[product.name].push(product);
    });

    // Find products to delete (keep only the newest)
    const toDelete = [];
    Object.values(nameGroups).forEach(products => {
      if (products.length > 1) {
        // Sort by created_at, keep the newest
        products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        // Mark all but the first (newest) for deletion
        for (let i = 1; i < products.length; i++) {
          toDelete.push(products[i].id);
        }
      }
    });

    if (toDelete.length === 0) {
      console.log('✅ No duplicates to delete!\n');
      return;
    }

    console.log(`🗑️  About to delete ${toDelete.length} duplicate product(s)\n`);

    // Delete duplicates
    let deleted = 0;
    for (const id of toDelete) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`❌ Failed to delete ${id}:`, error.message);
      } else {
        console.log(`✅ Deleted duplicate: ${id}`);
        deleted++;
      }
    }

    console.log(`\n✅ Successfully deleted ${deleted} duplicate products!\n`);
    console.log('═══════════════════════════════════════\n');
    console.log('🎉 Refresh your browser and try again!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the finder first
await findAndFixDuplicates();

// Ask if user wants to auto-delete (in production, you'd prompt)
console.log('\n💡 Run this to auto-delete duplicates:');
console.log('   node fix_duplicate_products.js --fix\n');
