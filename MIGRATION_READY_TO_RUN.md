# Database Migration SQL - Ready to Copy & Paste 📋

## ⚠️ CRITICAL: Run This in Supabase Before Deployment

Copy the SQL code below and run it in your Supabase SQL Editor.

---

## Instructions

1. Go to: https://app.supabase.com
2. Select your project
3. Click "SQL Editor" (left sidebar)
4. Click "New Query"
5. **Copy all the code below**
6. **Paste into the SQL editor**
7. **Click "Run"** button
8. **Verify** the output shows "links | jsonb"

---

## SQL Code to Run

```sql
-- Add links column to blogs table for CTA (Call-To-Action) links feature
-- This enables the rich text editor's CTA links functionality

-- First, add the column if it doesn't already exist
ALTER TABLE blogs
ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb;

-- Create index for better query performance on JSON data
CREATE INDEX IF NOT EXISTS idx_blogs_links ON blogs USING GIN (links);

-- Verify the column was added successfully
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'blogs' AND column_name = 'links';
```

---

## Expected Output

After running, you should see:

```
column_name | data_type
-----------+-----------
links       | jsonb
(1 row)
```

**If you see this output, the migration was successful! ✅**

---

## What This Does

### 1. `ALTER TABLE blogs ADD COLUMN...`
- **Purpose**: Adds a new `links` column to the blogs table
- **Type**: JSONB (JSON Binary - optimized for JSON queries)
- **Default**: Empty array `[]` for new blogs
- **Effect**: Existing blogs get empty array default

### 2. `CREATE INDEX...`
- **Purpose**: Creates an index for faster queries
- **Type**: GIN (Generalized Inverted Index)
- **Why**: Makes searching/filtering JSON data much faster
- **Impact**: No visible change, just improves performance

### 3. `SELECT column_name...`
- **Purpose**: Verifies the column was created
- **Output**: Shows column name and type
- **Result**: Confirms migration success

---

## Data Format for Links

Blog links are stored as JSON in this format:

```json
[
  {
    "text": "Learn More",
    "url": "https://example.com"
  },
  {
    "text": "Shop Now",
    "url": "https://shop.example.com"
  }
]
```

**Text**: Button label that users see
**URL**: Where the button links to

---

## Timing

| Step | Time |
|------|------|
| Open Supabase | 10 seconds |
| Create new query | 5 seconds |
| Copy & paste SQL | 5 seconds |
| Run migration | < 1 second |
| Verify output | 5 seconds |
| **Total** | **~25 seconds** |

---

## Safety Check

✅ **This migration is SAFE because**:
- Only ADDS a column (doesn't delete anything)
- Only CREATES an index (doesn't modify existing data)
- Has `IF NOT EXISTS` clauses (won't error if already run)
- Only SELECTS for verification (read-only)

❌ **Does NOT**:
- Delete any data
- Drop any tables or columns
- Break existing functionality
- Modify existing content

---

## Rollback Instructions (If Needed)

If something goes wrong, you can undo with:

```sql
-- Remove the index
DROP INDEX IF EXISTS idx_blogs_links;

-- Remove the column (optional - only if absolutely necessary)
ALTER TABLE blogs DROP COLUMN IF EXISTS links;
```

**Note**: You should only do this if something is clearly broken. In most cases, it's safe to leave the column and index in place.

---

## Troubleshooting

### Error: "Permission denied"
**Cause**: You don't have admin access to the project
**Solution**: Use account with admin/owner access

### Error: "Column already exists"
**Cause**: Migration was already run before
**Solution**: This is fine! The `IF NOT EXISTS` prevents errors. No action needed.

### Error: "Table blogs does not exist"
**Cause**: The blogs table hasn't been created yet
**Solution**: First run migrations that create the blogs table

### No Output / Empty Result
**Cause**: Query ran but returned nothing
**Solution**: 
1. Check if blogs table exists
2. Check if column already exists
3. Run the SELECT statement alone:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'blogs';
   ```

### Partial Error (first query succeeds, index fails)
**Cause**: Index name might already exist
**Solution**: This is OK - the column was added. The index might exist under different name.

---

## After Migration

### Verify Success
✅ Output shows "links | jsonb"
✅ No error messages
✅ You can now save blogs with CTA links

### Test the Feature
1. Go to admin dashboard
2. Create/edit a blog
3. Add CTA links in the "CTA Links (Optional)" section
4. Save the blog
5. View blog on detail page
6. CTA links should appear as buttons

### If Still Not Working
1. Refresh the page (browser cache)
2. Clear browser storage
3. Check browser console for errors
4. Verify migration output was "links | jsonb"

---

## Before You Deploy

☑️ **Checklist**:
1. [ ] Open Supabase SQL Editor
2. [ ] Copy the SQL code above
3. [ ] Create new query
4. [ ] Paste SQL code
5. [ ] Click "Run"
6. [ ] Verify output shows "links | jsonb"
7. [ ] Note the timestamp of when you ran it
8. [ ] Proceed with deployment

---

## Quick Copy-Paste Version

If you just want to copy quickly:

```sql
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb; CREATE INDEX IF NOT EXISTS idx_blogs_links ON blogs USING GIN (links); SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'links';
```

(All three commands on one line - Supabase can handle it)

---

## Timeline for Deployment

```
T-0: Run this migration RIGHT NOW in Supabase
     ✓ Creates links column
     ✓ Creates index
     ✓ Verifies setup
     
T+1min: Deploy code to Vercel
        ✓ Push code changes
        ✓ Vercel automatically builds and deploys
        
T+5min: Test on live site
        ✓ Create test blog with CTA links
        ✓ Verify links display
        
T+10min: Announce to team
         ✓ Feature is live
         ✓ Team can start using rich editor
```

---

## Important Notes

⚠️ **DO NOT deploy code before running this migration!**
- If you deploy code without the migration, creating/editing blogs with links will fail
- The code expects the `links` column to exist
- Always run database changes FIRST

✅ **Safe to run multiple times**
- The `IF NOT EXISTS` clause prevents errors
- Can't hurt anything if run again
- Idempotent (safe operation)

🔐 **Backup recommendation**
- Before migration, consider taking a Supabase backup
- (Usually automatic, but check your Supabase settings)

---

## Questions Before Running?

**Q: Will this affect existing blogs?**
A: No. Existing blogs will get empty array `[]` as default for links.

**Q: Can I undo this?**
A: Yes, but it's not necessary. The column is harmless if unused.

**Q: Will existing users lose data?**
A: No. Only adding a new optional column.

**Q: What if migration fails?**
A: Check error message. Usually just permissions. No data is lost.

**Q: How long does it take?**
A: Less than 1 second. Almost instant.

**Q: Do I need to restart anything?**
A: No. Changes are immediate in Supabase.

---

## Final Checklist

- [ ] Read this entire file
- [ ] Understand what will happen
- [ ] Have Supabase access
- [ ] Ready to copy-paste SQL
- [ ] Have deployment plan ready
- [ ] Backed up (optional but recommended)

✅ **Ready to proceed!**

Just run the SQL code above and you're done. The feature will work immediately after! 🚀

---

**Last Updated**: Today
**Status**: Ready to execute
**Estimated Time**: < 1 minute
**Risk Level**: Very Low
**Required Before**: Code deployment
**Reversible**: Yes (but not necessary)
