import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkProducts() {
  console.log('Checking products in database...\n');
  
  // Get all products
  const { data: allProducts, error: allError } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (allError) {
    console.error('Error fetching all products:', allError);
    return;
  }
  
  console.log(`Total products in database: ${allProducts.length}\n`);
  
  if (allProducts.length > 0) {
    console.log('All products:');
    allProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Category: ${product.category}`);
      console.log(`   Is Hidden: ${product.is_hidden}`);
      console.log(`   Price: ₹${product.price || `${product.price_15g} - ${product.price_20g}`}`);
      console.log(`   Stock: ${product.stock}`);
      console.log(`   Created: ${new Date(product.created_at).toLocaleString()}`);
    });
  }
  
  // Get only visible products
  const { data: visibleProducts, error: visibleError } = await supabase
    .from('products')
    .select('*')
    .eq('is_hidden', false)
    .order('created_at', { ascending: false });
  
  if (visibleError) {
    console.error('\nError fetching visible products:', visibleError);
    return;
  }
  
  console.log(`\n\nVisible products (is_hidden = false): ${visibleProducts.length}`);
  
  if (visibleProducts.length > 0) {
    console.log('\nVisible products list:');
    visibleProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product.category})`);
    });
  } else {
    console.log('\n⚠️  NO VISIBLE PRODUCTS FOUND!');
    console.log('This means all products have is_hidden = true');
    console.log('Products need to have is_hidden = false to appear on the website');
  }
}

checkProducts().catch(console.error);
