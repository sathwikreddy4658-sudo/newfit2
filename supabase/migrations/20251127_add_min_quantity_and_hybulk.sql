-- Migration: Add min_quantity to promo_codes and create HYBULK promo
-- Date: 2025-11-27
-- Purpose: Support minimum quantity requirements for promo codes

-- Step 1: Add min_quantity column to promo_codes table
ALTER TABLE public.promo_codes
ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 0;

-- Step 2: Add comment for clarity
COMMENT ON COLUMN public.promo_codes.min_quantity IS 
'Minimum number of items in cart required for this promo to apply (0 = no minimum)';

-- Step 3: Create HYBULK promo code
-- This is a 100% free shipping promo for Hyderabad with minimum 2 items
INSERT INTO public.promo_codes (
  code,
  discount_percentage,
  promo_type,
  shipping_discount_percentage,
  allowed_states,
  allowed_pincodes,
  min_quantity,
  active,
  created_at
) VALUES (
  'HYBULK',
  0,
  'shipping_discount',
  100,
  ARRAY['TELANGANA'],
  ARRAY['500%'],  -- Hyderabad pincodes start with 500 (500001-500099, 500101-500199, etc.)
  2,              -- Minimum 2 items required
  true,
  NOW()
)
ON CONFLICT (code) DO UPDATE 
SET 
  shipping_discount_percentage = 100,
  min_quantity = 2,
  active = true
WHERE promo_codes.code = 'HYBULK';

-- Step 4: Update APFREE to ensure it has no minimum quantity
UPDATE public.promo_codes
SET min_quantity = 0
WHERE code = 'APFREE';

-- Step 5: Verify the setup
SELECT 
  code,
  discount_percentage,
  promo_type,
  shipping_discount_percentage,
  min_quantity,
  allowed_states,
  allowed_pincodes,
  active
FROM public.promo_codes
WHERE code IN ('APFREE', 'HYBULK')
ORDER BY code;