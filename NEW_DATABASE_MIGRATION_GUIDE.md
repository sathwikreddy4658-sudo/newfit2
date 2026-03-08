# 🚀 Complete New Supabase Database Migration Guide

## ⚠️ IMPORTANT: Payment Gateway & Region

**Region does NOT affect PhonePe payment gateway!** Your Indian payment gateway will work fine regardless of database region because:
- PhonePe is a 3rd-party payment service that communicates with your API backend
- The database location doesn't matter for payment processing
- Your API backend can be anywhere and still connect to PhonePe

**Therefore, it's SAFE to migrate to a different region for your database backup.**

---

## 📋 Step-by-Step Migration Checklist

### PHASE 1: Create New Supabase Project in Different Region

1. Go to [supabase.com](https://supabase.com)
2. Create a new project with:
   - **Region**: Choose a different region (e.g., if current is `ap-northeast-1` Asia, try `eu-west-1` Europe or `us-east-1` US)
   - **Database Password**: Set a strong password
3. Note down:
   - **New URL**: `https://XXXXX.supabase.co`
   - **New Anon Key**: `eyJ...` (starts with eyJ)
   - **New Service Role Key**: `eyJ...` (different from anon key)

---

## 🗄️ PHASE 2: Execute Database Setup Scripts

Run these scripts **IN ORDER** in your new Supabase SQL Editor:

### **Step 1: Create Base Schema** (Run First)
```bash
File: clean-database-schema.sql
Location: Root of your project
```
✅ This creates:
- All base tables (profiles, products, orders, order_items, blogs, etc.)
- Enums (payment_method, payment_status, order_status, etc.)
- Base indexes
- Base RLS policies

### **Step 2: Complete Database Setup** (Run Second)
```bash
File: SETUP_COMPLETE_DATABASE.sql
Location: Root of your project
```
✅ This creates:
- `product_faqs` table
- `lab_reports` table with `lab-reports` storage bucket
- `saved_addresses` table
- `pincodes` table with delivery/COD info
- `blog-images` storage bucket
- Enhanced `promo_codes` table with free_shipping support
- All RLS policies for the above tables

### **Step 3: Update Order Function** (Run Third)
```bash
File: UPDATE_ORDER_FUNCTION_WITH_GUEST_DATA.sql
Location: Root of your project
```
✅ This creates:
- `create_order_with_items()` function that handles:
  - Guest checkout (customer_name, customer_email, customer_phone)
  - Pricing validation (anti-tamper checks)
  - Stock validation
  - COD charge support
  - Shipping charge support
  - Payment method tracking

### **Step 4: Additional Migration Files** (Optional but Recommended)
Run these for additional functionality:

```bash
-- Payment functions
File: deploy_create_order_function.sql
File: deploy_confirm_cod_function.sql

-- Pincode utilities
File: add_missing_pincode_columns.sql
File: add_location_based_promo_codes.sql
File: add_shipping_discount_promo.sql
File: update_pincode_policies.sql

-- Other utilities
File: add_all_missing_columns.sql
File: add_confirmed_status.js
File: add_cta_heading_to_blogs.sql
File: add_links_to_blogs.sql
```

---

## 📝 PHASE 3: Manual Data Setup & Configuration

### 1. **Load Pincode Data** (CRITICAL for shipping)

After creating the `pincodes` table:

1. Go to Supabase Table Editor → `pincodes` table
2. Click **Import data** → **CSV**
3. Upload: **Complete_All_States_Combined_Pincodes.csv**
4. Map columns:
   - `Pincode` → `pincode`
   - `State` → `state`
   - `District` → `district`
   - `Delivery` → `delivery` (Y/N)
   - `COD` → `cod` (Y/N)
5. Click **Import** (takes 2-3 minutes)

### 2. **Create Admin User**

```bash
# Update the hardcoded URL and keys in this file, then run:
node create_admin.js
```

**Note**: Replace in the file:
```javascript
const supabaseUrl = 'YOUR_NEW_SUPABASE_URL';
const supabaseServiceKey = 'YOUR_NEW_SERVICE_ROLE_KEY';
```

Creates admin user with:
- Email: `admin@freelit.com`
- Password: Change this! Use strong password in production
- Role: `admin` (set via user_roles table)

### 3. **Set Admin Role in Database**

In Supabase SQL Editor:
```sql
-- Get the admin user ID from the admin you just created
SELECT id, email FROM auth.users WHERE email = 'admin@freelit.com';

-- Insert admin role (replace UUID with actual admin user ID)
INSERT INTO user_roles (user_id, role)
VALUES ('ADMIN_USER_ID_HERE', 'admin');
```

### 4. **Create Sample Products** (Optional)

```bash
# Update the keys in this file, then run:
node create_sample_products.js
```

This creates sample products for testing:
- CHOCO NUT Protein Bar
- VANILLA DELIGHT Protein Bar
- And others...

### 5. **Create Blog Image Bucket** (If using blogs)

```bash
# Update keys in .env, then run:
node setup-blog-bucket.js
```

---

## 🔧 PHASE 4: Update Application Configuration

Update your application environment to use the new Supabase credentials:

### **In your `.env` file (or `.env.local`)**:
```env
VITE_SUPABASE_URL=https://YOUR_NEW_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_NEW_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_NEW_SERVICE_ROLE_KEY
```

### **In hardcoded setup scripts** (if any):
- `create_admin.js`
- `create_sample_products.js`
- `setup-blog-bucket.js`
- `check_lab_reports_setup.js`
- Any other Node.js files in root

Replace:
```javascript
const supabaseUrl = 'https://oikibnfnhauymhfpxiwi.supabase.co';
```
with:
```javascript
const supabaseUrl = 'https://YOUR_NEW_PROJECT.supabase.co';
```

---

## 📊 PHASE 5: Database Objects Reference

### **Tables Created**
| Table | Purpose | Key Columns |
|-------|---------|------------|
| `profiles` | User profiles | id, name, email, address |
| `products` | Product catalog | id, name, price, stock, category |
| `orders` | Customer orders | id, user_id, total_price, status |
| `order_items` | Items in orders | order_id, product_id, quantity |
| `user_roles` | Admin/user roles | user_id, role |
| `blogs` | Blog posts | id, title, content, slug |
| `promo_codes` | Discounts/offers | code, discount_percentage, free_shipping |
| `promo_code_usage` | Track code usage | promo_code_id, user_id |
| `product_ratings` | User reviews | product_id, user_id, rating |
| `rating_votes` | Vote on reviews | rating_id, user_id |
| `payment_transactions` | Payment records | order_id, merchant_txn_id, status |
| `product_faqs` | Product Q&A | product_id, question, answer |
| `lab_reports` | Lab test results | product_id, file_url, test_type |
| `saved_addresses` | User address book | user_id, street_address, city |
| `pincodes` | Delivery serviceability | pincode, state, delivery_available, cod_available |
| `newsletter_subscribers` | Email list | email |

### **Storage Buckets**
| Bucket | Purpose | Public | File Types |
|--------|---------|--------|-----------|
| `blog-images` | Blog images | Yes | JPEG, PNG, WebP, GIF (5MB max) |
| `lab-reports` | Product test reports | Yes | PDF, images |
| `product-images` | Product photos | Yes | Images |

### **Database Functions**
| Function | Purpose | Parameters |
|----------|---------|-----------|
| `create_order_with_items()` | Create order atomically | user_id, total_price, address, payment_id, items, discounts, charges |
| `update_updated_at_column()` | Auto-update timestamp | -- (trigger function) |

### **Data Types (ENUMs)**
```sql
-- product_category: 'protein_bars', 'dessert_bars', 'chocolates'
-- order_status: 'pending', 'shipped', 'delivered', 'cancelled', 'paid'
-- app_role: 'admin', 'user'
-- payment_status: 'INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED'
-- payment_method: 'UPI', 'CARD', 'NET_BANKING', 'WALLET', 'PAY_PAGE'
```

### **RLS (Row Level Security) Policies**
All tables have RLS enabled with appropriate policies:
- **Public access**: profiles (limited), products, blogs, pincodes
- **Authenticated access**: orders, order_items, saved_addresses, promo_code_usage
- **Admin only**: product_faqs, payment_transactions, user_roles
- **Storage**: bucket-specific access policies

---

## 🔐 PHASE 6: Security Configuration

### **1. Update Auth Settings**
In new Supabase project → Authentication → Providers:
- Enable/disable signup as needed
- Configure email templates
- Set up auth redirects

### **2. Create Secrets** (if using PhonePe)
Go to Supabase → Project Settings → Secrets:
```
PHONEPE_API_KEY = your_key
PHONEPE_MERCHANT_ID = your_merchant_id
PHONEPE_ENDPOINT_URL = https://api.phonepe.com/...
```

### **3. RLS Policies** 
All RLS policies are created automatically by the SQL scripts above. Verify:
```sql
-- In Supabase SQL Editor:
SELECT tablename, * FROM pg_policies;
```

---

## ✅ PHASE 7: Verification Checklist

After migration, verify everything:

### **Database Tables**
```sql
-- Should show all 16+ tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### **Storage Buckets**
```sql
-- Should show: blog-images, lab-reports, product-images
SELECT id, name, public FROM storage.buckets;
```

### **Functions**
```sql
-- Should show create_order_with_items and others
SELECT proname FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

### **Admin User**
```sql
-- Should return one row for admin@freelit.com
SELECT u.id, u.email, ur.role 
FROM auth.users u 
LEFT JOIN user_roles ur ON u.id = ur.user_id 
WHERE u.email = 'admin@freelit.com';
```

### **Pincode Data**
```sql
-- Should show ~74,000 rows
SELECT COUNT(*) as total_pincodes FROM pincodes;

-- Should show deliverable pincodes
SELECT COUNT(*) as deliverable FROM pincodes WHERE delivery = 'Y';
```

### **Application Connection**
Deploy app with new credentials and test:
- Login page works
- Products load
- Shopping cart works
- Checkout with COD works
- PhonePe payment initiation works
- Admin dashboard loads

---

## 🔗 Remote Connectivity Notes

If your new database is in a different region/country:

✅ **This WON'T cause issues**:
- Payment gateway functionality (PhonePe still works)
- API calls (slightly higher latency, typically < 200ms)
- Authentication (Supabase handles this efficiently)
- File uploads/downloads

⚠️ **Monitor these** (usually not an issue):
- Latency from your server location to database
- Bandwidth for CSV imports (pincode data)
- Data residency compliance for different countries

---

## 🆘 Troubleshooting

### **"Bucket not found" error**
Run: `node setup-blog-bucket.js` again after updating credentials

### **"Pincodes table empty" errors**
Ensure CSV was imported with correct column mapping

### **"Admin user not found"**
Run `create_admin.js` again and verify:
```sql
SELECT * FROM auth.users WHERE email = 'admin@freelit.com';
INSERT INTO user_roles (user_id, role) VALUES ('UUID', 'admin');
```

### **PhonePe integration not working**
- Verify `PHONEPE_API_KEY` secret is set in new project
- Check payment transaction logs: `SELECT * FROM payment_transactions LIMIT 5;`
- Ensure API backend can reach PhonePe (region doesn't matter)

---

## 📞 Support Questions

**Q: Will existing customers' data be migrated?**  
A: This is a fresh database setup. Export customer data from old DB and import if needed.

**Q: How do I switch back if something goes wrong?**  
A: Update `.env` with old credentials. Always keep old Supabase project active initially.

**Q: Can I run both databases in parallel?**  
A: Yes! Update `.env` to switch between them for testing.

**Q: Is the PhonePe merchant account tied to region?**  
A: No, PhonePe account is independent of database location.

---

## 📁 Files Summary

```
Root directory files needed:
├── clean-database-schema.sql                    ← Run FIRST
├── SETUP_COMPLETE_DATABASE.sql                  ← Run SECOND
├── UPDATE_ORDER_FUNCTION_WITH_GUEST_DATA.sql    ← Run THIRD
├── create_admin.js                              ← Run for admin user
├── create_sample_products.js                    ← Optional
├── setup-blog-bucket.js                         ← Optional
├── Complete_All_States_Combined_Pincodes.csv    ← CSV import in UI
└── .env (UPDATE with new credentials)           ← Critical!
```

---

**Ready to migrate? Start with PHASE 2 Step 1!** 🚀
