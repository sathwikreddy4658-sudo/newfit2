-- Enable RLS on payment_transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own payment transactions
CREATE POLICY "Users can view their own payment transactions"
ON payment_transactions
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM orders WHERE orders.id = payment_transactions.order_id
  )
);

-- Allow webhook/service role to insert payment transactions
CREATE POLICY "Service role can insert payment transactions"
ON payment_transactions
FOR INSERT
WITH CHECK (true);

-- Allow webhook/service role to update payment transactions
CREATE POLICY "Service role can update payment transactions"
ON payment_transactions
FOR UPDATE
USING (true);
