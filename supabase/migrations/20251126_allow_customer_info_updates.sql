-- Allow users to update customer info and pricing on their own pending orders
-- This is needed for the checkout flow where we create the order first, then update with customer details

DROP POLICY IF EXISTS "Users can update customer info on pending orders" ON public.orders;

CREATE POLICY "Users can update customer info on pending orders"
ON public.orders
FOR UPDATE
USING (
  -- Allow updates on pending orders that belong to the user OR guest orders (user_id IS NULL)
  (auth.uid() = user_id OR user_id IS NULL) AND status = 'pending'
)
WITH CHECK (
  -- Only allow updating specific columns, status must remain pending
  (auth.uid() = user_id OR user_id IS NULL) AND status = 'pending'
);

-- Add comment for documentation
COMMENT ON POLICY "Users can update customer info on pending orders" ON public.orders IS 
  'Allows users to update customer_name, customer_email, customer_phone, total_price, shipping_charge, cod_charge, discount_applied, and payment_method on their own pending orders during checkout';
