# Admin Authentication Setup Guide (Firebase)

## Overview

The admin panel now uses **Firebase Authentication** instead of Supabase. Admins authenticate with their email/password credentials, and their admin status is verified via the `user_roles` collection in Firestore.

---

## Architecture

### Admin Role Storage
- **Location**: Firestore collection: `user_roles`
- **Document structure**:
```json
{
  "roles": ["admin"],
  "updatedAt": 1735812345000
}
```
- **Document ID**: User's Firebase UID

### Authentication Flow
1. Admin enters email/password on `/admin/auth` page
2. Firebase Auth validates credentials
3. System checks Firestore `user_roles/{userId}` for admin role
4. If role exists and contains "admin", user redirected to `/admin/dashboard`
5. `ProtectedAdminRoute.tsx` guards all admin pages with same check

---

## Creating Your First Admin User

### Step 1: Create a Firebase Auth User
You can use Firebase Console or this script:

```bash
# Using Firebase CLI (if installed)
firebase auth:import users.json

# Or manually via Firebase Console:
# 1. Go to Firebase Console > Authentication > Users
# 2. Click "Add User"
# 3. Enter admin email and password
```

### Step 2: Add Admin Role to Firestore
After user is created in Firebase, you need to add the admin role. **You have two options:**

#### Option A: Using Firebase Console (Recommended for first admin)
1. Go to Firebase Console > Firestore Database
2. Create new collection: `user_roles`
3. Create new document with the user's UID as Document ID
4. Add field:
   ```
   Field: roles
   Type: Array
   Value: ["admin"]
   ```
5. Click "Save"

#### Option B: Using Node.js Script
Create a file `create-admin.js` in your project root:

```javascript
// create-admin.js
const admin = require('firebase-admin');

// Initialize Firebase Admin (requires service account key)
const serviceAccount = require('./path-to-serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function createAdmin(userId, email) {
  try {
    await db.collection('user_roles').doc(userId).set({
      roles: ['admin'],
      updatedAt: new Date(),
      email: email,
    });
    console.log(`✅ Admin role created for user: ${email}`);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  }
}

// Run: node create-admin.js YOUR_USER_ID YOUR_EMAIL
const userId = process.argv[2];
const email = process.argv[3];

if (!userId || !email) {
  console.log('Usage: node create-admin.js <userId> <email>');
  process.exit(1);
}

createAdmin(userId, email);
```

Run it:
```bash
node create-admin.js "YOUR_FIREBASE_USER_ID" "admin@example.com"
```

---

## Admin Login

### First Time Setup
1. Navigate to `http://localhost:5173/admin/auth` (or your app URL)
2. Enter the email and password you created in Step 1
3. You should be redirected to `/admin/dashboard`

### Subsequent Logins
- Same process - Firebase checks if user exists and has admin role
- Session persists across browser restarts (Firebase persistence enabled)

---

## Managing Multiple Admins

### Add Another Admin User
1. Create new Firebase Auth user (Firebase Console > Authentication)
2. Get the new user's UID from the Authentication tab
3. Add role in Firestore:
   - Create document in `user_roles` collection
   - Use new user's UID as document ID
   - Add `roles: ["admin"]` field

### Remove Admin Access
1. Go to Firestore > `user_roles` collection
2. Delete the document for that user's UID
   - User can still log in via Firebase Auth
   - But will be denied access at ProtectedAdminRoute
3. (Optional) Delete user from Firebase Auth if removing completely

### Revoke Session Without Deletion
- Delete the `user_roles` document → user immediately loses admin access
- User stays in Firebase Auth (can still use regular customer features)

---

## Code Implementation Details

### ProtectedAdminRoute.tsx
All admin routes are wrapped with this component:
```typescript
// Checks:
1. Is user authenticated in Firebase?
2. Does user have 'admin' role in user_roles collection?
3. If both ✓ → render admin page
   If either ✗ → redirect to /
```

### AdminAuth.tsx
Admin login page:
```typescript
// Process:
1. User submits email + password form
2. Firebase Auth validates credentials
3. If valid, checks user_roles for 'admin' role
4. If admin role exists → navigates to /admin/dashboard
5. If not → shows "Access denied" message
```

### Firestore Helper Functions
```typescript
// Check if user has specific role
const roles = await getUserRoles(userId);

// Set user roles
await setUserRoles(userId, ['admin']);

// Check if user is admin (recommended)
const isAdmin = await isUserAdmin(userId);
```

---

## Security Best Practices

✅ **DO:**
- Use strong, unique passwords for admin accounts
- Store credentials in your password manager
- Regularly audit `user_roles` collection for unexpected entries
- Delete `user_roles` documents when admins leave

❌ **DON'T:**
- Share admin credentials via email/chat
- Use same password as other services
- Store credentials in code or environment files
- Leave disabled admins in `user_roles` collection

### Recommended Security Setup
1. **First Admin**: Use your personal strong password
2. **Additional Admins**: Use unique passwords, store in company password manager
3. **API Calls**: If building admin APIs, use Cloud Functions with admin SDK (not exposed to client)

---

## Troubleshooting

### "Access denied: Your account does not have admin privileges"
- **Cause**: User exists in Firebase Auth but no `user_roles` document
- **Fix**: Create `user_roles` document for user with `roles: ["admin"]`

### Admin redirected to home page instead of dashboard
- **Cause**: ProtectedAdminRoute didn't find admin role
- **Fix**: Check Firestore `user_roles` collection - document should exist with user's UID

### "Login failed" message
- **Cause**: Wrong email/password or user doesn't exist in Firebase Auth
- **Fix**: Double-check credentials; verify user was created in Firebase Auth

### Lost admin access
- **Cause**: `user_roles` document was deleted accidentally
- **Fix**: Recreate `user_roles/{userId}` with `roles: ["admin"]`

---

## Migration from Supabase

If you had admins in Supabase before:
1. Note down their emails and UIDs
2. Create new Firebase Auth users with same emails
3. Copy their UIDs to Firestore `user_roles` collection
4. Test login on admin pages
5. Once verified, old Supabase data can be discarded

---

## Next Steps

After admin authentication is working:
1. ✅ Admin Dashboard displays (no errors)
2. ⏳ Migrate admin features (Products, Blogs, Orders tabs) from Supabase to Firebase
3. ⏳ Test CRUD operations for each admin feature
4. ⏳ Implement analytics dashboard on Firestore data

---

## Quick Reference

| Task | Command/Location |
|------|-----------------|
| Create admin | Firebase Console > Auth + Create `user_roles` doc |
| Admin login page | Visit `/admin/auth` |
| View admin roles | Firestore > `user_roles` collection |
| Remove admin | Delete `user_roles/{userId}` document |
| Check code | [ProtectedAdminRoute.tsx](src/components/admin/ProtectedAdminRoute.tsx), [AdminAuth.tsx](src/pages/admin/AdminAuth.tsx) |

---

## Support

If you need to verify the authentication flow:
1. Open browser DevTools > Console
2. Login as admin
3. Look for console messages:
   - ✅ "User logged in: email@example.com"
   - ✅ Admin roles verified
   - ✅ Redirect to /admin/dashboard

---

**Status**: ✅ Admin authentication configured for Firebase  
**Last Updated**: March 2, 2026
