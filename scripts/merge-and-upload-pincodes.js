import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Starting Pincode Data Consolidation\n');

/**
 * Step 1: Read Shipneer pincodes
 */
console.log('📖 Reading Shipneer pincodes...');
const shipneerFile = path.join(__dirname, '../shipneer pincodes.xlsx');
const shipneerWorkbook = XLSX.readFile(shipneerFile);
const shipneerWorksheet = shipneerWorkbook.Sheets[shipneerWorkbook.SheetNames[0]];
const shipneerData = XLSX.utils.sheet_to_json(shipneerWorksheet);

// Create a map for quick lookup: pincode -> shipneer data
const shipneerMap = new Map();
shipneerData.forEach(row => {
  shipneerMap.set(row.Pincode, {
    pincode: row.Pincode,
    delivery_available: row.Delivery === 'Y',
    cod_available: row.COD === 'Y',
  });
});

console.log(`✅ Loaded ${shipneerData.length} pincodes from Shipneer\n`);

/**
 * Step 2: Read all statewise Excel files
 */
console.log('📖 Reading statewise pincode files...');
const statewiseDir = path.join(__dirname, '../statewise-list-pin-codes-india-152j');
const stateFiles = fs.readdirSync(statewiseDir).filter(f => f.endsWith('.xls') || f.endsWith('.xlsx'));

console.log(`Found ${stateFiles.length} state files\n`);

// Map to store all pincodes with state info: pincode -> state data
const statewiseMap = new Map();

stateFiles.forEach((file, index) => {
  const stateName = file.replace(/\.xls[x]?$/, '');
  console.log(`  [${index + 1}/${stateFiles.length}] Processing ${stateName}...`);

  try {
    const filePath = path.join(statewiseDir, file);
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Filter valid rows and extract key info
    const validRows = data.filter(row => row.PINCODE && typeof row.PINCODE === 'number');

    validRows.forEach(row => {
      const pincode = row.PINCODE;
      
      // Store state data (will merge with Shipneer later)
      if (!statewiseMap.has(pincode)) {
        statewiseMap.set(pincode, {
          pincode,
          state: row['STATE/U.T.'] || stateName,
          district: row.DISTRICT || '',
          postal_division: row['POSTAL DIVISION'] || '',
          taluk: row.TALUK || '',
        });
      }
    });

    console.log(`    ✅ ${validRows.length} valid pincodes`);
  } catch (error) {
    console.error(`    ❌ Error processing ${file}: ${error.message}`);
  }
});

console.log(`\n✅ Loaded ${statewiseMap.size} pincodes from statewise data\n`);

/**
 * Step 3: Merge - ONLY keep pincodes in BOTH lists
 */
console.log('🔗 Merging data (intersection only)...');
const mergedData = [];
let foundInBoth = 0;
let onlyInShipneer = 0;
let onlyInStatewise = 0;

// Check Shipneer pincodes against statewise data
shipneerMap.forEach((shipneerRow, pincode) => {
  if (statewiseMap.has(pincode)) {
    // Found in BOTH - merge them
    const stateData = statewiseMap.get(pincode);
    mergedData.push({
      pincode,
      state: stateData.state,
      district: stateData.district,
      postal_division: stateData.postal_division,
      taluk: stateData.taluk,
      delivery_available: shipneerRow.delivery_available,
      cod_available: shipneerRow.cod_available,
    });
    foundInBoth++;
  } else {
    // Only in Shipneer (skip - no state info)
    onlyInShipneer++;
  }
});

// Log pincodes only in statewise (for info)
statewiseMap.forEach((stateRow, pincode) => {
  if (!shipneerMap.has(pincode)) {
    onlyInStatewise++;
  }
});

console.log(`\n📊 Merge Results:`);
console.log(`  ✅ Found in BOTH lists: ${foundInBoth}`);
console.log(`  ⚠️  Only in Shipneer (no state): ${onlyInShipneer}`);
console.log(`  ⚠️  Only in Statewise (not deliverable): ${onlyInStatewise}`);
console.log(`  📦 Final count (to upload): ${mergedData.length}\n`);

if (mergedData.length === 0) {
  console.error('❌ No pincodes found in both lists! Check file paths.');
  process.exit(1);
}

/**
 * Step 4: Upload merged data to Supabase
 */
console.log('☁️  Uploading to Supabase...\n');

const BATCH_SIZE = 1000;
let uploaded = 0;
let failed = 0;

async function uploadBatch(batch, batchNumber) {
  try {
    const { error } = await supabase
      .from('pincodes')
      .insert(batch)
      .select();

    if (error) {
      console.error(`  ❌ Batch ${batchNumber} failed: ${error.message}`);
      failed += batch.length;
      return;
    }

    uploaded += batch.length;
    const progress = Math.round((uploaded / mergedData.length) * 100);
    console.log(`  ✅ Batch ${batchNumber}: ${batch.length} pincodes (${progress}% complete)`);
  } catch (error) {
    console.error(`  ❌ Error in batch ${batchNumber}: ${error.message}`);
    failed += batch.length;
  }
}

async function uploadAllData() {
  for (let i = 0; i < mergedData.length; i += BATCH_SIZE) {
    const batch = mergedData.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    await uploadBatch(batch, batchNumber);
  }

  console.log(`\n🎉 Upload Complete!`);
  console.log(`\n📈 Final Statistics:`);
  console.log(`  ✅ Successfully uploaded: ${uploaded}`);
  console.log(`  ❌ Failed: ${failed}`);
  
  // Count by delivery status
  const deliverable = mergedData.filter(p => p.delivery_available).length;
  const codEnabled = mergedData.filter(p => p.cod_available).length;
  
  console.log(`  📦 Total Deliverable: ${deliverable}`);
  console.log(`  💳 COD Enabled: ${codEnabled}`);
  
  // Count by state
  const byState = {};
  mergedData.forEach(p => {
    byState[p.state] = (byState[p.state] || 0) + 1;
  });
  
  console.log(`\n🗺️  Pincodes by State (Top 10):`);
  Object.entries(byState)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([state, count]) => {
      console.log(`    ${state}: ${count}`);
    });

  console.log(`\n✨ Database is optimized and ready!`);
}

uploadAllData().catch(console.error);
