#!/usr/bin/env node

/**
 * Verify all database tables and their structure
 * Run this with: node verify-database-setup.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const tablesToCheck = [
  'blogs',
  'product_faqs',
  'product_ratings',
  'newsletter_subscribers',
  'products',
  'user_roles'
];

async function checkTable(tableName) {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01') {
        return { status: '❌ NOT FOUND', records: 0, error: 'Table does not exist' };
      } else if (error.code === '42501') {
        return { status: '⚠️  NO ACCESS', records: 0, error: 'RLS policy blocking access' };
      } else {
        return { status: '❌ ERROR', records: 0, error: error.message };
      }
    }

    return { status: '✅ EXISTS', records: count || 0, error: null };
  } catch (error) {
    return { status: '❌ ERROR', records: 0, error: error.message };
  }
}

async function verifySetup() {
  console.log('\n🔍 DATABASE VERIFICATION\n');
  console.log('='.repeat(60));

  let allGood = true;

  for (const table of tablesToCheck) {
    const result = await checkTable(table);
    const statusSymbol = result.status;
    const records = result.records > 0 ? ` (${result.records} records)` : '';
    
    console.log(`\n${statusSymbol} ${table}${records}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
      allGood = false;
    }
  }

  console.log('\n' + '='.repeat(60));

  if (allGood) {
    console.log('\n✅ All tables exist and are accessible!\n');
  } else {
    console.log('\n⚠️  Some tables are missing or inaccessible.\n');
    console.log('Run these SQL migrations in Supabase SQL Editor:\n');
    console.log('1. Blog setup');
    console.log('2. Product FAQs setup');
    console.log('3. Product Ratings setup (parts 1-3)');
    console.log('4. Newsletter setup\n');
  }
}

console.log('🚀 Database Setup Verification Tool\n');
verifySetup().catch(console.error);
