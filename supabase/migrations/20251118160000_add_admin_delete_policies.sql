-- Add DELETE policies for admins to manage orders and order_items
-- This allows admins to delete orders and their associated items

-- Drop existing delete policies if they exist (in case they were created with wrong criteria)
DROP POLICY IF EXISTS "Admins can delete all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete all order_items" ON public.order_items;

-- Create DELETE policy for orders table
CREATE POLICY "Admins can delete all orders" 
  ON public.orders 
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create DELETE policy for order_items table  
CREATE POLICY "Admins can delete all order_items"
  ON public.order_items
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Grant necessary permissions (if not already granted)
-- Note: RLS policies already handle the security, but explicit grants ensure compatibility
GRANT DELETE ON public.orders TO authenticated;
GRANT DELETE ON public.order_items TO authenticated;
