-- Create product_faqs table for managing FAQ section on product pages
CREATE TABLE IF NOT EXISTS product_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_product_faqs_product_id ON product_faqs(product_id);
CREATE INDEX IF NOT EXISTS idx_product_faqs_display_order ON product_faqs(display_order);

-- Enable RLS
ALTER TABLE product_faqs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read product FAQs" ON product_faqs;
DROP POLICY IF EXISTS "Admins can insert product FAQs" ON product_faqs;
DROP POLICY IF EXISTS "Admins can update product FAQs" ON product_faqs;
DROP POLICY IF EXISTS "Admins can delete product FAQs" ON product_faqs;

-- Allow anyone to read FAQs
CREATE POLICY "Anyone can read product FAQs"
  ON product_faqs
  FOR SELECT
  USING (true);

-- Only authenticated admins can insert FAQs
CREATE POLICY "Admins can insert product FAQs"
  ON product_faqs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Only authenticated admins can update FAQs
CREATE POLICY "Admins can update product FAQs"
  ON product_faqs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Only authenticated admins can delete FAQs
CREATE POLICY "Admins can delete product FAQs"
  ON product_faqs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Add trigger for updated_at
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
