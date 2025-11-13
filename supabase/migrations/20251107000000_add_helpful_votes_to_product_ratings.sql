-- Add helpful_votes column to product_ratings table
ALTER TABLE product_ratings ADD COLUMN IF NOT EXISTS helpful_votes INTEGER DEFAULT 0;

-- Create a separate table for tracking helpful votes (to allow multiple votes per rating)
CREATE TABLE IF NOT EXISTS rating_helpful_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rating_id UUID NOT NULL REFERENCES product_ratings(id) ON DELETE CASCADE,
    user_identifier TEXT NOT NULL, -- Can be user_id for logged in users or IP/session for guests
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(rating_id, user_identifier)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_rating_helpful_votes_rating_id ON rating_helpful_votes(rating_id);

-- Enable Row Level Security
ALTER TABLE rating_helpful_votes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view helpful votes
CREATE POLICY "Anyone can view helpful votes" ON rating_helpful_votes
    FOR SELECT USING (true);

-- Policy: Anyone can insert helpful votes (guests and users)
CREATE POLICY "Anyone can insert helpful votes" ON rating_helpful_votes
    FOR INSERT WITH CHECK (true);

-- Policy: Users can delete their own votes, guests can delete by identifier
CREATE POLICY "Users can delete their own votes" ON rating_helpful_votes
    FOR DELETE USING (true);

-- Function to update helpful_votes count
CREATE OR REPLACE FUNCTION update_helpful_votes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE product_ratings SET helpful_votes = helpful_votes + 1 WHERE id = NEW.rating_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE product_ratings SET helpful_votes = helpful_votes - 1 WHERE id = OLD.rating_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update helpful_votes count
CREATE TRIGGER trigger_update_helpful_votes_count
    AFTER INSERT OR DELETE ON rating_helpful_votes
    FOR EACH ROW EXECUTE FUNCTION update_helpful_votes_count();
