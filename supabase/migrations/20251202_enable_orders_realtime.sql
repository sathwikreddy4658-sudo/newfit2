-- Enable Realtime for orders table to support push notifications
-- This allows the OrderNotifications component to receive instant updates when new orders are placed

-- Enable Realtime replication for the orders table
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- Grant realtime access (if not already granted)
-- This is handled by Supabase UI, but adding for completeness
COMMENT ON TABLE public.orders IS 'Orders table with realtime enabled for instant notifications';

-- Instructions:
-- After running this SQL, you also need to:
-- 1. Go to Supabase Dashboard > Database > Replication
-- 2. Find the "orders" table in the list
-- 3. Click the toggle to enable Realtime for the "orders" table
-- 4. Save changes
