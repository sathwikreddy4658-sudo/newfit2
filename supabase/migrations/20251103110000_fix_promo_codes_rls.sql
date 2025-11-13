-- Fix the RLS policy for promo_codes to use the correct role type
-- Drop existing policy
DROP POLICY IF EXISTS "Allow admins to manage promo codes" ON promo_codes;

-- Create corrected policy for admins to manage promo codes (full access)
CREATE POLICY "Allow admins to manage promo codes" ON promo_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'::public.app_role
    )
  );
