import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixHiddenProducts() {
  console.log('Fixing hidden products...\n');
  
  // Get all hidden products
  const { data: hiddenProducts, error: fetchError } = await supabase
    .from('products')
    .select('*')
    .eq('is_hidden', true);
  
  if (fetchError) {
    console.error('Error fetching hidden products:', fetchError);
    return;
  }
  
  console.log(`Found ${hiddenProducts.length} hidden products\n`);
  
  if (hiddenProducts.length === 0) {
    console.log('No hidden products to fix!');
    return;
  }
  
  // Update all hidden products to be visible
  for (const product of hiddenProducts) {
    console.log(`Updating product: ${product.name}`);
    
    const { error: updateError } = await supabase
      .from('products')
      .update({ is_hidden: false })
      .eq('id', product.id);
    
    if (updateError) {
      console.error(`  ❌ Error updating ${product.name}:`, updateError);
    } else {
      console.log(`  ✅ Successfully made ${product.name} visible`);
    }
  }
  
  console.log('\n✅ All products have been updated!');
  console.log('Products should now appear on the website.');
}

fixHiddenProducts().catch(console.error);
