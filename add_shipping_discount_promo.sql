-- Add shipping discount promo code support
-- This allows admins to create promo codes that give % discount on shipping

-- Add new columns to promo_codes table
ALTER TABLE public.promo_codes 
ADD COLUMN IF NOT EXISTS promo_type VARCHAR(20) DEFAULT 'percentage' CHECK (promo_type IN ('percentage', 'shipping_discount')),
ADD COLUMN IF NOT EXISTS shipping_discount_percentage DECIMAL(5,2) DEFAULT 0 CHECK (shipping_discount_percentage >= 0 AND shipping_discount_percentage <= 100),
ADD COLUMN IF NOT EXISTS allowed_states TEXT[], -- Array of allowed states (NULL = all states)
ADD COLUMN IF NOT EXISTS allowed_pincodes TEXT[]; -- Array of pincode patterns (NULL = all pincodes)

-- Update existing promo codes to be percentage type
UPDATE public.promo_codes 
SET promo_type = 'percentage' 
WHERE promo_type IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_promo_codes_type ON public.promo_codes(promo_type);

-- Comment on new columns
COMMENT ON COLUMN public.promo_codes.promo_type IS 'Type: percentage (product discount) or shipping_discount (shipping discount)';
COMMENT ON COLUMN public.promo_codes.shipping_discount_percentage IS 'Percentage discount on shipping charges (0-100). 100 = free shipping';
COMMENT ON COLUMN public.promo_codes.allowed_states IS 'States where promo is valid. NULL = all states';
COMMENT ON COLUMN public.promo_codes.allowed_pincodes IS 'Pincode patterns where promo is valid (e.g., 500%). NULL = all pincodes';

-- Sample: 100% shipping discount (free shipping) for Andhra Pradesh and Telangana
INSERT INTO public.promo_codes (
  code,
  discount_percentage,
  active,
  promo_type,
  shipping_discount_percentage,
  allowed_states
) VALUES (
  'APFREE',
  1, -- Minimum value to satisfy check constraint (not used for shipping_discount type)
  true,
  'shipping_discount',
  100, -- 100% off shipping = free shipping
  ARRAY['ANDHRA PRADESH', 'TELANGANA']
) ON CONFLICT (code) DO UPDATE SET
  promo_type = 'shipping_discount',
  shipping_discount_percentage = 100,
  allowed_states = ARRAY['ANDHRA PRADESH', 'TELANGANA'],
  active = true;

-- Sample: 50% shipping discount for Hyderabad
INSERT INTO public.promo_codes (
  code,
  discount_percentage,
  active,
  promo_type,
  shipping_discount_percentage,
  allowed_states,
  allowed_pincodes
) VALUES (
  'HYD50',
  1, -- Minimum value to satisfy check constraint (not used for shipping_discount type)
  true,
  'shipping_discount',
  50, -- 50% off shipping
  ARRAY['TELANGANA'],
  ARRAY['500%']
) ON CONFLICT (code) DO UPDATE SET
  promo_type = 'shipping_discount',
  shipping_discount_percentage = 50,
  allowed_states = ARRAY['TELANGANA'],
  allowed_pincodes = ARRAY['500%'],
  active = true;
