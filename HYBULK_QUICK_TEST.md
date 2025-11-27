# HYBULK Promo - Quick Test Checklist

## 🚀 Before Testing

- [ ] Run the SQL migration in Supabase
  1. Go to Supabase Dashboard → SQL Editor
  2. Create new query
  3. Copy contents from: `supabase/migrations/20251127_add_min_quantity_and_hybulk.sql`
  4. Click "Run"
  5. Verify: "Successfully inserted HYBULK promo code"

- [ ] Restart dev server: `npm run dev`

---

## ✅ Test 1: Single Item with HYBULK (Should REJECT)

```
Action: 
1. Add 1 item to cart
2. Go to cart
3. Enter code: HYBULK
4. Look at UI

Expected Result:
✅ Toast warning or promo doesn't apply
✅ Shipping charge still shows in total
✅ Console log shows: "[Checkout] Promo requires min 2 items, cart has 1"
```

**Result:** ☐ PASS ☐ FAIL

---

## ✅ Test 2: Two Items with HYBULK in Hyderabad (Should ACCEPT)

```
Action:
1. Add 2 items to cart (any products)
2. Go to checkout
3. Enter Hyderabad pincode: 500001
4. Click "Check Delivery"
5. Go back to cart
6. Enter code: HYBULK

Expected Result:
✅ Promo applies successfully
✅ Toast: "Promo code HYBULK applied! Free shipping for TELANGANA"
✅ Cart shows discount amount (equals shipping charge)
✅ Total price reduced by shipping amount
✅ Console shows: [Cart] Promo code applied successfully
```

**Result:** ☐ PASS ☐ FAIL

---

## ✅ Test 3: Two Items But Wrong Pincode (Should REJECT)

```
Action:
1. Add 2 items to cart
2. Go to checkout
3. Enter non-Hyderabad pincode: 110001 (Delhi)
4. Click "Check Delivery" 
5. Go to cart
6. Try to apply: HYBULK

Expected Result:
❌ Promo doesn't apply
✅ Toast: Message indicates location not supported
✅ Shipping charge shown in total
✅ No discount applied
```

**Result:** ☐ PASS ☐ FAIL

---

## ✅ Test 4: Verify APFREE Still Works

```
Action:
1. Clear cart
2. Add 1 item only
3. Go to cart
4. Enter code: APFREE

Expected Result:
✅ APFREE applies (no minimum quantity needed)
✅ Free shipping shown
✅ Toast: "Promo code APFREE applied!"
```

**Result:** ☐ PASS ☐ FAIL

---

## ✅ Test 5: Reduce Quantity After Applying HYBULK

```
Action:
1. Add 2 items to cart
2. Apply HYBULK in Hyderabad (should work)
3. Remove 1 item (reduce to 1)

Expected Result:
✅ HYBULK shows as inactive or removed
✅ Shipping charge reappears
✅ Toast: "Promo requires minimum 2 items"
✅ Total increases by shipping amount
```

**Result:** ☐ PASS ☐ FAIL

---

## ✅ Test 6: Complete Order with HYBULK

```
Action:
1. Add 2-3 items to cart
2. Apply HYBULK (Hyderabad pincode)
3. Proceed to checkout
4. Enter address details
5. Choose payment method
6. Complete order (test payment or COD)

Expected Result:
✅ Order created successfully
✅ Order total excludes shipping charge
✅ Order details show discount_applied correctly
✅ Thank you page displays correct pricing breakdown
✅ Console shows: [Conversion] Tracking purchase...
```

**Result:** ☐ PASS ☐ FAIL

---

## 🔍 Console Logs to Check

When applying HYBULK, open F12 Console and verify:

✅ Should see:
```
[Cart] Promo code fetched: {code: "HYBULK", promo_type: "shipping_discount", min_quantity: 2, ...}
[Checkout] Promo requires min 2 items, cart has 2 (or more)
[Cart] Promo code applied successfully
```

❌ Should NOT see errors like:
```
Cannot read property 'min_quantity' of undefined
Uncaught TypeError in CartContext
```

---

## 📊 Summary

| Test | Expected | Result |
|------|----------|--------|
| 1 item + HYBULK | REJECT | ☐ |
| 2 items + HYBULK (HYD) | ACCEPT | ☐ |
| 2 items + HYBULK (Wrong PIN) | REJECT | ☐ |
| 1 item + APFREE | ACCEPT | ☐ |
| Reduce qty after HYBULK | Auto-remove | ☐ |
| Full checkout flow | Success | ☐ |

**Overall Status:** ☐ All Pass ☐ Some Failed

---

## 🐛 If Something Fails

1. **Check migration ran successfully:**
   - Supabase → SQL Editor → Run query
   - Verify: HYBULK exists in promo_codes table

2. **Check CartContext updated:**
   - Look at `src/contexts/CartContext.tsx` line 186
   - Should include: `min_quantity` in the SELECT

3. **Check Checkout validation:**
   - Look at `src/pages/Checkout.tsx` lines 55-60
   - Should have quantity check logic

4. **Clear cache & restart:**
   - Delete `node_modules/.vite` folder
   - Refresh browser page
   - Restart dev server

5. **Check console logs:**
   - F12 → Console tab
   - Look for any red errors
   - Search for "[Cart]" or "[Checkout]" logs

---

## ✅ After All Tests Pass

- [ ] Push changes to GitHub
- [ ] Deploy to production
- [ ] Test HYBULK code live
- [ ] Monitor for customer usage
- [ ] Track reduced shipping costs
