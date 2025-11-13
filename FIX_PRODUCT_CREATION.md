# How to Fix Product Creation Error

## Problem
Your form is trying to send `price_15g`, `price_20g`, `products_page_image`, and `cart_image` columns, but your database is missing these columns. This is why you're getting a **400 Bad Request** error.

## Solution
You need to add these columns to your `products` table in Supabase.

### Method 1: Using Supabase Dashboard (Easiest) ✅ RECOMMENDED

1. **Go to Supabase Dashboard**
   - Open: https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click **"SQL Editor"** in the left sidebar
   - Click **"New Query"** button (green button at top right)

3. **Copy and Paste This SQL:**
```sql
-- Add missing columns to products table for product management form
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS products_page_image TEXT,
ADD COLUMN IF NOT EXISTS cart_image TEXT;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS price_15g DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_20g DECIMAL(10,2);

-- For existing products that have price_15g and price_20g as NULL, set them from the price column
UPDATE public.products 
SET price_15g = COALESCE(price, 100)
WHERE price_15g IS NULL;

UPDATE public.products 
SET price_20g = COALESCE(price, 100) + 50
WHERE price_20g IS NULL;

-- Now make price_15g and price_20g NOT NULL
ALTER TABLE public.products
ALTER COLUMN price_15g SET NOT NULL,
ALTER COLUMN price_20g SET NOT NULL;
```

4. **Click "Run"**
   - You should see "Success" message
   - Wait for all statements to complete

5. **Verify**
   - Go to **Table Editor** in left sidebar
   - Click on **products** table
   - Scroll right to see the new columns: `products_page_image`, `cart_image`, `price_15g`, `price_20g`

### Method 2: Using the Migration File (If you have service role key)

If you have your service role key, you can run:
```bash
node run_missing_columns_migration.js
```

But first, add this to your `.env` file:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Get your Service Role Key:**
1. Go to Supabase Dashboard → Your Project
2. Click **Settings** (gear icon, bottom left)
3. Click **API** in left sidebar
4. Copy the **Service Role Key** (keep this secret!)
5. Add it to your `.env` file as `SUPABASE_SERVICE_ROLE_KEY`

---

## After Applying the Migration

1. **Refresh your browser** (Ctrl+R or Cmd+R)
2. **Go to admin dashboard** → Products
3. **Try creating a product again** - it should work now!

---

## What Was Wrong

Your `ProductsTab.tsx` form sends these fields:
- `price_15g` ✅ Now added
- `price_20g` ✅ Now added  
- `products_page_image` ✅ Now added
- `cart_image` ✅ Now added

But your database was missing these columns, causing a **400 Bad Request** error from Supabase.

---

## Next Time

The consolidated-database-schema.sql file has been updated with these columns, so if you create a new database, you won't have this issue.
