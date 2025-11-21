# Variant Stock Status Implementation

## Changes Made

### 1. Database Migration
**File:** `supabase/migrations/20251121_add_variant_stock_status.sql`

Added two new boolean columns to the products table:
- `stock_status_15g` (BOOLEAN, default: true) - In Stock/Out of Stock for 15g variant
- `stock_status_20g` (BOOLEAN, default: true) - In Stock/Out of Stock for 20g variant

**Action Required:** Run this SQL migration in your Supabase dashboard:
```sql
-- Navigate to Supabase Dashboard > SQL Editor > New Query
-- Copy and paste the contents of the migration file and execute
```

### 2. Admin Panel Updates
**File:** `src/components/admin/ProductsTab.tsx`

Changed from numeric stock fields to dropdown stock status:
- Removed: `stock_15g` and `stock_20g` numeric input fields
- Added: `stock_status_15g` and `stock_status_20g` dropdown fields with "In Stock" / "Out of Stock" options

**Admin Interface:**
- "15g Variant Stock Status" dropdown (In Stock / Out of Stock)
- "20g Variant Stock Status" dropdown (In Stock / Out of Stock)

### 3. Product Detail Page Updates
**File:** `src/pages/ProductDetail.tsx`

**Changes:**
1. Protein variant buttons now show "Out of Stock" label when unavailable
2. Out of stock variants are disabled and visually grayed out
3. Add to Cart button is disabled when selected variant is out of stock
4. Add to Cart button text changes to "Out of Stock" when variant unavailable

### 4. Combo Discount Functionality

The combo discount feature is already implemented and should be working. Here's how it works:

**Price Calculation Logic:**
```javascript
if (selectedQuantity === 3 && product.combo_3_discount) {
  discount = (subtotal * product.combo_3_discount) / 100;
  finalPrice = subtotal - discount;
} else if (selectedQuantity === 6 && product.combo_6_discount) {
  discount = (subtotal * product.combo_6_discount) / 100;
  finalPrice = subtotal - discount;
}
```

**Display:**
- 3-PACK button shows: "3-PACK" with "X% OFF" badge
- 6-PACK button shows: "6-PACK" with "X% OFF" badge
- Price section shows: "Save ₹XX.XX (X%)" when discount is applied

## Testing Steps

### Step 1: Apply Database Migration
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Open the file `supabase/migrations/20251121_add_variant_stock_status.sql`
4. Copy its contents and run in SQL Editor

### Step 2: Test Admin Panel
1. Login as admin
2. Go to Products Management
3. Edit an existing product or create new one
4. You should see:
   - "15g Variant Stock Status" dropdown
   - "20g Variant Stock Status" dropdown
   - "3-Pack Discount (%)" field (default: 5)
   - "6-Pack Discount (%)" field (default: 7)
5. Try setting:
   - 15g variant to "Out of Stock"
   - 20g variant to "In Stock"
   - 3-Pack discount to 10%
   - 6-Pack discount to 15%
6. Save the product

### Step 3: Test Product Page
1. Go to the product page you just edited
2. You should see:
   - "15g Protein" button disabled with "Out of Stock" label
   - "20g Protein" button enabled
3. Select 20g variant (should be pre-selected if 15g is out of stock)
4. Note the base price
5. Click "3-PACK" button:
   - Price should reduce by 10% (or your set percentage)
   - Should show "Save ₹XX.XX (10%)" below price
   - Button should show "10% OFF" badge
6. Click "6-PACK" button:
   - Price should reduce by 15% (or your set percentage)
   - Should show "Save ₹XX.XX (15%)" below price
   - Button should show "15% OFF" badge

### Step 4: Test Out of Stock Behavior
1. Try clicking on "15g Protein" button (should be disabled)
2. Try to add to cart - should show "Out of Stock" if current variant is unavailable
3. Switch to 20g variant - Add to Cart should work

## Troubleshooting

### If Combo Discounts Don't Show:
1. Check if `combo_3_discount` and `combo_6_discount` columns exist in database
2. Verify the product has discount values set (check in admin panel)
3. Open browser console and check for any errors
4. Try setting discount to a higher value like 20% to make it more visible

### If Stock Status Doesn't Show:
1. Ensure the migration has been run
2. Check that products have the new columns (default should be `true` for both)
3. Refresh the page after updating in admin panel

### Common Issues:
- **Migration not applied:** Stock status fields won't exist, causing errors
- **Old products:** Existing products will have default values (`true` for both variants)
- **Browser cache:** Hard refresh the page (Ctrl+Shift+R) if changes don't appear

## Database Schema Reference

```sql
-- Products table now has:
stock_status_15g BOOLEAN DEFAULT true  -- In Stock = true, Out of Stock = false
stock_status_20g BOOLEAN DEFAULT true  -- In Stock = true, Out of Stock = false
combo_3_discount DECIMAL(5,2) DEFAULT 5  -- Percentage discount for 3-pack
combo_6_discount DECIMAL(5,2) DEFAULT 7  -- Percentage discount for 6-pack
```

## Next Steps

1. ✅ Apply database migration
2. ✅ Test admin panel stock status dropdowns
3. ✅ Test product page out of stock display
4. ✅ Test combo discount calculations
5. ✅ Verify discount badges show on pack buttons
6. ✅ Test Add to Cart button behavior with out of stock variants
