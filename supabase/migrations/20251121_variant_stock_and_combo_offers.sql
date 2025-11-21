-- Migration: Add variant-specific stock management and combo pack offers

-- 1) Add columns for variant-specific stock (15g, 20g)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS stock_15g INTEGER DEFAULT 0 CHECK (stock_15g >= 0),
ADD COLUMN IF NOT EXISTS stock_20g INTEGER DEFAULT 0 CHECK (stock_20g >= 0);

-- 2) Add combo pack offer configuration (percentage discount for 3-packs and 6-packs)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS combo_3_discount DECIMAL(5,2) DEFAULT 5,
ADD COLUMN IF NOT EXISTS combo_6_discount DECIMAL(5,2) DEFAULT 7;

-- 3) Create combo_pack_offers table for global configuration (admin can set default rates)
CREATE TABLE IF NOT EXISTS public.combo_pack_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_type VARCHAR(10) NOT NULL UNIQUE, -- '3pack' or '6pack'
  discount_percentage DECIMAL(5,2) NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  description TEXT,
  active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add some default combo offers
INSERT INTO public.combo_pack_offers (combo_type, discount_percentage, description)
VALUES 
  ('3pack', 5, '3 bars combo - 5% discount'),
  ('6pack', 7, '6 bars combo - 7% discount')
ON CONFLICT (combo_type) DO NOTHING;

-- 4) Enable RLS on combo_pack_offers
ALTER TABLE public.combo_pack_offers ENABLE ROW LEVEL SECURITY;

-- 5) RLS Policies for combo_pack_offers
-- Allow admins to update combo offers
CREATE POLICY "Admins can view combo offers"
  ON public.combo_pack_offers FOR SELECT
  USING (true); -- Anyone can view

CREATE POLICY "Admins can update combo offers"
  ON public.combo_pack_offers FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6) Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_combo_pack_offers_type ON public.combo_pack_offers(combo_type);

-- 7) Update order_items to track which variant was purchased
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS product_variant VARCHAR(10) DEFAULT '15g',
ADD COLUMN IF NOT EXISTS combo_pack INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS discount_applied DECIMAL(5,2) DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.products.stock_15g IS 'Stock for 15g variant';
COMMENT ON COLUMN public.products.stock_20g IS 'Stock for 20g variant';
COMMENT ON COLUMN public.products.combo_3_discount IS 'Discount percentage for 3-pack (configurable per product)';
COMMENT ON COLUMN public.products.combo_6_discount IS 'Discount percentage for 6-pack (configurable per product)';
COMMENT ON TABLE public.combo_pack_offers IS 'Global combo pack offer configuration that admins can manage';
