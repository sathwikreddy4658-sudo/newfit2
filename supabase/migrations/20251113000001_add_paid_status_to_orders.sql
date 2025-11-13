-- Add 'paid' status to order_status enum
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'paid';

-- Add comment
COMMENT ON TYPE public.order_status IS 'Order status: pending, paid, shipped, delivered, cancelled';
