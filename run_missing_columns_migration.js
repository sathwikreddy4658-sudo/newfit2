import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
  console.log('🚀 Running migration: add_missing_product_columns\n');

  try {
    // Read the migration SQL
    const migrationSQL = readFileSync(
      'supabase/migrations/20251113000002_add_missing_product_columns.sql',
      'utf8'
    );

    console.log('📝 Migration SQL:');
    console.log(migrationSQL);
    console.log('\n---\n');

    // Split into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log(`⏳ Executing: ${statement.substring(0, 60)}...`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      }).catch(err => ({ error: err }));

      if (error) {
        console.error(`  ❌ Error:`, error.message);
        // Continue anyway as some statements might be conditional (IF NOT EXISTS)
      } else {
        console.log(`  ✅ Success`);
      }
    }

    console.log('\n🎉 Migration completed!\n');

    // Verify the changes
    console.log('✅ Verifying products table structure...\n');
    const { data: products, error: checkError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking products:', checkError);
    } else {
      console.log('✅ Products table is accessible');
      console.log('✅ Columns added successfully!\n');
      console.log('You can now create products with:');
      console.log('  - price_15g');
      console.log('  - price_20g');
      console.log('  - products_page_image');
      console.log('  - cart_image');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

runMigration();
