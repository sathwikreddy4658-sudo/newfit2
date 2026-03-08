-- Comprehensive setup to ensure guest orders support is properly configured

-- 1. Make user_id nullable if not already
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add guest customer information columns if they don't exist
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS shipping_charge DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cod_charge DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_applied DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_total DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 3. Create indexes for guest order lookups
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON public.orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- 4. Ensure RLS is enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 5. Drop ALL existing RLS policies on orders table to start fresh
DROP POLICY IF EXISTS "Allow updating customer info and pricing on pending orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update customer info on pending orders" ON public.orders;
DROP POLICY IF EXISTS "Allow guest and user order updates during checkout" ON public.orders;
DROP POLICY IF EXISTS "Orders are viewable by users and admins" ON public.orders;
DROP POLICY IF EXISTS "Allow guest order reads" ON public.orders;
DROP POLICY IF EXISTS "Users can read their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;

-- 6. CREATE SELECT POLICY - Allow admins to read all orders + users to read their own
CREATE POLICY "Admins can view all orders, users can view their own"
ON public.orders
FOR SELECT
USING (
  -- Admins can see all orders (using user_roles table)
  (SELECT COUNT(*) > 0 FROM public.user_roles 
   WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
  -- OR users can see their own orders
  OR auth.uid() = user_id
  -- NOTE: Guest orders (user_id IS NULL) are only viewable by admins
);

-- 7. CREATE UPDATE POLICY - Allow users to update pending orders + guests to update theirs
CREATE POLICY "Users and guests can update pending orders during checkout"
ON public.orders
FOR UPDATE
USING (
  status = 'pending' AND (
    -- Authenticated user updating their own order
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    -- Anonymous/guest updating a guest order (user_id is NULL)
    (user_id IS NULL)
  )
)
WITH CHECK (
  status = 'pending' AND (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    (user_id IS NULL)
  )
);

-- 8. CREATE INSERT POLICY - Allow users and guests to create orders
CREATE POLICY "Users and guests can create orders"
ON public.orders
FOR INSERT
WITH CHECK (
  user_id IS NULL OR
  auth.uid() = user_id
);

-- 9. Add comments for clarity
COMMENT ON COLUMN public.orders.customer_name IS 'Customer name for all orders (guest provided or from profile)';
COMMENT ON COLUMN public.orders.customer_email IS 'Customer email for all orders (guest provided or from profile)';
COMMENT ON COLUMN public.orders.customer_phone IS 'Customer phone for all orders (guest provided or from profile)';
COMMENT ON POLICY "Admins can view all orders, users can view their own" ON public.orders IS 
  'Admins can see all orders including guest orders; User can only see their own orders';
COMMENT ON POLICY "Users and guests can update pending orders during checkout" ON public.orders IS 
  'Allows authenticated users to update their own pending orders and guests to update guest orders during checkout';
COMMENT ON POLICY "Users and guests can create orders" ON public.orders IS 
  'Allows both authenticated users and guests to create new orders';

-- 10. Verification query to show the final schema
SELECT 
  'Orders table schema verification:' AS verification_type,
  ARRAY[
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_name') THEN '✅ customer_name' ELSE '❌ customer_name' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_email') THEN '✅ customer_email' ELSE '❌ customer_email' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_phone') THEN '✅ customer_phone' ELSE '❌ customer_phone' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='user_id' AND is_nullable='YES') THEN '✅ user_id IS NULLABLE' ELSE '❌ user_id still NOT NULL' END,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='orders' AND constraint_type='UNIQUE' AND constraint_name LIKE '%idx_orders%') THEN '✅ Indexes exist' ELSE '❌ Indexes missing' END
  ] AS columns_status;

-- 11. Show current RLS policies
SELECT 'RLS Policies for orders table:' AS section;
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY policyname;

-- 12. Summary message
SELECT 'Setup Complete!
✅ user_id is now nullable for guest orders
✅ customer_name, customer_email, customer_phone columns added
✅ RLS policies updated to allow:
   - Admins to read ALL orders (including guest orders)
   - Users to read their own orders
   - Users and guests to create and update pending orders
✅ Indexes created for order lookups

IMPORTANT: Make sure your admin user has the "admin" role assigned in the user_roles table.' AS setup_summary;
