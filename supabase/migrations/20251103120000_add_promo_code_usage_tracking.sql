-- Add usage tracking columns to promo_codes table
ALTER TABLE promo_codes
ADD COLUMN usage_limit INTEGER,
ADD COLUMN usage_count INTEGER DEFAULT 0;

-- Create promo_code_usage table to track individual usages
CREATE TABLE promo_code_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(promo_code_id, order_id)
);

-- Create indexes for better performance
CREATE INDEX idx_promo_code_usage_promo_code_id ON promo_code_usage(promo_code_id);
CREATE INDEX idx_promo_code_usage_user_id ON promo_code_usage(user_id);
CREATE INDEX idx_promo_code_usage_order_id ON promo_code_usage(order_id);

-- Enable RLS on promo_code_usage
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for promo_code_usage
CREATE POLICY "Allow admins to view promo code usage" ON promo_code_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::public.app_role
    )
  );

CREATE POLICY "Allow users to view their own promo code usage" ON promo_code_usage
  FOR SELECT USING (user_id = auth.uid());

-- Function to update promo code usage count
CREATE OR REPLACE FUNCTION update_promo_code_usage_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the usage count in promo_codes table
  UPDATE promo_codes
  SET usage_count = (
    SELECT COUNT(*)
    FROM promo_code_usage
    WHERE promo_code_id = COALESCE(NEW.promo_code_id, OLD.promo_code_id)
  )
  WHERE id = COALESCE(NEW.promo_code_id, OLD.promo_code_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to update usage count when promo_code_usage changes
CREATE TRIGGER update_promo_code_usage_count_trigger
  AFTER INSERT OR DELETE ON promo_code_usage
  FOR EACH ROW EXECUTE FUNCTION update_promo_code_usage_count();

-- Function to check if promo code can be used
CREATE OR REPLACE FUNCTION can_use_promo_code(promo_code_text TEXT, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  promo_record RECORD;
  user_usage_count INTEGER;
BEGIN
  -- Get promo code details
  SELECT * INTO promo_record
  FROM promo_codes
  WHERE code = UPPER(promo_code_text) AND active = true;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check usage limit if set
  IF promo_record.usage_limit IS NOT NULL THEN
    IF promo_record.usage_count >= promo_record.usage_limit THEN
      RETURN FALSE;
    END IF;
  END IF;

  -- Check if user has already used this promo code
  SELECT COUNT(*) INTO user_usage_count
  FROM promo_code_usage
  WHERE promo_code_id = promo_record.id AND promo_code_usage.user_id = can_use_promo_code.user_id;

  IF user_usage_count > 0 THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;
