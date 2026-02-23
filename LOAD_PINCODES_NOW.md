# 🚚 Load Pincode Data - Quick Start

## Problem
Your delivery check says "No delivery available" because the `pincodes` table is empty!

## Solution (2 Steps)

### ✅ Step 1: Run SETUP_COMPLETE_DATABASE.sql

This creates the pincodes table structure.

**Go to:** https://supabase.com/dashboard/project/oikibnfnhauymhfpxiwi/sql/new

Copy and paste the entire SETUP_COMPLETE_DATABASE.sql file → Click **RUN**

---

### ✅ Step 2: Import Pincode CSV Data

**⚠️ Use the COMPLETE CSV file:** **`Complete_All_States_Combined_Pincodes.csv`**

This file has State and District columns needed for shipping calculations!

**Option A - CSV Import (Easiest):**

1. Go to: https://supabase.com/dashboard/project/oikibnfnhauymhfpxiwi/editor
2. Click on **`pincodes`** table (left sidebar)
3. Click **Import data** button (top right)
4. Select **CSV**
5. Upload **`Complete_All_States_Combined_Pincodes.csv`**
6. Map columns:
   - `Pincode` → pincode
   - `State` → state
   - `District` → district
   - `Delivery` → delivery
   - `COD` → cod
7. Click **Import**
8. Wait for import to complete (~74,000 rows - may take 2-3 minutes)

---

**Option B - Manual Test Data (Quick Testing):**

If you just want to test with a few pincodes:

```sql
-- Run this in SQL Editor
INSERT INTO pincodes (pincode, state, district, delivery, cod)
VALUES 
  (560001, 'KARNATAKA', 'Bangalore', 'Y', 'Y'),
  (560002, 'KARNATAKA', 'Bangalore', 'Y', 'Y'),
  (560003, 'KARNATAKA', 'Bangalore', 'Y', 'Y'),
  (500067, 'TELANGANA', 'Hyderabad', 'Y', 'Y'),
  (500001, 'TELANGANA', 'Hyderabad', 'Y', 'Y'),
  (110001, 'DELHI', 'New Delhi', 'Y', 'Y'),
  (110002, 'DELHI', 'New Delhi', 'Y', 'Y'),
  (400001, 'MAHARASHTRA', 'Mumbai', 'Y', 'Y'),
  (400002, 'MAHARASHTRA', 'Mumbai', 'Y', 'Y'),
  (600001, 'TAMIL NADU', 'Chennai', 'Y', 'Y');
```

---

## Verify It Works

**Check data loaded:**

```sql
SELECT COUNT(*) as total_pincodes FROM pincodes;
SELECT COUNT(*) as deliverable FROM pincodes WHERE delivery = 'Y';
SELECT * FROM pincodes LIMIT 10;
```

**Test a specific pincode:**

```sql
SELECT * FROM pincodes WHERE pincode = 560001;
```

Should return:
```
pincode | state      | district  | delivery | cod
560001  | KARNATAKA  | Bangalore | Y        | Y
```

---

## How It Works

The app checks:
- `delivery = 'Y'` → ✅ Deliverable
- `delivery = 'N'` → ❌ Not deliverable
- `cod = 'Y'` → ✅ COD available
- `cod = 'N'` → ❌ COD not available

Now your checkout pincode checker will work! 🎉

---

## CSV File Location

✅ **Use this file:** **`Complete_All_States_Combined_Pincodes.csv`**

Location: **`d:\New folder (2)\newfit2\Complete_All_States_Combined_Pincodes.csv`**

This has State and District columns which are required for shipping rate calculations!

Format:
```
Pincode | State      | District  | Delivery | COD
797103  | NAGALAND   | DIMAPUR   | Y        | Y
560001  | KARNATAKA  | Bangalore | Y        | Y
```

---

❌ **Don't use:** `shipneer pincodes.csv` (missing State & District columns)
