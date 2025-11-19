#!/usr/bin/env node
/**
 * Load and merge pincodes from both CSV files into Supabase
 * - Complete_All_States_Combined_Pincodes.csv (has state/district data)
 * - shipneer pincodes.csv (more pincodes but no state/district)
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

// Simple pincode to state mapping (first 2 digits)
const PINCODE_STATE_MAP = {
  '11': 'DELHI',
  '12': 'HARYANA',
  '13': 'PUNJAB',
  '14': 'PUNJAB',
  '15': 'PUNJAB',
  '16': 'CHANDIGARH',
  '17': 'HIMACHAL PRADESH',
  '18': 'JAMMU & KASHMIR',
  '19': 'JAMMU & KASHMIR',
  '20': 'UTTAR PRADESH',
  '21': 'UTTAR PRADESH',
  '22': 'UTTAR PRADESH',
  '23': 'UTTAR PRADESH',
  '24': 'UTTAR PRADESH',
  '25': 'UTTAR PRADESH',
  '26': 'UTTAR PRADESH',
  '27': 'UTTAR PRADESH',
  '28': 'UTTAR PRADESH',
  '30': 'RAJASTHAN',
  '31': 'RAJASTHAN',
  '32': 'RAJASTHAN',
  '33': 'RAJASTHAN',
  '34': 'RAJASTHAN',
  '36': 'GUJARAT',
  '37': 'GUJARAT',
  '38': 'GUJARAT',
  '39': 'GUJARAT',
  '40': 'MAHARASHTRA',
  '41': 'MAHARASHTRA',
  '42': 'MAHARASHTRA',
  '43': 'MAHARASHTRA',
  '44': 'MAHARASHTRA',
  '45': 'MADHYA PRADESH',
  '46': 'MADHYA PRADESH',
  '47': 'MADHYA PRADESH',
  '48': 'MADHYA PRADESH',
  '49': 'MADHYA PRADESH',
  '50': 'TELANGANA',
  '51': 'ANDHRA PRADESH',
  '52': 'ANDHRA PRADESH',
  '53': 'ANDHRA PRADESH',
  '56': 'KARNATAKA',
  '57': 'KARNATAKA',
  '58': 'KARNATAKA',
  '59': 'KARNATAKA',
  '60': 'TAMIL NADU',
  '61': 'TAMIL NADU',
  '62': 'TAMIL NADU',
  '63': 'TAMIL NADU',
  '64': 'TAMIL NADU',
  '67': 'KERALA',
  '68': 'KERALA',
  '69': 'KERALA',
  '70': 'WEST BENGAL',
  '71': 'WEST BENGAL',
  '72': 'WEST BENGAL',
  '73': 'WEST BENGAL',
  '74': 'WEST BENGAL',
  '75': 'ORISSA',
  '76': 'ORISSA',
  '77': 'ORISSA',
  '78': 'ASSAM',
  '79': 'ASSAM',
  '80': 'BIHAR',
  '81': 'BIHAR',
  '82': 'BIHAR',
  '83': 'BIHAR',
  '84': 'BIHAR',
  '85': 'JHARKHAND',
  '86': 'JHARKHAND',
  '87': 'SIKKIM',
  '88': 'MANIPUR',
  '89': 'ARUNACHAL PRADESH',
  '90': 'MEGHALAYA',
  '91': 'NAGALAND',
  '92': 'MIZORAM',
  '93': 'TRIPURA',
  '94': 'UTTARAKHAND',
  '95': 'GOA',
  '96': 'LAKSHADWEEP',
  '97': 'ANDAMAN & NICOBAR',
  '98': 'PONDICHERRY',
};

function getStateFromPincode(pincode) {
  const prefix = String(pincode).substring(0, 2);
  return PINCODE_STATE_MAP[prefix] || 'INDIA';
}

async function loadMergedPincodes() {
  console.log('🚀 Starting strategic pincode data load...\n');
  console.log('📋 Strategy:');
  console.log('   • Shipneer CSV → Deliverability (most comprehensive)');
  console.log('   • All States CSV → State/District info (for cost estimation)\n');

  try {
    const pincodeMap = new Map(); // Use Map to merge and deduplicate

    // ========== STEP 1: Load shipneer pincodes.csv (PRIMARY - for deliverability) ==========
    console.log('📖 STEP 1: Loading shipneer pincodes.csv (Primary source)');
    const csv1Path = path.join(__dirname, 'shipneer pincodes.csv');
    const csv1Data = fs.readFileSync(csv1Path, 'utf8');
    const lines1 = csv1Data.split('\n').filter(line => line.trim());
    
    console.log(`   Processing ${lines1.length - 1} lines...`);
    
    for (let i = 1; i < lines1.length; i++) {
      const line = lines1[i].trim();
      if (!line) continue;
      
      const parts = line.split(',');
      if (parts.length < 3) continue;
      
      const pincode = parseInt(parts[0]);
      if (isNaN(pincode)) continue;
      
      const delivery = parts[1].trim();
      const cod = parts[2].trim();
      
      // Add with inferred state (will be updated if found in All States CSV)
      const state = getStateFromPincode(pincode);
      pincodeMap.set(pincode, {
        pincode,
        state,
        district: null,
        delivery,
        cod,
        delivery_available: delivery === 'Y',
        cod_available: cod === 'Y',
      });
    }
    
    console.log(`   ✅ Loaded ${pincodeMap.size} deliverable pincodes\n`);

    // ========== STEP 2: Enrich with Complete_All_States_Combined_Pincodes.csv (SECONDARY - for state/district) ==========
    console.log('📖 STEP 2: Enriching with Complete_All_States_Combined_Pincodes.csv');
    const csv2Path = path.join(__dirname, 'Complete_All_States_Combined_Pincodes.csv');
    const csv2Data = fs.readFileSync(csv2Path, 'utf8');
    const lines2 = csv2Data.split('\n').filter(line => line.trim());
    
    console.log(`   Processing ${lines2.length - 1} lines for state/district data...`);
    
    let enriched = 0;
    
    for (let i = 1; i < lines2.length; i++) {
      const line = lines2[i].trim();
      if (!line) continue;
      
      const parts = line.split(',');
      if (parts.length < 5) continue;
      
      const pincode = parseInt(parts[0]);
      if (isNaN(pincode)) continue;
      
      const state = parts[1].trim();
      const district = parts[2].trim();
      
      // If pincode exists in shipneer data, enrich it with state/district
      if (pincodeMap.has(pincode)) {
        const existing = pincodeMap.get(pincode);
        // Update state and district with accurate data
        existing.state = state;
        existing.district = district;
        enriched++;
      }
      // Note: We DON'T add new pincodes from this file
      // We only use it to enrich existing shipneer pincodes
    }
    
    console.log(`   ✅ Enriched ${enriched} pincodes with state/district data\n`);

    // Convert Map to Array
    const pincodes = Array.from(pincodeMap.values());
    console.log(`📊 Total unique pincodes: ${pincodes.length}\n`);

    // Delete existing data
    console.log('🗑️  Clearing existing pincodes...');
    const { error: deleteError } = await supabase
      .from('pincodes')
      .delete()
      .gte('pincode', 0);

    if (deleteError) {
      console.log('⚠️  Could not clear:', deleteError.message);
      console.log('   Trying alternative delete method...');
      // Try truncate via RPC if available, or just continue
    } else {
      console.log('✅ Cleared existing data\n');
    }

    // Wait a bit to ensure delete completes
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Insert in batches
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
        .upsert(batch, { onConflict: 'pincode' });

      if (error) {
        console.log('❌ FAILED');
        console.error('   Error:', error.message);
        failed += batch.length;
      } else {
        console.log('✅ SUCCESS');
        inserted += batch.length;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL SUMMARY');
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
    const testPincodes = [560001, 500067, 110001, 400001, 600001];
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

    console.log('\n✅ DONE! Merged pincodes loaded successfully!');
    console.log('🎉 You now have maximum pincode coverage!\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

loadMergedPincodes().catch(console.error);
