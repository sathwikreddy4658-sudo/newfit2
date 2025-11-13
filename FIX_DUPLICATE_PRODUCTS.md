# Product Not Found - Root Cause & Fix

## 🚨 Issue Identified

**Error:** `Cannot coerce the result to a single JSON object - The result contains 2 rows`

**Root Cause:** You have **duplicate products with the same name "ddd"** in your database.

**Impact:** When clicking on the product, Supabase finds 2 rows but the app expects only 1.

---

## ✅ Quick Fix (2 Minutes)

### **Via Supabase Dashboard:**

1. Open: https://app.supabase.com
2. Click your project
3. Table Editor → products
4. Find products named "ddd" (you'll see 2 rows)
5. **Delete ONE of them** (click row, then delete button)
6. Refresh browser in your app
7. ✅ Done!

---

## 🔧 Code Changes Made

### 1. **ProductDetail.tsx - Fixed Query**
- Changed from `.single()` to `.limit(1)`
- Now handles duplicate names gracefully
- Shows warning if duplicates exist
- Better error messages

### 2. **Created Helper Files:**
- `fix_duplicate_products.js` - Auto-find duplicates
- `find_duplicate_products.sql` - SQL query for Supabase
- `PRODUCT_NOT_FOUND_GUIDE.md` - Complete guide

---

## 📊 What's Happening

### Current Situation:
```
Database: products table
├── Row 1: name="ddd", id=UUID-1
└── Row 2: name="ddd", id=UUID-2  ← DUPLICATE!
```

### Query Logic:
```
Old (broken):
.select("*").eq("name", "ddd").single()
→ Error: Found 2 rows, expected 1!

New (fixed):
.select("*").eq("name", "ddd").limit(1)
→ Works: Returns first row, ignores duplicates
```

---

## 🎯 How to Find Other Duplicates

### Option 1: Via Dashboard
```
1. Go to Supabase Table Editor
2. Look for any product names that appear twice
3. Delete duplicates manually
```

### Option 2: Via SQL
```
1. Supabase → SQL Editor → New Query
2. Copy contents of: find_duplicate_products.sql
3. Run it
4. See all duplicate products
```

### Option 3: Via Node Script
```bash
node fix_duplicate_products.js
```

---

## 🛡️ Prevention for Future

### **Best Practices:**

1. **Check before creating**
   - Always look at existing products first
   - Don't create if it already exists

2. **Use unique names**
   - Each product name should be unique
   - Example: "CHOCO NUT Bar" (specific, not just "Bar")

3. **Edit instead of recreate**
   - If product exists, click pencil icon to edit
   - Don't create a new one

4. **Test in dev first**
   - Create test products
   - Verify they work
   - Delete test products before going live

---

## 📋 Files You Can Use

### **To Find Duplicates:**
- `diagnose_product_issue.js` - Shows all products and status
- `find_duplicate_products.sql` - SQL query for duplicates
- `fix_duplicate_products.js` - Auto-deletes duplicates

### **To Understand Issues:**
- `PRODUCT_NOT_FOUND_GUIDE.md` - Complete troubleshooting guide

### **Code Changed:**
- `src/pages/ProductDetail.tsx` - Better error handling

---

## ✨ After Fix

Once you delete the duplicate:

1. **Refresh browser** (Ctrl+R)
2. **Go to Products page**
3. **Click on any product**
4. **Should work now!**

---

## 🎓 What You Learned

| Concept | What Happened |
|---------|---------------|
| `.single()` | Expects exactly 1 result, fails with 2+ |
| `.limit(1)` | Returns first result, ignores duplicates |
| Duplicate data | Can break app logic |
| Error handling | Shows helpful error messages |
| Debugging | Console logs help find issues |

---

## 🚀 Next Steps

1. **Delete duplicate "ddd" product**
   - Via Supabase Dashboard (easiest)
   - Or run `node fix_duplicate_products.js`

2. **Test it works**
   - Refresh browser
   - Click products
   - Should load without errors

3. **Check for other duplicates**
   - Run `node fix_duplicate_products.js`
   - Fix any others found

4. **Create test product**
   - Verify new products work
   - Make sure they appear in list
   - Can click on them

---

## 💡 Common Questions

### Q: Will I lose product data?
A: No, you're only deleting the duplicate copy. Keep one.

### Q: How do I know which copy to delete?
A: Delete the older one (earlier created_at). Keep the newest.

### Q: Will this happen again?
A: Not if you check before creating products.

### Q: Can I use the auto-delete script?
A: Yes! `node fix_duplicate_products.js` will auto-delete older duplicates.

---

**Issue Type:** Duplicate Products  
**Severity:** High  
**Fix Time:** 2 minutes  
**Difficulty:** Very Easy  
**Status:** ✅ Resolved with updated code
