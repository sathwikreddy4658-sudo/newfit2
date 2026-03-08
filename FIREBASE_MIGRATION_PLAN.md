# Supabase → Firebase Migration Plan

**Project:** NewFit (React + Vite Frontend)  
**Current Setup:** Supabase PostgreSQL + PhonePe Payment  
**Target:** Firebase (Firestore + Authentication)  
**Status:** Planning Phase  
**Date:** March 2, 2026

---

## Executive Summary

This document outlines the complete migration from Supabase PostgreSQL to Firebase, including:
- Data structure mapping (SQL → Firestore collections)
- Migration phases and timeline
- Code changes required
- Testing and rollback strategy
- PaymentGateway (PhonePe) compatibility

**Key Benefits:**
- Serverless architecture with auto-scaling
- Better real-time capabilities via Firestore's real-time listeners
- Simplified authentication integration
- Reduced backend infrastructure costs
- Better integration with Google Cloud services

---

## 1. Data Structure Mapping

### Overview of Schema Transformation

| Supabase Table | Firebase Collection | Type | Primary Key |
|---|---|---|---|
| `profiles` | `users` | Document | uid (Firebase Auth) |
| `products` | `products` | Collection | productId (UUID) |
| `orders` | `orders` | Collection | orderId |
| `promo_codes` | `promoCodes` | Collection | codeId |
| `blogs` | `blogs` | Collection | blogId |
| `lab_reports` | `labReports` | Subcollection | reportId |
| `product_faqs` | `productFAQs` | Subcollection | faqId |
| `product_ratings` | `productRatings` | Subcollection | ratingId |
| `payment_transactions` | `payments` | Subcollection | transactionId |
| `newsletter_subscribers` | `subscribers` | Collection | email |
| `user_roles` | `roles` (doc in users) | Document field | role |

---

## 2. Detailed Collection Schema

### 2.1 Users Collection
**Path:** `/users/{uid}`

**Supabase:** `profiles` table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT,
  address TEXT,
  favorites TEXT[] ARRAY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Firebase Firestore:** `users/{uid}`
```typescript
interface UserDoc {
  uid: string;              // Firebase Auth UID
  email: string;
  displayName: string;
  address: string;
  favorites: string[];      // Array of product IDs
  role: 'user' | 'admin';   // From user_roles table
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Auth-related fields stored in Firebase Auth
  photoURL?: string;
  phoneNumber?: string;
}
```

**Migration Notes:**
- Use Firebase Auth UID as document ID instead of Supabase UUID
- Move `role` from separate `user_roles` table to document field
- Leverage Firebase Auth native fields (photoURL, phoneNumber, email)

---

### 2.2 Products Collection
**Path:** `/products/{productId}`

**Firestore Schema:**
```typescript
interface Product {
  id: string;                      // UUID
  name: string;
  description: string;
  category: string;
  price: number | null;
  price_15g: number | null;
  price_20g: number | null;
  nutrition: {
    calories: string | null;
    protein: string | null;
    sugar: string | null;
    allergens: string | null;
    weight: string | null;
  };
  images: {
    product: string | null;        // products_page_image
    cart: string | null;           // cart_image
    urls: string[];                // images array
  };
  inventory: {
    stock: number | null;
    minOrderQuantity: number | null;
    status_15g: boolean | null;
    status_20g: boolean | null;
  };
  discounts: {
    combo_3: number | null;
    combo_6: number | null;
  };
  isHidden: boolean;
  isFeatured?: boolean;            // NEW: for homepage
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Subcollections under /products/{productId}:
// - labReports/{reportId}
// - faqs/{faqId}
// - ratings/{ratingId}
```

**Migration Notes:**
- Flatten nested fields where possible (nutrition object instead of separate columns)
- Create subcollections for related data (FAQs, ratings, lab reports)
- Move image URLs to object structure
- Add `isFeatured` field for better homepage management

---

### 2.3 Orders Collection
**Path:** `/orders/{orderId}`

