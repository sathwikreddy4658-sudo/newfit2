-- Create pincodes table for Shipneer delivery data
CREATE TABLE IF NOT EXISTS public.pincodes (
  id BIGSERIAL PRIMARY KEY,
  pincode INTEGER NOT NULL UNIQUE,
  state TEXT NOT NULL,
  district TEXT,
  delivery TEXT NOT NULL,
  cod TEXT NOT NULL,
  delivery_available BOOLEAN DEFAULT FALSE,
  cod_available BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_pincodes_pincode ON public.pincodes(pincode);
CREATE INDEX IF NOT EXISTS idx_pincodes_state ON public.pincodes(state);
CREATE INDEX IF NOT EXISTS idx_pincodes_delivery ON public.pincodes(delivery_available);

-- Enable Row Level Security
ALTER TABLE public.pincodes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON public.pincodes
  FOR SELECT
  USING (true);

-- Create policy to allow authenticated users to insert/update
CREATE POLICY "Allow authenticated insert" ON public.pincodes
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow authenticated update" ON public.pincodes
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT ON public.pincodes TO anon;
GRANT SELECT ON public.pincodes TO authenticated;
GRANT ALL ON public.pincodes TO service_role;
GRANT USAGE ON SEQUENCE public.pincodes_id_seq TO anon;
GRANT USAGE ON SEQUENCE public.pincodes_id_seq TO authenticated;
