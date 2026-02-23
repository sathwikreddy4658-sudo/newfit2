-- Check and Fix Admin Access
-- Run this in Supabase SQL Editor

-- Step 1: See all users (to find your user ID)
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC;

-- Step 2: Check existing roles
SELECT ur.id, ur.user_id, ur.role, u.email
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id;

-- Step 3: Add admin role to your user (REPLACE 'YOUR_EMAIL_HERE' with your actual email)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 4: Verify admin role was added
SELECT ur.role, u.email
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'YOUR_EMAIL_HERE';
