-- Add location-based free shipping promo code support

-- First, check and add max_uses column if it doesn't exist (fallback for different schema versions)
ALTER TABLE public.promo_codes 
ADD COLUMN IF NOT EXISTS max_uses INTEGER;

-- Add new columns to promo_codes table
ALTER TABLE public.promo_codes 
ADD COLUMN IF NOT EXISTS promo_type VARCHAR(20) DEFAULT 'percentage' CHECK (promo_type IN ('percentage', 'free_shipping')),
ADD COLUMN IF NOT EXISTS allowed_states TEXT[], -- Array of allowed states
ADD COLUMN IF NOT EXISTS allowed_pincodes TEXT[]; -- Array of allowed pincode patterns

-- Update existing promo codes to be percentage type
UPDATE public.promo_codes 
SET promo_type = 'percentage' 
WHERE promo_type IS NULL;

-- Create index for faster state/pincode lookups
CREATE INDEX IF NOT EXISTS idx_promo_codes_type ON public.promo_codes(promo_type);

-- Comment on new columns
COMMENT ON COLUMN public.promo_codes.promo_type IS 'Type of promo code: percentage (discount) or free_shipping';
COMMENT ON COLUMN public.promo_codes.allowed_states IS 'Array of state names where promo is valid. NULL = all states';
COMMENT ON COLUMN public.promo_codes.allowed_pincodes IS 'Array of pincode patterns (e.g., 500%, 520%). NULL = all pincodes';

-- Insert sample free shipping promo for Andhra Pradesh and Telangana
INSERT INTO public.promo_codes (
  code,
  discount_percentage,
  active,
  max_uses,
  promo_type,
  allowed_states
) VALUES (
  'APFREE',
  0, -- Not used for free shipping
  true,
  1000,
  'free_shipping',
  ARRAY['ANDHRA PRADESH', 'TELANGANA']
) ON CONFLICT (code) DO UPDATE SET
  promo_type = 'free_shipping',
  allowed_states = ARRAY['ANDHRA PRADESH', 'TELANGANA'],
  active = true;

-- Insert another variant for Hyderabad specifically
INSERT INTO public.promo_codes (
  code,
  discount_percentage,
  active,
  max_uses,
  promo_type,
  allowed_states,
  allowed_pincodes
) VALUES (
  'HYDFREE',
  0,
  true,
  500,
  'free_shipping',
  ARRAY['TELANGANA'],
  ARRAY['500%'] -- Matches all Hyderabad pincodes (500xxx)
) ON CONFLICT (code) DO UPDATE SET
  promo_type = 'free_shipping',
  allowed_states = ARRAY['TELANGANA'],
  allowed_pincodes = ARRAY['500%'],
  active = true;
