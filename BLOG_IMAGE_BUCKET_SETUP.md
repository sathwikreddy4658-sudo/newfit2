# Blog Image Bucket Setup Guide

## Issue
The blog image uploads are failing with: **"Bucket not found"**

This means the `blog-images` bucket doesn't exist in your Supabase storage.

## Solution

### Option 1: Manual Setup via Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Enter bucket name: `blog-images`
5. Toggle **Make it public** to ON
6. Click **Create bucket**
7. Click on the `blog-images` bucket
8. Go to **Policies** tab
9. Click **New Policy** → **For full customization**
10. Choose **SELECT** operation
11. Set MIME types to allow images: `image/jpeg, image/png, image/webp, image/gif`
12. Set file size limit: 5242880 (5MB)

### Option 2: Using the Setup Script

If you have Node.js and the Supabase CLI installed:

1. Ensure your `.env` file has `SUPABASE_SERVICE_ROLE_KEY` (get this from Supabase dashboard Settings → API)
2. Run: `node setup-blog-bucket.js`
3. The script will create and configure the bucket automatically

### Option 3: Using Supabase CLI

```bash
supabase storage create blog-images --public
```

## After Setup

- Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
- Reload the page
- Try uploading a blog image again
- The image should now upload and display in the blog preview

## Verification

Once the bucket is created, you should see:
1. ✅ "Image compressed: XXXX -> YYYY bytes" in console
2. ✅ "Image uploaded successfully: https://..." in console
3. ✅ Image appears in blog card preview
4. ✅ Image displays on blog detail page

## Troubleshooting

If uploads still fail:
- Check browser console for exact error message
- Verify bucket is set to **public** (not private)
- Check CORS settings in Supabase dashboard
- Ensure image file is under 5MB
- Try a different image format (JPEG, PNG, WebP)
