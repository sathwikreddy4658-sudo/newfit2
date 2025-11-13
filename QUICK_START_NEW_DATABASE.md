# Quick Start Guide - Clone Your Database in 5 Minutes

This is a simplified guide to get your new database up and running quickly.

## 🚀 Quick Steps

### Step 1: Create New Supabase Project (2 minutes)

1. Go to https://app.supabase.com
2. Click **"New Project"**
3. Fill in:
   - **Name**: `freelit-clone` (or your choice)
   - **Password**: Create a strong password (SAVE THIS!)
   - **Region**: Same as your current project
4. Click **"Create new project"**
5. Wait for project to be ready (~2 minutes)

### Step 2: Get Your Credentials (1 minute)

1. In your new project, go to **Settings** (gear icon) → **API**
2. Copy these three values:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbG...
   service_role key: eyJhbG...
   ```
3. Save them somewhere safe!

### Step 3: Apply Database Schema (1 minute)

**Option A: Using SQL Editor (Easiest)**

1. In your new project, click **SQL Editor** in sidebar
2. Click **"New Query"**
3. Open the file `consolidated-database-schema.sql` from this project
4. Copy ALL the contents
5. Paste into SQL Editor
6. Click **"Run"** (or Ctrl+Enter)
7. Wait for it to complete (should see "Success")

**Option B: Using Supabase CLI**

```bash
# Link to your new project
supabase link --project-ref YOUR_NEW_PROJECT_REF

# Push all migrations
supabase db push
```

### Step 4: Verify Everything Works (1 minute)

1. Go to **Table Editor** in your new project
2. Check that you see these tables:
   - ✅ profiles
   - ✅ products
   - ✅ orders
   - ✅ order_items
   - ✅ user_roles
   - ✅ blogs
   - ✅ promo_codes
   - ✅ product_ratings
   - ✅ payment_transactions
   - ✅ newsletter_subscribers

3. Go to **Storage** and verify:
   - ✅ product-images bucket exists

### Step 5: Update Your Project Configuration

Create a new `.env` file or update existing one:

```env
# New Database Credentials
VITE_SUPABASE_URL=https://YOUR_NEW_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ_YOUR_NEW_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=eyJ_YOUR_NEW_SERVICE_ROLE_KEY
```

---

## ✅ You're Done!

Your new database is now an exact copy of your current database structure!

### What You Have Now:

- ✅ **Separate database** - completely isolated from your current one
- ✅ **Same structure** - all tables, functions, and policies
- ✅ **Empty data** - ready for your new project
- ✅ **New credentials** - different API keys and passwords
- ✅ **Zero risk** - your current database is untouched

---

## 🎯 Next Steps

### Create an Admin User (Optional)

1. Sign up a user in your application
2. Get their user ID from **Authentication** → **Users** in Supabase Dashboard
3. Run this SQL in SQL Editor:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

### Test Your New Database

1. Update your application to use the new credentials
2. Try signing up a new user
3. Try viewing products
4. Try creating an order
5. Verify everything works!

---

## 📋 Checklist

- [ ] Created new Supabase project
- [ ] Saved new credentials
- [ ] Applied database schema
- [ ] Verified all tables exist
- [ ] Updated environment variables
- [ ] Tested authentication
- [ ] Created admin user (if needed)

---

## 🆘 Need Help?

- **Full Guide**: See `DATABASE_CLONE_GUIDE.md` for detailed instructions
- **Schema File**: `consolidated-database-schema.sql` contains your complete database structure
- **Admin Script**: Run `node create-admin-for-new-db.js` to create an admin user
- **Supabase Docs**: https://supabase.com/docs

---

## 💡 Pro Tips

1. **Keep credentials secure**: Never commit `.env` files to git
2. **Test thoroughly**: Test all features before using in production
3. **Backup regularly**: Set up automatic backups in Supabase Dashboard
4. **Monitor usage**: Check your database usage in Supabase Dashboard
5. **Use different passwords**: Don't reuse passwords between projects

---

## 🔒 Security Notes

- Your **current database is 100% safe** - we didn't touch it
- The **new database is independent** - changes won't affect the old one
- Both databases can **run simultaneously** without any conflicts
- Use **different credentials** for each database
- Keep your **service role key secret** - it bypasses security

---

**That's it! You now have a complete copy of your database structure ready to use for your new project! 🎉**
