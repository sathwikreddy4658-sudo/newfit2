-- Troubleshoot 406 Error - Orders Not Showing for Admin

-- STEP 1: Check if admin user has 'admin' role in user_roles
SELECT 'Step 1: Check admin user roles' AS step;
SELECT u.id, u.email, ur.role, 
       CASE WHEN ur.role = 'admin' THEN '✅ Has admin role' ELSE '❌ NO admin role' END as status
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email LIKE '%your-admin-email%'
LIMIT 1;

-- STEP 2: List ALL users and their roles
SELECT 'Step 2: All users and roles' AS step;
SELECT u.id, u.email, COALESCE(ur.role::text, 'NO ROLE') as role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC
LIMIT 20;

-- STEP 3: Check if RLS is enabled on orders table
SELECT 'Step 3: RLS Status' AS step;
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'orders';

-- STEP 4: Check ALL RLS policies on orders
SELECT 'Step 4: All RLS Policies' AS step;
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'orders'
ORDER BY policyname;

-- STEP 5: Verify orders table structure
SELECT 'Step 5: Orders table columns' AS step;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- STEP 6: Count guest vs authenticated orders
SELECT 'Step 6: Order summary' AS step;
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN user_id IS NULL THEN 1 END) as guest_orders,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as authenticated_orders,
  COUNT(CASE WHEN customer_name IS NOT NULL THEN 1 END) as orders_with_customer_name,
  COUNT(CASE WHEN customer_phone IS NOT NULL THEN 1 END) as orders_with_phone
FROM public.orders;

-- STEP 7: Sample guest orders check
SELECT 'Step 7: Sample guest orders' AS step;
SELECT id, customer_name, customer_email, customer_phone, status, created_at
FROM public.orders
WHERE user_id IS NULL
ORDER BY created_at DESC
LIMIT 3;

-- ACTION ITEMS:
-- 1. If Step 1 shows "NO admin role", add it:
--    INSERT INTO public.user_roles (user_id, role)
--    SELECT id, 'admin' FROM auth.users WHERE email = 'your-admin-email@example.com'
--    AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.users.id AND ur.role = 'admin');

-- 2. If Step 4 shows no policies or wrong policies, run GUEST_ORDERS_FINAL_SETUP.sql again

-- 3. If Step 7 shows guest orders without customer_name/phone:
--    The data update in checkout may be failing - check browser console logs

-- 4. If you still see 406 errors, try:
--    - Log out and log back in
--    - Clear browser cache
--    - Verify admin user was assigned AFTER the role was created
