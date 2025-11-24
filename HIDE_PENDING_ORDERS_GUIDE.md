# Hide Pending Orders from Customer Track Order Page

## Overview
This update ensures that pending orders are only visible to admins in the admin panel, not to customers on the Track Order page.

## What Changed

### Database Function Update
- Modified `get_orders_with_items_public()` function to exclude orders with `status = 'pending'`
- Customers using the Track Order page will now only see:
  - ✅ Confirmed orders
  - ✅ Processing orders
  - ✅ Shipped orders
  - ✅ Delivered orders
  - ✅ Cancelled orders
  - ❌ Pending orders (hidden)

### What Remains Unchanged
- **Order Confirmation Page**: Still shows all orders (including pending) immediately after creation
- **Admin Panel**: Still shows ALL orders including pending ones
- **Admin Orders Tab**: No changes - admins see everything

## How to Apply This Change

### Step 1: Load the Migration in Supabase
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20251124_hide_pending_orders_from_customers.sql`
4. Paste and click **RUN**

### Step 2: Verify the Change
1. Create a test order that stays in "pending" status
2. Go to the Track Order page as a customer
3. Enter your email/phone
4. Verify that pending orders do NOT appear
5. Log in to admin panel and verify pending orders ARE visible there

## Migration File Location
```
supabase/migrations/20251124_hide_pending_orders_from_customers.sql
```

## User Experience

### Before This Change
- ❌ Customers could see pending orders in Track Order page
- ❌ Confusing for customers to see unconfirmed orders

### After This Change
- ✅ Customers only see confirmed and processed orders
- ✅ Pending orders remain visible only to admins
- ✅ Cleaner customer experience
- ✅ Orders appear on Track Order page only after admin confirms them

## Technical Details

### Modified Function
```sql
CREATE OR REPLACE FUNCTION public.get_orders_with_items_public(
  p_email text,
  p_phone text
)
```

### Key Change
Added filter: `AND o.status != 'pending'`

This ensures the function only returns orders that are not in pending status when customers search for their orders.

## Troubleshooting

### If pending orders still appear:
1. Verify the migration was run successfully in Supabase
2. Check the function definition in Supabase Dashboard > Database > Functions
3. Clear browser cache and try again

### If confirmed orders don't appear:
1. Check that the order status is actually "confirmed" (not "pending")
2. Verify the email/phone number matches exactly
3. Check admin panel to see what status the order has

## Related Files
- `src/pages/TrackOrder.tsx` - Track Order page (no code changes needed)
- `supabase/migrations/20251124_hide_pending_orders_from_customers.sql` - Database migration
- Admin panel orders tab - Already shows all orders including pending

---

**Date Created**: November 24, 2025
**Status**: Ready to Deploy
