# HYBULK Promo Code - Testing Plan

## 🎯 Test Objective
Verify that a **minimum quantity requirement** works correctly for the new HYBULK promo code (100% free shipping for Hyderabad with 2+ items minimum).

---

## 📋 Pre-Test Setup

### 1. Check Database Schema
Run this in Supabase SQL Editor to add `min_quantity` column:

```sql
-- Add min_quantity column to promo_codes table
ALTER TABLE public.promo_codes
ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.promo_codes.min_quantity IS 
'Minimum number of items in cart required for this promo to apply (0 = no minimum)';
```

### 2. Create HYBULK Promo Code
Insert into Supabase:

```sql
INSERT INTO public.promo_codes (
  code,
  discount_percentage,
  promo_type,
  shipping_discount_percentage,
  allowed_states,
  allowed_pincodes,
  min_quantity,
  active
) VALUES (
  'HYBULK',
  0,
  'shipping_discount',
  100,
  ARRAY['TELANGANA'],
  ARRAY['50%'],  -- Hyderabad pincodes start with 5000-5099, 5100-5199, etc.
  2,  -- Minimum 2 items
  true
);
```

---

## 🧪 Test Scenarios

### Test Case 1: Single Item with HYBULK (Should NOT Apply)
```
Scenario: User tries HYBULK with only 1 item

Step 1: Add 1 item to cart (any product, quantity = 1)
Step 2: Go to cart page
Step 3: Enter promo code: HYBULK
Step 4: Expected Result:
   ❌ Promo should NOT apply
   ✅ Toast message: "Promo code requires minimum 2 items"
   ✅ Cart total should include shipping charge
   ✅ Console log: "[Checkout] Promo requires min 2 items, cart has 1"
```

### Test Case 2: Two Items with HYBULK (Should Apply)
```
Scenario: User has 2 items and applies HYBULK

Step 1: Add first item to cart (quantity = 1)
Step 2: Add second item to cart (quantity = 1)
       Total quantity = 2
Step 3: Go to checkout
Step 4: Enter pincode: 500001 (Hyderabad - starts with 50)
Step 5: Click "Check Delivery"
Step 6: Should see: Delivery available, shipping charge shown
Step 7: Go to cart
Step 8: Enter promo code: HYBULK
Step 9: Expected Result:
   ✅ Promo applies successfully
   ✅ Toast: "Promo code HYBULK applied! Free shipping for TELANGANA"
   ✅ Cart shows: Discount: -₹40 (or current shipping charge)
   ✅ Final total reduced by shipping amount
```

### Test Case 3: Three Items with HYBULK (Should Apply)
```
Scenario: User has 3 items and applies HYBULK

Step 1: Add 3 items to cart (any combination)
       Total quantity = 3
Step 2: Go to checkout
Step 3: Enter Hyderabad pincode: 500027
Step 4: Click "Check Delivery"
Step 5: Go to cart
Step 6: Apply HYBULK
Step 7: Expected Result:
   ✅ Promo applies
   ✅ Shipping discount applied correctly
   ✅ Total reduces by full shipping amount (100% off)
```

### Test Case 4: Quantity 2 But Wrong Pincode (Should NOT Apply)
```
Scenario: User has 2 items but pincode is NOT in Hyderabad

Step 1: Add 2 items to cart
Step 2: Go to checkout
Step 3: Enter non-Hyderabad pincode: 110001 (Delhi)
Step 4: Click "Check Delivery"
Step 5: Go to cart
Step 6: Apply HYBULK
Step 7: Expected Result:
   ❌ Promo should NOT apply
   ✅ Toast: "Promo code does not apply to this location"
   ✅ Shipping charge shown (not discounted)
```

### Test Case 5: Decreasing Quantity Below Minimum
```
Scenario: User has 2 items applied HYBULK, then reduces to 1

Step 1: Add 2 items to cart
Step 2: Apply HYBULK (should work)
Step 3: Decrease one item quantity to 0 (remove it)
       Total quantity = 1
Step 4: Expected Result:
   ✅ HYBULK automatically removed or shows as "inactive"
   ✅ Toast: "Promo requires minimum 2 items"
   ✅ Shipping charge reappears in total
   ✅ Proceed to checkout - order should NOT have discount
```

