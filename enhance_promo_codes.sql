-- ============================================================================
-- PROMO CODES TABLE FIX AND ENHANCEMENT
-- Add missing columns and compatibility for existing code
-- ============================================================================

-- Add free shipping support
ALTER TABLE public.promo_codes
ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT false;

-- Add compatibility aliases for usage columns (so both old and new names work)
-- The consolidated schema has max_uses and current_uses
-- But the component uses usage_limit and usage_count
-- We'll keep the original names and update the component instead

-- Add minimum order amount for promo codes
ALTER TABLE public.promo_codes
ADD COLUMN IF NOT EXISTS min_order_amount DECIMAL(10,2) DEFAULT 0;

-- Add description for admin reference
ALTER TABLE public.promo_codes
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add max discount amount for percentage-based codes
ALTER TABLE public.promo_codes
ADD COLUMN IF NOT EXISTS max_discount_amount DECIMAL(10,2);

-- Comments for clarity
COMMENT ON COLUMN public.promo_codes.free_shipping IS 'If true, provides free shipping instead of discount';
COMMENT ON COLUMN public.promo_codes.min_order_amount IS 'Minimum order amount required to use this promo code';
COMMENT ON COLUMN public.promo_codes.description IS 'Admin note about this promo code';
COMMENT ON COLUMN public.promo_codes.max_discount_amount IS 'Maximum discount amount for percentage-based codes';

-- Verify columns
SELECT 'Promo Codes Columns:' as check_type, column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'promo_codes'
AND column_name IN ('free_shipping', 'min_order_amount', 'description', 'max_discount_amount', 'max_uses', 'current_uses')
ORDER BY column_name;

SELECT '✅ Promo Codes Enhanced!' as status;
