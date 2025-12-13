-- Add links column to blogs table
-- This allows blogs to have CTA links

ALTER TABLE blogs ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_blogs_links ON blogs USING GIN (links);

-- Verify the column was added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'blogs' AND column_name = 'links';
