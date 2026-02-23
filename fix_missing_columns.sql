-- Add missing columns to products table
-- Run this in Supabase SQL Editor

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS combo_3_discount DECIMAL(5,2) DEFAULT 0 CHECK (combo_3_discount >= 0 AND combo_3_discount <= 100);

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS combo_6_discount DECIMAL(5,2) DEFAULT 0 CHECK (combo_6_discount >= 0 AND combo_6_discount <= 100);

-- Verify columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products' 
AND column_name IN ('combo_3_discount', 'combo_6_discount');
