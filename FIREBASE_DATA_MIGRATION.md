# Firebase Data Migration - Export & Transform Guide

**Purpose:** Export data from Supabase and transform it to Firebase Firestore format  
**Status:** Ready to Execute  
**Date:** March 2, 2026

---

## Phase 1: Export Data from Supabase

### Step 1.1: Export via Supabase Dashboard

1. Go to [Supabase Console](https://app.supabase.com)
2. Select your project: `nozxenfedpbkhomggdsa`
3. For each table, export as JSON:
   - SQL Editor → Export as JSON
   - Or: Table → Export

**Tables to export (in order):**
1. `products` → `products.json`
2. `profiles` → `profiles.json`
3. `orders` → `orders.json`
4. `promo_codes` → `promoCodes.json`
5. `blogs` → `blogs.json`
6. `lab_reports` → `labReports.json`
7. `product_faqs` → `productFAQs.json`
8. `product_ratings` → `productRatings.json`
9. `payment_transactions` → `paymentTransactions.json`
10. `newsletter_subscribers` → `subscribers.json`
11. `user_roles` → `userRoles.json`

### Step 1.2: Backup Data Location
Create directory: `/scripts/migration/exports/`
```
exports/
├── products.json
├── profiles.json
├── orders.json
├── promoCodes.json
├── blogs.json
├── labReports.json
├── productFAQs.json
├── productRatings.json
├── paymentTransactions.json
├── subscribers.json
└── userRoles.json
```

### Step 1.3: Verify Exports
```bash
# Check file sizes and counts
ls -lR scripts/migration/exports/

# Validate JSON
node scripts/migration/validate-exports.js
```

---

## Phase 2: Data Transformation Scripts

### Transform Strategy
```
Supabase JSON → Transform → Firebase Bulk Import Format
                    ↓
              Validation
                    ↓
              Firestore (via SDK)
```

### Step 2.1: Create Transform Script

**Create: `/scripts/migration/transform-all-data.js`**

```javascript
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const EXPORTS_DIR = './scripts/migration/exports';
const OUTPUT_DIR = './scripts/migration/transformed';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🚀 Starting Firebase data transformation...\n');

// ============================================
// 1. TRANSFORM PRODUCTS
// ============================================
function transformProducts() {
  console.log('📦 Transforming Products...');
  
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(EXPORTS_DIR, 'products.json'), 'utf8')
    );

    const transformed = data.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      
      price: {
        standard: product.price,
        variant15g: product.price_15g,
        variant20g: product.price_20g,
      },
      
      nutrition: {
        calories: product.calories,
        protein: product.protein,
        sugar: product.sugar,
        allergens: product.allergens,
        weight: product.weight,
      },
      
      images: {
        product: product.products_page_image,
        cart: product.cart_image,
        urls: product.images || [],
      },
      
      inventory: {
        stock: product.stock,
        minOrderQuantity: product.min_order_quantity,
        status15g: product.stock_status_15g,
        status20g: product.stock_status_20g,
      },
      
      discounts: {
        combo3: product.combo_3_discount,
        combo6: product.combo_6_discount,
      },
      
      isHidden: product.is_hidden || false,
      isFeatured: false, // Will be set manually
      
      metadata: {
        shelfLife: product.shelf_life,
      },
      
      createdAt: new Date(product.created_at),
      updatedAt: new Date(product.updated_at),
    }));

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'products.json'),
      JSON.stringify(transformed, null, 2)
    );
    
    console.log(`✅ Transformed ${transformed.length} products\n`);
    return transformed;
  } catch (error) {
    console.error('❌ Error transforming products:', error.message);
    return [];
  }
}

// ============================================
// 2. TRANSFORM PROFILES → USERS
// ============================================
function transformProfiles() {
  console.log('👤 Transforming Profiles → Users...');
  
  try {
    const profileData = JSON.parse(
      fs.readFileSync(path.join(EXPORTS_DIR, 'profiles.json'), 'utf8')
    );
    
    const roleData = JSON.parse(
      fs.readFileSync(path.join(EXPORTS_DIR, 'userRoles.json'), 'utf8')
    );

    const roleMap = {};
    roleData.forEach(role => {
      roleMap[role.user_id] = role.role;
    });

    const transformed = profileData.map(profile => ({
      uid: profile.id, // This should match Firebase Auth UID
      email: profile.email,
      displayName: profile.name || '',
      address: profile.address || '',
      favorites: profile.favorites || [],
      role: roleMap[profile.id] || 'user',
      createdAt: new Date(profile.created_at),
      updatedAt: new Date(profile.updated_at),
    }));

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'users.json'),
      JSON.stringify(transformed, null, 2)
    );
    
    console.log(`✅ Transformed ${transformed.length} users\n`);
    return transformed;
  } catch (error) {
    console.error('❌ Error transforming profiles:', error.message);
    return [];
  }
}

// ============================================
// 3. TRANSFORM ORDERS
// ============================================
function transformOrders() {
  console.log('📋 Transforming Orders...');
  
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(EXPORTS_DIR, 'orders.json'), 'utf8')
    );

    const transformed = data.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      userId: order.user_id,
      
      customer: {
        name: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone,
        isGuest: !order.user_id,
      },
      
      items: order.items || [], // Already array from Supabase
      
      pricing: {
        subtotal: order.total_amount, // Adjust if you have breakdown
        tax: 0, // Extract if available
        shippingCost: 0,
        discount: 0,
        total: order.total_amount,
      },
      
      payment: {
        method: order.payment_method || 'COD',
        status: order.status === 'paid' ? 'SUCCESS' : 'PENDING',
        transactionId: null,
      },
      
      order: {
        status: order.status,
        statusHistory: [{
          status: order.status,
          timestamp: new Date(order.created_at),
        }],
      },
      
      createdAt: new Date(order.created_at),
      updatedAt: new Date(order.updated_at),
    }));

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'orders.json'),
      JSON.stringify(transformed, null, 2)
    );
    
    console.log(`✅ Transformed ${transformed.length} orders\n`);
    return transformed;
  } catch (error) {
    console.error('❌ Error transforming orders:', error.message);
    return [];
  }
}

// ============================================
// 4. TRANSFORM PROMO CODES
// ============================================
function transformPromoCodes() {
  console.log('🎟️  Transforming Promo Codes...');
  
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(EXPORTS_DIR, 'promoCodes.json'), 'utf8')
    );

    const transformed = data.map(code => ({
      id: code.id,
      code: code.code,
      description: code.description || '',
      
      discount: {
        percentage: code.discount_percentage,
        maxAmount: code.max_discount_amount,
        freeShipping: code.free_shipping || false,
      },
      
      usage: {
        maxUses: code.max_uses,
        currentUses: code.current_uses || 0,
      },
      
      validity: {
        active: code.active,
        validFrom: code.valid_from ? new Date(code.valid_from) : null,
        validUntil: code.valid_until ? new Date(code.valid_until) : null,
      },
      
      constraints: {
        minOrderAmount: code.min_order_amount,
      },
      
      createdAt: new Date(code.created_at),
      updatedAt: new Date(code.updated_at),
    }));

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'promoCodes.json'),
      JSON.stringify(transformed, null, 2)
    );
    
    console.log(`✅ Transformed ${transformed.length} promo codes\n`);
    return transformed;
  } catch (error) {
    console.error('❌ Error transforming promo codes:', error.message);
    return [];
  }
}

// ============================================
// 5. TRANSFORM BLOGS
// ============================================
function transformBlogs() {
  console.log('📝 Transforming Blogs...');
  
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(EXPORTS_DIR, 'blogs.json'), 'utf8')
    );

    const transformed = data.map(blog => ({
      id: blog.id,
      title: blog.title,
      subheadline: blog.subheadline || '',
      content: blog.content,
      featured: false, // Set manually
      viewCount: 0,
      
      metadata: {
        author: 'Admin', // Default
        category: 'health', // Default - set manually
        tags: [],
        readingTime: Math.ceil(blog.content.split(/\s+/).length / 200), // Estimate
      },
      
      media: {
        imageUrl: blog.image_url,
        altText: blog.title,
      },
      
      seo: {
        slug: blog.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
        metaDescription: blog.subheadline || blog.content.substring(0, 160),
      },
      
      visibility: {
        published: true,
        publishedAt: new Date(blog.created_at),
      },
      
      createdAt: new Date(blog.created_at),
      updatedAt: new Date(blog.updated_at),
    }));

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'blogs.json'),
      JSON.stringify(transformed, null, 2)
    );
    
    console.log(`✅ Transformed ${transformed.length} blogs\n`);
    return transformed;
  } catch (error) {
    console.error('❌ Error transforming blogs:', error.message);
    return [];
  }
}

// ============================================
// 6. TRANSFORM LAB REPORTS
// ============================================
function transformLabReports() {
  console.log('🧪 Transforming Lab Reports...');
  
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(EXPORTS_DIR, 'labReports.json'), 'utf8')
    );

    const transformed = data.map(report => ({
      id: report.id,
      productId: report.product_id,
      
      file: {
        url: report.file_url,
        name: report.file_name,
        size: report.file_size,
      },
      
      test: {
        type: report.test_type,
        date: report.test_date ? new Date(report.test_date) : null,
      },
      
      createdAt: new Date(report.created_at),
      updatedAt: new Date(report.updated_at),
    }));

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'labReports.json'),
      JSON.stringify(transformed, null, 2)
    );
    
    console.log(`✅ Transformed ${transformed.length} lab reports\n`);
    return transformed;
  } catch (error) {
    console.error('❌ Error transforming lab reports:', error.message);
    return [];
  }
}

// ============================================
// 7. TRANSFORM PRODUCT FAQs
// ============================================
function transformProductFAQs() {
  console.log('❓ Transforming Product FAQs...');
  
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(EXPORTS_DIR, 'productFAQs.json'), 'utf8')
    );

    const transformed = data.map(faq => ({
      id: faq.id,
      productId: faq.product_id,
      
      content: {
        question: faq.question,
        answer: faq.answer,
      },
      
      metadata: {
        displayOrder: faq.display_order || 0,
        helpfulCount: 0,
      },
      
      createdAt: new Date(faq.created_at),
      updatedAt: new Date(faq.updated_at),
    }));

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'productFAQs.json'),
      JSON.stringify(transformed, null, 2)
    );
    
    console.log(`✅ Transformed ${transformed.length} product FAQs\n`);
    return transformed;
  } catch (error) {
    console.error('❌ Error transforming product FAQs:', error.message);
    return [];
  }
}

// ============================================
// 8. TRANSFORM PRODUCT RATINGS
// ============================================
function transformProductRatings() {
  console.log('⭐ Transforming Product Ratings...');
  
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(EXPORTS_DIR, 'productRatings.json'), 'utf8')
    );

    const transformed = data.map(rating => ({
      id: rating.id,
      productId: rating.product_id,
      userId: rating.user_id,
      
      review: {
        rating: rating.rating,
        comment: rating.comment || '',
        verified: false, // Set based on order history if needed
      },
      
      moderation: {
        approved: rating.approved,
        approvedAt: rating.approved ? new Date() : null,
      },
      
      engagement: {
        helpfulCount: 0,
        unhelpfulCount: 0,
      },
      
      createdAt: new Date(rating.created_at),
      updatedAt: new Date(rating.created_at),
    }));

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'productRatings.json'),
      JSON.stringify(transformed, null, 2)
    );
    
    console.log(`✅ Transformed ${transformed.length} product ratings\n`);
    return transformed;
  } catch (error) {
    console.error('❌ Error transforming product ratings:', error.message);
    return [];
  }
}

// ============================================
// 9. TRANSFORM PAYMENT TRANSACTIONS
// ============================================
function transformPaymentTransactions() {
  console.log('💳 Transforming Payment Transactions...');
  
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(EXPORTS_DIR, 'paymentTransactions.json'), 'utf8')
    );

    const transformed = data.map(txn => ({
      id: txn.id,
      orderId: txn.order_id,
      
      transaction: {
        merchantTransactionId: txn.merchant_transaction_id,
        phonepeTransactionId: txn.phonepe_transaction_id,
        amount: txn.amount,
      },
      
      status: txn.status,
      
      gateway: {
        name: 'PHONEPE',
        paymentMethod: txn.payment_method,
      },
      
      response: {
        code: txn.response_code,
        message: txn.response_message,
        fullResponse: txn.phonepe_response || {},
      },
      
      createdAt: new Date(txn.created_at),
      updatedAt: new Date(txn.updated_at),
    }));

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'paymentTransactions.json'),
      JSON.stringify(transformed, null, 2)
    );
    
    console.log(`✅ Transformed ${transformed.length} payment transactions\n`);
    return transformed;
  } catch (error) {
    console.error('❌ Error transforming payment transactions:', error.message);
    return [];
  }
}

// ============================================
// 10. TRANSFORM SUBSCRIBERS
// ============================================
function transformSubscribers() {
  console.log('📧 Transforming Subscribers...');
  
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(EXPORTS_DIR, 'subscribers.json'), 'utf8')
    );

    const transformed = data.map(sub => ({
      id: sub.id,
      email: sub.email,
      subscriptionStatus: 'subscribed',
      optedIn: true,
      createdAt: new Date(sub.created_at),
      updatedAt: new Date(sub.created_at),
    }));

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'subscribers.json'),
      JSON.stringify(transformed, null, 2)
    );
    
    console.log(`✅ Transformed ${transformed.length} subscribers\n`);
    return transformed;
  } catch (error) {
    console.error('❌ Error transforming subscribers:', error.message);
    return [];
  }
}

// ============================================
// MAIN EXECUTION
// ============================================
async function main() {
  console.log('═'.repeat(50));
  console.log('Firebase Data Transformation');
  console.log('═'.repeat(50) + '\n');

  const results = {
    products: transformProducts(),
    users: transformProfiles(),
    orders: transformOrders(),
    promoCodes: transformPromoCodes(),
    blogs: transformBlogs(),
    labReports: transformLabReports(),
    productFAQs: transformProductFAQs(),
    productRatings: transformProductRatings(),
    paymentTransactions: transformPaymentTransactions(),
    subscribers: transformSubscribers(),
  };

  // Create summary
  const summary = {
    timestamp: new Date().toISOString(),
    totals: {
      products: results.products.length,
      users: results.users.length,
      orders: results.orders.length,
      promoCodes: results.promoCodes.length,
      blogs: results.blogs.length,
      labReports: results.labReports.length,
      productFAQs: results.productFAQs.length,
      productRatings: results.productRatings.length,
      paymentTransactions: results.paymentTransactions.length,
      subscribers: results.subscribers.length,
    },
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'migration-summary.json'),
    JSON.stringify(summary, null, 2)
  );

  console.log('═'.repeat(50));
  console.log('✅ Transformation Complete!');
  console.log('═'.repeat(50));
  console.log('\n📂 Output directory: ' + OUTPUT_DIR);
  console.log('\n📊 Summary:');
  console.log(JSON.stringify(summary.totals, null, 2));
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

---

## Phase 3: Import to Firebase

### Step 3.1: Upload Data via Firebase SDK

**Create: `/scripts/migration/upload-to-firebase.js`**

```javascript
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'your-firebase-project-id',
});

