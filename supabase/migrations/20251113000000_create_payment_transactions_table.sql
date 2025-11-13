-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM (
  'INITIATED',
  'PENDING', 
  'SUCCESS',
  'FAILED',
  'REFUNDED',
  'CANCELLED'
);

-- Create payment method enum
CREATE TYPE public.payment_method AS ENUM (
  'UPI',
  'CARD',
  'NET_BANKING',
  'WALLET',
  'PAY_PAGE'
);

-- Create payment transactions table
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  merchant_transaction_id TEXT NOT NULL UNIQUE,
  phonepe_transaction_id TEXT,
  amount INTEGER NOT NULL CHECK (amount > 0), -- Amount in paisa
  currency TEXT NOT NULL DEFAULT 'INR',
  status public.payment_status NOT NULL DEFAULT 'INITIATED',
  payment_method public.payment_method,
  payment_instrument JSONB, -- Store payment instrument details
  response_code TEXT,
  response_message TEXT,
  phonepe_response JSONB, -- Store complete PhonePe response
  callback_received BOOLEAN DEFAULT FALSE,
  callback_data JSONB,
  refund_amount INTEGER DEFAULT 0,
  refund_transaction_id TEXT,
  refund_status TEXT,
  metadata JSONB, -- Additional metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Add indexes for better query performance
CREATE INDEX idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_merchant_txn_id ON public.payment_transactions(merchant_transaction_id);
CREATE INDEX idx_payment_transactions_phonepe_txn_id ON public.payment_transactions(phonepe_transaction_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_payment_transactions_created_at ON public.payment_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view their own payment transactions"
  ON public.payment_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payment_transactions.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payment transactions"
  ON public.payment_transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert payment transactions"
  ON public.payment_transactions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payment transactions"
  ON public.payment_transactions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create payment transaction
CREATE OR REPLACE FUNCTION public.create_payment_transaction(
  p_order_id UUID,
  p_merchant_transaction_id TEXT,
  p_amount INTEGER,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  -- Validate order exists
  IF NOT EXISTS (SELECT 1 FROM orders WHERE id = p_order_id) THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Create payment transaction
  INSERT INTO payment_transactions (
    order_id,
    merchant_transaction_id,
    amount,
    status,
    metadata
  )
  VALUES (
    p_order_id,
    p_merchant_transaction_id,
    p_amount,
    'INITIATED',
    p_metadata
  )
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$;

-- Function to update payment transaction status
CREATE OR REPLACE FUNCTION public.update_payment_transaction_status(
  p_merchant_transaction_id TEXT,
  p_status payment_status,
  p_phonepe_transaction_id TEXT DEFAULT NULL,
  p_payment_method payment_method DEFAULT NULL,
  p_response_code TEXT DEFAULT NULL,
  p_response_message TEXT DEFAULT NULL,
  p_phonepe_response JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_order_status order_status;
BEGIN
  -- Update payment transaction
  UPDATE payment_transactions
  SET
    status = p_status,
    phonepe_transaction_id = COALESCE(p_phonepe_transaction_id, phonepe_transaction_id),
    payment_method = COALESCE(p_payment_method, payment_method),
    response_code = COALESCE(p_response_code, response_code),
    response_message = COALESCE(p_response_message, response_message),
    phonepe_response = COALESCE(p_phonepe_response, phonepe_response),
    completed_at = CASE WHEN p_status IN ('SUCCESS', 'FAILED', 'CANCELLED') THEN now() ELSE completed_at END,
    updated_at = now()
  WHERE merchant_transaction_id = p_merchant_transaction_id
  RETURNING order_id INTO v_order_id;

  -- If payment successful, update order status to 'paid'
  IF p_status = 'SUCCESS' AND v_order_id IS NOT NULL THEN
    -- Check if order_status enum has 'paid' value
    BEGIN
      UPDATE orders
      SET status = 'paid'::order_status
      WHERE id = v_order_id;
    EXCEPTION
      WHEN invalid_text_representation THEN
        -- If 'paid' status doesn't exist, keep as 'pending'
        UPDATE orders
        SET status = 'pending'
        WHERE id = v_order_id;
    END;
  END IF;

  RETURN FOUND;
END;
$$;

-- Add comment for documentation
COMMENT ON TABLE public.payment_transactions IS 'Stores all payment transaction details from PhonePe';
COMMENT ON COLUMN public.payment_transactions.amount IS 'Amount in paisa (1 INR = 100 paisa)';
COMMENT ON COLUMN public.payment_transactions.merchant_transaction_id IS 'Unique transaction ID generated by merchant';
COMMENT ON COLUMN public.payment_transactions.phonepe_transaction_id IS 'Transaction ID from PhonePe';
