-- Add is_hidden column to products table
ALTER TABLE products ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE;

-- Hide all dessert_bars and chocolates products
UPDATE products SET is_hidden = TRUE WHERE category IN ('dessert_bars', 'chocolates');