const db = admin.firestore();
const BATCH_SIZE = 500; // Firestore batch limit

const INPUT_DIR = './scripts/migration/transformed';

// ============================================
// UPLOAD PRODUCTS
// ============================================
async function uploadProducts() {
  console.log('📦 Uploading Products...');
  
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(INPUT_DIR, 'products.json'), 'utf8')
    );

    let batch = db.batch();
    let count = 0;

    for (const product of data) {
      const docRef = db.collection('products').doc(product.id);
      batch.set(docRef, product);
      count++;

      if (count % BATCH_SIZE === 0) {
        await batch.commit();
        console.log(`  ✅ Uploaded ${count} products...`);
        batch = db.batch();
      }
    }

    if (count % BATCH_SIZE !== 0) {
      await batch.commit();
    }

    console.log(`✅ All ${data.length} products uploaded\n`);
  } catch (error) {
    console.error('❌ Error uploading products:', error);
    throw error;
  }
}

// ============================================
// UPLOAD USERS
// ============================================
async function uploadUsers() {
  console.log('👤 Uploading Users...');
  
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(INPUT_DIR, 'users.json'), 'utf8')
    );

    let batch = db.batch();
    let count = 0;

    for (const user of data) {
      const docRef = db.collection('users').doc(user.uid);
      batch.set(docRef, user);
      count++;

      if (count % BATCH_SIZE === 0) {
        await batch.commit();
        console.log(`  ✅ Uploaded ${count} users...`);
        batch = db.batch();
      }
    }

    if (count % BATCH_SIZE !== 0) {
      await batch.commit();
    }

    console.log(`✅ All ${data.length} users uploaded\n`);
  } catch (error) {
    console.error('❌ Error uploading users:', error);
    throw error;
  }
}