### Test Case 6: APFREE Still Works (No Min Quantity)
```
Scenario: Verify APFREE (old code) still works with single item

Step 1: Add 1 item to cart
Step 2: Apply APFREE
Step 3: Expected Result:
   ✅ APFREE applies (no minimum quantity requirement)
   ✅ 100% free shipping
   ✅ Toast: "Promo code APFREE applied! Free shipping..."
```

---

## 🔍 Verification Checklist

### Browser Console Logs
When applying HYBULK with 2 items, you should see:
```
✅ [Cart] Promo code fetched: {code: "HYBULK", promo_type: "shipping_discount", ...}
✅ [Cart] Promo code applied successfully
✅ [Checkout] Promo requires min 2 items, cart has 2 (or more)
```

When applying with 1 item:
```
✅ [Checkout] Promo requires min 2 items, cart has 1
```

### UI Displays
- [ ] Cart shows applied promo code
- [ ] Discount amount displays correctly
- [ ] Minimum quantity warning shows when < 2 items
- [ ] Toast notifications appear correctly
- [ ] Final total updates properly

### Database Verification
Run this to confirm promo code exists:
```sql
SELECT code, min_quantity, shipping_discount_percentage, allowed_states, active
FROM public.promo_codes
WHERE code = 'HYBULK';
```

Expected result:
```
code: HYBULK
min_quantity: 2
shipping_discount_percentage: 100
allowed_states: [TELANGANA]
active: true
```

---

## 🚀 Step-by-Step Test Execution

### Phase 1: Setup (5 minutes)
1. [ ] Add `min_quantity` column to database
2. [ ] Create HYBULK promo code via SQL
3. [ ] Verify in Supabase: promo code exists with min_quantity=2
4. [ ] Start dev server: `npm run dev`

### Phase 2: Basic Tests (10 minutes)
1. [ ] Test Case 1: Single item + HYBULK (should fail)
2. [ ] Test Case 2: Two items + HYBULK (should pass)
3. [ ] Check console logs for validation messages

### Phase 3: Advanced Tests (10 minutes)
1. [ ] Test Case 3: Three items + HYBULK
2. [ ] Test Case 4: Correct quantity, wrong pincode
3. [ ] Test Case 5: Decrease quantity after applying
4. [ ] Test Case 6: APFREE still works

### Phase 4: Checkout Flow (10 minutes)
1. [ ] Proceed to checkout with HYBULK applied
2. [ ] Verify pricing breakdown shows no shipping
3. [ ] Complete test order (COD or test payment)
4. [ ] Verify order saved correctly without shipping charge

---

## 📊 Expected Results Summary

| Test Case | Items | Pincode | Promo Applied | Shipping Cost |
|-----------|-------|---------|---------------|---------------|
| Case 1 | 1 | 500001 | ❌ NO | ₹40 |
| Case 2 | 2 | 500001 | ✅ YES | ₹0 |
| Case 3 | 3 | 500027 | ✅ YES | ₹0 |
| Case 4 | 2 | 110001 | ❌ NO | ₹40 |
| Case 5 | 1→2→1 | 500001 | ❌ NO (after reduce) | ₹40 |
| Case 6 | 1 | 500001 | ✅ YES (APFREE) | ₹0 |

---

## 🐛 If Tests Fail

### Promo not applying even with 2+ items?
- [ ] Check console for errors
- [ ] Verify `min_quantity` column exists in database
- [ ] Verify promo code is fetching `min_quantity` field
- [ ] Check CartContext.tsx line 186 includes `min_quantity` in SELECT

### Wrong validation logic?
- [ ] Check Checkout.tsx `getShippingDiscount()` function
- [ ] Verify quantity calculation is correct
- [ ] Check min_quantity comparison logic

### Pincode validation failing?
- [ ] Verify `allowed_pincodes` array format in database
- [ ] Check regex pattern for Hyderabad pincodes
- [ ] Test with multiple pincodes: 500001, 500027, 500047

---

## ✅ Success Criteria

All tests pass when:
1. ✅ Single item rejects HYBULK
2. ✅ 2+ items accept HYBULK
3. ✅ Correct pincode required
4. ✅ Quantity changes reflect in validation
5. ✅ Order completes with correct pricing
6. ✅ APFREE still works independently
