-- Add guest customer information columns to orders table
-- This allows storing customer info for guest checkouts

ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Add index for customer email to help with order lookups
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);

-- Add comment for documentation
COMMENT ON COLUMN public.orders.customer_name IS 'Customer name for guest orders (overrides profile name)';
COMMENT ON COLUMN public.orders.customer_email IS 'Customer email for guest orders (overrides profile email)';
COMMENT ON COLUMN public.orders.customer_phone IS 'Customer phone for guest orders (overrides profile phone)';
