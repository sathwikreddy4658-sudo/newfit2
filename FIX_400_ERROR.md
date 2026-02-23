# Fix 400 Error When Adding Products

## Problem
Getting 400 error when trying to add products because the database is missing required columns:
- `combo_3_discount`
- `combo_6_discount`
- `stock_status_15g`
- `stock_status_20g`

And missing tables:
- `product_faqs`
- `lab_reports`

## Solution

### Option 1: Run Complete Setup (RECOMMENDED)
Run the entire setup script to add everything at once:

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/oikibnfnhauymhfpxiwi
2. Click **SQL Editor** in the left sidebar
3. Open the file: `SETUP_COMPLETE_DATABASE.sql`
4. Copy all the SQL code
5. Paste it into the SQL Editor
6. Click **Run** button
7. Wait for all statements to complete
8. You should see "✅ Setup Complete!" at the end

This will:
- ✅ Add all 4 missing columns to products table
- ✅ Create product_faqs table with proper RLS policies
- ✅ Create lab_reports table with proper RLS policies
- ✅ Create lab-reports storage bucket
- ✅ Create blog-images storage bucket
- ✅ Verify everything was created successfully

### Option 2: Run Individual Scripts
If you prefer to run scripts one by one:

1. **Add missing product columns**: `add_all_missing_columns.sql`
2. **Create product FAQs table**: `create_product_faqs_table.sql` (already fixed with user_roles)
3. **Create lab reports table**: `create_lab_reports_now.sql`

## After Running SQL

1. **Restart your dev server** (Ctrl+C and run again)
2. **Try adding a product again** - should work now!
3. **Test all admin sections** - Products, Blogs, Lab Reports should all work

## What Was Fixed

### TypeScript Types
Updated `src/integrations/supabase/types.ts` to include:
- `stock_status_15g` and `stock_status_20g` in products table types
- `product_faqs` table types
- `lab_reports` table types
- `profiles` table types

### SQL Scripts
- Fixed `create_product_faqs_table.sql` to use `user_roles` instead of `profiles.is_admin`
- Created comprehensive setup script that adds everything

### Admin Panel
- Completely rebuilt with separate pages for each section
- Modern sidebar navigation
- Better routing structure

## Verify It Worked

After running the SQL and restarting:
1. Go to `/admin/products`
2. Click "Add Product"
3. Fill in the form
4. Should save without 400 error ✅
