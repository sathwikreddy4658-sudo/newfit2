import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read Excel file
const filePath = path.join(__dirname, '../shipneer pincodes.xlsx');
const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(`📊 Total pincodes to upload: ${data.length}`);

// Transform data for database
const transformedData = data.map(row => ({
  pincode: row.Pincode,
  delivery_available: row.Delivery === 'Y',
  cod_available: row.COD === 'Y',
  shipping_charge: null, // Will be calculated based on distance
  estimated_days: null,
}));

// Upload in batches to avoid timeouts
const BATCH_SIZE = 1000;
let uploaded = 0;
let failed = 0;

async function uploadBatch(batch, batchNumber) {
  try {
    const { error, data: result } = await supabase
      .from('pincodes')
      .insert(batch)
      .select();

    if (error) {
      console.error(`❌ Batch ${batchNumber} failed:`, error.message);
      failed += batch.length;
      return;
    }

    uploaded += batch.length;
    console.log(`✅ Batch ${batchNumber} uploaded: ${batch.length} pincodes (Total: ${uploaded})`);
  } catch (error) {
    console.error(`❌ Error uploading batch ${batchNumber}:`, error.message);
    failed += batch.length;
  }
}

async function uploadAllData() {
  console.log('🚀 Starting upload...\n');

  for (let i = 0; i < transformedData.length; i += BATCH_SIZE) {
    const batch = transformedData.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    await uploadBatch(batch, batchNumber);
  }

  console.log(`\n📈 Upload Complete!`);
  console.log(`✅ Uploaded: ${uploaded}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total COD Available: ${transformedData.filter(p => p.cod_available).length}`);
  console.log(`📊 Total Delivery Available: ${transformedData.filter(p => p.delivery_available).length}`);
}

uploadAllData().catch(console.error);
