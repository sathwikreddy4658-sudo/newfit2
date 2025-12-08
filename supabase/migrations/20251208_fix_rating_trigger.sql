-- Fix the rating trigger - the table doesn't have 'status' field, it has 'approved' boolean
-- Drop the broken trigger
DROP TRIGGER IF EXISTS trigger_set_rating_pending_on_edit ON product_ratings;
DROP FUNCTION IF EXISTS set_rating_pending_on_edit();

-- Create a corrected trigger that works with the 'approved' column
CREATE OR REPLACE FUNCTION set_rating_pending_on_edit()
RETURNS TRIGGER AS $$
BEGIN
  -- If the rating was approved and is being updated by the user (not admin), set to pending
  IF OLD.approved = true AND NEW.approved = true AND auth.uid() = NEW.user_id THEN
    NEW.approved = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger with the correct column
CREATE TRIGGER trigger_set_rating_pending_on_edit
  BEFORE UPDATE ON product_ratings
  FOR EACH ROW
  EXECUTE FUNCTION set_rating_pending_on_edit();

-- Ensure RLS policies are correct
DROP POLICY IF EXISTS "Admins can update all ratings" ON product_ratings;
CREATE POLICY "Admins can update all ratings" ON product_ratings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Ensure users can view their own ratings even if not approved
DROP POLICY IF EXISTS "Users can view their own ratings" ON product_ratings;
CREATE POLICY "Users can view their own ratings" ON product_ratings
  FOR SELECT USING (auth.uid() = user_id);
