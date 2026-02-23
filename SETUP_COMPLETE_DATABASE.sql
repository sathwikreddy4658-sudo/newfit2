-- ============================================================================
-- COMPLETE DATABASE SETUP FOR NEW SUPABASE PROJECT
-- Run this ENTIRE script in Supabase SQL Editor
-- This will add all missing columns and tables that weren't in consolidated schema
-- ============================================================================

-- ============================================================================
-- STEP 1: Add missing columns to products table
-- ============================================================================

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS combo_3_discount DECIMAL(5,2) DEFAULT 5 CHECK (combo_3_discount >= 0 AND combo_3_discount <= 100);

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS combo_6_discount DECIMAL(5,2) DEFAULT 7 CHECK (combo_6_discount >= 0 AND combo_6_discount <= 100);

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS stock_status_15g BOOLEAN DEFAULT true;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS stock_status_20g BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.products.combo_3_discount IS 'Discount percentage when buying 3+ items';
COMMENT ON COLUMN public.products.combo_6_discount IS 'Discount percentage when buying 6+ items';
COMMENT ON COLUMN public.products.stock_status_15g IS 'Stock status for 15g variant';
COMMENT ON COLUMN public.products.stock_status_20g IS 'Stock status for 20g variant';

-- ============================================================================
-- STEP 2: Create product_faqs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.product_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_product_faqs_product_id ON product_faqs(product_id);
CREATE INDEX IF NOT EXISTS idx_product_faqs_display_order ON product_faqs(display_order);

ALTER TABLE product_faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read product FAQs" ON product_faqs;
DROP POLICY IF EXISTS "Admins can insert product FAQs" ON product_faqs;
DROP POLICY IF EXISTS "Admins can update product FAQs" ON product_faqs;
DROP POLICY IF EXISTS "Admins can delete product FAQs" ON product_faqs;

CREATE POLICY "Anyone can read product FAQs"
  ON product_faqs FOR SELECT USING (true);

CREATE POLICY "Admins can insert product FAQs"
  ON product_faqs FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update product FAQs"
  ON product_faqs FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete product FAQs"
  ON product_faqs FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION update_product_faqs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_product_faqs_timestamp ON product_faqs;

CREATE TRIGGER update_product_faqs_timestamp
  BEFORE UPDATE ON product_faqs
  FOR EACH ROW
  EXECUTE FUNCTION update_product_faqs_updated_at();

-- ============================================================================
-- STEP 3: Create lab_reports table
-- ============================================================================

DROP TABLE IF EXISTS public.lab_reports CASCADE;

CREATE TABLE public.lab_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  test_type TEXT,
  test_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key if products table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    ALTER TABLE public.lab_reports 
    ADD CONSTRAINT lab_reports_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX idx_lab_reports_product_id ON public.lab_reports(product_id);
CREATE INDEX idx_lab_reports_created_at ON public.lab_reports(created_at DESC);

ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view lab reports" ON public.lab_reports;
DROP POLICY IF EXISTS "Authenticated users can insert lab reports" ON public.lab_reports;
DROP POLICY IF EXISTS "Authenticated users can update lab reports" ON public.lab_reports;
DROP POLICY IF EXISTS "Authenticated users can delete lab reports" ON public.lab_reports;

CREATE POLICY "Anyone can view lab reports"
  ON public.lab_reports FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert lab reports"
  ON public.lab_reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update lab reports"
  ON public.lab_reports FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete lab reports"
  ON public.lab_reports FOR DELETE
  USING (auth.uid() IS NOT NULL);

DROP TRIGGER IF EXISTS update_lab_reports_updated_at ON public.lab_reports;

