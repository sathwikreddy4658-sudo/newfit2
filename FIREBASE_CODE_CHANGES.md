# Firebase Code Migration - Quick Reference Guide

**Purpose:** Quick lookup for code changes needed across the application  
**Status:** Implementation Guide  
**Date:** March 2, 2026

---

## File Structure Changes

### Before (Supabase)
```
src/
├── integrations/
│   └── supabase/
│       ├── client.ts
│       ├── types.ts
│       └── types-updated.ts
└── [pages, components using supabase]
```

### After (Firebase)
```
src/
├── integrations/
│   └── firebase/              # NEW
│       ├── client.ts
│       ├── types.ts
│       ├── db.ts              # Firestore helpers
│       └── auth.ts            # Firebase Auth
└── [pages, components using firebase]
```

---

## Setup Files

### 1. Create `/src/integrations/firebase/client.ts`

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Optional: Enable emulator for local development
if (import.meta.env.DEV) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    // Emulator already initialized
  }
}
```

### 2. Create `/src/integrations/firebase/db.ts` (Firestore Helpers)

```typescript
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Query,
  QueryConstraint,
  DocumentData,
  Timestamp,
} from 'firebase/firestore';
import { db } from './client';

// ============================================
// USER OPERATIONS
// ============================================
export async function getUser(uid: string) {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function createUser(
  uid: string,
  userData: {
    email: string;
    displayName: string;
    address?: string;
    favorites?: string[];
  }
) {
  const docRef = doc(db, 'users', uid);
  await setDoc(docRef, {
    uid,
    ...userData,
    role: 'user',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return getUser(uid);
}

export async function updateUser(uid: string, updates: any) {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
  return getUser(uid);
}

// ============================================
// PRODUCT OPERATIONS
// ============================================
export async function getProduct(productId: string) {
  const docRef = doc(db, 'products', productId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function getAllProducts(filters?: {
  category?: string;
  hideHidden?: boolean;
  limit?: number;
}) {
  const constraints: QueryConstraint[] = [];

  if (filters?.hideHidden) {
    constraints.push(where('isHidden', '==', false));
  }

  if (filters?.category) {
    constraints.push(where('category', '==', filters.category));
  }

  constraints.push(orderBy('createdAt', 'desc'));

  if (filters?.limit) {
    constraints.push(limit(filters.limit));
  }

  const q = query(collection(db, 'products'), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createProduct(productData: any) {
  const docRef = doc(collection(db, 'products'));
  await setDoc(docRef, {
    id: docRef.id,
    ...productData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return { id: docRef.id, ...productData };
}

export async function updateProduct(productId: string, updates: any) {
  const docRef = doc(db, 'products', productId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
  return getProduct(productId);
}

export async function deleteProduct(productId: string) {
  const docRef = doc(db, 'products', productId);
  await deleteDoc(docRef);
}

// ============================================
// ORDER OPERATIONS
// ============================================
export async function getOrder(orderId: string) {
  const docRef = doc(db, 'orders', orderId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function getUserOrders(userId: string, limitCount: number = 50) {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createOrder(orderData: {
  orderNumber: string;
  customer: { name: string; email: string; phone: string };
  items: any[];
  pricing: any;
  payment: any;
  userId?: string | null;
}) {
  const docRef = doc(collection(db, 'orders'));
  await setDoc(docRef, {
    id: docRef.id,
    ...orderData,
    order: {
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        timestamp: Timestamp.now(),
      }],
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return { id: docRef.id, ...orderData };
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  notes?: string
) {
  const docRef = doc(db, 'orders', orderId);
  const orderDoc = await getDoc(docRef);
  const order = orderDoc.data();

  const statusHistory = order?.order?.statusHistory || [];
  statusHistory.push({
    status,
    timestamp: Timestamp.now(),
    notes: notes || null,
  });

  await updateDoc(docRef, {
    'order.status': status,
    'order.statusHistory': statusHistory,
    updatedAt: Timestamp.now(),
  });
}

// ============================================
// PROMO CODE OPERATIONS
// ============================================
export async function getPromoCode(code: string) {
  const q = query(
    collection(db, 'promoCodes'),
    where('code', '==', code.toUpperCase())
  );
  const snapshot = await getDocs(q);
  return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

export async function getAllPromoCodes() {
  const q = query(
    collection(db, 'promoCodes'),
    where('validity.active', '==', true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function validatePromoCode(code: string) {
  const promoCode = await getPromoCode(code);

  if (!promoCode) return { valid: false, error: 'Invalid promo code' };

  const now = new Date();
  const { validity, usage } = promoCode;

  if (!validity.active) {
    return { valid: false, error: 'Promo code is inactive' };
  }

  if (validity.validFrom && validity.validFrom.toDate() > now) {
    return { valid: false, error: 'Promo code not yet valid' };
  }

  if (validity.validUntil && validity.validUntil.toDate() < now) {
    return { valid: false, error: 'Promo code has expired' };
  }

  if (usage.maxUses && usage.currentUses >= usage.maxUses) {
    return { valid: false, error: 'Promo code usage limit reached' };
  }

  return { valid: true, promoCode };
}

export async function incrementPromoCodeUsage(promoCodeId: string) {
  const docRef = doc(db, 'promoCodes', promoCodeId);
  await updateDoc(docRef, {
    'usage.currentUses': increment(1),
    updatedAt: Timestamp.now(),
  });
}

// ============================================
// PRODUCT RATINGS
// ============================================
export async function getProductRatings(productId: string) {
  const q = query(
    collection(db, 'products', productId, 'ratings'),
    where('moderation.approved', '==', true),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createProductRating(
  productId: string,
  userId: string,
  ratingData: { rating: number; comment?: string }
) {
  const docRef = doc(collection(db, 'products', productId, 'ratings'));
  await setDoc(docRef, {
    id: docRef.id,
    productId,
    userId,
    review: {
      rating: ratingData.rating,
      comment: ratingData.comment || '',
      verified: false,
    },
    moderation: {
      approved: false,
      approvedAt: null,
    },
    engagement: {
      helpfulCount: 0,
      unhelpfulCount: 0,
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function getAverageRating(productId: string) {
  const ratings = await getProductRatings(productId);
  if (ratings.length === 0) return 0;

  const sum = ratings.reduce((acc, r) => acc + r.review.rating, 0);
  return sum / ratings.length;
}

// ============================================
// LAB REPORTS
// ============================================
export async function getProductLabReports(productId: string) {
  const snapshot = await getDocs(
    collection(db, 'products', productId, 'labReports')
  );
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ============================================
// PRODUCT FAQs
// ============================================
export async function getProductFAQs(productId: string) {
  const q = query(
    collection(db, 'products', productId, 'faqs'),
    orderBy('metadata.displayOrder', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ============================================
// BLOGS
// ============================================
export async function getBlog(blogId: string) {
  const docRef = doc(db, 'blogs', blogId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function getAllBlogs(limitCount: number = 10) {
  const q = query(
    collection(db, 'blogs'),
    where('visibility.published', '==', true),
    orderBy('visibility.publishedAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getBlogBySlug(slug: string) {
  const q = query(
    collection(db, 'blogs'),
    where('seo.slug', '==', slug)
  );
  const snapshot = await getDocs(q);
  return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

// ============================================
// SUBSCRIBERS
// ============================================
export async function subscribeToNewsletter(email: string) {
  const subscriberRef = doc(collection(db, 'subscribers'));
  await setDoc(subscriberRef, {
    id: subscriberRef.id,
    email,
    subscriptionStatus: 'subscribed',
    optedIn: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

// Helper exports
export { increment } from 'firebase/firestore';
```

### 3. Create `/src/integrations/firebase/auth.ts` (Authentication)

```typescript
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth } from './client';
import { createUser, getUser, updateUser } from './db';

// Set persistence
setPersistence(auth, browserLocalPersistence);

// ============================================
// AUTHENTICATION
// ============================================
export async function registerUser(
  email: string,
  password: string,
  displayName: string
) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    // Update profile
    await updateProfile(user, { displayName });

    // Create user document in Firestore
    await createUser(user.uid, {
      email,
      displayName,
      address: '',
      favorites: [],
    });

    return user;
  } catch (error) {
    throw error;
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    throw error;
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
}

export function onUserStateChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export async function updateUserProfile(uid: string, updates: { displayName?: string; photoURL?: string }) {
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, updates);
  }

  // Also update Firestore
  await updateUser(uid, updates);
}
```

---

## Migration Path by Feature

### Pattern 1: Simple CRUD

**Before (Supabase):**
```typescript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('category', 'supplements')
  .limit(10);
```

**After (Firebase):**
```typescript
import { getAllProducts } from '@/integrations/firebase/db';

const products = await getAllProducts({
  category: 'supplements',
  limit: 10,
  hideHidden: true,
});
```

---

### Pattern 2: Real-time Updates

**Before (Supabase):**
```typescript
const subscription = supabase
  .from('orders')
  .on('*', (payload) => handleOrderChange(payload))
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

**After (Firebase):**
```typescript
import { onSnapshot, query, collection, where } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';

const q = query(
  collection(db, 'orders'),
  where('userId', '==', userId)
);

const unsubscribe = onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      handleOrderAdded(change.doc.data());
    } else if (change.type === 'modified') {
      handleOrderModified(change.doc.data());
    } else if (change.type === 'removed') {
      handleOrderRemoved(change.doc.data());
    }
  });
});

// Cleanup in useEffect return
return () => unsubscribe();
```

---

### Pattern 3: File Upload

**Before (Supabase):**
```typescript
const { data, error } = await supabase.storage
  .from('blog-images')
  .upload(`${Date.now()}.jpg`, file);

const { data: signedData } = await supabase.storage
  .from('blog-images')
  .createSignedUrl(path, 3600);
```

**After (Firebase):**
```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/integrations/firebase/client';

const storageRef = ref(storage, `blog-images/${Date.now()}.jpg`);
const snapshot = await uploadBytes(storageRef, file);
const downloadUrl = await getDownloadURL(snapshot.ref);
```

---

### Pattern 4: Complex Queries

**Before (Supabase):**
```typescript
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('user_id', userId)
  .eq('status', 'completed')
  .gt('created_at', startDate.toISOString())
  .order('created_at', { ascending: false });
```

**After (Firebase):**
```typescript
import { query, collection, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';

const q = query(
  collection(db, 'orders'),
  where('userId', '==', userId),
  where('order.status', '==', 'completed'),
  where('createdAt', '>', startDate),
  orderBy('createdAt', 'desc')
);

const snapshot = await getDocs(q);
const orders = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

---

## Components That Need Updates

### Authentication Components
- [ ] `src/pages/Auth.tsx` → Use Firebase Auth
- [ ] `src/contexts/AuthContext.tsx` → Update with Firebase
- [ ] Login/Register forms → Firebase auth methods

### Data Components
- [ ] `src/pages/Products-updated.tsx` → Use getAllProducts()
- [ ] `src/pages/ProductDetail.tsx` → Use getProduct()
- [ ] `src/pages/Orders.tsx` → Use getUserOrders()
- [ ] `src/pages/admin/AdminProducts.tsx` → CRUD operations
- [ ] `src/pages/admin/AdminOrders.tsx` → Order management
- [ ] `src/pages/admin/AdminBlogs.tsx` → Blog management
- [ ] `src/pages/admin/AdminPromoCodes.tsx` → Promo code management

### Hooks
- [ ] Custom hooks using Supabase → Migrate to Firebase hooks
- [ ] React Query hooks → Add Firebase support

---

## Testing Checklist

- [ ] Firebase project created and credentials obtained
- [ ] `src/integrations/firebase/` directory set up
- [ ] Environment variables configured
- [ ] Authentication flow tested
- [ ] Product fetch tested
- [ ] Order creation tested
- [ ] Payment integration verified
- [ ] PhonePe callbacks working
- [ ] All admin operations tested
- [ ] Real-time listeners working
- [ ] File uploads working
- [ ] Data validation passes

---

## Environment Variables

Add to `.env`:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

---

## Installation Commands

```bash
# Install Firebase SDK
npm install firebase

# OAuth and other utilities (optional)
npm install firebase-admin  # For server-side operations
npm install @firebase/firestore @firebase/auth @firebase/storage
```

---

## Common Issues & Solutions

### Issue: Field not found in Firestore
**Solution:** Field naming uses camelCase in Firestore (e.g., `isHidden` not `is_hidden`)

### Issue: Query error with multiple conditions
**Solution:** Firestore requires indexes for most multi-field queries. Create them as suggested by console errors.

### Issue: Timestamp comparison
**Solution:** Use `Timestamp` objects for dates:
```typescript
import { Timestamp } from 'firebase/firestore';

const now = Timestamp.now();
where('createdAt', '>', now)
```

### Issue: Subcollection pagination
**Solution:** Firestore has no built-in pagination across subcollections. Implement manually with cursors.

---

## Migration Checklist

- [ ] Firebase project set up
- [ ] Firestore database created
- [ ] Firebase Auth enabled
- [ ] Storage bucket created
- [ ] Security rules configured
- [ ] Integration files created (`client.ts`, `db.ts`, `auth.ts`)
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Authentication components updated
- [ ] Data fetching components updated
- [ ] File upload functionality updated
- [ ] Admin operations updated
- [ ] Tests passing
- [ ] PhonePe integration verified
- [ ] Staging deployment successful
- [ ] Production deployment planned

---

**Status: Implementation Ready**  
**Next:** Apply code changes systematically per component  
**Last Updated:** March 2, 2026
