# ⚡ QUICK FIX - Password Reset Link Issue

## The Problem
Reset link shows "#" instead of password reset form

## The Solution (3 Steps)

### Step 1: Check Supabase Site URL ⚙️

1. Go to **Supabase Dashboard**
2. Select your project
3. Click **Settings** (bottom left)
4. Go to **Authentication**
5. Check **Site URL** field

**It should be**:
- **Localhost**: `http://localhost:5173`
- **Production**: `https://yourdomain.com`

⚠️ **Change it to match YOUR actual URL!**

---

### Step 2: Code Fix Applied ✅

Already done! `src/pages/Auth.tsx` has been updated to:
- ✅ Detect reset tokens from URL hash
- ✅ Show password form automatically
- ✅ Handle password reset properly

No code changes needed - already fixed!

---

### Step 3: Test It 🧪

1. Clear browser cache: **Ctrl+Shift+Delete**
2. Go to your app
3. Click "Forgot Password?"
4. Enter your email
5. Check email for reset link
6. Click link
7. **You should see the password reset form!**

---

## What It Should Look Like

✅ **Correct URL** (after clicking email link):
```
http://localhost:5173/auth?mode=reset#access_token=...&refresh_token=...
```

✅ **Form That Appears**:
```
┌──────────────────────────┐
│    Reset Password        │
├──────────────────────────┤
│ New Password: [______]   │
│ Confirm:     [______]   │
│                          │
│ [Update Password]        │
│ [Back to Login]          │
└──────────────────────────┘
```

---

## If It Still Doesn't Work

### Check #1: Is email being sent?
- Request password reset
- Check email inbox/spam
- If no email: Email not configured in Supabase

### Check #2: What's the actual link URL?
- Copy the link from email
- Does it start with `http://localhost:5173` or `https://yourdomain.com`?
- Should have `#access_token=` in it

### Check #3: Browser console
- Press **F12** to open Developer Tools
- Go to **Console** tab
- Look for errors (red text)
- Share any errors you see

---

## Key Point

**The most common cause is Supabase Site URL mismatch!**

Make sure your Supabase Site URL matches exactly:
- If using localhost: `http://localhost:5173` (with http://)
- If using production: `https://yourdomain.com` (with https://)

---

## Configuration File Locations

**Check these files exist and are correct**:

1. `.env` file in project root:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_key_here
```

2. Supabase Dashboard Settings:
   - Settings → Authentication → Site URL

Both must match your actual app URL!

---

## Works on Both Localhost and Production?

**Yes!** ✅

The code automatically detects your current domain:
- Localhost: Uses `http://localhost:5173`
- Production: Uses `https://yourdomain.com`

Just make sure Supabase Site URL matches!

---

**That's it! Try these steps and the reset password should work! 🎉**

Need more detailed help? See **PASSWORD_RESET_LINK_ISSUE_FIX.md**