**Firestore Schema:**
```typescript
interface Order {
  id: string;
  orderNumber: string;             // Reference number for customers
  userId: string | null;           // Firebase UID (null for guest)
  
  customer: {
    name: string;
    email: string;
    phone: string;
    // For guest checkouts:
    isGuest: boolean;
    guestSession?: string;         // Temp session ID
  };
  
  items: OrderItem[];              // Array of products in order
  
  pricing: {
    subtotal: number;
    tax: number;
    shippingCost: number;
    discount: number;              // From promo code
    total: number;
  };
  
  shipping: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    deliveryEstimate?: string;
  };
  
  payment: {
    method: 'COD' | 'PHONEPE' | 'WALLET';
    status: 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
    transactionId: string | null;
    merchantTransactionId: string | null;
    phonepeTransactionId?: string | null;
  };
  
  order: {
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    statusHistory: OrderStatusChange[];
  };
  
  promoCode?: {
    code: string;
    discountPercentage: number;
    freeShipping: boolean;
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface OrderItem {
  productId: string;
  variantId?: string;              // For 15g vs 20g variants
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface OrderStatusChange {
  status: string;
  timestamp: Timestamp;
  notes?: string;
}

// Subcollections:
// /orders/{orderId}/payments/{transactionId}
// /orders/{orderId}/timeline/{eventId}
```

**Migration Notes:**
- Embed items array instead of separate order_items table
- Flatten payment info from separate payment_transactions table
- Add status history for order tracking
- Support both authenticated users and guest checkouts

---

### 2.4 Promo Codes Collection
**Path:** `/promoCodes/{codeId}`

**Firestore Schema:**
```typescript
interface PromoCode {
  id: string;
  code: string;                    // Unique, indexed
  description: string | null;
  
  discount: {
    percentage: number;
    maxAmount: number | null;
    freeShipping: boolean;
  };
  
  usage: {
    maxUses: number | null;
    currentUses: number;
  };
  
  validity: {
    active: boolean;
    validFrom: Timestamp | null;
    validUntil: Timestamp | null;
  };
  
  constraints: {
    minOrderAmount: number | null;
    applicableCategories?: string[];
    customerId?: string;           // For targeted promos
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexing:** Single-field index on `code` field for quick lookups

---

### 2.5 Blogs Collection
**Path:** `/blogs/{blogId}`

**Firestore Schema:**
```typescript
interface Blog {
  id: string;
  title: string;
  subheadline: string | null;
  content: string;                 // Store as markdown or HTML
  featured: boolean;               // For homepage
  viewCount: number;               // For analytics
  
  metadata: {
    author: string;                // NEW
    category: string;              // NEW: nutrition, fitness, etc.
    tags: string[];                // NEW
    readingTime: number;            // NEW: minutes
  };
  
  media: {
    imageUrl: string | null;
    altText: string | null;
  };
  
  seo: {
    slug: string;                  // For URL-friendly path
    metaDescription: string | null;
  };
  
