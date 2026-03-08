-- Assign Admin Role to User
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard

-- Step 1: First, let's find the user ID from their email
SELECT id, email FROM auth.users WHERE email = 'sathwikreddypapaigari@gmail.com';

-- Step 2: Once you have the user ID, run this to assign the admin role
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID from Step 1
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID_HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 3: Verify the admin role was assigned
SELECT ur.user_id, ur.role, ur.created_at, u.email
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email = 'sathwikreddypapaigari@gmail.com';

-- Alternative approach: If you know the email, you can also use this directly
-- This finds the user from profiles table and assigns the role
WITH admin_user AS (
  SELECT id FROM public.profiles WHERE email = 'sathwikreddypapaigari@gmail.com'
)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM admin_user
ON CONFLICT (user_id, role) DO NOTHING;
