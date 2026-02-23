-- Diagnostic: Check products and cart integrity

-- 1. List all products in the database
SELECT 
    id,
    name,
    stock,
    price,
    hidden,
    created_at
FROM public.products
ORDER BY name;

-- 2. Check if there are any orders with order_items that reference non-existent products
SELECT 
    oi.id as order_item_id,
    oi.order_id,
    oi.product_id,
    oi.product_name,
    CASE 
        WHEN p.id IS NULL THEN 'MISSING - Product does not exist!'
        ELSE 'OK - Product exists'
    END as product_status
FROM public.order_items oi
LEFT JOIN public.products p ON oi.product_id = p.id
WHERE p.id IS NULL
LIMIT 50;

-- 3. Check products that might have been soft-deleted (hidden)
SELECT 
    id,
    name,
    stock,
    hidden,
    'This product is hidden but still exists' as status
FROM public.products
WHERE hidden = true
ORDER BY name;

-- 4. Verify the product_id foreign key constraint exists
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'order_items'
    AND kcu.column_name = 'product_id';

-- 5. Simple test: Try to get products by common testing IDs
-- (This helps identify if the issue is with specific products)
SELECT 
    'Testing product existence' as test_name,
    COUNT(*) as total_products,
    COUNT(CASE WHEN hidden = false THEN 1 END) as visible_products,
    COUNT(CASE WHEN hidden = true THEN 1 END) as hidden_products,
    COUNT(CASE WHEN stock > 0 THEN 1 END) as in_stock_products
FROM public.products;
