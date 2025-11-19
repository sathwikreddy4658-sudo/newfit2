#!/usr/bin/env node
/**
 * Load Shipneer pincodes data into Supabase
 * This script reads the CSV file and inserts all pincodes into the database
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

async function loadPincodes() {
  console.log('🚀 Starting pincode data load...\n');

  try {
    // Read the CSV file
    const csvPath = path.join(__dirname, 'Complete_All_States_Combined_Pincodes.csv');
    console.log('📖 Reading file:', csvPath);
    
    const csvData = fs.readFileSync(csvPath, 'utf8');
    const lines = csvData.split('\n').filter(line => line.trim());
    
    // Skip header and parse CSV
    const pincodes = [];
    const seen = new Set(); // Track duplicates
    
    console.log(`📄 Processing ${lines.length - 1} lines...\n`);
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(',');
      if (parts.length < 5) continue;
      
      const pincode = parseInt(parts[0]);
      const state = parts[1].trim();
      const district = parts[2].trim();
      const delivery = parts[3].trim();
      const cod = parts[4].trim();
      
      // Skip duplicates (keep first occurrence)
      if (seen.has(pincode)) continue;
      seen.add(pincode);
      
      pincodes.push({
        pincode,
        state,
        district,
        delivery,
        cod,
        delivery_available: delivery === 'Y',
        cod_available: cod === 'Y',
      });
    }

    console.log(`✅ Loaded ${pincodes.length} unique pincodes from CSV\n`);

    // Delete existing data (optional - comment out if you want to keep existing)
    console.log('🗑️  Clearing existing pincodes...');
    const { error: deleteError } = await supabase
      .from('pincodes')
      .delete()
      .neq('pincode', 0); // Delete all

    if (deleteError) {
      console.log('⚠️  Note: Could not clear existing data:', deleteError.message);
    } else {
      console.log('✅ Cleared existing data\n');
    }

    // Insert in batches (Supabase has a limit)
    const batchSize = 1000;
    let inserted = 0;
    let failed = 0;

    console.log(`📦 Inserting in batches of ${batchSize}...\n`);

    for (let i = 0; i < pincodes.length; i += batchSize) {
      const batch = pincodes.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(pincodes.length / batchSize);

      process.stdout.write(`   Batch ${batchNum}/${totalBatches} (${batch.length} records)... `);

      const { data, error } = await supabase
        .from('pincodes')
        .insert(batch);

      if (error) {
        console.log('❌ FAILED');
        console.error('   Error:', error.message);
        failed += batch.length;
      } else {
        console.log('✅ SUCCESS');
        inserted += batch.length;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully inserted: ${inserted} pincodes`);
    if (failed > 0) {
      console.log(`❌ Failed: ${failed} pincodes`);
    }
    console.log('='.repeat(60) + '\n');

    // Verify data
    console.log('🔍 Verifying data in database...');
    const { count, error: countError } = await supabase
      .from('pincodes')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error verifying:', countError.message);
    } else {
      console.log(`✅ Total pincodes in database: ${count}\n`);
    }

    // Test specific pincodes
    console.log('🧪 Testing specific pincodes:');
    const testPincodes = [560001, 500067, 110001];
    for (const testPin of testPincodes) {
      const { data, error } = await supabase
        .from('pincodes')
        .select('*')
        .eq('pincode', testPin)
        .single();

      if (error) {
        console.log(`   ${testPin}: ❌ Not found`);
      } else {
        const deliveryStatus = data.delivery === 'Y' ? '✅' : '❌';
        const codStatus = data.cod === 'Y' ? '✅' : '❌';
        console.log(`   ${testPin}: ${deliveryStatus} Delivery | ${codStatus} COD | ${data.state}`);
      }
    }

    console.log('\n✅ DONE! Pincodes loaded successfully!');
    console.log('🎉 You can now test the pincode checker in your app!\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

loadPincodes().catch(console.error);
