# 🔐 Firebase Security Rules - CORRECTED

## The Issue

Your security rules were checking for admin role in the wrong location:
- ❌ **Wrong**: Looking in `/users/{uid}` for `role == 'admin'`
- ✅ **Correct**: Should check `/user_roles/{uid}` for `'admin' in roles[]`

## Solution

### Step 1: Update Firestore Security Rules

1. **Open Firebase Console** → Your Project → **Firestore Database** → **Rules tab**
2. **Replace ALL content** with the code below:

```typescript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function - check if user has admin role
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/user_roles/$(request.auth.uid)).data.roles.hasAny(['admin']);
    }
    
    function isSignedIn() {
      return request.auth != null;
    }

    // ========== USER ROLES & ADMIN PANEL ==========
    // Only admins can manage role assignments
    match /user_roles/{uid} {
      allow read: if request.auth.uid == uid;
      allow read, write: if isAdmin();
    }
    
    // ========== USER PROFILES ==========
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
      allow read: if isAdmin();
    }
    
    // ========== PRODUCTS (Admin Full Control) ==========
    match /products/{productId} {
      allow read: if true;  // Public read for all users
      allow create, update, delete: if isAdmin();  // Only admins can manage
      
      // Product FAQs - Admin only
      match /faqs/{faqId} {
        allow read: if true;
        allow create, update, delete: if isAdmin();
      }
      
      // Product Ratings - Users create, admins manage
      match /ratings/{ratingId} {
        allow read: if true;
        allow create: if isSignedIn();
        allow update, delete: if isAdmin() || request.auth.uid == resource.data.userId;
      }
      
      // Lab Reports - Admin only
      match /labReports/{reportId} {
        allow read: if true;
        allow create, update, delete: if isAdmin();
      }
    }
    
    // ========== ORDERS (Admin Full Control) ==========
    match /orders/{orderId} {
      allow read: if isAdmin() || request.auth.uid == resource.data.userId;
      allow create: if isSignedIn();
      allow update, delete: if isAdmin();  // Admins control all order operations
    }
    
    // ========== PROMO CODES (Admin Only) ==========
    match /promoCodes/{codeId} {
      allow read: if true;  // Users can read to validate codes
      allow create, update, delete: if isAdmin();  // Only admins manage
    }
    
    // ========== BLOGS (Admin Full Control) ==========
    match /blogs/{blogId} {
      allow read: if true;  // Public read
      allow create, update, delete: if isAdmin();  // Only admins manage
      
      // Blog comments/interactions
      match /comments/{commentId} {
        allow read: if true;
        allow create: if isSignedIn();
        allow update, delete: if isAdmin() || request.auth.uid == resource.data.userId;
      }
    }
    
    // ========== NEWSLETTER SUBSCRIBERS (Admin Management) ==========
    match /subscribers/{docId} {
      allow create: if true;  // Anyone can subscribe
      allow read, update, delete: if isAdmin();  // Admins manage list
    }
    
    // ========== ANALYTICS (Admin View) ==========
    match /analytics/{docId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }
    
    // ========== SETTINGS (Admin Only) ==========
    match /settings/{docId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }
  }
}
```

3. **Click "Publish"**

### Step 2: Verify Admin Setup

Make sure your admin user has the correct role in `/user_roles/{uid}`:

```json
{
  "roles": ["admin"],
  "updatedAt": <timestamp>
}
```

**To add admin role** (via Firebase Console):
1. Go to **Firestore Database**
2. Click **`user_roles`** collection (create if missing)
3. Create new document with your **User UID** as Document ID
4. Add field:
   ```
   Field: roles
   Type: Array
   Value: ["admin"]
   ```
5. Save

## ✅ What This Fixes

- ✅ **Products**: Admins can create, update, delete products
- ✅ **Blogs**: Admins can create, update, delete blog posts
- ✅ **Promo Codes**: Admins can create, update, delete promo codes
- ✅ **Orders**: Admins can view, update, and delete all orders
- ✅ **Lab Reports**: Admins can upload, update, delete lab reports
- ✅ **Ratings**: Admins can manage customer ratings
- ✅ **Newsletter**: Admins can manage subscriber list
- ✅ **Settings/Analytics**: Admins have full access
- ✅ Users can only see/edit their own profiles
- ✅ Public read access for products, blogs, ratings, promo codes

## 🧪 Testing

After updating the rules:

1. **Login as admin** (email/password with admin role in `/user_roles`)
2. **Go to Admin Dashboard** → Products
3. **Click "+ Create Product"**
4. **Fill form and try creating** - should now succeed ✅

## 📝 Troubleshooting

| Problem | Solution |
|---------|----------|
| Still getting "Missing permissions" | Make sure admin role is in `/user_roles/{uid}`, not `/users/{uid}` |
| Rules not working after update | Click "Publish" button and wait 1-2 minutes |
| Can't see changes in app | Clear browser cache and hard refresh (Ctrl+Shift+R) |

## 🔗 Reference

- Actual structure in code: [`src/integrations/firebase/db.ts:450`](src/integrations/firebase/db.ts#L450)
- Admin check function: [`src/integrations/firebase/db.ts:476`](src/integrations/firebase/db.ts#L476)
