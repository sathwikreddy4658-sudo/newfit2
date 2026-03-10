# Admin Panel Setup Guide - Product Editor

## 🎯 Overview

The **Firestore Admin Panel** has been implemented to allow you to easily edit product information (descriptions, ingredients, nutrition facts) **without touching code**.

## ✨ What's New

### Created Files:
1. **`src/pages/AdminProductsPanel.tsx`** - Full-featured admin product editor
   - Beautiful UI matching your site's design
   - Product selection interface
   - Editable fields for description, ingredients, and nutrition
   - Real-time Firestore synchronization

### Updated Files:
1. **`src/integrations/firebase/types.ts`** - Extended Product interface with new fields
   - `ingredients[]` - Array of ingredient strings
   - `nutrition` object with 16 new nutrition fields (per 60g and 100g)
   
2. **`src/App.tsx`** - Added new admin route
   - Route: `/admin/product-editor`
   - Protected by Firebase authentication
   
3. **`src/pages/ProductDetail.tsx`** - Dynamic content from Firestore
   - Product descriptions now read from Firestore (not hardcoded)
   - Ingredients list pulled from database
   - Nutrition table displays dynamic values

## 🚀 How to Use

### Step 1: Access the Admin Panel
1. Go to: `https://www.freelit.in/admin/product-editor`
2. Log in with your Firebase admin account
3. You'll see a list of all protein bar products

### Step 2: Select a Product
- Click "Edit Product" on any product card
- The product editor will load with current data

### Step 3: Edit Product Information

#### A. Product Description
- **Field:** "Product description" textarea
- **What to edit:** Main product description (use line breaks for bullet points)
- **Example format:**
  ```
  Choco Nut is a low calorie protein bar with 20g of protein in just 224 calories
  High protein
  No refined sugar
  No preservatives
  No chalky chew
  ```

#### B. Inside The Bar (Ingredients)
- **Field:** Ingredients list
- **Add ingredients:** Click "+ Add Ingredient" button
- **Edit ingredients:** Update text in each field
- **Remove ingredients:** Click "Remove" button next to ingredient
- **Example:**
  ```
  Whey protein concentrate
  Honey
  Pea protein isolate
  Date syrup
  Peanuts
  Cocoa powder
  Water
  Gum arabic
  Cocoa butter
  ```

#### C. Nutrition Info
The nutrition table has **two sections**: "Per 60g" and "Per 100g"

**Per 60g Fields:**
- Energy (kcal)
- Protein (g)
- Carbohydrates (g)
- Total Sugars (g)
- Added Sugars (g)
- Fat (g)
- Saturated Fat (g)
- Trans Fat (g)

**Per 100g Fields:**
- Same fields as above (just for 100g serving)

**Example Values for Choco Nut:**
```
Per 60g:        Per 100g:
Energy: 224     Energy: 360
Protein: 20     Protein: 33.5
Carbs: 25.2     Carbs: 42.13
Sugars: 6.8     Sugars: 11.46
Added Sugars: 0 Added Sugars: 0
Fat: 4.1        Fat: 6.86
Sat Fat: 1.9    Sat Fat: 3.33
Trans Fat: 0    Trans Fat: 0
```

### Step 4: Save Changes
1. Review all changes
2. Click **"Save Changes"** button (green button at bottom)
3. You'll see a success message
4. Changes are **LIVE immediately** on your product page

## 📱 Features

✅ **Beautiful Admin UI** - Matches your site's design language
✅ **Real-time Updates** - Changes appear instantly on product pages
✅ **Easy Navigation** - Back button to return to product list
✅ **Error Handling** - Clear error messages if something goes wrong
✅ **Responsive Design** - Works on desktop, tablet, and mobile
✅ **Authentication** - Only logged-in Firebase users can access
✅ **Product List** - See all products at a glance before editing

## 🔒 Security

- ✅ **Firebase Auth Required** - Only authenticated users can access
- ✅ **Firestore Rules** - Can add rules to restrict to admin-only users
- ✅ **Timestamps** - All changes are timestamped (updatedAt field)

## ⚙️ Setup Firestore Security Rules (Optional)

To restrict admin panel access to only admin users, add this to your Firestore Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow admins to edit products
    match /products/{document=**} {
      allow read: if true;
      allow write: if request.auth.uid in get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isAdmin ||
                      request.auth.uid in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Restrict admins collection
    match /admins/{document=**} {
      allow read, write: if request.auth.uid in get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isAdmin;
    }
  }
}
```

## 🐛 Troubleshooting

### Admin panel not loading?
- ✅ Make sure you're logged in to Firebase
- ✅ Check browser console for errors
- ✅ Verify Firestore database is accessible

### Changes not saving?
- ✅ Check internet connection
- ✅ Verify Firestore has write permissions
- ✅ Check browser console for error messages

### Product descriptions not showing on site?
- ✅ Make sure you filled in the "Product description" field
- ✅ Verify data was saved (look for success toast)
- ✅ Clear browser cache and reload product page

## 🎨 Product Page Display

### What Shows on Product Detail Page:
1. **Top Section** - Product images and pricing (unchanged)
2. **Product Description** - From admin panel (was hardcoded, now dynamic)
3. **Inside The Bar** - Ingredients list from admin panel
4. **Nutrition Info** - Values from admin panel nutrition table
5. **Lab Reports** - Testing information (unchanged)
6. **FAQ Section** - Frequently asked questions (unchanged)
7. **Benefits Section** - Marketing content (unchanged)

## 📊 Current Products

Initially, the admin panel shows **protein bar products** (category: "protein_bars"):
- Peanut Butter Bar
- Cranberry Cocoa Bar
- Caramelly Peanut Bar

You can add more product categories in the future.

## 🔄 Next Steps (Future Enhancement)

After confirming this admin panel works well, we can add:
- 📷 Image upload/management
- 💰 Price and stock management
- 🏷️ Promo code and discount management
- 📋 Variant management (15g/20g/60g sizes)
- 📊 Product analytics dashboard

## ✅ Testing Checklist

Before going fully live:

- [ ] Log in to admin panel at `/admin/product-editor`
- [ ] Select a product
- [ ] Update description with test text
- [ ] Add/edit ingredients
- [ ] Change a nutrition value
- [ ] Save changes
- [ ] Go to product detail page
- [ ] Verify changes appear live
- [ ] Go back to admin panel
- [ ] Verify edited values are still showing

## 📞 Support

If you need help:
1. Check console (F12) for error messages
2. Verify Firestore connectivity
3. Make sure Firebase credentials are correct
4. Test with a simple change first

---

**You're all set!** 🎉 

Start editing product information at: **https://www.freelit.in/admin/product-editor**
