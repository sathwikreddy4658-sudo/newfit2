import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function fixPriceValidation() {
  console.log('🔧 Fixing price validation to allow empty main price...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Test creating a product with empty main price
  console.log('Testing product creation with empty main price...');

  const testProduct = {
    name: "Test Product - Empty Price",
    category: "protein_bars",
    price: null, // Empty main price
    price_15g: 50,
    price_20g: 65,
    stock: 100,
    nutrition: "Test nutrition info",
    description: "Test product with empty main price",
    is_hidden: false
  };

  try {
    const { data, error } = await supabase
      .from('products')
      .insert([testProduct])
      .select();

    if (error) {
      console.error('❌ Product creation failed:', error.message);
      console.log('\n🔍 Analyzing the error...');

      if (error.message.includes('validation')) {
        console.log('This is a validation error. The issue is in the Zod schema.');
        console.log('The productSchema in validation.ts requires price to be optional,');
        console.log('but the form parsing logic might be sending an empty string instead of undefined.');
      }
    } else {
      console.log('✅ Product created successfully with empty main price!');
      console.log('Product ID:', data[0].id);

      // Clean up test product
      await supabase.from('products').delete().eq('id', data[0].id);
      console.log('🧹 Test product cleaned up');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }

  console.log('\n📋 SOLUTION:');
  console.log('The issue is in src/components/admin/ProductsTab.tsx');
  console.log('Change this line:');
  console.log('  const price = formData.price ? parseFloat(formData.price) : undefined;');
  console.log('To this:');
  console.log('  const price = formData.price && formData.price.trim() !== "" ? parseFloat(formData.price) : undefined;');
  console.log('');
  console.log('This ensures that empty strings are treated as undefined, not parsed as NaN.');
}

fixPriceValidation().catch(console.error);
