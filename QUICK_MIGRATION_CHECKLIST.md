# ⚡ Quick Migration Checklist - Copy & Paste Ready

## 🎯 TL;DR: What to do in order

### NEW PROJECT SETUP (5 minutes)
- [ ] Create new Supabase project in different region
- [ ] Copy new credentials (URL, Anon Key, Service Role Key)
- [ ] Update `.env` file with new credentials

### SQL SCRIPTS - RUN IN THIS ORDER (15 minutes)

**Script 1 - Base Schema**
```sql
GO TO: Supabase SQL Editor
COPY & PASTE entire file: clean-database-schema.sql
CLICK: Run
WAIT: ~30 seconds
```

**Script 2 - Complete Setup**
```sql
COPY & PASTE entire file: SETUP_COMPLETE_DATABASE.sql
CLICK: Run
WAIT: ~1 minute
```

**Script 3 - Order Function**
```sql
COPY & PASTE entire file: UPDATE_ORDER_FUNCTION_WITH_GUEST_DATA.sql
CLICK: Run
WAIT: ~20 seconds
```

**Script 4 - Additional Functions (Optional)**
```sql
COPY & PASTE files:
- deploy_create_order_function.sql
- deploy_confirm_cod_function.sql
- add_missing_pincode_columns.sql
```

### DATA SETUP (10 minutes)

**Step 1: Import Pincode Data**
- [ ] Go to Supabase Table Editor
- [ ] Select `pincodes` table
- [ ] Click "Import data" → "CSV"
- [ ] Upload: `Complete_All_States_Combined_Pincodes.csv`
- [ ] Map columns (Pincode→pincode, State→state, District→district, Delivery→delivery, COD→cod)
- [ ] Click Import
- [ ] Wait 2-3 minutes

**Step 2: Create Admin User**
```bash
# BEFORE running, edit create_admin.js and update:
# Line 3: const supabaseUrl = 'YOUR_NEW_URL';
# Line 4: const supabaseServiceKey = 'YOUR_NEW_SERVICE_ROLE_KEY';

node create_admin.js
```

**Step 3: Add Admin Role**
```sql
-- Find admin user ID first:
SELECT id FROM auth.users WHERE email = 'admin@freelit.com';

-- Then run (replace UUID):
INSERT INTO user_roles (user_id, role)
VALUES ('PASTE_ADMIN_ID_HERE', 'admin');
```

**Step 4: Create Sample Products (Optional)**
```bash
# Edit create_sample_products.js with new credentials, then:
node create_sample_products.js
```

**Step 5: Setup Blog Bucket (If using blogs)**
```bash
# Files already have env vars, just run:
node setup-blog-bucket.js
```

### APPLICATION UPDATE (5 minutes)

- [ ] Update `.env` file with new Supabase credentials
- [ ] Update any hardcoded URLs in JS files (if any)
- [ ] Test application connects to new database
- [ ] Test PhonePe payment (should work fine!)

---

## 🔍 VERIFICATION COMMANDS

Run these in Supabase SQL Editor to verify everything:

```sql
-- 1. Check all tables exist
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_schema = 'public';

-- 2. Check storage buckets
SELECT id, name, public FROM storage.buckets;

-- 3. Check admin user
SELECT u.id, u.email, ur.role FROM auth.users u 
LEFT JOIN user_roles ur ON u.id = ur.user_id 
WHERE u.email = 'admin@freelit.com';

-- 4. Check pincodes
SELECT COUNT(*) as total_pincodes, 
       SUM(CASE WHEN delivery = 'Y' THEN 1 ELSE 0 END) as deliverable 
FROM pincodes;

-- 5. Check functions
SELECT proname FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname LIKE 'create_order%' OR proname LIKE '%updated_at%';
```

---

## ❓ QUICK FAQs

**Q: Will payment gateway break?**  
A: NO! PhonePe is independent of database region.

**Q: Should I delete old database?**  
A: NO! Keep it for 1-2 weeks as backup.

**Q: What if something goes wrong?**  
A: Update `.env` back to old URL and you're back online in 30 seconds.

**Q: How long does full migration take?**  
A: ~45 minutes (mostly waiting for CSV import)

**Q: Can I test new database before going live?**  
A: YES! Just update `.env` and test, then switch back.

**Q: Do I need to run ALL the SQL files?**  
A: NO! Just the 3 main ones (clean-database, SETUP_COMPLETE, UPDATE_ORDER_FUNCTION)

---

## 📞 CREDENTIALS FORMAT

When setting up, you'll need:

```
From New Supabase Project:
├── Project URL: https://XXXXXXXXXXXXX.supabase.co
├── Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
└── Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Into .env file:
VITE_SUPABASE_URL=https://XXXXXXXXXXXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚀 YOU'RE READY!

Follow the steps above in order and you'll have a complete backup database in a different region!

**Nothing will break. Payment gateway will still work. Go ahead!**