// ============================================
// UPLOAD ORDERS
// ============================================
async function uploadOrders() {
  console.log('📋 Uploading Orders...');
  
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(INPUT_DIR, 'orders.json'), 'utf8')
    );

    const paymentData = JSON.parse(
      fs.readFileSync(path.join(INPUT_DIR, 'paymentTransactions.json'), 'utf8')
    );

    let batch = db.batch();
    let count = 0;

    for (const order of data) {
      const orderRef = db.collection('orders').doc(order.id);
      batch.set(orderRef, order);
      count++;

      // Upload payment transactions as subcollection
      const payments = paymentData.filter(p => p.orderId === order.id);
      for (const payment of payments) {
        const paymentRef = orderRef.collection('payments').doc(payment.id);
        batch.set(paymentRef, payment);
      }

      if (count % BATCH_SIZE === 0) {
        await batch.commit();
        console.log(`  ✅ Uploaded ${count} orders...`);
        batch = db.batch();
      }
    }

    if (count % BATCH_SIZE !== 0) {
      await batch.commit();
    }

    console.log(`✅ All ${data.length} orders uploaded\n`);
  } catch (error) {
    console.error('❌ Error uploading orders:', error);
    throw error;
  }
}

// ============================================
// UPLOAD PROMO CODES
// ============================================
async function uploadPromoCodes() {
  console.log('🎟️  Uploading Promo Codes...');
  
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(INPUT_DIR, 'promoCodes.json'), 'utf8')
    );

    let batch = db.batch();
    let count = 0;

    for (const code of data) {
      const docRef = db.collection('promoCodes').doc(code.id);
      batch.set(docRef, code);
      count++;

      if (count % BATCH_SIZE === 0) {
        await batch.commit();
        console.log(`  ✅ Uploaded ${count} promo codes...`);
        batch = db.batch();
      }
    }

    if (count % BATCH_SIZE !== 0) {
      await batch.commit();
    }

    console.log(`✅ All ${data.length} promo codes uploaded\n`);
  } catch (error) {
    console.error('❌ Error uploading promo codes:', error);
    throw error;
  }
}

