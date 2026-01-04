# ✅ Password Reset Setup - Option 1 (Using /auth Page)

## Current Setup

Your application is already configured to use the `/auth` page for password reset!

### How It Works

```
User requests password reset
        ↓
Email sent to: https://www.freelit.in/auth?mode=reset
        ↓
User clicks link in email
        ↓
Link contains tokens: #access_token=...&refresh_token=...
        ↓
Page loads on /auth with mode=reset
        ↓
Auth.tsx detects reset mode and shows password form
        ↓
User enters new password
        ↓
Password updated in Supabase
        ↓
User signs in with new password ✅
```

---

## ✅ Code is Ready

Your `src/pages/Auth.tsx` is already configured:

```tsx
const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
  redirectTo: `${window.location.origin}/auth?mode=reset`,
});
```

This means:
- On **localhost**: Sends to `http://localhost:5173/auth?mode=reset`
- On **production**: Sends to `https://www.freelit.in/auth?mode=reset`

---

## ⚙️ Required Supabase Configuration

To make this work on **https://www.freelit.in**, you MUST configure Supabase correctly:

### Step 1: Set Site URL

1. Go to **Supabase Dashboard** → Your Project
2. Click **Settings** (bottom left)
3. Go to **Authentication** tab
4. Find **Site URL** field
5. **Change it to**: `https://www.freelit.in`

⚠️ **This is CRITICAL!** The Site URL must match your production domain.

### Step 2: Add Redirect URLs

Still in **Settings → Authentication**:

1. Find **Redirect URLs** section
2. Add these URLs:
   ```
   https://www.freelit.in
   https://www.freelit.in/auth
   https://www.freelit.in/auth?mode=reset
   ```

3. Click **Save**

### Step 3: Verify Environment Variables

Make sure your `.env` (or deployment secrets) has:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_key_here
```

Both values must be correct and match your Supabase project.

---

## 🧪 Testing the Setup

### On Production (https://www.freelit.in)

1. Open your app: `https://www.freelit.in`
2. Go to login page (or click "Forgot Password?")
3. Enter your test email
4. Click "Send Reset Link"
5. Check email for reset link
6. **Expected Link Format**:
   ```
   https://www.freelit.in/auth?mode=reset#access_token=xxx&refresh_token=yyy
   ```
7. Click the link
8. **Expected Result**: Password reset form appears with:
   - New Password input
   - Confirm Password input
   - Update Password button
   - Back to Login button
9. Enter new password (8+ characters)
10. Click "Update Password"
11. **Success!** Password updated
12. Sign in with new password

---

## 📋 Current Redirect URLs You Have

```
✅ https://www.freelit.in/auth
✅ https://www.freelit.in
```

**Add these additional ones**:
- `https://www.freelit.in/auth?mode=reset`

This ensures the reset password link works correctly.

---

## ✅ Checklist

- [ ] Open Supabase Dashboard
- [ ] Go to Settings → Authentication
- [ ] Set **Site URL** to: `https://www.freelit.in`
- [ ] Add **Redirect URLs**:
  - [ ] `https://www.freelit.in`
  - [ ] `https://www.freelit.in/auth`
  - [ ] `https://www.freelit.in/auth?mode=reset`
- [ ] Click **Save**
- [ ] Verify environment variables in deployment
- [ ] Test password reset flow

---

## 🔧 If It Still Doesn't Work

### Check #1: Supabase Site URL
- Is it set to `https://www.freelit.in`?
- Not `http://` (no http)
- Not with trailing slash

### Check #2: Email Sending
- Is email arriving in inbox?
- Check spam folder
- If not: Email not configured in Supabase

### Check #3: Link Format
- Copy link from email
- Does it start with `https://www.freelit.in/auth`?
- Does it contain `#access_token=` and `#refresh_token=`?

### Check #4: Browser Console
- Open DevTools (F12)
- Go to Console tab
- Look for error messages
- Share any red errors

---

## 🎯 Summary

✅ **Code**: Already configured for `/auth` page password reset  
✅ **Email Sending**: Configured to send to `{origin}/auth?mode=reset`  
✅ **Form**: Shows password reset form on `/auth` page  
✅ **Database Update**: Updates password in Supabase  

**Only thing needed**: Set Supabase **Site URL** to `https://www.freelit.in`

---

## Environment-Specific URLs

| Environment | Site URL | Reset Link |
|-------------|----------|-----------|
| **Local Dev** | `http://localhost:5173` | `http://localhost:5173/auth?mode=reset` |
| **Production** | `https://www.freelit.in` | `https://www.freelit.in/auth?mode=reset` |

Set the correct **Site URL** in Supabase for each environment!

---

## Ready to Deploy? ✅

1. Update Supabase Site URL
2. Test password reset on production
3. Monitor error logs
4. You're done!

The password reset feature is production-ready! 🚀
