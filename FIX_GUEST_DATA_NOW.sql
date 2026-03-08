-- IMMEDIATE FIX: Update RLS Policies for Guest Orders
-- Run this NOW to fix the guest order data not being saved

-- 1. Drop ALL existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "Allow updating customer info and pricing on pending orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update customer info on pending orders" ON public.orders;
DROP POLICY IF EXISTS "Allow guest and user order updates during checkout" ON public.orders;
DROP POLICY IF EXISTS "Users and guests can update pending orders during checkout" ON public.orders;
DROP POLICY IF EXISTS "Orders are viewable by users and admins" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders, users can view their own" ON public.orders;
DROP POLICY IF EXISTS "admin_select_all_guest_select_own" ON public.orders;
DROP POLICY IF EXISTS "allow_update_pending_guest_orders" ON public.orders;
DROP POLICY IF EXISTS "allow_update_own_pending_orders" ON public.orders;
DROP POLICY IF EXISTS "allow_all_inserts" ON public.orders;
DROP POLICY IF EXISTS "Allow guest order reads" ON public.orders;
DROP POLICY IF EXISTS "Users can read their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
DROP POLICY IF EXISTS "Users and guests can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated and anonymous inserts" ON public.orders;

-- 2. Re-create fresh RLS policies
-- SELECT Policy: Admins can read all + Users can read their own
CREATE POLICY "admin_select_all_guest_select_own"
ON public.orders
FOR SELECT
USING (
  -- Admins can see all orders
  (SELECT COUNT(*) > 0 FROM public.user_roles 
   WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
  -- OR users can see their own orders
  OR auth.uid() = user_id
);

-- UPDATE Policy: For pending guest orders (simplest possible)
CREATE POLICY "allow_update_pending_guest_orders"
ON public.orders
FOR UPDATE
USING (
  -- Allow update if: order is pending AND user_id is NULL (guest order)
  status = 'pending' AND user_id IS NULL
)
WITH CHECK (
  status = 'pending' AND user_id IS NULL
);

-- UPDATE Policy: For authenticated users updating their own pending orders
CREATE POLICY "allow_update_own_pending_orders"
ON public.orders
FOR UPDATE
USING (
  status = 'pending' AND auth.uid() IS NOT NULL AND auth.uid() = user_id
)
WITH CHECK (
  status = 'pending' AND auth.uid() IS NOT NULL AND auth.uid() = user_id
);

-- INSERT Policy: Allow creating guest orders (user_id IS NULL) and authenticated user orders
CREATE POLICY "allow_all_inserts"
ON public.orders
FOR INSERT
WITH CHECK (
  user_id IS NULL OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
);

-- 3. Verify the policies are in place
SELECT 'RLS Policies Updated - Details:' AS status;
SELECT policyname, cmd as operation, permissive
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY policyname;

-- Show policy details
SELECT 'Policy Details:' AS details;
SELECT tablename, policyname, qual as condition, with_check
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY policyname;

-- 4. Test query: Show guest orders
SELECT 'Sample Guest Orders (may still be NULL - see next step):' AS test;
SELECT id::text as order_id, customer_name, customer_email, customer_phone, status, created_at
FROM public.orders
WHERE user_id IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- 5. Summary
SELECT 'Fix Applied! 
✅ All conflicting policies dropped
✅ CREATE POLICY: allow_update_pending_guest_orders (for guest user updates)
✅ CREATE POLICY: allow_update_own_pending_orders (for authenticated user updates)
✅ CREATE POLICY: admin_select_all_guest_select_own (for SELECT/READ)
✅ CREATE POLICY: allow_all_inserts (for INSERT/CREATE orders)

KEY CHANGE: Split UPDATE policy into 2 separate policies:
- One for guest orders: status=pending AND user_id IS NULL
- One for authenticated users: status=pending AND user_id matches auth.uid()

NEXT STEPS:
1. Create a NEW guest order (old orders will still have NULL data)
2. Open browser console (F12) during checkout
3. Look for logs starting with [Checkout]
4. Should see "Order updated successfully with guest data"
5. Check admin dashboard - new guest order should show name and phone' AS next_steps;
