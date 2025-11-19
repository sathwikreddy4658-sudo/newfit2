# 📦 Load Shipneer Pincodes Data

## How It Works Now

The pincode checker now works with Shipneer's CSV format:

```
pincode | state    | district   | delivery | cod
--------|----------|------------|----------|-----
560001  | KARNATAKA| Bangalore  | Y        | Y
500067  | TELANGANA| Hyderabad  | Y        | Y
110001  | DELHI    | New Delhi  | Y        | Y
```

**Logic:**
- `delivery = 'Y'` → Pincode is deliverable ✅
- `delivery = 'N'` → Pincode is NOT deliverable ❌
- `cod = 'Y'` → COD is available at this pincode ✅
- `cod = 'N'` → COD is NOT available ❌

---

## Steps to Load Shipneer Data

### Step 1: Get Your Shipneer CSV File

You should have a CSV file from Shipneer with columns:
```
pincode, state, district, postal_division, taluk, delivery, cod
```

### Step 2: Open Supabase Console

Go to: https://app.supabase.com → Your Project → SQL Editor

### Step 3: Upload CSV Data (Easiest Way)

**Option A: Using Supabase CSV Import Tool**

1. Go to **Table Editor** (left sidebar)
2. Click on **pincodes** table
3. Click **Import data** → **CSV**
4. Select your Shipneer CSV file
5. Click **Import**

Supabase will automatically map columns to your table.

---

**Option B: Using SQL Editor (Manual)**

1. Go to **SQL Editor**
2. Create temporary table:
```sql
CREATE TEMP TABLE shipneer_import (
  pincode INTEGER,
  state TEXT,
  district TEXT,
  postal_division TEXT,
  taluk TEXT,
  delivery TEXT,
  cod TEXT
);
```

3. Copy all rows from CSV into the table (using SQL INSERT statements)
4. Then run:
```sql
INSERT INTO pincodes (pincode, state, district, postal_division, taluk, delivery, cod)
SELECT * FROM shipneer_import;
```

---

### Step 4: Verify the Data

Run this in **SQL Editor**:

```sql
-- Check total pincodes loaded
SELECT COUNT(*) as total FROM pincodes;

-- Check how many are deliverable
SELECT COUNT(*) as deliverable FROM pincodes WHERE delivery = 'Y';

-- Check specific pincode
SELECT * FROM pincodes WHERE pincode = 560001;
```

---

## Test in Your App

### Test 1: Basic Deliverability
```
1. Go to checkout
2. Enter pincode: 560001
3. Click "Check"
4. Expected: ✅ Delivery Available!
5. Should show: KARNATAKA | ₹50 | 2 days
```

### Test 2: COD Availability
```
1. Same as above
2. Should show: COD ✅ Available
3. Try to select COD payment
4. Expected: Button should NOT be disabled
```

### Test 3: Non-Deliverable Pincode
```
1. Enter pincode: 999999 (doesn't exist)
2. Click "Check"
3. Expected: ❌ Delivery not available for this pincode
4. Payment buttons stay disabled
```

### Test 4: COD Not Available
Find a pincode in your CSV where `delivery = 'Y'` but `cod = 'N'`:
```
1. Enter that pincode
2. Click "Check"
3. Should show: ✅ Delivery Available
4. But COD button should be disabled
5. Message: "Cash on Delivery not available for this pincode"
```

---

## Example: Quick Test Data

If you don't have the full Shipneer CSV yet, add these test rows:

Run in **SQL Editor**:

```sql
INSERT INTO pincodes (pincode, state, district, delivery, cod) VALUES
-- Deliverable with COD
(560001, 'KARNATAKA', 'Bangalore', 'Y', 'Y'),
(500067, 'TELANGANA', 'Hyderabad', 'Y', 'Y'),
(110001, 'DELHI', 'New Delhi', 'Y', 'Y'),
(400001, 'MAHARASHTRA', 'Mumbai', 'Y', 'Y'),
(700001, 'WEST BENGAL', 'Kolkata', 'Y', 'Y'),
(600001, 'TAMIL NADU', 'Chennai', 'Y', 'Y'),
(682001, 'KERALA', 'Kochi', 'Y', 'Y'),
(380001, 'GUJARAT', 'Ahmedabad', 'Y', 'Y'),

-- Deliverable but NO COD
(201001, 'UTTAR PRADESH', 'Noida', 'Y', 'N'),
(474001, 'MADHYA PRADESH', 'Indore', 'Y', 'N'),

-- NOT Deliverable
(999999, 'UNKNOWN', 'Unknown', 'N', 'N')
ON CONFLICT (pincode) DO UPDATE SET delivery = EXCLUDED.delivery, cod = EXCLUDED.cod;
```

Then test with all these pincodes!

---

## Troubleshooting

### Problem: Checker still says "not available"
**Solution:** Verify the pincode exists in your table:
```sql
SELECT * FROM pincodes WHERE pincode = 560001;
```
If no rows, the pincode wasn't imported.

### Problem: CSV import failed
**Solution:** Check column names match:
- `pincode` (must be INTEGER)
- `state` (TEXT)
- `district` (TEXT)
- `delivery` (TEXT - should be 'Y' or 'N')
- `cod` (TEXT - should be 'Y' or 'N')

### Problem: Data imported but checker still broken
**Solution:** Check the column names in your CSV. They might be different. If so, update `pincodeService.ts` to use your actual column names:

```typescript
// If your CSV uses different names, change these:
const isDeliverable = data.delivery === 'Y';  // Change 'delivery' to your column name
const shipneerCodAvailable = data.cod === 'Y'; // Change 'cod' to your column name
```

---

## How the Code Works Now

When user enters pincode **560001**:

```
1. User clicks "Check"
2. Code calls: getShippingRate(560001)
3. Database query: SELECT * FROM pincodes WHERE pincode = 560001
4. Returns: {pincode: 560001, state: 'KARNATAKA', delivery: 'Y', cod: 'Y', ...}
5. Code checks: delivery === 'Y' → TRUE ✅
6. Code checks: cod === 'Y' → TRUE ✅
7. Code looks up: STATE_SHIPPING_RATES['KARNATAKA'] = {charge: 50, ...}
8. Returns: {serviceable: true, charge: 50, codAvailable: true, ...}
9. UI shows: ✅ Delivery Available! | KARNATAKA | ₹50 | 2 days
10. Payment buttons unlock
```

---

## Next Steps

1. ✅ Get your Shipneer CSV file
2. ✅ Upload to Supabase using CSV Import
3. ✅ Run verification queries above
4. ✅ Test with pincode 560001 (or any in your data)
5. ✅ Verify delivery checker shows ✅
6. ✅ Verify COD button works/gets disabled correctly
7. ✅ Production ready!

---

## Questions?

- **"Where's the Shipneer CSV?"** → You should have it from Shipneer. Ask your account manager.
- **"CSV has different column names?"** → Update `pincodeService.ts` to match your column names.
- **"How many pincodes?"** → Usually 21,000+ deliverable pincodes in India.
- **"What if state not in STATE_SHIPPING_RATES?"** → Falls back to generic rate (₹100, 3 days).
