# Product FAQ Feature - Setup Guide

## Overview
A comprehensive FAQ system has been implemented for product pages with full admin management capabilities.

## Database Setup

### Step 1: Run the SQL Migration
Execute the following file in your Supabase SQL Editor:
- **File**: `create_product_faqs_table.sql`

This creates:
- `product_faqs` table with columns: id, product_id, question, answer, display_order, created_at, updated_at
- Proper indexes for performance
- Row Level Security (RLS) policies
- Admin-only write access, public read access

## Features Implemented

### 1. Customer-Facing FAQ Section
**Location**: Bottom of product detail pages (before the protein bars benefits section)

**Features**:
- Accordion-style expandable Q&A
- Matches site's design language (Saira font, #3b2a20 color)
- Only shows when FAQs exist for the product
- Mobile responsive design
- Smooth expand/collapse animations

**Component**: `src/components/ProductFAQ.tsx`

### 2. Admin FAQ Management
**Location**: Admin Panel → Products Tab → Each product card has a FAQ button (question mark icon)

**Features**:
- Add new FAQs with question and answer fields
- Edit existing FAQs inline
- Delete FAQs with confirmation
- Reorder FAQs (display order)
- Real-time updates
- Validation for required fields

**Component**: `src/components/admin/ProductFAQManager.tsx`

## Usage Instructions

### For Admins:

1. **Navigate to Admin Panel**
   - Go to `/admin`
   - Click on "Products" tab

2. **Manage FAQs for a Product**
   - Find the product you want to add FAQs to
   - Click the question mark icon (?) button
   - A dialog will open with the FAQ manager

3. **Add a New FAQ**
   - Click "Add New FAQ" button
   - Enter the question in the first field
   - Enter the answer in the textarea (supports multi-line text)
   - Click "Add" to save

4. **Edit an Existing FAQ**
   - Click the pencil (Edit) icon on any FAQ
   - Modify the question or answer
   - Click "Update" to save changes

5. **Delete an FAQ**
   - Click the trash (Delete) icon on any FAQ
   - Confirm the deletion

6. **Reorder FAQs**
   - Use the grip icon to reorder FAQs
   - The display_order is automatically managed

### For Customers:

1. **View FAQs**
   - Visit any product detail page
   - Scroll to the bottom (after lab reports, before benefits section)
   - Click on any question to expand and see the answer
   - Click again to collapse

## Technical Details

### Database Schema
```sql
CREATE TABLE product_faqs (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Security
- Public read access (anyone can view FAQs)
- Write access restricted to authenticated admins only
- Cascade delete when product is deleted

### Components Created
1. `ProductFAQ.tsx` - Customer-facing FAQ display
2. `ProductFAQManager.tsx` - Admin FAQ management interface

### Files Modified
1. `ProductDetail.tsx` - Added FAQ section
2. `ProductsTab.tsx` - Added FAQ management button and dialog

## Styling
- Uses consistent brown theme (#3b2a20)
- Saira font for headers
- Accordion-style with hover effects
- Responsive grid layout
- Matches lab reports section styling

## Next Steps (Optional Enhancements)

1. **Bulk FAQ Management**: Add ability to copy FAQs from one product to another
2. **FAQ Categories**: Group FAQs by category (Shipping, Ingredients, Usage, etc.)
3. **Rich Text Editor**: Add formatting options for answers (bold, italic, lists, links)
4. **FAQ Analytics**: Track which FAQs are most frequently expanded
5. **Search/Filter**: Add search functionality in FAQ manager for products with many FAQs
6. **Import/Export**: Bulk import FAQs via CSV or JSON

## Testing Checklist

- [ ] Run the SQL migration in Supabase
- [ ] Create a test FAQ for a product
- [ ] Verify FAQ appears on product page
- [ ] Test editing an FAQ
- [ ] Test deleting an FAQ
- [ ] Test reordering FAQs
- [ ] Verify mobile responsiveness
- [ ] Test with no FAQs (section should be hidden)
- [ ] Verify admin-only write access
- [ ] Test cascade delete (delete product with FAQs)