  visibility: {
    published: boolean;
    publishedAt: Timestamp | null;
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Migration Notes:**
- Add SEO-friendly slug field
- Include metadata for better organization
- Add view count for analytics

---

### 2.6 Lab Reports (Subcollection)
**Path:** `/products/{productId}/labReports/{reportId}`

**Firestore Schema:**
```typescript
interface LabReport {
  id: string;
  productId: string;
  
  file: {
    url: string;
    name: string;
    size: number | null;
  };
  
  test: {
    type: string | null;           // e.g., "Heavy Metals", "Microbial"
    date: Timestamp | null;
    certificationBody?: string;    // NEW
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 2.7 Product FAQs (Subcollection)
**Path:** `/products/{productId}/faqs/{faqId}`

**Firestore Schema:**
```typescript
interface ProductFAQ {
  id: string;
  productId: string;
  
  content: {
    question: string;
    answer: string;
  };
  
  metadata: {
    displayOrder: number;
    helpfulCount?: number;         // NEW: upvote functionality
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 2.8 Product Ratings (Subcollection)
**Path:** `/products/{productId}/ratings/{ratingId}`

**Firestore Schema:**
```typescript
interface ProductRating {
  id: string;
  productId: string;
  userId: string;                  // Firebase UID
  
  review: {
    rating: number;                // 1-5 stars
    comment: string | null;
    verified: boolean;              // Is verified purchase
  };
  
  moderation: {
    approved: boolean | null;
    approvedAt: Timestamp | null;
    approvedBy?: string;            // Admin UID
  };
  
  engagement: {
    helpfulCount: number;
    unhelpfulCount: number;
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 2.9 Payment Transactions (Subcollection)
**Path:** `/orders/{orderId}/payments/{transactionId}`

**Firestore Schema:**
```typescript
interface PaymentTransaction {
  id: string;
  orderId: string;
  
  transaction: {
    merchantTransactionId: string;  // Our reference
    phonepeTransactionId: string | null;
    amount: number;
  };
  
  status: 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  
  gateway: {
    name: 'PHONEPE' | 'COD';
    paymentMethod: string | null;   // UPI, Card, etc.
  };
  
  response: {
    code: string | null;
    message: string | null;
    fullResponse: any;              // Raw PhonePe response
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 2.10 Newsletter Subscribers Collection
**Path:** `/subscribers/{email}` (or `/subscribers/{subscriberId}`)

**Firestore Schema:**
```typescript
interface Subscriber {
  id: string;
  email: string;                   // Indexed for uniqueness
  subscriptionStatus: 'subscribed' | 'unsubscribed';
  optedIn: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 3. Migration Phases

### Phase 1: Preparation (Week 1)
- [ ] Set up Firebase project
- [ ] Configure Firestore database
- [ ] Set up Firebase Authentication
- [ ] Create Firestore security rules
- [ ] Set up Cloud Storage for images/documents
- [ ] Install Firebase SDK in project

### Phase 2: Data Export & Transformation (Week 2)
- [ ] Export all data from Supabase PostgreSQL
- [ ] Create migration scripts to transform data
- [ ] Validate data integrity
- [ ] Test migration scripts
- [ ] Backup all existing data

### Phase 3: Code Migration (Week 3-4)
- [ ] Replace Supabase client with Firebase
- [ ] Update authentication logic
- [ ] Migrate all data access queries
- [ ] Update API/function calls
- [ ] Test all features
- [ ] Update environment variables

### Phase 4: Testing & Validation (Week 4-5)
- [ ] Comprehensive feature testing
- [ ] Load testing
- [ ] Security audit
- [ ] PhonePe integration verification
- [ ] Data validation

### Phase 5: Deployment (Week 5)
- [ ] Deploy to staging environment
- [ ] Run production simulation tests
- [ ] Final health checks
- [ ] Deploy to production
- [ ] Monitor logs and metrics
- [ ] Decommission Supabase (after stabilization)

---

## 4. Code Migration Changes Required

### 4.1 Update Client Initialization

**Before (Supabase):**
```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
```

**After (Firebase):**
```typescript
// src/integrations/firebase/client.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### 4.2 Update Environment Variables

**Required `.env` variables:**
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

### 4.3 Authentication Changes

**Before (Supabase):**
```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { displayName: name }
  }
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// Current user
const { data: { user } } = await supabase.auth.getUser();
```

**After (Firebase):**
```typescript
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, 
         onAuthStateChanged, updateProfile } from 'firebase/auth';

// Sign up
const userCredential = await createUserWithEmailAndPassword(auth, email, password);
await updateProfile(userCredential.user, { displayName: name });

// Sign in
const userCredential = await signInWithEmailAndPassword(auth, email, password);

// Current user (real-time listener)
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User logged in
  }
});
```

---

### 4.4 CRUD Operations - Products Example

**Before (Supabase):**
```typescript
// Fetch products
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('is_hidden', false)
  .order('created_at', { ascending: false });

// Create product
const { data, error } = await supabase
  .from('products')
  .insert([{ name, price, category, ... }]);

// Update product
const { data, error } = await supabase
  .from('products')
  .update({ price: 299 })
  .eq('id', productId);

// Delete product
const { error } = await supabase
  .from('products')
  .delete()
  .eq('id', productId);
```

**After (Firebase):**
```typescript
import { collection, query, where, orderBy, getDocs, addDoc, 
         updateDoc, deleteDoc, doc } from 'firebase/firestore';

// Fetch products
const q = query(
  collection(db, 'products'),
  where('isHidden', '==', false),
  orderBy('createdAt', 'desc')
);
const snapshot = await getDocs(q);
const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

// Create product
const docRef = await addDoc(collection(db, 'products'), {
  name, price, category, ...
});

// Update product
await updateDoc(doc(db, 'products', productId), {
  price: 299
});

// Delete product
await deleteDoc(doc(db, 'products', productId));
```

---

### 4.5 Complex Queries - Orders by User

**Before (Supabase):**
```typescript
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(50);
```

**After (Firebase):**
```typescript
const q = query(
  collection(db, 'orders'),
  where('userId', '==', userId),
  orderBy('createdAt', 'desc'),
  limit(50)
);
const snapshot = await getDocs(q);
const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

---

### 4.6 Real-time Listeners

**Before (Supabase):**
```typescript
const subscription = supabase
  .from('orders')
  .on('*', (payload) => {
    console.log('Change received!', payload);
  })
  .subscribe();
```

**After (Firebase):**
```typescript
import { onSnapshot } from 'firebase/firestore';

const unsubscribe = onSnapshot(
  query(
    collection(db, 'orders'),
    where('userId', '==', userId)
  ),
  (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
);

// Cleanup: call unsubscribe() when component unmounts
```

---

### 4.7 Storage/File Uploads

**Before (Supabase):**
```typescript
const { data, error } = await supabase.storage
  .from('blog-images')
  .upload(`${Date.now()}.jpg`, file);

// Get signed URL
const { data } = await supabase.storage
  .from('blog-images')
  .createSignedUrl(path, 60);
```

**After (Firebase):**
```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const storageRef = ref(storage, `blog-images/${Date.now()}.jpg`);
const snapshot = await uploadBytes(storageRef, file);
const downloadUrl = await getDownloadURL(snapshot.ref);
```

---

## 5. PhonePe Integration - Firebase Compatibility

### PhonePe Compatibility Matrix
✅ **Compatible**: PhonePe API works with Firebase (no changes needed)

The PhonePe integration is **backend-agnostic** and will continue to work:

1. **Payment Transaction Flow:**
   - Frontend → Backend → PhonePe API (unchanged)
   - PaymentCallback endpoint (unchanged)
   - PhonePe webhook callbacks (unchanged)

2. **Updates Required:**
   - Store transactions in `/orders/{orderId}/payments/{transactionId}` instead of `payment_transactions` table
   - Maintain same transaction fields (merchantTransactionId, amount, status, etc.)
   - Same webhook validation logic

**Example Migration:**
```typescript
// Before: Insert in payment_transactions table
await supabase
  .from('payment_transactions')
  .insert([{
    order_id: orderId,
    merchant_transaction_id: merchantTransactionId,
    amount,
    status: 'INITIATED',
    ...
  }]);

// After: Create doc in payments subcollection
await setDoc(
  doc(db, 'orders', orderId, 'payments', transactionId),
  {
    orderId,
    transaction: { merchantTransactionId, amount },
    status: 'INITIATED',
    ...
  }
);
```

---

## 6. Security & Firestore Rules

### Firestore Security Rules Template

```typescript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can only read/write their own profile
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
      allow read: if isAdmin();
    }
    
    // Products: public read, admin write
    match /products/{productId} {
      allow read: if true;  // Products are public
      allow write: if isAdmin();
      
      // Subcollections: same rules
      match /faqs/{faqId} {
        allow read: if true;
        allow write: if isAdmin();
      }
      
      match /ratings/{ratingId} {
        allow create: if isSignedIn();
        allow read: if true;
        allow update: if isAdmin() || request.auth.uid == resource.data.userId;
      }
      
      match /labReports/{reportId} {
        allow read: if true;
        allow write: if isAdmin();
      }
    }
    
    // Orders: users see own, admins see all
    match /orders/{orderId} {
      allow read: if isAdmin() || request.auth.uid == resource.data.userId || 
                     (resource.data.userId == null && 
                      request.auth.token.guestSession == resource.data.customer.guestSession);
      allow create: if isSignedIn() || hasGuestSession();
      allow update: if isAdmin();
    }
    
    // Promo codes: public read, admin write
    match /promoCodes/{codeId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Blogs: public read, admin write
    match /blogs/{blogId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Subscribers: create own subscription, admin read
    match /subscribers/{docId} {
      allow create: if true;
      allow read: if isAdmin();
      allow update: if isAdmin();
    }
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function hasGuestSession() {
      return request.auth.token.guestSession != null;
    }
  }
}
```

---

## 7. Performance Considerations

### Firestore vs Supabase PostgreSQL

| Aspect | Supabase | Firebase | Recommendation |
|---|---|---|---|
| Query Speed | ⚡ Fast | ⚡ Fast | Same performance |
| Aggregation | Very efficient | Limited | May need Cloud Functions |
| Real-time | Good | Excellent | Firebase advantage |
| Scalability | Vertical | Horizontal | Firebase advantage |
| Cost | Lower at scale | Higher with reads | Monitor costs |
| Transactions | ACID | Limited | Use batches |

### Optimization Tips
1. **Index frequently queried fields** (Firestore will suggest)
2. **Denormalize data** where needed (unlike SQL)
3. **Use collection groups** for cross-product queries
4. **Cache with React Query** (already using)
5. **Batch operations** to reduce API calls

---

## 8. Testing Strategy

### Unit Tests
```typescript
// Example: Test user creation
test('creates user with correct role', async () => {
  const userId = 'test-uid';
  await createUser(userId, { email: 'test@example.com' });
  
  const userDoc = await getDoc(doc(db, 'users', userId));
  expect(userDoc.data().role).toBe('user');
});
```

### Integration Tests
- Full order creation flow
- Payment processing (PhonePe mock)
- Product crud operations
- Admin functionality
- Guest checkout

### Migration Tests
```typescript
// Validate data after migration
const productsSnap = await getDocs(collection(db, 'products'));
expect(productsSnap.size).toBe(expectedCount);

productsSnap.forEach(doc => {
  const data = doc.data();
  expect(data.id).toBeDefined();
  expect(data.name).toBeDefined();
  expect(data.price).toBeGreaterThanOrEqual(0);
});
```

---

## 9. Rollout Strategy

### Option A: Parallel Running (Safest)
1. Keep Supabase running
2. Write data to both Supabase and Firebase
3. Read from Firebase, fallback to Supabase
4. Gradually increase Firebase traffic
5. After 2 weeks: switch to Firebase only
6. After 1 week stable: decommission Supabase

### Option B: Staged Migration (Faster)
1. Migrate data to Firebase
2. Deploy code changes (feature flags for data source)
3. Enable Firebase for 10% users
4. Monitor logs and errors
5. Gradually increase to 100%
6. Decommission Supabase

### Option C: Big Bang Migration (Riskiest)
1. Cut over completely in one deployment
2. Only viable if high confidence + good monitoring
3. Requires 24/7 support team standby

**Recommendation:** Option A (Parallel Running)

---

## 10. Estimated Effort & Timeline

| Phase | Duration | Effort | Owner |
|---|---|---|---|
| Setup Firebase | 2-3 days | Low | DevOps |
| Data Migration Scripts | 3-4 days | Medium | Backend |
| Code Migration | 5-7 days | High | Full Team |
| Testing | 5-7 days | High | QA + Dev |
| Deployment | 2-3 days | Medium | DevOps |
| **Total** | **3-4 weeks** | **High** | **Team** |

---

## 11. Checklist for Next Steps

### Immediate Actions
- [ ] Discuss proposal with stakeholders
- [ ] Create Firebase project
- [ ] Obtain Firebase credentials
- [ ] Set up Firestore database
- [ ] Configure Firebase rules
- [ ] Install Firebase SDK

### Pre-Migration
- [ ] Export all Supabase data
- [ ] Create migration scripts
- [ ] Test migration in staging
- [ ] Get team trained on Firebase
- [ ] Document rollback procedures

### Execution
- [ ] Create feature branches for code migration
- [ ] Parallel: write tests while coding
- [ ] Code review process
- [ ] Staging deployment
- [ ] Smoke tests
- [ ] Production deployment

---

## 12. Key Contacts & Resources

**Firebase Resources:**
- [Firebase Docs](https://firebase.google.com/docs)
- [Firestore Query Reference](https://firebase.google.com/docs/firestore/query-data/queries)
- [Firebase Console](https://console.firebase.google.com)

**Migration Helpers:**
- Data export scripts location: `/scripts/migration/`
- Transformation scripts: `/scripts/migration/transform/`
- Test data: `/scripts/migration/test-data/`

---

## Questions & Known Risks

### Questions
1. **Authentication:** Can we use Google Sign-In alongside email/password?
2. **Cost implications:** How will monthly cost compare?
3. **Offline functionality:** Do we need Firebase's offline support?
4. **PhonePe webhook:** Does PhonePe need proxy/middleware adjustment?

### Known Risks
1. ⚠️ **Firestore pricing:** Read-heavy operations cost more (mitigate with caching)
2. ⚠️ **Query limitations:** Can't do AND queries across fields same as SQL
3. ⚠️ **Transaction size:** Max 25 writes per transaction
4. ⚠️ **Data denormalization:** Requires different thinking for data structure
5. ⚠️ **Guest checkouts:** Need special handling in Firebase (no anonymous auth preferred)

---

## Next Document: Data Migration Scripts

When approved, we'll create:
1. `FIREBASE_DATA_EXPORT.md` - Export Supabase data
2. `FIREBASE_DATA_TRANSFORM.md` - Data transformation scripts
3. `FIREBASE_CODE_MIGRATION_GUIDE.md` - Detailed code changes per file

---

**Status: Ready for Review**  
**Last Updated:** March 2, 2026
