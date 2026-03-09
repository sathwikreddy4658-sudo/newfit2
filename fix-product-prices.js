import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-PUUt_w0f1DbW5T7OnQvU0tQXhXvCKfA",
  authDomain: "newfit-35320.firebaseapp.com",
  projectId: "newfit-35320",
  storageBucket: "newfit-35320.firebasestorage.app",
  messagingSenderId: "769476076932",
  appId: "1:769476076932:web:3f1c9f5cf1fdb688e7eeb6"
};

// Expected product prices
const PRODUCT_PRICES = {
  'CHOCO NUT': 149,
  'VANILLA DELIGHT': 149,
  'STRAWBERRY CHEESECAKE': 129,
  'DARK CHOCOLATE': 199,
  'CARAMELLY PEANUT': 149
};

async function fixProductPrices() {
  try {
    console.log('🔍 Connecting to Firebase...');
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('📦 Fetching all products...\n');
    
    const productsRef = collection(db, 'products');
    const productsSnap = await getDocs(productsRef);
    
    let updatedCount = 0;
    let issuesFound = 0;
    
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
        console.log(`⚠️  ${productName}: Unknown product (no price mapping)`);
        issuesFound++;
        continue;
      }
      
      if (currentPrice !== expectedPrice) {
        console.log(`🔧 Fixing: ${productName}`);
        console.log(`   Old price: ₹${currentPrice}`);
        console.log(`   New price: ₹${expectedPrice}`);
        
        const productRef = doc(db, 'products', productDoc.id);
        await updateDoc(productRef, { price: expectedPrice });
        
        updatedCount++;
      } else {
        console.log(`✅ ${productName}: ₹${currentPrice} (correct)`);
      }
    }
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(`✨ Summary:`);
    console.log(`   Products updated: ${updatedCount}`);
    console.log(`   Issues found: ${issuesFound}`);
    console.log(`${'='.repeat(50)}\n`);
    
    if (updatedCount > 0) {
      console.log('✅ All product prices have been fixed!');
      console.log('\nNext steps:');
      console.log('1. Clear browser cache (Ctrl+Shift+Delete)');
      console.log('2. Refresh the page');
      console.log('3. Try placing a new order - prices should now display correctly\n');
    } else {
      console.log('✅ All products have correct prices!\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixProductPrices();
