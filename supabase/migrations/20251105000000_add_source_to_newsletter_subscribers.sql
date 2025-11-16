-- Add source column to newsletter_subscribers table
ALTER TABLE newsletter_subscribers
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'footer';

-- Update existing records to have 'footer' as source if they don't have one
UPDATE newsletter_subscribers
SET source = 'footer'
WHERE source IS NULL;
