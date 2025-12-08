-- IMMEDIATE FIX: Drop the broken trigger and functions that reference non-existent 'status' column
DROP TRIGGER IF EXISTS trigger_set_rating_pending_on_edit ON product_ratings CASCADE;
DROP FUNCTION IF EXISTS set_rating_pending_on_edit() CASCADE;

-- Verify the product_ratings table structure
-- SELECT * FROM information_schema.columns WHERE table_name = 'product_ratings';
