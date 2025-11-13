# Supabase Backend Configuration Fix

## Current Issues

Based on the errors you're experiencing:

1. ❌ **"Error sending confirmation email"** - Supabase email service not configured
2. ❌ **"email rate limit exceeded"** - Too many test attempts (temporary)
3. ⚠️ **Email confirmation is enabled** - Requires SMTP setup or needs to be disabled

## Solution Options

### Option 1: Disable Email Confirmation (Quickest - For Development)

This is the fastest way to get authentication working for development/testing.

#### Steps:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Sign in to your account
   - Select your project: `osromibanfzzthdmhyzp`

2. **Navigate to Authentication Settings**
   - Click **Authentication** in the left sidebar
   - Click **Providers**
   - Find and click on **Email** provider

3. **Disable Email Confirmation**
   - Look for **"Confirm email"** or **"Enable email confirmations"** toggle
   - **Turn it OFF** (disable it)
   - Click **Save** at the bottom

4. **Wait for Rate Limit to Reset**
   - The rate limit will reset in 10-15 minutes
   - Or you can try with a different email address

5. **Test Again**
   - Try signing up with a new email
   - You should be able to sign in immediately without email verification

---

### Option 2: Configure SMTP for Email Sending (Production Ready)

This is the proper solution for production but requires email service setup.

#### Steps:

1. **Choose an Email Service Provider**
   - **SendGrid** (Free tier: 100 emails/day)
   - **Mailgun** (Free tier: 5,000 emails/month)
   - **AWS SES** (Very cheap, requires AWS account)
   - **Resend** (Modern, developer-friendly)

2. **Get SMTP Credentials**
   
   For SendGrid example:
   - Sign up at https://sendgrid.com
   - Go to Settings → API Keys
   - Create a new API key with "Mail Send" permissions
   - Save the API key (you'll need it)

3. **Configure Supabase SMTP**
   - Go to Supabase Dashboard → Project Settings → Authentication
   - Scroll to **SMTP Settings**
   - Fill in:
     ```
     Host: smtp.sendgrid.net
     Port: 587
     Username: apikey
     Password: [Your SendGrid API Key]
     Sender email: noreply@yourdomain.com
     Sender name: Freelit
     ```

4. **Test Email Sending**
   - Try signing up with a new email
   - Check if verification email arrives
   - Click the link to verify

---

### Option 3: Use Supabase's Built-in Email (Limited)

Supabase provides a limited email service for development.

#### Steps:

1. **Check Current Email Settings**
   - Go to Supabase Dashboard → Authentication → Email Templates
   - Verify that email templates are configured

2. **Limitations**
   - Limited to 3-4 emails per hour per email address
   - Not suitable for production
   - May have delivery issues

---

## Immediate Actions (To Fix Current Errors)

### 1. Wait for Rate Limit Reset (10-15 minutes)

The "email rate limit exceeded" error will automatically clear after waiting.

### 2. Try with Different Email

Use a different email address to test while waiting for rate limit to reset.

### 3. Check Supabase Status

Visit https://status.supabase.com to ensure there are no ongoing issues.

---

## Recommended Solution Path

### For Development/Testing:
1. **Disable email confirmation** (Option 1)
2. Wait 15 minutes for rate limit to reset
3. Test sign-up and sign-in

### For Production:
1. **Set up SMTP** with SendGrid or similar (Option 2)
2. Keep email confirmation enabled for security
3. Configure proper email templates
4. Test thoroughly before launch

---

## Testing After Fix

Once you've applied one of the solutions above:

1. **Clear Browser Cache**
   ```
   - Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
   - Clear cookies and cached data
   ```

2. **Test Sign Up**
   - Use a fresh email address
   - Fill in name, email, password
   - Click "Sign Up"
   - Should succeed without errors

3. **Test Sign In**
   - If email confirmation is disabled: Sign in immediately
   - If email confirmation is enabled: Check email → Click link → Then sign in

---

## Current Configuration

Your `supabase/config.toml` shows:
```toml
[auth.email]
enable_confirmations = true  # ← This requires SMTP or should be disabled
max_frequency = "1s"
otp_length = 6
otp_expiry = 86400
```

**Recommendation:** Either disable `enable_confirmations` or set up SMTP.

---

## Additional Notes

### Rate Limiting
- Supabase has built-in rate limiting to prevent abuse
- Current limit appears to be around 3-5 sign-ups per email per hour
- This is normal and protects against spam

### Email Verification
- Email verification is a security best practice
- For development, it's okay to disable it temporarily
- For production, always enable it with proper SMTP

### Support
If issues persist after trying these solutions:
1. Check Supabase logs in Dashboard → Logs
2. Contact Supabase support: https://supabase.com/support
3. Check Supabase Discord: https://discord.supabase.com

---

## Quick Fix Summary

**Fastest solution (5 minutes):**
1. Go to Supabase Dashboard
2. Authentication → Providers → Email
3. Disable "Confirm email"
4. Save
5. Wait 15 minutes for rate limit
6. Test again

This will get your authentication working immediately for development!
