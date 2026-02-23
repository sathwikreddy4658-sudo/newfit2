# Promo Codes Fix & Free Shipping Feature

## Problems Fixed

### 1. **Database Column Mismatch** ❌ → ✅
**Problem:** PromoCodesTab was using `usage_limit` and `usage_count` but database has `max_uses` and `current_uses`

**Fixed:** Updated component to use correct column names from database

### 2. **Missing Free Shipping Feature** ❌ → ✅  
**Problem:** No way to create free shipping promo codes

**Fixed:** Added complete free shipping support

## What Was Added

### Database Changes (SQL)
Run **[SETUP_COMPLETE_DATABASE.sql](SETUP_COMPLETE_DATABASE.sql)** which now includes:

```sql
-- New columns added to promo_codes table:
- free_shipping (BOOLEAN) - Enables free shipping instead of discount
- min_order_amount (DECIMAL) - Minimum order value required
- description (TEXT) - Admin notes about the promo code
- max_discount_amount (DECIMAL) - Cap for percentage-based discounts
```

### Component Updates

**Enhanced PromoCodesTab with:**
- 🚚 **Free Shipping Toggle** - Toggle between discount and free shipping codes
- **Smart Form** - Shows different fields based on code type
- **Better Display** - Type badges (Discount vs Free Shipping)
- **Usage Tracking** - Shows current uses vs limit
- **Min Order Amount** - Set minimum order value for codes
- **Description Field** - Internal notes for admin reference

### TypeScript Types
Updated `src/integrations/supabase/types.ts` with all new promo_codes columns

## How to Use

### Step 1: Run SQL Setup
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/oikibnfnhauymhfpxiwi/sql)
2. Copy contents of [SETUP_COMPLETE_DATABASE.sql](SETUP_COMPLETE_DATABASE.sql)
3. Paste and click **Run**
4. Wait for "✅ Setup Complete!"

### Step 2: Restart Dev Server
Press Ctrl+C and restart

### Step 3: Try It Out
1. Go to `/admin/promo-codes`
2. Click "Add Promo Code"

**For Discount Code:**
- Leave "Free Shipping" toggle OFF
- Enter code and discount percentage
- Optionally set usage limit and max discount amount

**For Free Shipping Code:**
- Toggle "Free Shipping" ON ✅
- Enter code
- Set minimum order amount (e.g., ₹499)
- Optionally set usage limit

## Features Overview

### Discount Codes
- Percentage-based discount (1-100%)
- Optional max discount amount cap
- Usage limits
- Min order amount requirement

### Free Shipping Codes  
- Provides free shipping instead of discount
- Min order amount threshold
- Usage limits
- Great for marketing campaigns!

### Both Types Support
- ✅ Active/Inactive toggle
- ✅ Usage tracking
- ✅ Admin descriptions
- ✅ Edit and delete
- ✅ Unlimited or limited usage

## Example Use Cases

**Discount Code:**
```
Code: WELCOME10
Type: Discount
Discount: 10%
Max Discount: ₹100
Min Order: ₹299
Usage Limit: 100 uses
```

**Free Shipping Code:**
```
Code: FREESHIP499
Type: Free Shipping
Min Order: ₹499
Usage Limit: Unlimited
Description: Free shipping for orders above ₹499
```

## What's New in the UI

### Create/Edit Form
- 🔵 Free Shipping toggle (prominent blue box)
- Conditional fields based on code type
- Better labels and hints
- Validation messages

### Promo Codes Table
- **Type** column with badges (💰 Discount or 🚚 Free Shipping)
- **Usage** shows: current uses / limit
- **Min Order** shows minimum order amount
- Description appears under creation date
- Active/Inactive toggle per code

All working now! 🎉
