-- Fix pincode import issues - Choose ONE of the solutions below

-- ============================================================================
-- SOLUTION 1: Clear existing data before import (RECOMMENDED for fresh start)
-- ============================================================================
-- Use this if you want to replace all existing pincode data

TRUNCATE TABLE public.pincodes RESTART IDENTITY CASCADE;

-- After running this, you can import your CSV through Supabase's import feature


-- ============================================================================
-- SOLUTION 2: Import with UPSERT (update existing, insert new)
-- ============================================================================
-- If you want to keep existing data and update/add from CSV:
-- 
-- 1. First, create a temporary table to load your CSV:

CREATE TEMP TABLE pincodes_temp (
    pincode INTEGER,
    state TEXT,
    district TEXT,
    delivery TEXT,
    cod TEXT
);

-- 2. Import your CSV into pincodes_temp using Supabase's import feature
--    (Table Editor → Import data → select pincodes_temp)

-- 3. Then run this to deduplicate and merge into main table:

-- Remove duplicates from temp table (keep first occurrence)
DELETE FROM pincodes_temp a USING pincodes_temp b
WHERE a.ctid < b.ctid 
  AND a.pincode = b.pincode;

-- Insert or update from temp table
INSERT INTO public.pincodes (pincode, state, district, delivery, cod, delivery_available, cod_available)
SELECT 
    pincode,
    state,
    district,
    delivery,
    cod,
    CASE WHEN delivery = 'Y' THEN true ELSE false END as delivery_available,
    CASE WHEN cod = 'Y' THEN true ELSE false END as cod_available
FROM pincodes_temp
ON CONFLICT (pincode) 
DO UPDATE SET
    state = EXCLUDED.state,
    district = EXCLUDED.district,
    delivery = EXCLUDED.delivery,
    cod = EXCLUDED.cod,
    delivery_available = EXCLUDED.delivery_available,
    cod_available = EXCLUDED.cod_available,
    updated_at = NOW();

-- 4. Clean up temp table
DROP TABLE pincodes_temp;


-- ============================================================================
-- SOLUTION 3: Check what data already exists
-- ============================================================================
-- Use this to see what's currently in your table

SELECT COUNT(*) as total_pincodes,
       COUNT(DISTINCT pincode) as unique_pincodes
FROM public.pincodes;

-- See sample of existing data
SELECT * FROM public.pincodes LIMIT 10;
