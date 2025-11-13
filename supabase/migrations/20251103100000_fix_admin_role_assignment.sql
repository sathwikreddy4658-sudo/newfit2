-- Ensure admin role is properly assigned to admin@freelit.com
-- This migration will create the admin user if they don't exist and assign the admin role

-- First, ensure the admin user exists (this will be handled by signup, but let's make sure)
-- Note: In production, the user should be created through the signup process

-- Insert admin role for admin@freelit.com, creating the user_roles entry if needed
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'admin@freelit.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Also ensure the profile exists
INSERT INTO public.profiles (id, name, email, address)
SELECT id, 'Admin User', email, 'Admin Address'
FROM auth.users
WHERE email = 'admin@freelit.com'
ON CONFLICT (id) DO NOTHING;
