# Quick Troubleshooting - If Orders Still Fail

**Last Deployed**: March 9, 2026  
**Status**: Firestore rules updated with COD status fix

---

## ⚠️ If You Still Get "Missing or insufficient permissions"

### Step 1: Clear Cache & Hard Refresh
```
1. Press Ctrl + Shift + Delete (open Clear Browsing Data)
2. Check: Cookies, Cached images
3. Click "Clear"
4. Go back to app
5. Press Ctrl + F5 (hard refresh)
```

---

### Step 2: Test in Incognito Mode
```
1. Press Ctrl + Shift + N (open Incognito)
2. Go to http://localhost:8080 (your app)
3. Add items to cart
4. Try "Checkout as Guest"
5. Fill all fields and place order
```
**Why?** Incognito has no cached data or auth tokens

---

### Step 3: Check Browser Console
```
1. Press F12 (open Developer Tools)
2. Click "Console" tab
3. Look for error messages starting with:
   - "FirebaseError"
   - "[Checkout]"
   - "Error creating order"
4. Copy the FULL error message
```

### Common Errors & Fixes:

| Error Message | Cause | Fix |
|---|---|---|
| `Missing or insufficient permissions` | Rules issue | Verify rules deployed (see below) |
| `Address Required` | Address field empty | Fill complete delivery address |
| `Validation failed: customer_phone` | Phone not 10 digits | Use exactly 10 digit phone |
| `Validation failed: customer_email` | Email format wrong | Use valid email (test@test.com) |
| `Product not found` | Cart product deleted | Remove & re-add to cart |

---

### Step 4: Verify Rules Are Deployed

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select **newfit-35320** project
3. Go to **Firestore Database** → **Rules** tab
4. Look for this text in the ORDERS section:

```
allow create: if 
  // Must have required fields
  request.resource.data.keys().hasAll(['items', 'total_amount', 'customer_email', 'customer_phone', 'status']) &&
  ...
  // Status can be: 'pending' (online payment), 'confirmed' (COD), or 'payment_initiated'
  request.resource.data.status in ['pending', 'confirmed', 'payment_initiated'];
```

If you DON'T see `'confirmed'` in the status list:
1. ❌ Rules NOT deployed correctly
2. Redeploy: `firebase deploy --only firestore:rules`

---

### Step 5: Check Order Data

Add this to see what's being sent (browser console):

```javascript
// Replace with test data
const testOrder = {
  items: [{
    productId: 'test-prod-id',
    name: 'Test Product',
    price: 299.99,
    quantity: 1
  }],
  total_amount: 299.99,
  customer_email: 'test@test.com',
  customer_phone: '9876543210',
  status: 'confirmed'  // ← This is key for COD
};

// Check all 5 required fields exist
const required = ['items', 'total_amount', 'customer_email', 'customer_phone', 'status'];
const missing = required.filter(f => !(f in testOrder));
console.log('Missing fields:', missing);  // Should be empty []
```

---

## 🔧 Manual Rule Deployment

If Firebase says rules are already deployed but it's not working:

```bash
# Option 1: Force redeploy with new timestamp
firebase deploy --only firestore:rules

# Option 2: View current rules
firebase firestore:rules --project newfit-35320

# Option 3: Clear cache and deploy
firebase cache:clear
firebase deploy --only firestore:rules
```

---

## ✅ Verification Checklist

```
□ Browser cache cleared
□ Hard refresh done (Ctrl+F5)
□ Tested in Incognito mode
□ Firebase rules show 'confirmed' status
□ Phone is exactly 10 digits
□ Email has valid format
□ Order address is filled
□ Using current Checkout.tsx (has status='confirmed' for COD)
```

---

## 📞 Next Steps If Still Stuck

1. Check [GUEST_AND_USER_ORDERING_FIX.md](GUEST_AND_USER_ORDERING_FIX.md)
2. Check [TESTING_GUEST_USER_ORDERING.md](TESTING_GUEST_USER_ORDERING.md)
3. View Firestore rules in Firebase Console
4. Check browser console errors (F12)
5. Try in brand new Incognito window
6. Restart dev server: `npm run dev`

---

## Expected Success

When it works, you'll see:
```
✅ Order placed successfully
✅ Confirmation shown
✅ Order ID displayed
✅ Order appears in Firebase (Firestore → orders collection)
✅ Status is 'confirmed' (for COD) or 'pending' (for online)
```

Good luck! 🚀
