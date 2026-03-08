# Firebase Setup: Step-by-Step Setup Guide

**Current Status:** Firebase account created ✅  
**Next Goal:** Get Firebase credentials and set up project  
**Estimated Time:** 15-20 minutes  
**Date:** March 2, 2026

---

## Step 1: Create Your Firebase Project

### In Firebase Console (https://console.firebase.google.com)

1. **Click "Add project"** (top left)
2. **Enter project name:** `newfit` (or any name)
3. **Configuration options:**
   - Google Analytics: **Disable** (optional, can enable later)
   - Accept terms → **Create project**
4. **Wait 1-2 minutes** while Firebase initializes

✅ **Your project is ready**

---

## Step 2: Register Your Web App

Once your project is created:

1. **Click the Web app icon** (</> symbol)
2. **Enter app name:** `newfit-web` (or similar)
3. **Check "Also set up Firebase Hosting for this app"** - Optional for now
4. **Click "Register app"**

You'll see a config object - **KEEP THIS WINDOW OPEN**, you'll need it for the .env file.

---

## Step 3: Copy Firebase Configuration

The Firebase console will show you something like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDxxxxxxxxxxxxxxxxxx",
  authDomain: "newfit-abc123.firebaseapp.com",
  projectId: "newfit-abc123",
  storageBucket: "newfit-abc123.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
  measurementId: "G-ABCDEFGHIJ"
};
```

**Look for these exact values**, they're your credentials.

---

## Step 4: Set Up Firestore Database

1. **In Firebase Console**, click **"Firestore Database"** (left sidebar)
2. **Click "Create database"**
3. **Choose production/test mode:**
   - Select: **Production mode** (secure rules)
4. **Select location:**
   - Choose: **us-central1** (or nearest to your users)
5. **Click "Enable"**
6. **Wait for initialization** (1-2 minutes)

✅ **Firestore is ready**

---

## Step 5: Enable Firebase Authentication

1. **Click "Authentication"** (left sidebar)
2. **Click "Get started"**
3. **Enable Email/Password:**
   - Click "Email/Password"
   - Toggle "Enable" ON
   - Click "Save"

✅ **Authentication is ready**

---

## Step 6: Enable Cloud Storage

1. **Click "Storage"** (left sidebar)
2. **Click "Get started"**
3. **Choose location:** `us-central1`
4. **Click "Done"**
5. **Note the storage bucket name:** `newfit-abc123.appspot.com`

✅ **Storage is ready**

---

## Step 7: Update Your .env File

Now add the Firebase credentials to your `.env` file.

### Open `.env` in VS Code:
```
File: d:\New folder (2)\newfit2\.env
```

### Replace the old Supabase variables with:

```env
# Remove these Supabase lines (keep for now as backup):
# VITE_SUPABASE_URL=https://nozxenfedpbkhomggdsa.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=...
# VITE_SUPABASE_ANON_KEY=...

# Add these Firebase variables:
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Example (with real values):
```env
VITE_FIREBASE_API_KEY=AIzaSyDgNlZ5D-Z_K8Q9pJ-QxZ_QqZQQ9QqQ
VITE_FIREBASE_AUTH_DOMAIN=newfit-abc123.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=newfit-abc123
VITE_FIREBASE_STORAGE_BUCKET=newfit-abc123.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-ABCDEFGHIJ
```

---

## Step 8: Install Firebase SDK

Open terminal in VS Code and run:

```bash
npm install firebase
```

This will take 1-2 minutes.

---

## Step 9: Create Firebase Client File

Create a new file: `src/integrations/firebase/client.ts`

```typescript
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
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log('✅ Firebase initialized successfully');
```

---

## Step 10: Test Your Connection

Create a test file: `src/tests/firebase-test.ts`

```typescript
import { auth, db, storage } from '@/integrations/firebase/client';
import { collection, getDocs } from 'firebase/firestore';

export async function testFirebaseConnection() {
  try {
    console.log('🧪 Testing Firebase connection...\n');

    // Test 1: Auth loaded
    console.log('✅ Auth:', auth.currentUser ? 'Connected' : 'Ready');

    // Test 2: Firestore accessible
    const testQuery = await getDocs(collection(db, 'products'));
    console.log('✅ Firestore:', testQuery.size, 'products found');

    // Test 3: Storage bucket
    console.log('✅ Storage:', storage.bucket.name);

    console.log('\n🎉 All Firebase services working!');
    return true;

  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    return false;
  }
}

// Run in browser console or call from a component
if (typeof window !== 'undefined') {
  (window as any).testFirebase = testFirebaseConnection;
}
```

Then in browser console:
```javascript
testFirebase()
```

---

## Step 11: Configure Firestore Security Rules

1. **In Firebase Console**, go to **Firestore Database**
2. **Click "Rules" tab** (at top)
3. **Replace all content with this:**

