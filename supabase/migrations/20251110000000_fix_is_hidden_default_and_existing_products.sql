UPDATE public.products
SET is_hidden = false
WHERE is_hidden = true
-- Alter the table to set the default value for is_hidden to false
ALTER TABLE public.products
ALTER COLUMN is_hidden SET DEFAULT false
-- Add a comment to document this change
COMMENT ON COLUMN public.products.is_hidden IS 'Whether the product is hidden from public view. Defaults to false (visible).'
