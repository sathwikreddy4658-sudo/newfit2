-- Fix product_ratings table to add missing columns and ensure proper structure

-- Check if table exists and has the right structure
-- Add the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.product_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- Enable RLS
ALTER TABLE public.product_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view all ratings" ON public.product_ratings;
CREATE POLICY "Users can view all ratings"
  ON public.product_ratings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own ratings" ON public.product_ratings;
CREATE POLICY "Users can insert their own ratings"
  ON public.product_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own ratings" ON public.product_ratings;
CREATE POLICY "Users can update their own ratings"
  ON public.product_ratings FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view and manage all ratings" ON public.product_ratings;
CREATE POLICY "Admins can view and manage all ratings"
  ON public.product_ratings
  USING ((SELECT (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin' = 'true'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_ratings_product_id ON public.product_ratings(product_id);
CREATE INDEX IF NOT EXISTS idx_product_ratings_user_id ON public.product_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_product_ratings_approved ON public.product_ratings(approved);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_product_ratings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_product_ratings_timestamp ON public.product_ratings;
CREATE TRIGGER update_product_ratings_timestamp
  BEFORE UPDATE ON public.product_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_ratings_timestamp();