```typescript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow anyone to read products (public catalog)
    match /products/{productId} {
      allow read: if true;
      allow write: if isSuperAdmin();
    }
    
    // Allow users to read/write their own profiles
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
      allow read: if isSuperAdmin();
    }
    
    // Allow anyone to read blogs
    match /blogs/{blogId} {
      allow read: if true;
      allow write: if isSuperAdmin();
    }
    
    // Allow anyone to create orders, but only see their own
    match /orders/{orderId} {
      allow create: if request.auth != null;
      allow read: if request.auth.uid == resource.data.userId || isSuperAdmin();
      allow update: if isSuperAdmin();
    }
    
    // Allow anyone to read promo codes
    match /promoCodes/{codeId} {
      allow read: if true;
      allow write: if isSuperAdmin();
    }
    
    // Allow anyone to read and create ratings
    match /products/{productId}/ratings/{ratingId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId || isSuperAdmin();
    }
    
    // Allow admin to read and write blog reports
    match /products/{productId}/labReports/{reportId} {
      allow read: if true;
      allow write: if isSuperAdmin();
    }
    
    // Allow admin to manage FAQs
    match /products/{productId}/faqs/{faqId} {
      allow read: if true;
      allow write: if isSuperAdmin();
    }
    
    // Allow newsletter signups
    match /subscribers/{docId} {
      allow create: if true;
      allow read, write: if isSuperAdmin();
    }
    
    // Helper function to check if admin
    function isSuperAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

4. **Click "Publish"**

✅ **Rules are live**

---

## Step 12: Configure Storage Security Rules

1. **In Firebase Console**, go to **Storage**
2. **Click "Rules" tab**
3. **Replace all content with this:**

```typescript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Public reads for product/blog images
    match /blog-images/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /product-images/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Public reads for lab reports
    match /lab-reports/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Private user uploads
    match /user-uploads/{userId}/{allPaths=**} {
      allow read, write: if request.auth.uid == userId;
      allow read: if isAdmin();
    }
    
    // User profiles
    match /user-profiles/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
      allow delete: if request.auth.uid == userId;
    }
    
    // Helper function
    function isAdmin() {
      return request.auth != null && 
             request.auth.token.admin == true;
    }
  }
}
```

4. **Click "Publish"**

✅ **Storage rules are live**

---

## Step 13: Verify Everything Works

1. **Save .env file** (Ctrl+S)
2. **Restart dev server** in terminal:
   ```bash
   npm run dev
   ```
3. **Open browser console** (F12)
4. **Look for:**
   ```
   ✅ Firebase initialized successfully
   ```

If you see this, **Firebase is connected!** 🎉

---

## Checklist: What's Done Now?

- [ ] Firebase account created
- [ ] Firebase project created
- [ ] Web app registered
- [ ] Firestore database enabled
- [ ] Authentication enabled
- [ ] Cloud Storage enabled
- [ ] Firebase credentials copied to .env
- [ ] Firebase SDK installed (`npm install firebase`)
- [ ] `src/integrations/firebase/client.ts` created
- [ ] Firestore security rules published
- [ ] Storage security rules published
- [ ] Firebase connection verified

---

## Next Steps (After This)

1. **Create helper functions** (`src/integrations/firebase/db.ts`)
   - See FIREBASE_CODE_CHANGES.md
   
2. **Create admin user** (for testing)
   - See section below

3. **Migrate your first data collection** (products)
   - See FIREBASE_DATA_MIGRATION.md

4. **Update components** to use Firebase
   - See FIREBASE_CODE_CHANGES.md

---

## Quick Reference: Where Things Are

| Component | Location | Status |
|-----------|----------|--------|
| Firebase Config | .env file | ✅ Added |
| Client Init | `src/integrations/firebase/client.ts` | ✅ Created |
| Auth Config | Firebase Console → Authentication | ✅ Active |
| Database | Firebase Console → Firestore | ✅ Active |
| Storage | Firebase Console → Storage | ✅ Active |
| Security Rules | Firebase Console → Rules | ✅ Active |

---

## Troubleshooting

### Issue: "VITE_FIREBASE_API_KEY is undefined"
**Solution:** 
- Make sure you've added all 7 variables to .env
- Restart the dev server (`npm run dev`)
- Check spelling of variable names (case-sensitive)

### Issue: "Project ID not found"
**Solution:**
- Go to Firebase Console → Settings → Project Settings
- Copy the exact Project ID
- Paste into .env as `VITE_FIREBASE_PROJECT_ID`

### Issue: Firestore returns empty
**Solution:**
- This is normal! You haven't uploaded data yet
- See FIREBASE_DATA_MIGRATION.md to import data

### Issue: "Permission denied" errors
**Solution:**
- Security rules are too restrictive
- For testing, temporarily use `allow read, write: if true;`
- Never deploy this to production!

---

## Optional: Create Test Admin User (For Testing)

This creates one admin account you can use:

1. **In Firebase Console**, go to **Authentication**
2. **Click "Add user"** (top right)
3. **Email:** `admin@newfit.com`
4. **Password:** `Test@123456` (or your choice)
5. **Click "Add user"**

Now you have a test admin account to work with during development.

---

## Optional: Add Custom Claims (for Admin Role)

This is more advanced - come back to this later:

1. Install Firebase Admin SDK:
   ```bash
   npm install firebase-admin
   ```

2. Create `scripts/set-admin.js`:
   ```javascript
   const admin = require('firebase-admin');
   
   // Download service account from Firebase Console → Settings → Service Accounts
   const serviceAccount = require('./firebase-service-account.json');
   
   admin.initializeApp({
     credential: admin.credential.cert(serviceAccount)
   });
   
   admin.auth().setCustomUserClaims('admin-user-uid', { admin: true })
     .then(() => console.log('✅ Admin claims set'))
     .catch(error => console.error('❌ Error:', error));
   ```

3. Run:
   ```bash
   node scripts/set-admin.js
   ```

---

## Summary

You now have:
✅ Firebase project created  
✅ Firestore database configured  
✅ Authentication enabled  
✅ Cloud Storage ready  
✅ Security rules in place  
✅ SDK installed  
✅ Connection verified  

**You're ready to migrate data!** 🚀

Next: Follow FIREBASE_DATA_MIGRATION.md to export Supabase data and import to Firebase.

---

**Total Setup Time:** ~20 minutes  
**Status:** Complete  
**Last Updated:** March 2, 2026
