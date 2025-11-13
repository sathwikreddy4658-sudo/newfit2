-- Allow public access to profiles for displaying names in approved ratings
-- This policy allows anyone (including anonymous users) to view profile names
-- when they are associated with approved product ratings

CREATE POLICY "Public can view profile names for approved ratings"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM product_ratings pr
    WHERE pr.user_id = profiles.id
    AND pr.approved = true
  )
);
