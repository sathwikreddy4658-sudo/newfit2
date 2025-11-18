-- Function to confirm payment and update order status
CREATE OR REPLACE FUNCTION public.confirm_payment_for_order(
  p_order_id UUID,
  p_transaction_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the order and verify it belongs to the current user
  SELECT user_id INTO v_user_id
  FROM orders
  WHERE id = p_order_id;

  -- Only allow if order exists and belongs to current user
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Order does not belong to user';
  END IF;

  -- Update order status to paid
  UPDATE orders
  SET 
    status = 'paid',
    payment_id = p_transaction_id,
    updated_at = now()
  WHERE id = p_order_id;

  -- Deduct stock for this order
  PERFORM deduct_stock_for_order(p_order_id);

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to confirm payment: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.confirm_payment_for_order(UUID, TEXT) TO authenticated;
