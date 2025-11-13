import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://osromibanfzzthdmhyzp.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zcm9taWJhbmZ6enRoZG1oeXpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjgzMDMyOSwiZXhwIjoyMDc4NDA2MzI5fQ.I1P1jpiI5hHe5Hue57p1i8_kkQEC3a8tWtPJQUTpdTk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// List of migrations to run in order
const migrations = [
  'newfit-main/supabase/migrations/20251110000000_fix_is_hidden_default_and_existing_products.sql',
  'newfit-main/supabase/migrations/20251111000000_make_price_nullable.sql',
  'newfit-main/supabase/migrations/20251112000000_fix_profile_address_nullable.sql'
];

async function executeMigration(migrationPath) {
  console.log(`\n🚀 Running migration: ${migrationPath}\n`);

  try {
    // Read the migration file
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('Migration SQL:');
    console.log(migrationSQL);
    console.log('\n---\n');

    // Execute the migration using RPC
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      console.log('\nTrying direct SQL execution...\n');

      // Try executing each statement separately
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error: stmtError } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (stmtError) {
          console.error(`  ❌ Failed:`, stmtError.message);
        } else {
          console.log(`  ✅ Success`);
        }
      }
    } else {
      console.log('✅ Migration executed successfully!');
    }

  } catch (err) {
    console.error('❌ Error:', err);
  }
}

async function runMigrations() {
  console.log('Starting migration process...\n');

  for (const migration of migrations) {
    await executeMigration(migration);
  }

  console.log('\n🎉 All migrations completed!\n');

  // Verify the changes
  console.log('Verifying changes...\n');

  // Check products table
  const { data: products, error: checkError } = await supabase
    .from('products')
    .select('name, is_hidden, price');

  if (checkError) {
    console.error('Error checking products:', checkError);
  } else {
    console.log('Products after migration:');
    products.forEach(p => {
      console.log(`  - ${p.name}: is_hidden = ${p.is_hidden}, price = ${p.price}`);
    });
  }

  // Check profiles table
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('name, email, address')
    .limit(5);

  if (profileError) {
    console.error('Error checking profiles:', profileError);
  } else {
    console.log('\nProfiles sample after migration:');
    profiles.forEach(p => {
      console.log(`  - ${p.name} (${p.email}): address = ${p.address}`);
    });
  }
}

runMigrations().catch(console.error);
