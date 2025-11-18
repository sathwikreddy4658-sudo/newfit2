-- Add payment_method column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Add a check constraint to ensure valid payment methods
ALTER TABLE orders ADD CONSTRAINT valid_payment_method 
  CHECK (payment_method IS NULL OR payment_method IN ('COD', 'PhonePe', 'Online'));
