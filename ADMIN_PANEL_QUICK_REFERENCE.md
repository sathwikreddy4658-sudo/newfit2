# Admin Panel Quick Reference

## 🚀 Quick Start

**Access:** `https://www.freelit.in/admin/product-editor`

### Edit Product Info in 4 Steps:
1. Log in with Firebase account
2. Click "Edit Product" on any product
3. Update description, ingredients & nutrition values
4. Click "Save Changes" - Done! ✅

---

## 📝 What You Can Edit

### ✏️ Product Description
- Main product description text
- Use line breaks for bullets
- Appears at top of product page

### 🥜 Inside The Bar (Ingredients)
- List of all ingredients
- Add new: "+Add Ingredient" button
- Edit: Update text in field
- Remove: Click "Remove" button

### 📊 Nutrition Info
**Per 60g:**
- Energy (kcal)
- Protein (g)
- Carbs (g)
- Sugars (g)
- Added Sugars (g)
- Fat (g)
- Sat Fat (g)
- Trans Fat (g)

**Per 100g:**
- Same fields (just for 100g serving)

---

## 🎯 Example: Update Choco Nut

**Description:**
```
Choco Nut is a low calorie protein bar with 20g protein in 224 calories
High protein
No refined sugar
No preservatives
No chalky chew
```

**Ingredients:**
```
whey protein concentrate
honey
pea protein isolate
date syrup
peanuts
cocoa powder
water
gum arabic
cocoa butter
```

**Nutrition (Per 60g):**
```
Energy: 224
Protein: 20
Carbs: 25.2
Sugars: 6.8
Added Sugars: 0
Fat: 4.1
Sat Fat: 1.9
Trans Fat: 0
```

---

## ⌨️ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save | Click "Save Changes" button |
| Cancel | Click "Cancel" button |
| Back | Click back button in header |

---

## 💡 Pro Tips

✅ **Save multiple times** - Each save is independent
✅ **Test live** - Changes appear instantly on product page
✅ **Use line breaks** - Description supports line breaks for formatting
✅ **Mobile friendly** - Admin panel works on phone/tablet
✅ **Undo via Firestore** - Can restore previous values from database if needed

---

## ❌ Common Mistakes to Avoid

❌ Don't leave nutrition fields empty (use 0 instead)
❌ Don't forget "Save Changes" button
❌ Don't edit during internet disconnection
❌ Don't reload page before save completes

---

## 🆘 Troubleshooting

**Issue: Can't log in?**
→ Use Firebase login credentials
→ Check if account has Firestore access

**Issue: Changes not saving?**
→ Check internet connection
→ Look for red error message
→ Try saving again

**Issue: Can't see product changes live?**
→ Clear browser cache
→ Reload product page
→ Check admin panel shows saved values

**Issue: Get error "Failed to update"?**
→ Check Firestore connection
→ Verify database has write permissions
→ Try again after refreshing page

---

## 📚 Documentation

- Full guide: `ADMIN_PANEL_SETUP_GUIDE.md`
- Technical details: `ADMIN_PANEL_IMPLEMENTATION_SUMMARY.md`

---

## 💬 Questions?

Need help? Check the full guide or review the error messages in admin panel.

**Admin Panel URL:** `https://www.freelit.in/admin/product-editor`
