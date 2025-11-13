-- Create admin user and assign role
-- First, create the user in auth.users (this needs to be done via API, but we can prepare the role assignment)

-- Insert admin role for the user with email admin@freelit.com
-- Note: The user must already exist in auth.users table
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'admin@freelit.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Also create a profile for the admin user
INSERT INTO public.profiles (id, name, email, address)
SELECT id, 'Admin User', email, 'Admin Address'
FROM auth.users
WHERE email = 'admin@freelit.com'
ON CONFLICT (id) DO NOTHING;
