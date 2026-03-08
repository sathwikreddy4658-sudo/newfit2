# Guest Order Details Fix

## Problem Updated

Guest orders are being created successfully, but:
1. **Admin is getting 406 errors** when trying to fetch orders (permission denied by RLS policy)
2. **Guest's name and phone numbers are not showing** in the admin/orders dashboard

## Root Cause

The RLS (Row Level Security) policies on the orders table are blocking admin access:

1. **Missing SELECT policy** - The table has no policy allowing admins to read all orders
2. **Insufficient permissions** - Admin users need the "admin" role in the user_roles table
3. **Column access denied** - Even if orders are readable, customer_name/phone might not be readable

## Solutions Implemented

### 1. Comprehensive Database Setup (CRITICAL)

Updated `GUEST_ORDERS_FINAL_SETUP.sql` to:
- ✅ Make `user_id` nullable (for guest orders)
- ✅ Add `customer_name`, `customer_email`, `customer_phone` columns
- ✅ **NEW**: Create SELECT policy allowing admins to see ALL orders
- ✅ Create UPDATE policy allowing guests to update pending orders
- ✅ Create INSERT policy allowing guests to create orders
- ✅ Enable RLS on orders table
- ✅ Drop all conflicting policies first

### 2. Enhanced Error Logging

- **Checkout.tsx**: Logs when guest data is being saved and any errors
- **OrdersTab.tsx**: Logs what orders are being fetched

### 3. Troubleshooting Script

Created `TROUBLESHOOT_406_ERROR.sql` to:
- Check if admin user has "admin" role
- List all users and roles
- Verify RLS is enabled
- Show all RLS policies
- Check orders table structure
- Count guest vs authenticated orders

## What You Need to Do - IMMEDIATE ACTION

### Step 1: Deploy Database Setup

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open `GUEST_ORDERS_FINAL_SETUP.sql`
3. Copy ALL the SQL code
4. Paste into Supabase SQL Editor
5. Click **Run** to execute

**Expected output** - You should see:
- Verification query results showing ✅ for all columns
- RLS policies listed with proper permission configurations
- Summary message confirming setup complete

### Step 2: Troubleshoot 406 Error

1. Run `TROUBLESHOOT_406_ERROR.sql` in Supabase:
   - Copy ALL the SQL code
   - Paste into Supabase SQL Editor
   - Click **Run**

2. Check the results for:
   - **Step 1**: Does your admin user have "admin" role? (Should show ✅)
   - **Step 4**: Are there 3-4 RLS policies listed?
   - **Step 6**: How many total orders? How many guest orders?

3. **If admin does NOT have admin role**:
   - Find your admin user's email from Step 2
   - Run this SQL:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   SELECT id, 'admin' FROM auth.users 
   WHERE email = 'your-admin-email@example.com'
   AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.users.id);
   ```

### Step 3: Test Admin Access

1. **Log out** of your admin account
2. **Clear browser cache** (Ctrl+Shift+Delete / Cmd+Shift+Delete)
3. **Log back in** as admin
4. Go to **Admin Dashboard** → **Orders Tab**
5. Check browser console (F12) for:
   - `[OrdersTab] Guest Orders Fetched:` - Should show guest order data
   - `[OrdersTab] Orders Summary:` - Should show guest order counts

### Step 4: Create and Test Guest Order

1. Open incognito window / private browsing
2. Add products to cart
3. Click **Checkout** → **Continue as Guest**
4. Fill in test data:
   ```
   Name: Test Guest
   Email: testguest@example.com
   Phone: 9876543210
   Address: [Fill out complete address form]
   ```
5. Complete the order
6. Open browser console in admin dashboard
7. Should see guest order appearing with customer data

### Step 5: Verify in Admin Orders

After guest order is created:
1. Log in as admin
2. Go to **Admin Dashboard** → **Orders Tab**
3. Look for your guest order
4. **Should display**:
   - ✅ Order ID
   - ✅ "Guest" badge
   - ✅ Customer Name: "Test Guest"
   - ✅ Email: testguest@example.com (clickable mailto)
   - ✅ Phone: 9876543210 (clickable tel)
   - ✅ Order items

## RLS Policy Configuration Explained

The new policies created:

### 1. SELECT Policy (Reading Orders)
```sql
-- Admins can see all orders (using admin role)
-- Users can see their own orders only
-- Guest orders are ONLY visible to admins
```

### 2. UPDATE Policy (Modifying Orders)
```sql
-- Pending orders can be updated by:
-- - User who owns the order (auth.uid() = user_id)
-- - Anonymous (for guest checkout)
```

### 3. INSERT Policy (Creating Orders)
```sql
-- Orders can be created by:
-- - Authenticated users
-- - Anonymous users (guests)
```

## Debugging Checklist

| Issue | Cause | Fix |
|-------|-------|-----|
| 406 Error on GET orders | No SELECT RLS policy | Run GUEST_ORDERS_FINAL_SETUP.sql |
| Admin can't see any orders | Admin doesn't have "admin" role | Add admin role to user_roles table |
| Guest orders exist but no customer_name | Checkout update failing | Check browser console logs in checkout |
| Customer data shows [EMPTY] in admin | RLS policy blocking column access | Re-run GUEST_ORDERS_FINAL_SETUP.sql |
| Still seeing 406 after all fixes | Old policies still conflicting | Manually drop ALL policies and re-run |
| Admin user not assigned correctly | Role assigned before user created | Verify order of operations in Step 2 |

## Key Files

1. **GUEST_ORDERS_FINAL_SETUP.sql** ← **RUN THIS FIRST**
   - Configures database for guest orders
   - Sets up all RLS policies

2. **TROUBLESHOOT_406_ERROR.sql** ← **Run this to debug**
   - Checks admin permissions
   - Verifies RLS policies
   - Shows order data

3. **src/pages/Checkout.tsx** (Updated)
   - Enhanced logging for guest data

4. **src/components/admin/OrdersTab.tsx** (Updated)
   - Enhanced logging for order fetches

## Expected Console Output

### During Guest Checkout (Browser Console)
```
[Checkout] Customer Data Being Saved: {
  isGuestCheckout: true,
  customerName: "Test Guest",
  customerEmail: "testguest@example.com",
  customerPhone: "9876543210"
}

[Checkout] Full Update Data: { /* data object */ }

[Checkout] Order updated successfully with guest data: {
  updated: 1,
  orderId: "aad2a97a-...",
  savedData: {
    customer_name: "Test Guest",
    customer_email: "testguest@example.com",
    customer_phone: "9876543210",
    ...
  }
}
```

### In Admin Dashboard (Browser Console)
```
[OrdersTab] Guest Orders Fetched: [
  {
    id: "aad2a97a",
    customer_name: "Test Guest",
    customer_email: "testguest@example.com",
    customer_phone: "9876543210",
    ...
  }
]

[OrdersTab] Orders Summary: {
  total: 15,
  guest: 3,
  authenticated: 12
}
```

## If You Still Have Issues

1. **Check Supabase status**: https://status.supabase.com
2. **Verify database**: Run TROUBLESHOOT_406_ERROR.sql and share results
3. **Check role assignment**: Ensure admin role exists and is assigned
4. **Verify auth session**: Log out, clear cache, log back in
5. **Test with fresh guest order**: Create a new guest order and check if it shows

## Next Steps After Fix

Once guest orders are showing:
1. Test guest order lookup functionality
2. Verify email notifications are sending
3. Test order status updates (shipped, delivered)
4. Check CSV export includes guest data
5. Consider adding SMS notifications for guest orders

Good luck! 🚀

