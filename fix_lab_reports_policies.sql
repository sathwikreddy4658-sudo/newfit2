-- Fix Lab Reports Storage Policies
-- Run this in Supabase Dashboard > SQL Editor

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view lab reports files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload lab reports" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete lab reports files" ON storage.objects;

-- Create new storage policies with better error handling

-- 1. Anyone can view/download files
CREATE POLICY "Public can view lab reports files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lab-reports');

-- 2. Authenticated admins can upload
CREATE POLICY "Admins can upload lab reports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lab-reports' 
    AND auth.uid() IS NOT NULL
    AND public.has_role(auth.uid(), 'admin')
  );

-- 3. Authenticated admins can delete
CREATE POLICY "Admins can delete lab reports files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'lab-reports' 
    AND auth.uid() IS NOT NULL
    AND public.has_role(auth.uid(), 'admin')
  );

-- Alternative: If has_role() function doesn't work, use this simpler version instead
-- (Comment out the above policies and uncomment these)

/*
-- Simpler policies - allow all authenticated users
CREATE POLICY "Admins can upload lab reports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lab-reports' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Admins can delete lab reports files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'lab-reports' 
    AND auth.uid() IS NOT NULL
  );
*/

-- Verify the bucket exists and is public
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'lab-reports') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('lab-reports', 'lab-reports', true);
    RAISE NOTICE 'Created lab-reports bucket';
  ELSE
    UPDATE storage.buckets 
    SET public = true 
    WHERE id = 'lab-reports';
    RAISE NOTICE 'Updated lab-reports bucket to public';
  END IF;
END $$;

-- Check if has_role function exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'has_role'
  ) THEN
    RAISE NOTICE '⚠️ WARNING: has_role() function does not exist!';
    RAISE NOTICE 'You need to create this function or use the simpler policies above';
  ELSE
    RAISE NOTICE '✅ has_role() function exists';
  END IF;
END $$;
