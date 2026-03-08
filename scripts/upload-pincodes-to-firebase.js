#!/usr/bin/env node
/**
 * Upload pincodes from CSV to Firebase Firestore
 * Usage: node scripts/upload-pincodes-to-firebase.js
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

// ESM equivalent of __dirname (Node 22+)
const __dirname = import.meta.dirname;

// firebase-admin is CommonJS, load via createRequire
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

// Check for service account
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, '../firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('\u274c Firebase service account not found at:', serviceAccountPath);
  console.error('');
  console.error('To get your service account key:');
  console.error('  1. Go to https://console.firebase.google.com/project/newfit-35320/settings/serviceaccounts/adminsdk');
  console.error('  2. Click "Generate New Private Key"');
  console.error('  3. Save the file as firebase-service-account.json in the project root');
  process.exit(1);
}

// ESM cannot require() JSON directly - read & parse manually
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

/**
 * Parse CSV file and return array of records
 */
function parseCSV(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length < 2) {
      throw new Error('CSV file is empty or malformed');
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const pinCodeIndex = headers.indexOf('pincode');
    const stateIndex = headers.indexOf('state');
    const districtIndex = headers.indexOf('district');
    const deliveryIndex = headers.indexOf('delivery');
    const codIndex = headers.indexOf('cod');

    if (pinCodeIndex === -1 || stateIndex === -1) {
      throw new Error('Missing required columns: pincode, state');
    }

    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      
      const pincode = parseInt(parts[pinCodeIndex]);
      if (isNaN(pincode)) continue;

      records.push({
        pincode,
        state: parts[stateIndex] || '',
        district: parts[districtIndex] || '',
        delivery: parts[deliveryIndex] || 'N',
        cod: parts[codIndex] || 'N',
        delivery_available: parts[deliveryIndex] === 'Y',
        cod_available: parts[codIndex] === 'Y',
      });
    }

    return records;
  } catch (error) {
    console.error('Error parsing CSV:', error.message);
    throw error;
  }
}

/**
 * Upload records to Firebase in batches
 */
async function uploadToFirebase(records) {
  const BATCH_SIZE = 500; // Firestore batch limit
  let uploaded = 0;
  let skipped = 0;

  console.log(`\n📤 Uploading ${records.length} pincodes to Firebase...`);
  console.log('⏳ This may take several minutes...\n');

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = admin.firestore().batch();
    const batchRecords = records.slice(i, Math.min(i + BATCH_SIZE, records.length));

    for (const record of batchRecords) {
      // Key by pincode string for O(1) lookup in the app
      const docRef = db.collection('pincodes').doc(`${record.pincode}`);
      batch.set(docRef, record, { merge: true });
      uploaded++;
    }

    try {
      await batch.commit();
      const progress = Math.min(i + BATCH_SIZE, records.length);
      console.log(`✅ Uploaded ${progress}/${records.length} pincodes...`);
    } catch (error) {
      console.error(`❌ Error in batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
      throw error;
    }
  }

  return { uploaded, skipped };
}

/**
 * Verify upload by checking a few pincodes
 */
async function verifyUpload() {
  try {
    const snapshot = await db.collection('pincodes').limit(5).get();
    
    console.log('\n✅ Sample pincodes from Firebase:');
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  Pincode ${data.pincode}: ${data.state} (${data.district}) - Delivery: ${data.delivery}, COD: ${data.cod}`);
    });

    // Get total count
    const countSnapshot = await db.collection('pincodes').count().get();
    return countSnapshot.data().count;
  } catch (error) {
    console.error('Error verifying upload:', error);
    return 0;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Prefer the CLEAN CSV (deliverable pincodes only, ~10K records)
    // Fall back to the full CSV (~74K records) if CLEAN is not found
    const cleanCsvPath = path.join(__dirname, '../Complete_All_States_Combined_Pincodes_CLEAN.csv');
    const fullCsvPath = path.join(__dirname, '../Complete_All_States_Combined_Pincodes.csv');

    let csvPath;
    if (fs.existsSync(cleanCsvPath)) {
      csvPath = cleanCsvPath;
      console.log('📋 Using CLEAN CSV (deliverable pincodes only - more efficient)');
    } else if (fs.existsSync(fullCsvPath)) {
      csvPath = fullCsvPath;
      console.log('📋 Using full CSV (all pincodes including non-deliverable)');
    } else {
      console.error('❌ CSV file not found. Expected one of:');
      console.error('   -', cleanCsvPath);
      console.error('   -', fullCsvPath);
      process.exit(1);
    }

    console.log('🔍 Parsing CSV file...');
    const allRecords = parseCSV(csvPath);
    console.log(`✅ Found ${allRecords.length} total records`);

    // Deduplicate: keep first occurrence per pincode
    const seen = new Set();
    const records = allRecords.filter(r => {
      if (seen.has(r.pincode)) return false;
      seen.add(r.pincode);
      return true;
    });
    console.log(`✅ ${records.length} unique pincodes after deduplication`);

    const result = await uploadToFirebase(records);
    console.log(`\n✅ Upload complete!`);
    console.log(`   Uploaded: ${result.uploaded}`);
    console.log(`   Skipped: ${result.skipped}`);

    const totalCount = await verifyUpload();
    console.log(`\n📊 Total pincodes in Firebase: ${totalCount}`);

    console.log('\n✨ Pincode delivery checking is now functional!');
    console.log('   You can test it by checking a pincode in the checkout.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Always run when invoked as a script
main().then(() => process.exit(0)).catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
