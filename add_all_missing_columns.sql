-- Add ALL missing columns to products table
-- Run this in Supabase SQL Editor to fix 400 errors

-- Add combo discount columns
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS combo_3_discount DECIMAL(5,2) DEFAULT 5 CHECK (combo_3_discount >= 0 AND combo_3_discount <= 100);

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS combo_6_discount DECIMAL(5,2) DEFAULT 7 CHECK (combo_6_discount >= 0 AND combo_6_discount <= 100);

-- Add stock status columns for variants
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS stock_status_15g BOOLEAN DEFAULT true;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS stock_status_20g BOOLEAN DEFAULT true;

-- Add comments for clarity
COMMENT ON COLUMN public.products.combo_3_discount IS 'Discount percentage when buying 3+ items';
COMMENT ON COLUMN public.products.combo_6_discount IS 'Discount percentage when buying 6+ items';
COMMENT ON COLUMN public.products.stock_status_15g IS 'Stock status for 15g variant - true = In Stock, false = Out of Stock';
COMMENT ON COLUMN public.products.stock_status_20g IS 'Stock status for 20g variant - true = In Stock, false = Out of Stock';

-- Verify all columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products' 
AND column_name IN ('combo_3_discount', 'combo_6_discount', 'stock_status_15g', 'stock_status_20g')
ORDER BY column_name;
