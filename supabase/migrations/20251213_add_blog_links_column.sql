-- Add links column to blogs table
-- This migration adds a links column to store blog CTA links

ALTER TABLE blogs ADD COLUMN IF NOT EXISTS links TEXT;

-- Add comment for clarity
COMMENT ON COLUMN blogs.links IS 'JSON array of blog CTA links with text and url properties';

-- Verify the column was added
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'blogs';
