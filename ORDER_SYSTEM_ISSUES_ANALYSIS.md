# Order System Issues Analysis

## Problems Identified

### 1. **Order ID Mismatch**
- **Admin Panel Shows**: `7CZyBuQ2` (first 8 chars of Firestore document ID)
- **Customer Sees**: `ORD-1773165449475` (order_number field)
- **Issue**: Two different IDs shown; customers given display-friendly ID but admin shows internal ID
- **Impact**: Customers can't use their order ID from confirmation email to track in admin

### 2. **Pricing Discrepancy**
- **Admin Shows Items Total**: ₹170.00 (raw sum of item.price × quantity)
- **Customer Track Page Shows Subtotal**: ₹153.00 (calculated as total_amount + discount_amount)
- **Data Mismatch**: 
  - Only PROMO CODE discount (appliedDiscount) is saved in `discount_amount`
  - COMBO PACK discounts are applied in CartContext but NOT tracked in order
  - Admin shows raw items total; customer page tries to reverse-calculate subtotal

**Example Order:**
```
2 × Cranberry Cocoa @ ₹85 = ₹170 (raw)
- Combo discount (if any): Not tracked
- Promo discount: ₹17
= Actual subtotal: ₹153
= Final total: ₹136
```

### 3. **Missing Data in Order Record**
The order doesn't store:
- `combo_discount_amount` (COMBO discounts applied)
- `items_subtotal` (what items actually cost before any discounts)
- Clear breakdown of which discount is which

## Root Causes

### CartContext (lines 211-225)
```javascript
// totalPrice ALREADY includes combo discounts!
const totalPrice = items.reduce((sum, item) => {
    const subtotal = item.price * item.quantity;
    let discount = 0;
    
    if (item.quantity >= 3 && item.combo_3_discount) {
      discount = (subtotal * item.combo_3_discount) / 100;
    }
    // ...
    return sum + (subtotal - discount);  // Already discounted!
}, 0);
```

### Checkout.tsx (lines 670-771)
```javascript
// itemsSubtotal uses "discountedTotal" which includes BOTH discounts
const itemsSubtotal = discountedTotal !== undefined ? discountedTotal : totalPrice;
const appliedDiscount = discountAmount || 0;  // Only promo discount

// Order stores incomplete discount info
orderData = {
  discount_amount: appliedDiscount,  // ❌ Missing combo discount!
  total_amount: itemsSubtotal + netShipping + codCharge - appliedDiscount
}
```

### TrackOrder.tsx (line 283)
```javascript
// Calculates subtotal assuming discount_amount is the only discount
<span>₹{(order.total_amount - (order.shipping_charge || 0) + (order.discount_amount || 0)).toFixed(2)}</span>
// This fails when combo discounts exist but aren't tracked
```

## Required Fixes

### Fix 1: Store Complete Pricing Data
- Add `items_subtotal` (raw sum before any discounts)
- Add `combo_discount_amount` (separate from promo discount)
- Keep existing `discount_amount` for promo discount (or rename to `promo_discount_amount`)

### Fix 2: Fix TrackOrder Subtotal Calculation
- Use stored `items_subtotal` if available
- Otherwise calculate from items array: `SUM(item.price × item.quantity)`

### Fix 3: Standardize Order ID Display
- Admin: Show `order_number` by default (customer-facing ID)
- Fallback to first 8 chars of ID only for legacy data
- Ensure search works with both IDs

### Fix 4: Fix Admin OrdersTab
- Calculate items total from stored data consistently
- Show correct discount breakdown

## Files to Modify
1. `src/pages/Checkout.tsx` - Store complete pricing info
2. `src/pages/TrackOrder.tsx` - Fix subtotal calculation
3. `src/components/admin/OrdersTab.tsx` - Fix display logic
4. `src/integrations/firebase/types.ts` - Update Order type definition
