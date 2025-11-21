-- Migration: Add stock status fields for variants (In Stock / Out of Stock)

-- Add stock status fields for 15g and 20g variants
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS stock_status_15g BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS stock_status_20g BOOLEAN DEFAULT true;

-- Add comments for clarity
COMMENT ON COLUMN public.products.stock_status_15g IS 'Stock status for 15g variant - true = In Stock, false = Out of Stock';
COMMENT ON COLUMN public.products.stock_status_20g IS 'Stock status for 20g variant - true = In Stock, false = Out of Stock';
