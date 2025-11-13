-- SQL Query to Find Duplicate Products
-- Copy and paste this into Supabase SQL Editor to see all duplicate product names

SELECT name, COUNT(*) as count, 
       STRING_AGG(id::text, ', ') as ids,
       MIN(created_at) as oldest_created,
       MAX(created_at) as newest_created
FROM public.products
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- ============================================
-- To DELETE duplicates (keep newest):
-- ============================================
-- Option 1: Delete a specific duplicate by ID
-- (Replace 'YOUR_ID' with the UUID you want to delete)
-- DELETE FROM public.products WHERE id = 'YOUR_ID';

-- Option 2: Delete all older duplicates (keeps newest version only)
-- WITH ranked_products AS (
--   SELECT 
--     id,
--     name,
--     ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) as rn
--   FROM public.products
-- )
-- DELETE FROM public.products 
-- WHERE id IN (SELECT id FROM ranked_products WHERE rn > 1);
