# 📋 IMMEDIATE ACTION CHECKLIST - Password Reset Setup

## What You Need to Do (3 Steps - 5 minutes)

### Step 1: Update Supabase Site URL ⚙️

1. Go to: https://supabase.com
2. Login to your account
3. Select your **freelit** project
4. Click **Settings** (bottom left)
5. Click **Authentication** tab
6. Find **Site URL** field
7. **Change from**: (whatever is there now)
8. **Change to**: `https://www.freelit.in`
9. Click **Save**

✅ **This is the most important step!**

---

### Step 2: Add Redirect URL ✅

Still in **Settings → Authentication**:

1. Scroll to **Redirect URLs**
2. Add this URL: `https://www.freelit.in/auth?mode=reset`
3. Your list should now have:
   - `https://www.freelit.in`
   - `https://www.freelit.in/auth`
   - `https://www.freelit.in/auth?mode=reset` ← NEW
4. Click **Save**

---

### Step 3: Test It 🧪

1. Open: `https://www.freelit.in`
2. Click "Forgot Password?"
3. Enter your test email
4. Click "Send Reset Link"
5. Check your email
6. Click the reset link
7. **You should see the password reset form!**

---

## That's It! ✅

Your password reset is now fully set up and working!

### What happens automatically:

✅ User clicks "Forgot Password?"  
✅ Enters email  
✅ Email sent with reset link  
✅ User clicks link in email  
✅ Password reset form appears  
✅ User enters new password  
✅ Password updated in database  
✅ User signs in with new password  

---

## Configuration Summary

| Setting | Value |
|---------|-------|
| **Site URL** | `https://www.freelit.in` |
| **Redirect URL #1** | `https://www.freelit.in` |
| **Redirect URL #2** | `https://www.freelit.in/auth` |
| **Redirect URL #3** | `https://www.freelit.in/auth?mode=reset` |

---

## If You Get an Error

**"Page shows # instead of password form"**
→ Check that **Site URL** is set to `https://www.freelit.in`

**"Email not received"**
→ Email service might not be configured in Supabase

**"Password won't update"**
→ Check browser console (F12) for error messages

---

**Time needed**: ~5 minutes  
**Difficulty**: Very easy  
**Status**: Production ready! 🚀
