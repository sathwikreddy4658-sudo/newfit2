-- Make price column nullable to allow products without a main price
-- Products will rely on price_15g and price_20g instead

ALTER TABLE public.products
ALTER COLUMN price DROP NOT NULL;

-- Verify the change
-- SELECT column_name, is_nullable, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'products' AND column_name = 'price';
