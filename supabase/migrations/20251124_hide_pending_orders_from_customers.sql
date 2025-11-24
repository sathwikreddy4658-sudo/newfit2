-- Hide pending orders from customers in track order page
-- Pending orders should only be visible to admin

-- Update the public order tracking function to exclude pending orders
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
    (
      p_email IS NOT NULL AND o.customer_email = p_email
    ) OR (
      p_phone IS NOT NULL AND o.customer_phone = p_phone
    )
  )
  AND o.status != 'pending'  -- Exclude pending orders from customer view
  ORDER BY o.created_at DESC;
$function$;

-- Note: Admin users should use the regular orders table query with proper authentication
-- which will show all orders including pending ones

-- The get_order_with_items_public function (used for order confirmation page) 
-- is intentionally NOT modified because customers need to see their order 
-- immediately after creation, even if it's pending. The track order page
-- should only show confirmed and processed orders.
