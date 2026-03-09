# 🧪 Testing Guest & User Ordering - Quick Guide

## ✅ Fix Applied

Firestore security rules have been updated to allow guests and users to place orders. Rules deployed successfully on March 9, 2026.

---

## 🚀 How to Test

### Test 1: Guest Checkout with COD

**Steps:**
1. Open app in **Incognito/Private mode** (ensures no cached auth)
2. Browse products and add items to cart
3. Click **"Checkout as Guest"** button
4. Fill in guest checkout form:
   - Name: Test Guest
   - Email: guest@test.com
   - Phone: 9876543210
   - Address: Test Address, City, State, 123456
5. Select **COD (Cash on Delivery)**
6. Click **"Place Order"**

**Expected Results:**
- ✅ Order should be created successfully
- ✅ Confirmation message appears
- ✅ Order appears in Firestore console
- ✅ Order ID displayed to user

---

### Test 2: Guest Checkout with Online Payment

**Steps:**
1. Open app in **Incognito/Private mode**
2. Add items to cart
3. Click **"Checkout as Guest"**
4. Fill guest checkout form (same as Test 1)
5. Select **Online Payment**
6. Click **"Place Order"**

**Expected Results:**
- ✅ Order created in Firestore
- ✅ Payment gateway opens (PhonePe)
- ✅ Can complete or cancel payment
- ✅ After payment success, order marked as 'paid'

---

### Test 3: User Checkout with COD

**Steps:**
1. Log in with test user account
2. Add items to cart
3. Click **"Checkout"** (not "as guest")
4. Fill address (or select saved address)
5. Select **COD**
6. Click **"Place Order"**

**Expected Results:**
- ✅ Order created with user_id
- ✅ Order appears in user's "My Orders"
- ✅ Order visible to admin in Orders tab
- ✅ Order marked as 'confirmed' for COD

---

### Test 4: User Checkout with Online Payment

**Steps:**
1. Log in as test user
2. Add items to cart
3. Click **"Checkout"**
4. Fill/select address
5. Select **Online Payment**
6. Click **"Place Order"**

**Expected Results:**
- ✅ Order created in pending status
- ✅ Payment gateway opens
- ✅ After payment success, order marked as 'paid'
- ✅ Order visible in user account

---

### Test 5: Admin Can See All Orders

**Steps:**
1. Log in as **admin**
2. Navigate to **"/admin"** panel
3. Go to **"Orders"** tab

**Expected Results:**
- ✅ Admin sees orders from Tests 1-4
- ✅ Both guest and user orders visible
- ✅ Can click to see order details
- ✅ Guest orders show customer name/email/phone
- ✅ Admin can update order status

---

### Test 6: Promo codes work for all (Guests & Users)

**Steps:**
1. Complete Tests 1-4 **with a valid promo code**
   - Add promo code in cart
   - Verify discount applies
   - Place order

**Expected Results:**
- ✅ Discount applied to order total
- ✅ Order saves with promo_code field
- ✅ Works for both guest and user

---

## 🐛 If Orders Still Fail

### Check Browser Console (F12)

Look for error messages:

```
❌ "Missing or insufficient permissions"
  → Clear cache and try again (Ctrl+Shift+Delete)
  → Or try in Incognito mode

❌ "Validation failed: customer_phone"
  → Phone must be exactly 10 digits
  → Check phone format

❌ "Address Required"
  → Address field is empty
  → Ensure address is filled before placing order

❌ "Product not found"
  → Product was deleted after adding to cart
  → Remove from cart and re-add
```

---

### Check Firestore Rules (Firebase Console)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select **newfit-35320** project
3. Go to **Firestore Database** → **Rules** tab
4. Verify these lines are present:

```
match /orders/{orderId} {
  allow read: if isAdmin() || ...
  allow create: if 
    request.resource.data.keys().hasAll(...
    // NO "request.auth != null" requirement
    
  allow update: if isAdmin();
  allow delete: if isAdmin();
}
```

If not, rules need to be redeployed:
```bash
firebase deploy --only firestore:rules
```

---

### Check Firestore Data

1. Firebase Console → **Firestore Database**
2. Look for **orders** collection
3. Click on a guest order
4. Should see:
   - ✅ `user_id: null` (or empty)
   - ✅ `customer_name: "Guest Name"`
   - ✅ `customer_email: "guest@email.com"`
   - ✅ `status: "confirmed"` or `"pending"`

---

## 📊 Expected Order Structure

```javascript
{
  id: "...auto-generated...",
  order_number: "ORD-1678459200000",
  user_id: null,  // ← null for guests, uid for users
  customer_name: "Test Guest",
  customer_email: "guest@test.com",
  customer_phone: "9876543210",
  address: "Test Address",
  items: [
    {
      productId: "prod123",
      name: "Product Name",
      price: 299.99,
      quantity: 2,
      image: "url..."
    }
  ],
  total_amount: 599.98,
  status: "confirmed",  // COD or "pending" for online payment
  payment_method: "cod",  // or "online"
  discount_amount: 0,
  shipping_charge: 50,
  cod_charge: 10,
  promo_code: null,
  paid: true,  // COD=true, Online Payment=false until webhook
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

---

## ✅ Success Criteria

All tests pass when:

| Feature | Status |
|---------|--------|
| Guest + COD | ✅ Order created |
| Guest + Online Payment | ✅ Order created + payment |
| User + COD | ✅ Order created |
| User + Online Payment | ✅ Order created + payment |
| Admin sees all orders | ✅ Visible in Orders tab |
| Promo codes apply | ✅ Discount shows in order |
| Order validation | ✅ Email/phone/price validated |

---

## 📞 Need Help?

If you're still experiencing issues:

1. Check browser console errors (F12)
2. Verify rules are deployed (command above)
3. Clear cache and retry in Incognito mode
4. Check Firestore order documents exist
5. Verify admin role is set in `/user_roles/{uid}`

---

## Command Reference

```bash
# Deploy updated rules
firebase deploy --only firestore:rules

# View current rules
firebase firestore:rules --project=newfit-35320

# Clear browser cache
Ctrl + Shift + Delete (or Cmd + Shift + Delete on Mac)

# Hard refresh page
Ctrl + F5 (or Cmd + Shift + R on Mac)
```

---

## Summary

✅ **Rules deployed**  
✅ **Guests can place orders**  
✅ **Users can place orders**  
✅ **Admins can manage orders**  
✅ **Security validation intact**

Start testing! 🚀
