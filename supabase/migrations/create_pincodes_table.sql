-- Create pincodes table in Supabase
CREATE TABLE IF NOT EXISTS pincodes (
  id BIGSERIAL PRIMARY KEY,
  pincode INTEGER NOT NULL UNIQUE,
  state TEXT,
  district TEXT,
  postal_division TEXT,
  taluk TEXT,
  delivery_available BOOLEAN NOT NULL DEFAULT false,
  cod_available BOOLEAN NOT NULL DEFAULT false,
  shipping_charge DECIMAL(10, 2),
  estimated_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_pincode ON pincodes(pincode);
CREATE INDEX IF NOT EXISTS idx_state ON pincodes(state);
CREATE INDEX IF NOT EXISTS idx_district ON pincodes(district);
CREATE INDEX IF NOT EXISTS idx_delivery_cod ON pincodes(delivery_available, cod_available);
CREATE INDEX IF NOT EXISTS idx_state_cod ON pincodes(state, cod_available);

-- Enable RLS (Row Level Security)
ALTER TABLE pincodes ENABLE ROW LEVEL SECURITY;

-- Allow public read access to pincodes
CREATE POLICY "Allow public read access" ON pincodes
  FOR SELECT
  USING (true);

-- Allow service role to insert/update (for admin functions)
CREATE POLICY "Allow service role full access" ON pincodes
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
