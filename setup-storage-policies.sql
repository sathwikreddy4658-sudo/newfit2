-- Setup Storage Policies for blog-images bucket
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql

-- Policy 1: Allow anyone to READ (SELECT) blog images
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog-images');

-- Policy 2: Allow anyone to UPLOAD (INSERT) blog images
CREATE POLICY "Allow public insert"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'blog-images');

-- Policy 3: Allow anyone to UPDATE blog images
CREATE POLICY "Allow public update"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'blog-images')
WITH CHECK (bucket_id = 'blog-images');

-- Policy 4: Allow anyone to DELETE blog images
CREATE POLICY "Allow public delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'blog-images');
