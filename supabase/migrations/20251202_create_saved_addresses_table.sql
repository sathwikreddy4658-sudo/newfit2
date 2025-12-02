-- Migration: Add saved_addresses table for user address management
-- Created: 2025-12-02

-- Create saved_addresses table
CREATE TABLE IF NOT EXISTS public.saved_addresses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL, -- e.g., "Home", "Office", "My Address 1"
  flat_no text,
  building_name text,
  street_address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  landmark text,
  phone text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_addresses_user_id ON public.saved_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_addresses_default ON public.saved_addresses(user_id, is_default);

-- Add RLS policies
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

-- Users can view their own addresses
CREATE POLICY "Users can view own saved addresses"
  ON public.saved_addresses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own addresses (max 6 check done in app)
CREATE POLICY "Users can insert own saved addresses"
  ON public.saved_addresses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own addresses
CREATE POLICY "Users can update own saved addresses"
  ON public.saved_addresses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own addresses
CREATE POLICY "Users can delete own saved addresses"
  ON public.saved_addresses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_saved_addresses_updated_at
  BEFORE UPDATE ON public.saved_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_addresses_updated_at();

-- Add constraint: only one default address per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_default_per_user 
  ON public.saved_addresses(user_id) 
  WHERE is_default = true;

-- Add comment
COMMENT ON TABLE public.saved_addresses IS 'Stores saved addresses for users. Max 6 addresses per user enforced in application.';
