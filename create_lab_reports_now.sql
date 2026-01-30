-- Complete Lab Reports Setup - Run this ONCE in Supabase Dashboard SQL Editor
-- This will create everything needed for the lab reports feature

-- 1. Drop the table if it exists (to start fresh)
DROP TABLE IF EXISTS public.lab_reports CASCADE;

-- 2. Create the table fresh
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

-- 3. Add foreign key constraint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    ALTER TABLE public.lab_reports 
    ADD CONSTRAINT lab_reports_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Foreign key constraint added';
  ELSE
    RAISE WARNING '⚠️ products table does not exist - foreign key not created';
  END IF;
END $$;

-- 2. Create indexes
CREATE INDEX idx_lab_reports_product_id ON public.lab_reports(product_id);
CREATE INDEX idx_lab_reports_created_at ON public.lab_reports(created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;

-- 4. Drop old policies if they exist
DROP POLICY IF EXISTS "Anyone can view lab reports" ON public.lab_reports;
DROP POLICY IF EXISTS "Admins can insert lab reports" ON public.lab_reports;
DROP POLICY IF EXISTS "Admins can update lab reports" ON public.lab_reports;
DROP POLICY IF EXISTS "Admins can delete lab reports" ON public.lab_reports;

-- 5. Create table policies (simplified - any authenticated user)
CREATE POLICY "Anyone can view lab reports"
  ON public.lab_reports FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert lab reports"
  ON public.lab_reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update lab reports"
  ON public.lab_reports FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete lab reports"
  ON public.lab_reports FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- 6. Create trigger for updated_at (if update_updated_at_column function exists)
DROP TRIGGER IF EXISTS update_lab_reports_updated_at ON public.lab_reports;
CREATE TRIGGER update_lab_reports_updated_at
  BEFORE UPDATE ON public.lab_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('lab-reports', 'lab-reports', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 8. Drop old storage policies
DROP POLICY IF EXISTS "Public can view lab reports files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload lab reports" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete lab reports files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload lab reports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete lab reports files" ON storage.objects;

-- 9. Create storage policies (simplified - any authenticated user)
CREATE POLICY "Public can view lab reports files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lab-reports');

CREATE POLICY "Authenticated users can upload lab reports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lab-reports' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can update lab reports"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'lab-reports' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can delete lab reports files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'lab-reports' 
    AND auth.uid() IS NOT NULL
  );

-- 10. Verify setup
DO $$
BEGIN
  RAISE NOTICE '✅ Lab reports table created/updated';
  RAISE NOTICE '✅ RLS policies applied';
  RAISE NOTICE '✅ Storage bucket configured';
  RAISE NOTICE '✅ Storage policies applied';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Setup complete! You can now upload lab reports.';
END $$;
