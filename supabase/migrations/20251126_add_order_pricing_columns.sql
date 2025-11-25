-- Add pricing breakdown columns to orders table for admin visibility

-- Add payment_method column if it doesn't exist
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Add shipping charge column (nullable since old orders won't have it)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_charge DECIMAL(10,2) DEFAULT 0 CHECK (shipping_charge >= 0);

-- Add COD charge column (nullable since old orders won't have it)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS cod_charge DECIMAL(10,2) DEFAULT 0 CHECK (cod_charge >= 0);

-- Add discount applied column at order level (nullable since old orders won't have it)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS discount_applied DECIMAL(10,2) DEFAULT 0 CHECK (discount_applied >= 0);

-- Add comments for clarity
COMMENT ON COLUMN public.orders.payment_method IS 'Payment method used for this order (cod/online)';
COMMENT ON COLUMN public.orders.shipping_charge IS 'Shipping charge applied to this order (after any shipping discount)';
COMMENT ON COLUMN public.orders.cod_charge IS 'Cash on Delivery charge applied to this order (if COD selected)';
COMMENT ON COLUMN public.orders.discount_applied IS 'Total product discount applied to this order';
