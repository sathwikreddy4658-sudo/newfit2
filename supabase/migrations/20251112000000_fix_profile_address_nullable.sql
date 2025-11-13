-- Fix the profiles table to allow NULL address during signup
-- Users can update their address later

-- Make address nullable
ALTER TABLE public.profiles
ALTER COLUMN address DROP NOT NULL
-- Update the handle_new_user function to handle address properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, address)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    NULL  -- Address will be NULL initially, user can update later
  );

  -- Assign user role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
 ON CONFLICT (user_id, role) DO NOTHING;  -- Prevent duplicate role errors

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$
