-- Deploy create_order_with_items function to Supabase
-- This function creates orders with order items atomically

-- First, make sure discount tracking columns exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
ADD COLUMN IF NOT EXISTS original_total DECIMAL(10,2);

-- Drop existing function if it exists (with any signature)
DROP FUNCTION IF EXISTS public.create_order_with_items(uuid, numeric, text, text, jsonb);
DROP FUNCTION IF EXISTS public.create_order_with_items(uuid, numeric, text, text, jsonb, numeric);

-- Create the function with proper signature
CREATE OR REPLACE FUNCTION public.create_order_with_items(
  p_user_id uuid, 
  p_total_price numeric, 
  p_address text, 
  p_payment_id text, 
  p_items jsonb,
  p_discount_amount numeric DEFAULT 0
)
RETURNS TABLE(order_id uuid, success boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_current_stock INTEGER;
  v_calculated_total NUMERIC := 0;
  v_item_quantity INTEGER;
  v_item_price NUMERIC;
  v_original_total NUMERIC;
BEGIN
  -- Validate total price range (positive and reasonable)
  IF p_total_price <= 0 OR p_total_price > 10000000 THEN
    RAISE EXCEPTION 'Invalid total price: must be between 0.01 and 10,000,000';
  END IF;
  
  -- Validate discount amount
  IF p_discount_amount < 0 OR p_discount_amount > p_total_price THEN
    RAISE EXCEPTION 'Invalid discount amount: must be between 0 and %', p_total_price;
  END IF;
  
  -- Validate address length
  IF LENGTH(TRIM(p_address)) < 10 OR LENGTH(p_address) > 500 THEN
    RAISE EXCEPTION 'Invalid address: must be between 10 and 500 characters';
  END IF;
  
  -- Validate payment_id length if provided
  IF p_payment_id IS NOT NULL AND (LENGTH(p_payment_id) < 5 OR LENGTH(p_payment_id) > 100) THEN
    RAISE EXCEPTION 'Invalid payment ID format';
  END IF;
  
  -- Validate items array is not empty
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;
  
  -- Validate items array is not too large
  IF jsonb_array_length(p_items) > 100 THEN
    RAISE EXCEPTION 'Order cannot contain more than 100 items';
  END IF;
  
  -- Validate each item and calculate total
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Extract and validate quantity
    v_item_quantity := (v_item->>'quantity')::INTEGER;
    IF v_item_quantity <= 0 OR v_item_quantity > 1000 THEN
      RAISE EXCEPTION 'Invalid quantity for %: must be between 1 and 1000', v_item->>'product_name';
    END IF;
    
    -- Extract and validate product price
    v_item_price := (v_item->>'product_price')::NUMERIC;
    IF v_item_price <= 0 OR v_item_price > 1000000 THEN
      RAISE EXCEPTION 'Invalid price for %: must be between 0.01 and 1,000,000', v_item->>'product_name';
    END IF;
    
    -- Validate product_name is not empty
    IF LENGTH(TRIM(v_item->>'product_name')) = 0 OR LENGTH(v_item->>'product_name') > 200 THEN
      RAISE EXCEPTION 'Invalid product name: must be between 1 and 200 characters';
    END IF;
    
    -- Validate product_id is a valid UUID
    IF (v_item->>'product_id') IS NULL OR (v_item->>'product_id')::UUID IS NULL THEN
      RAISE EXCEPTION 'Invalid product ID for %', v_item->>'product_name';
    END IF;
    
    -- Check if product exists and get current stock
    SELECT stock INTO v_current_stock
    FROM products
    WHERE id = (v_item->>'product_id')::UUID;
    
    -- Validate product exists in database
    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Product "%" with ID % does not exist in database', 
        v_item->>'product_name', v_item->>'product_id';
    END IF;
    
    -- Validate sufficient stock is available
    IF v_current_stock < (v_item->>'quantity')::INTEGER THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_item->>'product_name';
    END IF;
    
    -- Add to calculated total
    v_calculated_total := v_calculated_total + (v_item_price * v_item_quantity);
  END LOOP;
  
  -- Calculate original total (before discount)
  v_original_total := p_total_price + p_discount_amount;
  
  -- Verify submitted total matches calculated total (allow 0.01 variance for rounding)
  IF ABS(v_original_total - v_calculated_total) > 0.01 THEN
    RAISE EXCEPTION 'Total price mismatch: expected %, got %', v_calculated_total, v_original_total;
  END IF;
  
  -- Create the order (user_id can be null for guest checkout)
  INSERT INTO orders (user_id, total_price, address, payment_id, status, discount_amount, original_total)
  VALUES (p_user_id, p_total_price, p_address, p_payment_id, 'pending', p_discount_amount, v_original_total)
  RETURNING id INTO v_order_id;
  
  -- Create order items (WITHOUT deducting stock)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      product_name,
      product_price,
      quantity
    )
    VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      v_item->>'product_name',
      (v_item->>'product_price')::NUMERIC,
      (v_item->>'quantity')::INTEGER
    );
  END LOOP;
  
  -- Return success
  RETURN QUERY SELECT v_order_id, TRUE, NULL::TEXT;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RETURN QUERY SELECT NULL::UUID, FALSE, SQLERRM;
END;
$function$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.create_order_with_items(uuid, numeric, text, text, jsonb, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(uuid, numeric, text, text, jsonb, numeric) TO anon;

-- Confirm deployment
SELECT 'create_order_with_items function deployed successfully!' AS status;
