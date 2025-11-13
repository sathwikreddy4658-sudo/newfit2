# Database Clone Guide - Complete Step-by-Step Instructions

This guide will help you create an exact copy of your current Supabase database schema for use with another project, without affecting your existing database.

## Overview

Your current database includes:
- **Tables**: profiles, products, orders, order_items, user_roles, blogs, promo_codes, product_ratings, payment_transactions, newsletter_subscribers
- **Enums**: product_category, order_status, app_role, payment_status, payment_method
- **Functions**: has_role, handle_new_user, update_updated_at_column, create_payment_transaction, update_payment_transaction_status
- **Row Level Security (RLS)**: Enabled on all tables with comprehensive policies
- **Storage**: product-images bucket
- **Triggers**: Auto-update timestamps, new user handling

## Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- Node.js installed (for running scripts)
- Access to Supabase Dashboard

---

## Step 1: Create a New Supabase Project

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Click "New Project"**
3. **Fill in the details**:
   - Project Name: `freelit-clone` (or your preferred name)
   - Database Password: Choose a strong password (save this!)
   - Region: Choose the same region as your current project for consistency
   - Pricing Plan: Free tier is fine for testing
4. **Click "Create new project"**
5. **Wait for the project to be created** (takes 1-2 minutes)

---

## Step 2: Get Your New Project Credentials

Once the project is created:

1. Go to **Project Settings** (gear icon in sidebar)
2. Go to **API** section
3. Copy and save these values:
   - **Project URL**: `https://[your-project-ref].supabase.co`
   - **Project API Key (anon, public)**: `eyJ...`
   - **Project API Key (service_role, secret)**: `eyJ...`
