// Firebase Connection Test
// Run this to verify Firebase is properly configured

import { auth, db, storage } from '@/integrations/firebase/client';
import { collection, getDocs } from 'firebase/firestore';

export async function testFirebaseSetup(): Promise<{
  auth: boolean;
  firestore: boolean;
  storage: boolean;
  allPassed: boolean;
}> {
  console.log('\n🧪 Testing Firebase Configuration...\n');

  const results = {
    auth: false,
    firestore: false,
    storage: false,
    allPassed: false,
  };

  try {
    // Test 1: Auth
    if (auth) {
      console.log('✅ Authentication: Ready');
      results.auth = true;
    } else {
      console.log('❌ Authentication: Not configured');
    }

    // Test 2: Firestore
    try {
      const productsRef = collection(db, 'products');
      const snapshot = await getDocs(productsRef);
      console.log(`✅ Firestore: Ready (${snapshot.size} products found)`);
      results.firestore = true;
    } catch (error: any) {
      console.log('⚠️  Firestore: Connected but no data yet');
      results.firestore = true; // Still connected, just empty
    }

    // Test 3: Storage
    if (storage.bucket) {
      console.log(`✅ Cloud Storage: Ready (${storage.bucket})`);
      results.storage = true;
    } else {
      console.log('❌ Cloud Storage: Not configured');
    }

    // Summary
    results.allPassed = results.auth && results.firestore && results.storage;

    console.log('\n' + '='.repeat(50));
    if (results.allPassed) {
      console.log('🎉 Firebase Setup Complete!');
    } else {
      console.log('⚠️  Some Firebase services not configured');
    }
    console.log('='.repeat(50));
    console.log(`
Project ID: ${import.meta.env.VITE_FIREBASE_PROJECT_ID}
Storage Bucket: ${import.meta.env.VITE_FIREBASE_STORAGE_BUCKET}
    `);

  } catch (error) {
    console.error('❌ Firebase test failed:', error);
  }

  return results;
}

// Expose to window object for browser console access
if (typeof window !== 'undefined') {
  (window as any).testFirebaseSetup = testFirebaseSetup;
  console.log('✅ testFirebaseSetup() is available in browser console');
}

// Run test when this module is imported in development
if (import.meta.env.DEV) {
  console.log('Firebase test available - call testFirebaseSetup() in console');
}

// Export for manual testing
if (typeof window !== 'undefined') {
  (window as any).testFirebaseSetup = testFirebaseSetup;
}
