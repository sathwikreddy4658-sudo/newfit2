-- Add price variants for protein bars (15g and 20g)
ALTER TABLE products
ADD COLUMN price_15g numeric,
ADD COLUMN price_20g numeric;

-- Update existing products to set default prices (assuming current price is for 15g)
UPDATE products SET price_15g = price WHERE price_15g IS NULL;
UPDATE products SET price_20g = price + 50 WHERE price_20g IS NULL; -- Assuming 20g is 50 rupees more

-- Make price_15g and price_20g required for new products
ALTER TABLE products
ALTER COLUMN price_15g SET NOT NULL,
ALTER COLUMN price_20g SET NOT NULL;