4. Go to **Database** section
5. Copy the **Connection String** (you'll need this for migrations)

---

## Step 3: Initialize Supabase in a New Directory (Optional)

If you want to manage the new database separately:

```bash
# Create a new directory for the cloned project
mkdir freelit-clone
cd freelit-clone

# Initialize Supabase
supabase init

# Link to your new project
supabase link --project-ref [your-new-project-ref]
```

**OR** you can use the existing migrations from your current project.

---

## Step 4: Apply Database Schema to New Project

### Option A: Using Supabase CLI (Recommended)

1. **Copy all migration files** from your current project to the new project's `supabase/migrations` folder

2. **Link to the new project**:
```bash
supabase link --project-ref [your-new-project-ref]
```

3. **Push migrations to the new database**:
```bash
supabase db push
```

This will apply all migrations in order to your new database.

### Option B: Using the Consolidated Schema File

1. **Use the consolidated schema file** provided: `consolidated-database-schema.sql`

2. **Apply via Supabase Dashboard**:
   - Go to your new project in Supabase Dashboard
   - Click on **SQL Editor** in the sidebar
   - Click **New Query**
   - Copy the entire contents of `consolidated-database-schema.sql`
   - Paste into the SQL editor
   - Click **Run** (or press Ctrl+Enter)

3. **Verify the schema**:
   - Go to **Table Editor** to see all tables
   - Go to **Database** → **Roles** to verify RLS policies

### Option C: Using psql (Command Line)

```bash
# Connect to your new database
psql "postgresql://postgres:[your-password]@db.[your-project-ref].supabase.co:5432/postgres"

# Run the consolidated schema
\i consolidated-database-schema.sql

# Exit
\q
```

---

## Step 5: Verify the Database Schema

1. **Check Tables**:
   - Go to **Table Editor** in Supabase Dashboard
   - Verify all tables are created:
     - profiles
     - products
     - orders
     - order_items
     - user_roles
     - blogs
     - promo_codes
     - product_ratings
     - payment_transactions
     - newsletter_subscribers

2. **Check Storage**:
   - Go to **Storage** in Supabase Dashboard
   - Verify `product-images` bucket exists

3. **Check Functions**:
   - Go to **Database** → **Functions**
   - Verify functions exist:
     - has_role
     - handle_new_user
     - update_updated_at_column
     - create_payment_transaction
     - update_payment_transaction_status

4. **Check RLS Policies**:
   - Go to **Authentication** → **Policies**
   - Verify policies are enabled for all tables

---

## Step 6: Configure Your New Project

### Update Environment Variables

Create a new `.env` file for your new project (or update existing):

```env
# New Database Credentials
VITE_SUPABASE_URL=https://[your-new-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ[your-new-anon-key]...

# For server-side operations (keep this secret!)
SUPABASE_SERVICE_ROLE_KEY=eyJ[your-new-service-role-key]...
```

### Update Supabase Client Configuration

If you're creating a separate project, update your Supabase client initialization:

```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## Step 7: Test the New Database

1. **Test Authentication**:
   - Try signing up a new user
   - Verify the user is created in `auth.users`
   - Verify a profile is automatically created in `profiles` table
   - Verify user role is assigned in `user_roles` table

2. **Test Basic Operations**:
   - Try viewing products (should work without authentication)
   - Try creating an order (requires authentication)
   - Verify RLS policies are working correctly

3. **Test Admin Functions** (if needed):
   - Create an admin user using the provided script
   - Test admin-only operations

---

## Step 8: Create an Admin User (Optional)

If you need an admin user in your new database:

1. **First, sign up a regular user** through your application
2. **Get the user's ID** from the Supabase Dashboard (Authentication → Users)
3. **Run this SQL** in the SQL Editor:

```sql
-- Replace 'user-uuid-here' with the actual user ID
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

**OR** use the provided script:

```bash
node create-admin-for-new-db.js
```

---

## Step 9: Copy Data (Optional - Only if Needed)

If you want to copy existing data from your current database to the new one:

⚠️ **Warning**: This will copy all data including users, orders, products, etc.

### Using the Data Export/Import Scripts

1. **Export data from current database**:
```bash
node export-database-data.js
```

This creates a `database-export.json` file with all your data.

2. **Import data to new database**:
```bash
node import-database-data.js
```

This imports the data into your new database.

### Manual Data Copy (Alternative)

You can also copy data manually using the Supabase Dashboard:
1. Go to **Table Editor**
2. Select a table
3. Export as CSV
4. Switch to new project
5. Import CSV into the same table

---

## Important Notes

### Security Considerations

1. **Never commit credentials**: Keep your `.env` files out of version control
2. **Use different credentials**: Your new database should have different passwords and API keys
3. **RLS is enabled**: All tables have Row Level Security enabled by default
4. **Service role key**: Keep the service role key secret - it bypasses RLS

### Database Isolation

- ✅ Your **current database is completely safe** - we're not touching it
- ✅ The **new database is independent** - changes won't affect the old one
- ✅ You can **test freely** in the new database without any risk
- ✅ Both databases can **run simultaneously** without conflicts

### Cost Considerations

- Free tier includes: 500MB database, 1GB file storage, 50,000 monthly active users
- If you need more, consider upgrading to Pro plan
- Both databases count towards your organization's project limit

---

## Troubleshooting

### Migration Errors

If you encounter errors during migration:

1. **Check the error message** - it usually indicates which migration failed
2. **Verify the order** - migrations should run in chronological order
3. **Check dependencies** - some migrations depend on previous ones
4. **Manual fix**: You can run individual migrations manually in SQL Editor

### RLS Policy Issues

If you can't access data:

1. **Check if you're authenticated** - most operations require authentication
2. **Verify user roles** - admin operations require admin role
3. **Check RLS policies** - go to Authentication → Policies
4. **Temporarily disable RLS** for testing (not recommended for production):
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

### Connection Issues

If you can't connect to the database:

1. **Verify credentials** - check your `.env` file
2. **Check project status** - ensure project is active in Supabase Dashboard
3. **Network issues** - try accessing from a different network
4. **Firewall** - ensure your firewall allows connections to Supabase

---

## Next Steps

After successfully cloning your database:

1. **Update your application** to use the new database credentials
2. **Test thoroughly** before using in production
3. **Set up backups** for the new database
4. **Configure monitoring** and alerts
5. **Document any differences** between the two databases

---

## Support

If you encounter any issues:

1. Check Supabase documentation: https://supabase.com/docs
2. Supabase Discord community: https://discord.supabase.com
3. GitHub issues: https://github.com/supabase/supabase/issues

---

## Summary Checklist

- [ ] Created new Supabase project
- [ ] Saved new project credentials
- [ ] Applied database schema (migrations or consolidated SQL)
- [ ] Verified all tables exist
- [ ] Verified storage bucket exists
- [ ] Verified functions exist
- [ ] Verified RLS policies are enabled
- [ ] Updated environment variables
- [ ] Tested authentication
- [ ] Tested basic operations
- [ ] Created admin user (if needed)
- [ ] Copied data (if needed)
- [ ] Tested application with new database

---

**Congratulations!** You now have an exact copy of your database schema that you can use for your new project without affecting your current database.
