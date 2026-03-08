#!/usr/bin/env node
/**
 * Verify Pincode Firebase Setup
 * Quick test to check if everything is working
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
  path.join(__dirname, '../firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Firebase service account not found');
  console.error('Please set FIREBASE_SERVICE_ACCOUNT_PATH or place firebase-service-account.json in project root');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function verifySetup() {
  console.log('🔍 Verifying Pincode Firebase Setup...\n');

  try {
    // Test 1: Get total count
    console.log('1️⃣  Checking total pincodes in database...');
    const countSnap = await db.collection('pincodes').count().get();
    const total = countSnap.data().count;
    
    if (total === 0) {
      console.log('   ❌ No pincodes found! Run: node scripts/upload-pincodes-to-firebase.js');
      return;
    } else {
      console.log(`   ✅ Found ${total} pincodes in Firebase`);
    }

    // Test 2: Sample pincode
    console.log('\n2️⃣  Testing sample pincodes...');
    const testPincodes = [560001, 500067, 110001];
    
    for (const pincode of testPincodes) {
      const docSnap = await db.collection('pincodes').doc(`${pincode}`).get();
      if (docSnap.exists()) {
        const data = docSnap.data();
        const deliveryStatus = data.delivery === 'Y' ? '✅' : '❌';
        const codStatus = data.cod === 'Y' ? 'Yes' : 'No';
        console.log(`   ${pincode}: ${deliveryStatus} Delivery (${data.state}) - COD: ${codStatus}`);
      } else {
        console.log(`   ❌ Pincode ${pincode} not found`);
      }
    }

    // Test 3: Check states
    console.log('\n3️⃣  Sampling pincodes by state...');
    const states = ['KARNATAKA', 'TELANGANA', 'DELHI', 'ASSAM', 'NAGALAND'];
    
    for (const state of states) {
      const snap = await db.collection('pincodes')
        .where('state', '==', state)
        .limit(3)
        .get();
      
      if (snap.empty) {
        console.log(`   ⚠️  No pincodes for ${state}`);
      } else {
        const deliverableCount = snap.docs.filter(d => d.data().delivery === 'Y').length;
        console.log(`   ✅ ${state}: ${snap.docs.length} samples (${deliverableCount} deliverable)`);
      }
    }

    // Test 4: Check delivery availability
    console.log('\n4️⃣  Checking delivery statistics...');
    const snap = await db.collection('pincodes').limit(1000).get();
    const deliverable = snap.docs.filter(d => d.data().delivery === 'Y').length;
    const codAvailable = snap.docs.filter(d => d.data().cod === 'Y').length;
    
    console.log(`   Sample of 1000 pincodes:`);
    console.log(`   - Deliverable: ${deliverable} (${(deliverable/10).toFixed(1)}%)`);
    console.log(`   - COD Available: ${codAvailable} (${(codAvailable/10).toFixed(1)}%)`);

    console.log('\n✅ Verification complete!');
    console.log('\n🎯 Next steps:');
    console.log('   1. Start your dev server: npm run dev');
    console.log('   2. Go to checkout and test a pincode');
    console.log('   3. Try pincode 560001 (Bangalore)');
    console.log('   4. Should see: ₹50 shipping, 2 days delivery, COD available');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('- Check Firebase credentials in firebase-service-account.json');
    console.error('- Ensure pincodes have been uploaded to Firebase');
    console.error('- Check Firestore console for "pincodes" collection');
    process.exit(1);
  }
}

// Run verification
if (require.main === module) {
  verifySetup().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { verifySetup };
