-- Add admin role to admin@freelit.com user (retry)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@freelit.com'
ON CONFLICT (user_id, role) DO NOTHING;
