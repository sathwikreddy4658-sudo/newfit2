# 📋 All SQL Files Reference - What Each One Does

## CRITICAL FILES (MUST RUN IN ORDER)

### 1️⃣ `clean-database-schema.sql` - RUN FIRST
**Purpose**: Creates the base database structure

**Creates**:
- Enums (product_category, order_status, payment_status, etc.)
- Tables:
  - `profiles` - user info
  - `products` - product catalog  
  - `orders` - customer orders
  - `order_items` - items within orders
  - `user_roles` - admin/user roles
  - `blogs` - blog posts
  - `promo_codes` - discount codes
  - `promo_code_usage` - track code usage
  - `newsletter_subscribers` - email list
  - `product_ratings` - user reviews
  - `rating_votes` - vote on reviews
  - `payment_transactions` - payment records
- Base indexes
- Base RLS policies

**Run Time**: ~30 seconds  
**Size**: ~25 KB

---

### 2️⃣ `SETUP_COMPLETE_DATABASE.sql` - RUN SECOND
**Purpose**: Adds advanced tables and storage buckets

**Creates**:
- Additional columns for `products` table (combo discounts, stock status)
- Table: `product_faqs` - Q&A for products
- Table: `lab_reports` - lab test results for products
- Storage bucket: `lab-reports` (public, 5MB max)
- Table: `saved_addresses` - user address book
- Table: `pincodes` - pincode delivery data (~74k rows)
- Storage bucket: `blog-images` (public, 5MB max)
- Enhanced `promo_codes` table (free_shipping support)
- All RLS policies for above tables

**Run Time**: ~1-2 minutes  
**Size**: ~35 KB

---

### 3️⃣ `UPDATE_ORDER_FUNCTION_WITH_GUEST_DATA.sql` - RUN THIRD
**Purpose**: Creates main order creation function with guest support

**Creates**:
- Function: `create_order_with_items()` with parameters:
  - p_user_id
  - p_total_price
  - p_address
  - p_payment_id
  - p_items (JSON array)
  - p_discount_amount (optional)
  - p_customer_name (optional, for guests)
  - p_customer_email (optional, for guests)
  - p_customer_phone (optional, for guests)
  - p_shipping_charge (optional)
  - p_cod_charge (optional)
  - p_payment_method (optional, default 'cod')

**Features**:
- Validates prices (anti-tamper)
- Validates product stock
- Checks address format
- Creates order atomically
- Creates order items
- Supports COD charges
- Supports shipping charges
- Saves guest customer details

**Run Time**: ~20 seconds  
**Size**: ~15 KB

---

## OPTIONAL FILES (FUNCTIONAL ENHANCEMENTS)

### `deploy_create_order_function.sql`
**Purpose**: Alternative/additional order creation function  
**When to use**: If you need different order creation logic  
**Creates**: Enhanced `create_order_with_items()` variant

### `deploy_confirm_cod_function.sql`
**Purpose**: Function to confirm COD order payment  
**When to use**: For COD order confirmation workflow  
**Creates**: `confirm_cod_payment()` function

### `add_missing_pincode_columns.sql`
**Purpose**: Adds missing columns to pincodes table  
**When to use**: If pincodes table was created without all columns  
**Adds columns**: district, delivery, cod (if missing)

### `add_location_based_promo_codes.sql`
**Purpose**: Promo codes specific to locations/pincodes  
**When to use**: For location-based promotions  
**Adds**: Location filtering to promo codes

### `add_shipping_discount_promo.sql`
**Purpose**: Promo codes that provide free shipping  
**When to use**: For free shipping promotions  
**Modifies**: `promo_codes` table to support free_shipping

### `update_pincode_policies.sql`
**Purpose**: Updates RLS policies for pincode access  
**When to use**: If you need to change who can read/write pincodes  
**Modifies**: RLS policies on pincodes table

### `add_all_missing_columns.sql`
**Purpose**: Adds all miscellaneous missing columns to various tables  
**When to use**: General catch-all for any missing columns  
**Adds**: Various columns across products, orders, etc.

### `add_confirmed_status.js`
**Purpose**: JavaScript file to add 'confirmed' status to orders  
**When to use**: If you need to track order confirmation  
**What it does**: Updates orders table with confirmed status

### `add_cta_heading_to_blogs.sql`
**Purpose**: Adds CTA (Call To Action) heading field to blogs  
**When to use**: For blog CTA functionality  
**Adds column**: cta_heading to blogs table

### `add_links_to_blogs.sql`
**Purpose**: Adds related links field to blogs  
**When to use**: For blog internal/external links  
**Adds columns**: links (JSONB) to blogs table

---

## MIGRATION FILES (From Supabase Migrations)

These are auto-generated migration files from Supabase:

### `supabase/migrations/20251013055836_*.sql`
First migration in sequence

### `supabase/migrations/20251013055757_*.sql`
Early order creation function

### `supabase/migrations/001_create_lab_reports_table.sql`
Lab reports table and bucket setup

And many others...

**Note**: These are created by Supabase's migration system. They're for version control and audit. You don't need to run them separately if you run the consolidated scripts above.

---

## VERIFICATION SCRIPTS

### `clean-database-schema.sql` (lines 660-685)
Has built-in SQL checks:
```sql
SELECT 'Storage Buckets:' as check_type, id, name, public 
FROM storage.buckets 
WHERE id IN ('product-images');
```

### `SETUP_COMPLETE_DATABASE.sql` (lines 380-418)
Has comprehensive verification:
```sql
-- Checks tables exist
-- Checks storage buckets
-- Checks product columns
-- Checks promo codes columns
```

---

## 🎯 EXECUTION PLAN

### MINIMUM SETUP (10 minutes)
1. Run `clean-database-schema.sql`
2. Run `SETUP_COMPLETE_DATABASE.sql`  
3. Run `UPDATE_ORDER_FUNCTION_WITH_GUEST_DATA.sql`
4. Import pincode CSV

**Result**: Fully functional database with orders, products, payments

### COMPLETE SETUP (15 minutes)
Above + run all optional files that match your feature set

**Result**: Database with labs, blogs, FAQs, advanced promo codes

---

## 📊 Data Dependencies

**Order**: Create scripts must run in this order because:
1. Base schema first (tables must exist)
2. Additional tables second (depend on base tables)
3. Order function third (depends on orders table)

---

## 🔒 Security Notes

- All tables have RLS (Row Level Security) enabled
- Policies control who can access what data
- Service Role Key bypasses RLS (for admin operations)
- Anon Key has limited access (for guest users)

---

## 💾 Total Size

All SQL scripts combined: ~100 KB  
Pincode CSV data: ~5 MB  
Product images bucket: Unlimited (5MB per file)  
Lab reports bucket: Unlimited (as configured)  

---

## ✅ Checklist

- [ ] Run clean-database-schema.sql
- [ ] Run SETUP_COMPLETE_DATABASE.sql
- [ ] Run UPDATE_ORDER_FUNCTION_WITH_GUEST_DATA.sql
- [ ] Import pincode CSV
- [ ] Run optional scripts (if needed)
- [ ] Verify all tables exist
- [ ] Verify order function works
- [ ] Create admin user
- [ ] Test application connection

**That's it!** Your new Supabase database is ready! 🚀
