#!/usr/bin/env node

/**
 * Alternative: Run this from Browser Console on admin page
 * Paste into browser console (F12) while logged in as admin
 */

async function fixProductPricesFromBrowser() {
  const PRODUCT_PRICES = {
    'CHOCO NUT': 149,
    'VANILLA DELIGHT': 149,
    'STRAWBERRY CHEESECAKE': 129,
    'DARK CHOCOLATE': 199,
    'CARAMELLY PEANUT': 149,
    'CRANBERRY COCOA': 149
  };

  try {
    console.log('🔍 Connecting to Firestore...');
    
    // Access Firestore from window (it must be initialized in the app)
    const db = window.__DEV_FIRESTORE__ || (await import('zustand')).default?.getState?.()?.db;
    
    if (!db) {
      console.error('❌ Firestore not available. Make sure you are on the admin dashboard.');
      return;
    }

    const { getFirestore, collection, getDocs, doc, updateDoc } = await import('firebase/firestore');
    
    // Get reference using the app from page
    const firebaseApp = await import('firebase/app').then(m => m.getApp?.());
    
    if (!firebaseApp) {
      console.error('❌ Firebase app not initialized on this page');
      return;
    }
    
    const firestoreDb = getFirestore(firebaseApp);
    const productsRef = collection(firestoreDb, 'products');
    const productsSnap = await getDocs(productsRef);
    
    let updatedCount = 0;
    
    for (const productDoc of productsSnap.docs) {
      const productData = productDoc.data();
      const productName = productData.name || 'Unknown';
      const currentPrice = productData.price || 0;
      
      // Find correct price
      let expectedPrice = null;
      for (const [key, price] of Object.entries(PRODUCT_PRICES)) {
        if (productName.toLowerCase().includes(key.toLowerCase())) {
          expectedPrice = price;
          break;
        }
      }
      
      if (!expectedPrice) {
        console.log(`⚠️  ${productName}: No price mapping found`);
        continue;
      }
      
      if (currentPrice !== expectedPrice) {
        console.log(`🔧 Fixing: ${productName} (₹${currentPrice} → ₹${expectedPrice})`);
        
        const productRef = doc(firestoreDb, 'products', productDoc.id);
        await updateDoc(productRef, { price: expectedPrice });
        updatedCount++;
      } else {
        console.log(`✅ ${productName}: ₹${currentPrice} (correct)`);
      }
    }
    
    console.log(`\n✨ Updated ${updatedCount} products!\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// For Node.js environment
export async function fixProductPricesNode() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║         Firebase Admin SDK Price Fix (Node.js)             ║
╚════════════════════════════════════════════════════════════╝

⚠️  This script requires:
1. Firebase Admin SDK initialization
2. Service account credentials

Quick Instructions:
1. Get your service account key from Firebase Console:
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save as "serviceAccountKey.json" in project root

2. Install admin SDK:
   npm install firebase-admin

3. Update the script with your credentials

4. Run: node fix-product-prices.js --use-admin

For now, use this approach instead:
  `);
  fixProductPricesFromBrowser();
}

// For browser console
console.log(`
=== Product Price Fixer ===

To fix product prices right now:

1. Press F12 to open Developer Console
2. Copy-paste this entire block into the console:

${fixProductPricesFromBrowser.toString()}

3. Then run: fixProductPricesFromBrowser()

This will update all products with correct prices in Firestore.
`);
