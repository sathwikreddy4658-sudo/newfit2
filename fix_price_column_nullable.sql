-- Make the main price column nullable so products can use only variant prices
ALTER TABLE products
ALTER COLUMN price DROP NOT NULL;

-- Update the comment to reflect that price is now optional
COMMENT ON COLUMN products.price IS 'Optional main price - if null, use price_15g and price_20g variants';
