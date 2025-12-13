-- Add cta_heading column to blogs table
-- This allows blogs to have customizable CTA section headings

ALTER TABLE blogs ADD COLUMN IF NOT EXISTS cta_heading TEXT DEFAULT 'Learn More';

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'blogs' AND column_name = 'cta_heading';
