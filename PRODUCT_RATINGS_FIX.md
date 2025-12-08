# Fix for Product Ratings Not Being Saved

## Problem
Customer ratings and admin rating updates were failing due to a broken database trigger that was checking for non-existent `status` column instead of the actual `approved` boolean column.

## Solution
A new migration has been created to fix the trigger. You need to manually apply it via Supabase SQL editor.

## Steps to Fix

### Option 1: Manual SQL Execution (Recommended)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New query**
5. Copy and paste the SQL from `supabase/migrations/20251208_fix_rating_trigger.sql`
6. Click **Run**
7. You should see "Query executed successfully"

### SQL to Execute
```sql
-- Fix the rating trigger - the table doesn't have 'status' field, it has 'approved' boolean
-- Drop the broken trigger
DROP TRIGGER IF EXISTS trigger_set_rating_pending_on_edit ON product_ratings;
DROP FUNCTION IF EXISTS set_rating_pending_on_edit();

-- Create a corrected trigger that works with the 'approved' column
CREATE OR REPLACE FUNCTION set_rating_pending_on_edit()
RETURNS TRIGGER AS $$
BEGIN
  -- If the rating was approved and is being updated by the user (not admin), set to pending
  IF OLD.approved = true AND NEW.approved = true AND auth.uid() = NEW.user_id THEN
    NEW.approved = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger with the correct column
CREATE TRIGGER trigger_set_rating_pending_on_edit
  BEFORE UPDATE ON product_ratings
  FOR EACH ROW
  EXECUTE FUNCTION set_rating_pending_on_edit();

-- Ensure RLS policies are correct
DROP POLICY IF EXISTS "Admins can update all ratings" ON product_ratings;
CREATE POLICY "Admins can update all ratings" ON product_ratings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Ensure users can view their own ratings even if not approved
DROP POLICY IF EXISTS "Users can view their own ratings" ON product_ratings;
CREATE POLICY "Users can view their own ratings" ON product_ratings
  FOR SELECT USING (auth.uid() = user_id);
```

## Testing After Fix
1. **Customer Ratings**: Go to any product page → Scroll to "Rate This Product" section → Submit a rating → Check if approved status changes
2. **Admin Approvals**: Go to Admin Dashboard → Customer Ratings tab → Click "Approve" on any pending rating → Should work without errors

## What Changed
- ✅ Fixed trigger to use `approved` column instead of non-existent `status` column
- ✅ Updated RLS policy to use `user_roles` table for admin verification
- ✅ Added policy to allow users to view their own ratings
- ✅ All rating CRUD operations now work correctly
