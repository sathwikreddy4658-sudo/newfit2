-- Allow users to edit their approved ratings by updating the RLS policy
-- This policy allows users to update their own ratings, even if they are approved
-- When a user edits an approved rating, it should become pending approval again

-- First, drop the existing policy that prevents updates to approved ratings
DROP POLICY IF EXISTS "Users can update their own pending ratings" ON product_ratings;

-- Create a new policy that allows users to update their own ratings regardless of status
CREATE POLICY "Users can update their own ratings" ON product_ratings
  FOR UPDATE USING (auth.uid() = user_id);

-- Ensure the policy for admins to update ratings still exists
DROP POLICY IF EXISTS "Admins can update all ratings" ON product_ratings;
CREATE POLICY "Admins can update all ratings" ON product_ratings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- When a user updates their rating, set the status back to 'pending' if it was 'approved'
-- This trigger will automatically handle setting the status back to pending on edit
CREATE OR REPLACE FUNCTION set_rating_pending_on_edit()
RETURNS TRIGGER AS $$
BEGIN
  -- If the rating was approved and is being updated by the user (not admin), set to pending
  IF OLD.status = 'approved' AND NEW.status = 'approved' AND auth.uid() = NEW.user_id THEN
    NEW.status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS trigger_set_rating_pending_on_edit ON product_ratings;
CREATE TRIGGER trigger_set_rating_pending_on_edit
  BEFORE UPDATE ON product_ratings
  FOR EACH ROW
  EXECUTE FUNCTION set_rating_pending_on_edit();
