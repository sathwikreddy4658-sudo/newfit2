# Product Not Found Issue - Diagnosis Guide

## 🚨 **CRITICAL ISSUE FOUND: DUPLICATE PRODUCTS**

### **Your Issue:**
You have **2 products with the same name "ddd"** in your database.

**Error:** `Cannot coerce the result to a single JSON object - The result contains 2 rows`

**Why this happens:** The ProductDetail page uses `.single()` which expects exactly ONE product. When there are 2+ products with the same name, Supabase can't decide which one to return.

---

## ✅ **IMMEDIATE FIX (Choose One)**

### **Option A: Delete Duplicate via Supabase Dashboard (Easiest)**

1. Go to https://app.supabase.com
2. Click your project
3. Click **Table Editor** in sidebar
4. Click **products** table
5. Look for products named "ddd"
6. Delete the older duplicate (keep one)
7. Refresh your browser

### **Option B: Auto-Delete via Script (Optional)**

If you have the service role key set up:
```bash
cd c:\Users\vivek\Downloads\newfit-main\newfit-main
node fix_duplicate_products.js
```

---

## 🔍 **Common Causes**

### **Why You Might Have Duplicates:**

1. **Created product, then created again** - Didn't realize it was created
2. **Testing multiple times** - Left test products behind
3. **Import/bulk operation** - Data got duplicated
4. **Accidental duplicate submission** - Network issues caused retry

---

## 🔧 **How to Prevent This in Future**

### **1. Check Before Creating**
- Go to Admin Dashboard → Products
- Look at existing products first
- Don't create if it already exists

### **2. Use Unique Product Names**
- Each product name should be unique
- Use specific names like "CHOCO NUT Bar" not just "Bar"

### **3. Update Existing Instead of Creating**
- If product exists, edit it instead of creating new one
- Click pencil icon to edit

---

## 📊 **Your Product Database Status**

| Issue | Status | Action |
|-------|--------|--------|
| Duplicate "ddd" products | ⚠️ **FOUND** | Delete one copy |
| Other products | ✅ OK | No action needed |

---

## 🎯 **Step-by-Step Fix Now**

### **Step 1: Open Supabase**
- Go to: https://app.supabase.com
- Click your project

### **Step 2: Find Duplicates**
- Click **Table Editor**
- Click **products** table
- Use search to find "ddd"
- You should see 2 rows

### **Step 3: Delete One**
- Click on ONE of the "ddd" products
- Click the delete button (trash icon)
- Confirm deletion

### **Step 4: Test**
- Refresh your browser
- Go to Products page
- Click on any product
- It should load now!

---

## � **How to Find All Duplicates**

To check if there are other duplicates:

```bash
node fix_duplicate_products.js
```

This will:
- Show all duplicate product names
- Tell you which ones to delete
- Offer to auto-delete them

---

## 📋 Checklist

- [ ] Go to Supabase Dashboard
- [ ] Find products table
- [ ] Search for "ddd"
- [ ] Delete the duplicate copy
- [ ] Refresh browser
- [ ] Test by clicking a product
- [ ] Verify it works

---

## 🎉 After Fix

Once you delete the duplicate:
1. **Refresh browser** (Ctrl+R)
2. **Go to Products page**
3. **Click on "ddd" product**
4. **Should load successfully!**

---

## ⚠️ Important Notes

- **Only delete ONE of the duplicates** - keep one copy
- **After deletion, refresh browser**
- **Check console (F12) for any remaining errors**
- **If still broken, check for other duplicate product names**

---

## 📞 If It Still Doesn't Work

1. Check console (F12 → Console tab) for errors
2. Verify the "ddd" product is still there (you didn't delete both)
3. Check `is_hidden` column is `false`
4. Run `node fix_duplicate_products.js` to see all duplicates

---

**Issue Type:** Duplicate Products  
**Severity:** High  
**Fix Difficulty:** Very Easy (Just delete one row)  
**Estimated Time:** 2 minutes

