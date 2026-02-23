-- Deploy confirm_cod_order function to Supabase
-- This function confirms COD (Cash on Delivery) orders

-- First, ensure guest info columns exist on orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS customer_phone text;

-- Create helpful indexes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_orders_customer_email'
  ) THEN
    CREATE INDEX idx_orders_customer_email ON public.orders (customer_email);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_orders_customer_phone'
  ) THEN
    CREATE INDEX idx_orders_customer_phone ON public.orders (customer_phone);
  END IF;
END$$;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.confirm_cod_order(uuid, text);

-- Create the confirm_cod_order function
-- This function allows guests (user_id IS NULL) and authenticated users
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
  v_status text;
BEGIN
  -- Get order details
  SELECT user_id, status INTO v_user_id, v_status
  FROM public.orders
  WHERE id = p_order_id;

  -- Check if order exists
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Check if order is already processed
  IF v_status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'Order already processed with status: %', v_status;
  END IF;

  -- If order belongs to a logged-in user, enforce ownership
  -- For guest orders (v_user_id IS NULL), allow anyone to confirm
  IF v_user_id IS NOT NULL THEN
    -- Check if current user matches order owner
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Unauthorized: Authentication required for user orders';
    END IF;
    
    IF auth.uid() IS DISTINCT FROM v_user_id THEN
      RAISE EXCEPTION 'Unauthorized: You can only confirm your own orders';
    END IF;
  END IF;

  -- Update order to confirmed status
  UPDATE public.orders
  SET 
    status = 'confirmed',
    payment_id = p_payment_id,
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN TRUE;
END;
$function$;

-- Grant execute permissions to authenticated and anonymous users (for guest checkout)
GRANT EXECUTE ON FUNCTION public.confirm_cod_order(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_cod_order(uuid, text) TO anon;

-- Confirm deployment
SELECT 'confirm_cod_order function deployed successfully!' AS status;
