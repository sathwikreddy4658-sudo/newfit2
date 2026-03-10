# Favorites & FAQ Fixes - Deployment Guide

## Issues Fixed

### 1. TypeError in Favorites (db.ts:167)
**Problem**: `Cannot read properties of undefined (reading 'indexOf')`  
**Root Cause**: `localFavorites` was not being validated as an array before calling `.includes()`  
**Fix**: Added robust localStorage parsing with try-catch block and type safety

**Changes in ProductDetail.tsx (lines 205-245)**:
```typescript
// Now safely parses localStorage and defaults to empty array
let localFavorites: string[] = [];
try {
  const stored = localStorage.getItem(`favorites_${user.id}`);
  if (stored) {
    const parsed = JSON.parse(stored);
    localFavorites = Array.isArray(parsed) ? parsed : [];
  }
} catch (parseError) {
  console.warn('Failed to parse favorites from localStorage:', parseError);
  localFavorites = [];
}
```

### 2. FAQ Permission Error (db.ts:732)
**Problem**: `Missing or insufficient permissions` when fetching FAQs  
**Root Cause**: 
- Firestore rules didn't include the `/products/{id}/product_faqs/{faqId}` subcollection
- Missing rule for `/favorites/{userId}` collection

**Fixes in firestore.rules**:
- ✅ Added subcollection rule for `/products/{productId}/product_faqs/{faqId}` (lines 53-57)
- ✅ Added new `/favorites/{userId}` collection rule (allows authenticated users to read/write their own favorites)

## Updated Firestore Rules

### 1. Product FAQs Subcollection (Already Added)
```firestore rules
// Product FAQs subcollection
// Public read, only admin can write
match /product_faqs/{faqId} {
  allow read: if true; // Public can read FAQs
  allow write: if request.auth != null && isAdmin();
}
```

### 2. New Favorites Collection Rule (Added)
```firestore rules
// ============ FAVORITES ============
// Users can manage their own favorites (save/read products they like)
match /favorites/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

## Deployment Instructions

### Step 1: Deploy Updated Code
Build and deploy your application - the ProductDetail.tsx fix is already included.

### Step 2: Update Firestore Rules
Your `firestore.rules` file already has been updated with:
1. Subcollection rule for product FAQs inside products
2. New favorites collection rule

To deploy these rules to Firebase:

**Option A: Using Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Firestore Database → Rules tab
4. Copy the updated content from `firestore.rules` file
5. Click "Publish"

**Option B: Using Firebase CLI**
```bash
firebase deploy --only firestore:rules
```

## Testing Checklist

After deployment, test these scenarios:

✅ **Favorites Feature**:
- [ ] Click heart icon to add product to favorites
- [ ] See "Added to favorites" toast notification
- [ ] Click heart again to remove - see "Removed from favorites" toast
- [ ] Favorites persist after page reload
- [ ] Double-tap heart replaces view with navigating to favorites page
- [ ] Favorites load correctly in /favorites page

✅ **FAQ Feature**:
- [ ] FAQs section loads when viewing a product
- [ ] No permission errors in console
- [ ] FAQs display in the correct order (by display_order)

✅ **Admin Functionality**:
- [ ] Admin can still edit FAQs through admin panel
- [ ] Admin can delete FAQs
- [ ] Admin can add new FAQs

✅ **Authentication Edge Cases**:
- [ ] Non-logged-in users see "Please sign in to add favorites" toast
- [ ] Each user's favorites are isolated (not shared with other users)
- [ ] Users cannot access other users' favorites documents

## Data Structure Reference

### Favorites Collection Structure
```
/favorites/{userId}
  ├─ productId1: true
  ├─ productId2: true
  └─ updatedAt: Timestamp
```

### LocalStorage Backup
Favorites are also saved to localStorage as:
```
favorites_{userId}: [productId1, productId2, ...]
```

This provides offline access before syncing to Firestore.

## Security Notes

✅ **Favorites are user-private**: Only authenticated users can read/write their own favorites document

✅ **FAQs are public**: Anyone can read FAQs (no authentication required), but only admins can edit

✅ **isAdmin() Check**: Both FAQs and products use the existing `isAdmin()` function that checks `user_roles/{uid}` collection

## Rollback Plan

If issues occur after deployment:

1. **Revert Firestore Rules**:
   - Go to Firebase Console → Firestore → Rules → Deploy a Previous Version
   - Or manually restore the backup of firestore.rules

2. **Code Rollback**:
   - The ProductDetail.tsx fix is backward compatible
   - No breaking changes to existing functionality

## Support & Monitoring

Monitor these metrics after deployment:
- **Cloud Firestore Errors**: Check for rules violation errors in Cloud Logging
- **Frontend Errors**: Monitor browser console for any remaining permission errors
- **User Reports**: Watch for users reporting favorites not saving

---

**Deployed By**: GitHub Copilot  
**Date Fixed**: Today  
**Status**: ✅ Ready for deployment
