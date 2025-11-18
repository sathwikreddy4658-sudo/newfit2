-- Guest orders support: columns, secure RPCs, and COD for guests

-- 1) Ensure guest info columns exist on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS customer_phone text;

-- Helpful indexes
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

-- 2) Update confirm_cod_order to allow guests (user_id IS NULL)
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
  SELECT user_id, status INTO v_user_id, v_status
  FROM public.orders
  WHERE id = p_order_id;

  IF v_status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'Order not found or already processed';
  END IF;

  -- If order belongs to a logged-in user, enforce ownership
  IF v_user_id IS NOT NULL AND auth.uid() IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only confirm your own orders';
  END IF;

  UPDATE public.orders
  SET status = 'confirmed',
      payment_id = p_payment_id,
      updated_at = NOW()
  WHERE id = p_order_id;

  RETURN TRUE;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.confirm_cod_order(uuid, text) TO authenticated, anon;

-- 3) Secure RPC for public tracking: orders with nested items
CREATE OR REPLACE FUNCTION public.get_orders_with_items_public(
  p_email text,
  p_phone text
)
RETURNS SETOF jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    to_jsonb(o.*)
    || jsonb_build_object(
      'order_items', (
        SELECT COALESCE(jsonb_agg(oi.* ORDER BY oi.created_at), '[]'::jsonb)
        FROM public.order_items oi
        WHERE oi.order_id = o.id
      )
    ) AS row
  FROM public.orders o
  WHERE (
    p_email IS NOT NULL AND o.customer_email = p_email
  ) OR (
    p_phone IS NOT NULL AND o.customer_phone = p_phone
  )
  ORDER BY o.created_at DESC;
$function$;

GRANT EXECUTE ON FUNCTION public.get_orders_with_items_public(text, text) TO anon;

-- 4) Secure RPC to fetch a single order with items for a given email (guest confirmation page)
CREATE OR REPLACE FUNCTION public.get_order_with_items_public(
  p_order_id uuid,
  p_email text
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    to_jsonb(o.*)
    || jsonb_build_object(
      'order_items', (
        SELECT COALESCE(jsonb_agg(oi.* ORDER BY oi.created_at), '[]'::jsonb)
        FROM public.order_items oi
        WHERE oi.order_id = o.id
      )
    )
  FROM public.orders o
  WHERE o.id = p_order_id AND (p_email IS NULL OR o.customer_email = p_email)
  LIMIT 1;
$function$;

GRANT EXECUTE ON FUNCTION public.get_order_with_items_public(uuid, text) TO anon;

-- 5) Secure RPC to link a guest order to a newly created user
CREATE OR REPLACE FUNCTION public.link_guest_order_to_user(
  p_order_id uuid,
  p_email text,
  p_phone text,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_matches integer;
BEGIN
  -- Only allow linking if order currently has no user and matches provided email/phone
  SELECT COUNT(*) INTO v_matches
  FROM public.orders o
  WHERE o.id = p_order_id
    AND o.user_id IS NULL
    AND (p_email IS NULL OR o.customer_email = p_email)
    AND (p_phone IS NULL OR o.customer_phone = p_phone);

  IF v_matches = 0 THEN
    RAISE EXCEPTION 'Order not eligible for linking';
  END IF;

  UPDATE public.orders
  SET user_id = p_user_id,
      updated_at = NOW()
  WHERE id = p_order_id AND user_id IS NULL;

  RETURN TRUE;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.link_guest_order_to_user(uuid, text, text, uuid) TO anon;