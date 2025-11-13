import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  console.error('You need to set SUPABASE_SERVICE_ROLE_KEY in your .env file');
  console.error('\n📝 How to get your Service Role Key:');
  console.error('1. Go to: https://app.supabase.com');
  console.error('2. Click your project');
  console.error('3. Go to Settings (bottom left) → API');
  console.error('4. Copy the "Service Role Key" (keep it secret!)');
  console.error('5. Add to .env: SUPABASE_SERVICE_ROLE_KEY=your_key_here\n');
  console.error('OR use the Supabase SQL Editor method below.\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function makePriceNullable() {
  console.log('🚀 Making price column nullable...\n');

  try {
    const migrationSQL = 'ALTER TABLE public.products ALTER COLUMN price DROP NOT NULL;';

    console.log('📝 Executing SQL:');
    console.log(migrationSQL);
    console.log('\n---\n');

    const { error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    }).catch(err => ({ error: err }));

    if (error) {
      console.error('❌ Error:', error.message);
      console.error('\n⚠️  This usually means you need to use the Supabase SQL Editor instead.\n');
      console.log('📌 ALTERNATIVE METHOD - Use Supabase SQL Editor:');
      console.log('1. Go to: https://app.supabase.com');
      console.log('2. Click your project');
      console.log('3. Click "SQL Editor" in left sidebar');
      console.log('4. Click "New Query"');
      console.log('5. Copy and paste this SQL:');
      console.log('');
      console.log('   ALTER TABLE public.products ALTER COLUMN price DROP NOT NULL;');
      console.log('');
      console.log('6. Click "Run"');
      console.log('7. You should see "Success" message');
      console.log('\nThen refresh your browser and try creating a product again!');
    } else {
      console.log('✅ Success!\n');
      console.log('✅ The price column is now nullable!');
      console.log('✅ You can now create products without a main price.');
      console.log('\n🎉 Try creating a product now:');
      console.log('- Leave "Price" empty');
      console.log('- Fill in "Price 15g" and "Price 20g"');
      console.log('- The product will be created successfully!');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

makePriceNullable();
