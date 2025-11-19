#!/usr/bin/env node
/**
 * Create the pincodes table in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTable() {
  console.log('🚀 Creating pincodes table...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create_pincodes_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📖 Executing SQL...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error creating table:', error.message);
      console.log('\n⚠️  Please run the SQL manually in Supabase SQL Editor:');
      console.log('1. Go to: https://app.supabase.com/project/osromibanfzzthdmhyzp/sql');
      console.log('2. Copy the contents of create_pincodes_table.sql');
      console.log('3. Paste and run it\n');
      process.exit(1);
    }
    
    console.log('✅ Table created successfully!\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('\n⚠️  Please run the SQL manually in Supabase SQL Editor:');
    console.log('1. Go to: https://app.supabase.com/project/osromibanfzzthdmhyzp/sql');
    console.log('2. Copy the contents of create_pincodes_table.sql');
    console.log('3. Paste and run it\n');
    process.exit(1);
  }
}

setupTable().catch(console.error);
