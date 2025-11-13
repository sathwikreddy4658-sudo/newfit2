# Fix Supabase Authentication Issues

## The Problem
You're getting "Invalid login credentials" because Supabase requires email verification before users can sign in.

## Solution: Disable Email Confirmation in Supabase Dashboard

### Step 1: Go to Supabase Dashboard
1. Open your browser and go to https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: `osromibanfzzthdmhyzp`

### Step 2: Disable Email Confirmation
1. In the left sidebar, click on **Authentication**
2. Click on **Providers**
3. Find the **Email** provider and click on it
4. Look for the setting **"Confirm email"** or **"Enable email confirmations"**
5. **UNCHECK** or **DISABLE** this option
6. Click **Save** at the bottom

### Step 3: Test the Fix
1. Try creating a new account with a fresh email address
2. You should be able to sign in immediately without email verification

## Alternative: If You Can't Disable Email Confirmation

If you need to keep email confirmation enabled for security reasons, users must:

1. **Sign up** with their email and password
2. **Check their email inbox** for a verification link from Supabase
3. **Click the verification link** in the email
4. **Return to your site** and sign in

The verification email will come from `noreply@mail.app.supabase.io`

## For Existing Users

If you have users who signed up before this fix:
- They need to verify their email using the link sent during signup
- Or you can manually verify them in the Supabase Dashboard:
  1. Go to Authentication > Users
  2. Find the user
  3. Click on them
  4. Toggle "Email Confirmed" to ON

## Testing Checklist

- [ ] Disabled email confirmation in Supabase Dashboard
- [ ] Created a new test account
- [ ] Successfully signed in without email verification
- [ ] Tested with existing products appearing in product list
- [ ] Verified all product categories are visible

## Need Help?

If you're still having issues:
1. Make sure you saved the changes in the Supabase Dashboard
2. Clear your browser cache and cookies
3. Try in an incognito/private window
4. Check the Supabase Dashboard logs for any errors
