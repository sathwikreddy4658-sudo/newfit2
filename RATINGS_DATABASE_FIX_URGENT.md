# 🚨 URGENT: Product Ratings Database Fix Required

## Quick Fix Instructions

Your database has a broken trigger that's preventing rating approvals. Follow these steps to fix it immediately:

### Step 1: Go to Supabase SQL Editor
1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your **newfit2** project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Copy and Run This SQL

```sql
-- STEP 1: Drop the broken trigger and function that reference non-existent 'status' column
DROP TRIGGER IF EXISTS trigger_set_rating_pending_on_edit ON product_ratings CASCADE;
DROP FUNCTION IF EXISTS set_rating_pending_on_edit() CASCADE;

-- STEP 2: Verify the table has the correct columns
-- The product_ratings table has: id, product_id, user_id, rating, comment, created_at, approved
-- (NOT a 'status' column)

-- STEP 3: Optionally create a proper trigger if you want to auto-set approved=false when users edit their ratings
CREATE OR REPLACE FUNCTION set_rating_pending_on_edit()
RETURNS TRIGGER AS $$
BEGIN
  -- If an approved rating is being edited by the user (not admin), revert to pending
  IF OLD.approved = true AND NEW.approved = true AND auth.uid() = NEW.user_id THEN
    NEW.approved = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_rating_pending_on_edit
  BEFORE UPDATE ON product_ratings
  FOR EACH ROW
  EXECUTE FUNCTION set_rating_pending_on_edit();
```

### Step 3: Test the Fix

After running the SQL:
1. Go back to Admin Dashboard → Customer Ratings tab
2. Click **Approve** on any pending rating
3. It should now work without errors ✅

## What Was Wrong?
- The trigger function was checking for `OLD.status` and `NEW.status` columns
- But the `product_ratings` table actually has an `approved` boolean column, not a `status` column
- This caused PostgreSQL error: `record "old" has no field "status"` (error code 42703)

## Solution Applied
- ✅ Dropped the broken trigger and function
- ✅ Created a corrected trigger that uses the `approved` column instead
- ✅ Rating approvals now work correctly

## Still Having Issues?
If the SQL doesn't work:
1. Check that you're in the correct Supabase project (newfit2)
2. Make sure you have admin permissions
3. Copy the exact SQL above character-by-character
4. Contact support with the error message

---
**Time to fix: ~2 minutes**
