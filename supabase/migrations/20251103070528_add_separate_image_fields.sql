-- Add separate image fields for products page and cart display
ALTER TABLE public.products
ADD COLUMN products_page_image TEXT,
ADD COLUMN cart_image TEXT;

-- Update existing products to use the first image from the images array if available
UPDATE public.products
SET products_page_image = images[1]
WHERE images IS NOT NULL AND array_length(images, 1) > 0;

UPDATE public.products
SET cart_image = images[1]
WHERE images IS NOT NULL AND array_length(images, 1) > 0;
