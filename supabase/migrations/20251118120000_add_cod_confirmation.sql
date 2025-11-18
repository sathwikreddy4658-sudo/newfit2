-- Add function to confirm COD orders
-- This function allows users to confirm their own COD orders
-- Uses SECURITY DEFINER to bypass RLS restrictions

CREATE OR REPLACE FUNCTION public.confirm_cod_order(
  p_order_id uuid,
  p_payment_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user_id for this order to verify ownership
  SELECT user_id INTO v_user_id
  FROM orders
  WHERE id = p_order_id AND status = 'pending';
  
  -- Check if order exists and is pending
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Order not found or already processed';
  END IF;
  
  -- Verify the authenticated user owns this order
  IF auth.uid() != v_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only confirm your own orders';
  END IF;
  
  -- Update order to confirmed status (COD)
  -- payment_id will store 'COD-' prefix to identify COD orders
  UPDATE orders
  SET 
    status = 'confirmed',
    payment_id = p_payment_id,
    updated_at = NOW()
  WHERE id = p_order_id AND user_id = v_user_id;
  
  RETURN TRUE;
END;
$function$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.confirm_cod_order(uuid, text) TO authenticated;