CREATE TRIGGER update_lab_reports_updated_at
  BEFORE UPDATE ON public.lab_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 4: Create lab-reports storage bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('lab-reports', 'lab-reports', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can view lab reports files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload lab reports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update lab reports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete lab reports files" ON storage.objects;

CREATE POLICY "Public can view lab reports files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lab-reports');

CREATE POLICY "Authenticated users can upload lab reports"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'lab-reports' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update lab reports"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'lab-reports' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete lab reports files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'lab-reports' AND auth.uid() IS NOT NULL);

-- ============================================================================
-- STEP 5: Create blog-images storage bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete blog images" ON storage.objects;

CREATE POLICY "Public can view blog images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-images');

CREATE POLICY "Authenticated users can upload blog images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'blog-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update blog images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'blog-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete blog images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'blog-images' AND auth.uid() IS NOT NULL);

-- ============================================================================
-- STEP 6: Enhance promo_codes table with free shipping support
-- Promo codes can now provide:
--   - Discount only (discount_percentage > 0, free_shipping = false)
--   - Free shipping only (free_shipping = true, discount_percentage = 0)
--   - BOTH discount + free shipping (free_shipping = true, discount_percentage > 0)
-- ============================================================================

ALTER TABLE public.promo_codes
ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT false;

ALTER TABLE public.promo_codes
ADD COLUMN IF NOT EXISTS min_order_amount DECIMAL(10,2) DEFAULT 0;

ALTER TABLE public.promo_codes
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.promo_codes
ADD COLUMN IF NOT EXISTS max_discount_amount DECIMAL(10,2);

COMMENT ON COLUMN public.promo_codes.free_shipping IS 'If true, provides free shipping (can be combined with discount)';
COMMENT ON COLUMN public.promo_codes.min_order_amount IS 'Minimum order amount required to use this promo code';
COMMENT ON COLUMN public.promo_codes.description IS 'Admin note about this promo code';
COMMENT ON COLUMN public.promo_codes.max_discount_amount IS 'Maximum discount amount for percentage-based codes';

-- ============================================================================
-- STEP 7: Create saved_addresses table for user address management
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.saved_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  flat_no TEXT,
  building_name TEXT,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  landmark TEXT,
  phone TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_addresses_user_id ON public.saved_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_addresses_default ON public.saved_addresses(user_id, is_default);

ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own saved addresses" ON public.saved_addresses;
DROP POLICY IF EXISTS "Users can insert own saved addresses" ON public.saved_addresses;
DROP POLICY IF EXISTS "Users can update own saved addresses" ON public.saved_addresses;
DROP POLICY IF EXISTS "Users can delete own saved addresses" ON public.saved_addresses;

CREATE POLICY "Users can view own saved addresses"
  ON public.saved_addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved addresses"
  ON public.saved_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved addresses"
  ON public.saved_addresses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved addresses"
  ON public.saved_addresses FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_saved_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_saved_addresses_updated_at ON public.saved_addresses;

CREATE TRIGGER trigger_update_saved_addresses_updated_at
  BEFORE UPDATE ON public.saved_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_addresses_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_default_per_user 
  ON public.saved_addresses(user_id) 
  WHERE is_default = true;

COMMENT ON TABLE public.saved_addresses IS 'Stores saved addresses for users. Max 6 addresses per user enforced in application.';

-- ============================================================================
-- STEP 8: Create pincodes table for delivery serviceability
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pincodes (
  id BIGSERIAL PRIMARY KEY,
  pincode INTEGER NOT NULL UNIQUE,
  state TEXT NOT NULL,
  district TEXT,
  delivery TEXT NOT NULL,
  cod TEXT NOT NULL,
  delivery_available BOOLEAN DEFAULT FALSE,
  cod_available BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pincodes_pincode ON public.pincodes(pincode);
CREATE INDEX IF NOT EXISTS idx_pincodes_state ON public.pincodes(state);
CREATE INDEX IF NOT EXISTS idx_pincodes_delivery ON public.pincodes(delivery_available);

ALTER TABLE public.pincodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.pincodes;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.pincodes;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.pincodes;

CREATE POLICY "Allow public read access" ON public.pincodes
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert" ON public.pincodes
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated update" ON public.pincodes
  FOR UPDATE
  USING (auth.role() = 'authenticated');

GRANT SELECT ON public.pincodes TO anon;
GRANT SELECT ON public.pincodes TO authenticated;
GRANT ALL ON public.pincodes TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.pincodes_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.pincodes_id_seq TO authenticated;

COMMENT ON TABLE public.pincodes IS 'Stores pincode serviceability data. Delivery=Y means deliverable, COD=Y means COD available.';

-- ============================================================================
-- VERIFICATION: Check everything was created
-- ============================================================================

-- Check products columns
SELECT 'Products Columns:' as check_type, column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products' 
AND column_name IN ('combo_3_discount', 'combo_6_discount', 'stock_status_15g', 'stock_status_20g')
ORDER BY column_name;

-- Check tables exist
SELECT 'Tables Created:' as check_type, 
  (SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_faqs')) as product_faqs_exists,
  (SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lab_reports')) as lab_reports_exists,
  (SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_addresses')) as saved_addresses_exists,
  (SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pincodes')) as pincodes_exists;

-- Check storage buckets
SELECT 'Storage Buckets:' as check_type, id, name, public FROM storage.buckets WHERE id IN ('lab-reports', 'blog-images');

-- Check promo codes columns
SELECT 'Promo Codes Columns:' as check_type, column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'promo_codes'
AND column_name IN ('free_shipping', 'min_order_amount', 'description', 'max_discount_amount')
ORDER BY column_name;

-- All done!
SELECT '✅ Setup Complete!' as status;

-- ============================================================================
-- IMPORTANT: Load Pincode Data After This Script
-- ============================================================================
-- The pincodes table is created but empty. You need to import CSV data:
--
-- METHOD 1 - CSV Import (Recommended):
-- 1. Go to Table Editor → pincodes table
-- 2. Click "Import data" → "CSV"
-- 3. Upload "Complete_All_States_Combined_Pincodes.csv" file (~74,000 rows)
-- 4. Map columns: Pincode→pincode, State→state, District→district, Delivery→delivery, COD→cod
-- 5. Click Import (takes 2-3 minutes)
--
-- ⚠️ IMPORTANT: Use "Complete_All_States_Combined_Pincodes.csv" NOT "shipneer pincodes.csv"
--    The Complete file has State and District columns needed for shipping calculations!
--
-- METHOD 2 - Manual SQL Insert (for quick testing):
-- INSERT INTO pincodes (pincode, state, district, delivery, cod)
-- VALUES 
--   (560001, 'KARNATAKA', 'Bangalore', 'Y', 'Y'),
--   (560002, 'KARNATAKA', 'Bangalore', 'Y', 'Y'),
--   (500067, 'TELANGANA', 'Hyderabad', 'Y', 'Y'),
--   (110001, 'DELHI', 'New Delhi', 'Y', 'Y'),
--   (400001, 'MAHARASHTRA', 'Mumbai', 'Y', 'Y');
--
-- Verify data loaded:
-- SELECT COUNT(*) as total_pincodes FROM pincodes;
-- SELECT COUNT(*) as deliverable FROM pincodes WHERE delivery = 'Y';
-- SELECT * FROM pincodes WHERE pincode = 560001;
-- ============================================================================