// ============================================
// UPLOAD BLOGS
// ============================================
async function uploadBlogs() {
  console.log('📝 Uploading Blogs...');
  
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(INPUT_DIR, 'blogs.json'), 'utf8')
    );

    let batch = db.batch();
    let count = 0;

    for (const blog of data) {
      const docRef = db.collection('blogs').doc(blog.id);
      batch.set(docRef, blog);
      count++;

      if (count % BATCH_SIZE === 0) {
        await batch.commit();
        console.log(`  ✅ Uploaded ${count} blogs...`);
        batch = db.batch();
      }
    }

    if (count % BATCH_SIZE !== 0) {
      await batch.commit();
    }

    console.log(`✅ All ${data.length} blogs uploaded\n`);
  } catch (error) {
    console.error('❌ Error uploading blogs:', error);
    throw error;
  }
}

// ============================================
// UPLOAD PRODUCT DATA (FAQs, Ratings, Lab Reports)
// ============================================
async function uploadProductSubcollections() {
  console.log('🔗 Uploading Product Subcollections...');
  
  try {
    // Lab Reports
    const labReports = JSON.parse(
      fs.readFileSync(path.join(INPUT_DIR, 'labReports.json'), 'utf8')
    );

    // Product FAQs
    const faqs = JSON.parse(
      fs.readFileSync(path.join(INPUT_DIR, 'productFAQs.json'), 'utf8')
    );

    // Product Ratings
    const ratings = JSON.parse(
      fs.readFileSync(path.join(INPUT_DIR, 'productRatings.json'), 'utf8')
    );

    let batch = db.batch();
    let count = 0;

    // Upload lab reports
    for (const report of labReports) {
      const docRef = db
        .collection('products')
        .doc(report.productId)
        .collection('labReports')
        .doc(report.id);
      batch.set(docRef, report);
      count++;

      if (count % BATCH_SIZE === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }

    // Upload FAQs
    for (const faq of faqs) {
      const docRef = db
        .collection('products')
        .doc(faq.productId)
        .collection('faqs')
        .doc(faq.id);
      batch.set(docRef, faq);
      count++;

      if (count % BATCH_SIZE === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }

    // Upload ratings
    for (const rating of ratings) {
      const docRef = db
        .collection('products')
        .doc(rating.productId)
        .collection('ratings')
        .doc(rating.id);
      batch.set(docRef, rating);
      count++;

      if (count % BATCH_SIZE === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }

    if (count % BATCH_SIZE !== 0) {
      await batch.commit();
    }

    console.log(`✅ Uploaded ${labReports.length} lab reports`);
    console.log(`✅ Uploaded ${faqs.length} FAQs`);
    console.log(`✅ Uploaded ${ratings.length} ratings\n`);
  } catch (error) {
    console.error('❌ Error uploading product subcollections:', error);
    throw error;
  }
}

// ============================================
// UPLOAD SUBSCRIBERS
// ============================================
async function uploadSubscribers() {
  console.log('📧 Uploading Subscribers...');
  
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(INPUT_DIR, 'subscribers.json'), 'utf8')
    );

    let batch = db.batch();
    let count = 0;

    for (const sub of data) {
      const docRef = db.collection('subscribers').doc(sub.id);
      batch.set(docRef, sub);
      count++;

      if (count % BATCH_SIZE === 0) {
        await batch.commit();
        console.log(`  ✅ Uploaded ${count} subscribers...`);
        batch = db.batch();
      }
    }

    if (count % BATCH_SIZE !== 0) {
      await batch.commit();
    }

    console.log(`✅ All ${data.length} subscribers uploaded\n`);
  } catch (error) {
    console.error('❌ Error uploading subscribers:', error);
    throw error;
  }
}

