-- Add missing columns to products table for product management form
-- These columns are needed for the admin product creation form to work

-- Add cart_image and products_page_image columns if they don't exist
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS products_page_image TEXT,
ADD COLUMN IF NOT EXISTS cart_image TEXT;

-- The price_15g and price_20g columns should already exist from the previous migration
-- If they don't, add them here:
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS price_15g DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_20g DECIMAL(10,2);

-- For existing products that have price_15g and price_20g as NULL, set them from the price column
UPDATE public.products 
SET price_15g = COALESCE(price, 100)
WHERE price_15g IS NULL;

UPDATE public.products 
SET price_20g = COALESCE(price, 100) + 50
WHERE price_20g IS NULL;

-- Now make price_15g and price_20g NOT NULL
ALTER TABLE public.products
ALTER COLUMN price_15g SET NOT NULL,
ALTER COLUMN price_20g SET NOT NULL;
