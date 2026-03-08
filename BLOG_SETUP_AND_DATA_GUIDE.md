# 🎯 Blog System Complete Setup Guide

## Quick Start (2 Options)

### Option 1: Manual Setup (5 minutes)
1. ✅ Run SQL migrations in Supabase dashboard
2. ✅ Run `node setup-blog-bucket.js`
3. ✅ Access admin panel → Blogs

### Option 2: Automated Setup (Using provided scripts)
- Just run the scripts below!

---

## Step-by-Step Instructions

### Step 1: Run Database Migrations ⚙️

**Where**: Go to your Supabase project → **SQL Editor**

**Run these 3 queries in order:**

#### Query 1: Create Blogs Table
```sql
CREATE TABLE IF NOT EXISTS blogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blogs are viewable by everyone" ON blogs
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage blogs" ON blogs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_blogs_updated_at
  BEFORE UPDATE ON blogs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

✅ **Expected**: Query executed successfully

---

#### Query 2: Add CTA Heading Column
```sql
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS cta_heading TEXT DEFAULT 'Learn More';
```

✅ **Expected**: Column added successfully

---

#### Query 3: Add CTA Links Column
```sql
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_blogs_links ON blogs USING GIN (links);
```

✅ **Expected**: Column and index created

---

### Step 2: Setup Blog Image Storage 📁

```bash
node setup-blog-bucket.js
```

**Output should show:**
```
✅ Bucket blog-images created successfully (or already exists)
✅ Storage policies configured
```

---

### Step 3: Verify Setup ✅

```bash
node view-blog-data.js count
```

**Expected output**: `📊 Total Blog Posts: 0` (if new) or `X` blogs

---

## Using the Admin Interface 🎨

Once setup is complete:

1. Go to Admin Dashboard
2. Click **"Manage Blogs"** or navigate to `/admin/blogs`
3. Click **"Add New Blog"**
4. Fill in:
   - **Title**: Blog title
   - **Image**: Upload feature image
   - **Content**: Use rich text editor (Bold, Italic, Lists, Headers, etc.)
   - **CTA Heading**: Custom heading for call-to-action section
   - **CTA Links**: Add action buttons with URLs
5. Click **"Save Blog"**

---

## Accessing Your Blog Data 📊

### View All Blog Titles
```bash
node view-blog-data.js list
```

### Count Blog Posts
```bash
node view-blog-data.js count
```

### See Full Blog Details
```bash
node view-blog-data.js details
```

### Export to JSON (Full Data)
```bash
node export-blog-data.js
```

Creates: `blog_export_TIMESTAMP.json` and `blog_export_TIMESTAMP.csv`

### Backup All Data
```bash
node view-blog-data.js backup
```

Creates: `blog_backups/blog_backup_YYYY-MM-DD.json`

---

## Troubleshooting 🔧

### Q: "Bucket not found" when uploading images?
**A**: Run `node setup-blog-bucket.js` again

### Q: Cannot see blogs in admin panel?
**A**: Make sure:
- ✅ All 3 SQL migrations were run
- ✅ You're logged in as admin
- ✅ Browser cache cleared (Ctrl+Shift+Delete)

### Q: Export scripts don't work?
**A**: Check `.env` file has:
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

### Q: "User roles" table not found?
**A**: Make sure admin setup is complete - see `SETUP_COMPLETE_DATABASE.sql`

---

## Database Schema 🗄️

```
blogs table:
├── id (UUID, Primary Key)
├── title (TEXT, Required)
├── content (TEXT, Rich HTML, Required)
├── image_url (TEXT, Optional)
├── cta_heading (TEXT, Default: "Learn More")
├── links (JSONB Array, Default: [])
├── created_at (TIMESTAMP, Auto)
└── updated_at (TIMESTAMP, Auto)

Sample links structure:
[
  { "text": "Learn More", "url": "https://example.com" },
  { "text": "Sign Up", "url": "https://form.example.com" }
]
```

---

## File Structure 📂

```
Project Root/
├── setup-blog-bucket.js          ← Setup storage bucket
├── export-blog-data.js           ← Export all blogs to JSON/CSV
├── view-blog-data.js             ← View blog data in terminal
├── src/pages/
│   ├── Blogs.tsx                 ← Main blog listing page
│   └── BlogDetail.tsx            ← Individual blog page
├── src/components/admin/
│   └── BlogsTab.tsx              ← Admin blog editor
└── supabase/migrations/
    └── 20251103130000_create_blogs_table.sql ← Initial migration
```

---

## Features Implemented ✨

- ✅ Rich text editor (Bold, Italic, Headers, Lists, Quotes, Code blocks)
- ✅ Feature image upload
- ✅ Custom CTA headings
- ✅ Multiple CTA links with custom text
- ✅ Auto-save drafts in browser storage
- ✅ Responsive design (Mobile, Tablet, Desktop)
- ✅ RLS Security (Public read, Admin write)
- ✅ Auto timestamps (created_at, updated_at)

---

## Next Steps 🚀

1. ✅ Run the setup commands above
2. ✅ Create your first blog post in Admin
3. ✅ View blogs at `/blogs` in your app
4. ✅ Export data whenever needed

---

**Need help?** Check files:
- `BLOG_SYSTEM_COMPLETE_SUMMARY.md` - Feature overview
- `BLOG_IMAGE_BUCKET_SETUP.md` - Image storage troubleshooting
- `DATABASE_MIGRATION_GUIDE.md` - Detailed migration instructions