// ============================================
// MAIN EXECUTION
// ============================================
async function main() {
  console.log('═'.repeat(50));
  console.log('Firebase Data Upload');
  console.log('═'.repeat(50) + '\n');

  try {
    await uploadProducts();
    await uploadUsers();
    await uploadOrders();
    await uploadPromoCodes();
    await uploadBlogs();
    await uploadProductSubcollections();
    await uploadSubscribers();

    console.log('═'.repeat(50));
    console.log('✅ All data uploaded successfully!');
    console.log('═'.repeat(50));
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
```

---

## Phase 4: Verification

### Step 4.1: Validate Checksums

```bash
# Count records in Firebase
node scripts/migration/verify-firebase.js
```

### Step 4.2: Spot Check Data

```typescript
// Example verification query
const products = await getDocs(collection(db, 'products'));
console.log(`Total products: ${products.size}`);

products.forEach(doc => {
  const product = doc.data();
  console.assert(product.name, `Product ${doc.id} missing name`);
  console.assert(product.category, `Product ${doc.id} missing category`);
});
```

---

## Troubleshooting

### Issue: File Not Found
**Solution:** Ensure exports are in `/scripts/migration/exports/`

### Issue: Invalid JSON
**Solution:** Export directly from Supabase dashboard, don't edit files manually

### Issue: Firebase Quota Exceeded
**Solution:** 
- Split uploads into smaller batches
- Wait 24 hours for quota reset
- Request quota increase in Firebase console

### Issue: User UID Mismatch
**Solution:**
- Supabase UUIDs ≠ Firebase Auth UIDs
- You'll need to create Firebase Auth accounts OR
- Map old UUIDs to Firebase UID after Auth setup

---

## Next Steps

1. ✅ Export data from Supabase
2. ✅ Run transformation script
3. ✅ Upload to Firebase
4. ✅ Verify data integrity
5. 📝 Update code (see FIREBASE_CODE_MIGRATION_GUIDE.md)
6. 🧪 Run tests
7. 🚀 Deploy to staging
8. 📊 Monitor & optimize

---

**Status: Ready to Execute**  
**Last Updated:** March 2, 2026
