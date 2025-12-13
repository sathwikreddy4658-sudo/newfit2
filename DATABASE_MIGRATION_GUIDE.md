# Database Migration - Add Blog Links Column ⚙️

## IMPORTANT: Required for Full Functionality

The `add_links_to_blogs.sql` migration MUST be run in Supabase to enable the CTA (Call-To-Action) links feature to work properly.

## What This Does

This migration adds support for storing CTA links (buttons) on blog posts. Without this, you'll get a database error when trying to save blogs with CTA links.

## How to Run the Migration

### Step 1: Open Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your project
3. Click on "SQL Editor" in the left sidebar

### Step 2: Create New Query
1. Click "New Query"
2. You'll see an empty SQL editor

### Step 3: Copy the SQL Code
Copy the following SQL code:

```sql
-- Add links column to blogs table if it doesn't exist
ALTER TABLE blogs
ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_blogs_links ON blogs USING GIN (links);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'blogs' AND column_name = 'links';
```

### Step 4: Paste and Execute
1. Paste the SQL code into the editor
2. Click the "Run" button (or press Ctrl+Enter)
3. You should see a success message

### Step 5: Verify
You should see output like:
```
column_name | data_type
links       | jsonb
(1 row)
```

This confirms the migration was successful!

## What the Migration Does

### 1. Adds `links` Column
- **Type**: JSONB (JSON with Binary storage)
- **Default Value**: Empty array `[]`
- **Purpose**: Stores CTA links as JSON array

### 2. Creates Index
- **Type**: GIN (Generalized Inverted Index)
- **Purpose**: Makes queries on JSON data faster
- **Performance**: Significantly improves retrieval speed

### 3. Verification Query
- **Purpose**: Confirms the column exists
- **Output**: Displays column name and data type

## Data Format

Blog links are stored as JSON array:

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

## Rollback Instructions (If Needed)

If you need to undo this migration:

```sql
-- Remove the index
DROP INDEX IF EXISTS idx_blogs_links;

-- Remove the column
ALTER TABLE blogs DROP COLUMN IF EXISTS links;
```

However, this is NOT recommended unless something goes wrong.

## Troubleshooting

### Error: "Permission denied"
**Solution**: Make sure you're logged in with a Supabase account that has admin access to the project.

### Error: "Column already exists"
**Solution**: The migration has already been run. This is safe - just means it's already done.

### Error: "Table blogs does not exist"
**Solution**: The blogs table hasn't been created yet. Create it first before running this migration.

### Migration runs but no verification output
**Solution**: This might happen if the column already existed. Check by running:
```sql
SELECT * FROM information_schema.columns 
WHERE table_name = 'blogs' AND column_name = 'links';
```

## After Migration

✅ You can now:
- Add CTA links when creating blogs
- Edit CTA links on existing blogs
- CTA links will display on the blog detail page
- Links are saved in the database

## Testing the Feature

After running the migration:

1. Go to admin dashboard
2. Create a new blog or edit existing blog
3. Scroll to "CTA Links (Optional)" section
4. Click "Add Link"
5. Enter link text and URL
6. Click "Add Blog" to save
7. Visit the blog detail page
8. CTA links should appear as buttons below the blog content

## Migration Status

- [ ] Open Supabase SQL Editor
- [ ] Copy SQL code
- [ ] Paste into editor
- [ ] Click "Run"
- [ ] Verify output shows "links | jsonb"
- [ ] Mark complete when done

## Need Help?

If the migration fails:

1. Check the error message carefully
2. Make sure you have admin access to Supabase project
3. Try running just the first ALTER TABLE line
4. Contact Supabase support if still having issues

## Production Deployment

When deploying to production:

1. Run this migration first in production database
2. Then deploy the new code
3. Test CTA links functionality
4. Monitor for any errors

⚠️ **DO NOT** deploy code before running this migration, or users will get errors when saving blogs with CTA links!

---

**Status**: Ready to run
**Estimated Time**: < 1 second
**Risk Level**: Low (just adds column and index)
**Rollback**: Easy (drop column if needed)
