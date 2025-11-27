-- Add min_quantity column to promo_codes table
ALTER TABLE public.promo_codes 
ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN public.promo_codes.min_quantity IS 'Minimum total quantity of items required in cart for promo to apply';

-- Create the HYBULK promo code
-- 100% free shipping for Hyderabad, requires 2+ items
INSERT INTO public.promo_codes (
  code,
  discount_percentage,
  promo_type,
  shipping_discount_percentage,
  allowed_states,
  allowed_pincodes,
  min_quantity,
  usage_limit,
  active
) VALUES (
  'HYBULK',
  0, -- No product discount, only shipping discount
  'shipping_discount',
  100, -- 100% off on shipping
  ARRAY['TELANGANA'], -- Hyderabad is in Telangana
  ARRAY['500%', '501%'], -- Hyderabad pincodes start with 500 and 501
  2, -- Minimum 2 items required
  NULL, -- Unlimited usage
  true
)
ON CONFLICT (code) DO UPDATE SET
  discount_percentage = EXCLUDED.discount_percentage,
  promo_type = EXCLUDED.promo_type,
  shipping_discount_percentage = EXCLUDED.shipping_discount_percentage,
  allowed_states = EXCLUDED.allowed_states,
  allowed_pincodes = EXCLUDED.allowed_pincodes,
  min_quantity = EXCLUDED.min_quantity,
  active = EXCLUDED.active;

-- Verify the promo was created
SELECT 
  code,
  promo_type,
  shipping_discount_percentage,
  allowed_states,
  allowed_pincodes,
  min_quantity,
  active
FROM public.promo_codes
WHERE code = 'HYBULK';
