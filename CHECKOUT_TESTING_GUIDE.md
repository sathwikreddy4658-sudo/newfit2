# Complete Checkout & Admin Testing Guide

**Updated**: November 12, 2025  
**Status**: ✅ Development Server Running at http://localhost:8081/

---

## 🧪 Testing Scenario 1: Guest Checkout Flow

### Step 1: Navigate to Products
1. Open http://localhost:8081/
2. Click on any product or go to `/products` page
3. Select "Order as Guest" option

### Step 2: Add Items to Cart
1. Select a product (e.g., a meal plan)
2. Choose protein option
3. Set quantity (e.g., 2)
4. Click "Add to Cart"
5. Verify item appears in cart

### Step 3: Proceed to Checkout
1. Click "Checkout" button
2. You should see "Guest Information" section at top

### Step 4: Fill Guest Information
**Test Data** (Guest):
```
Full Name: John Doe
Email: john@example.com
Phone: 9876543210
```

**Expected Behavior**:
- ✓ Phone field shows prominent input with phone icon
- ✓ Helper text shows valid formats: "9876543210, +919876543210, or 919876543210"
- ✓ Field is blue-highlighted to draw attention

### Step 5: Fill Delivery Address with Phone
1. Scroll to "Delivery Address & Contact" section
2. Fill the form:
   ```
   Flat/House Number: 101
   Building Name: Green Heights
   Street Address: MG Road, Bangalore
   City: Bangalore
   State: Karnataka
   Pincode: 560001
   Landmark: Near Forum Mall
   ```

3. **CRITICAL**: Scroll to top of address form
4. **Phone Number** field should be visible at top
5. Enter phone number: `9876543210`

### Step 6: Test Phone Validation

**Test Case 1 - Valid 10-digit**:
- Enter: `9876543210`
- Expected: ✓ No error, green checkmark helper text

**Test Case 2 - Valid with +91**:
- Clear and enter: `+919876543210`
- Expected: ✓ No error, formats correctly

**Test Case 3 - Invalid number (too short)**:
- Enter: `987654321`
- Click elsewhere or submit
- Expected: ❌ Red error: "Invalid phone number"

**Test Case 4 - Invalid number (starts with wrong digit)**:
- Enter: `5876543210`
- Expected: ❌ Red error: "Phone number must start with 6-9"

### Step 7: Click "Save Address & Continue"
- Expected:
  - ✓ Form validates all fields
  - ✓ Phone validation passes
  - ✓ Green toast: "Address saved successfully!"
  - ✓ Address card shows your details

### Step 8: Verify Order Summary
- Expected in right panel:
  - Order items with correct quantities
  - Subtotal
  - Total amount
  - "Go to Payment" button

### Step 9: Click "Go to Payment"
- Expected:
  - Order created in database
  - Payment initiated with PhonePe
  - Redirected to PhonePe payment page
  - OR error message if something fails

---

## 🧪 Testing Scenario 2: Authenticated User Checkout

### Step 1: Login
1. Go to http://localhost:8081/auth
2. Use test account:
   ```
   Email: test@example.com
   Password: Test123!
   ```
   (Create if doesn't exist)

### Step 2: Add Items to Cart
1. Go to products
2. Add items to cart

### Step 3: Go to Checkout
1. Click Checkout
2. Should NOT see "Guest Information" section
3. Should see "Delivery Address" section

### Step 4: Fill Address with Phone
1. Scroll to address form
2. **Phone field should be at top** (same format as guest)
3. Enter phone: `9123456789`
4. Fill address details:
   ```
   Flat/House: 302
   Building: Silver Park
   Street: Brigade Road
   City: Bangalore
   State: Karnataka
   Pincode: 560025
   Landmark: Near Cubbon Park
   ```

### Step 5: Save Address
1. Click "Save Address & Continue"
2. Expected:
   - ✓ Phone and address saved to user profile
   - ✓ Toast: "Address saved successfully!"

### Step 6: Proceed to Payment
1. Click "Go to Payment"
2. Expected:
   - Payment initiated
   - Redirected to PhonePe
   - OR error message

---

## 👨‍💼 Testing Scenario 3: Admin Order Details

### Step 1: Create a Test Order
1. Complete guest checkout (or use existing order)
2. Note the order ID

### Step 2: Navigate to Admin Panel
1. Go to http://localhost:8081/admin
2. Login with admin credentials
3. Click on "Orders" tab

### Step 3: Verify Order Display

**Expected Order Card Layout** (Top to Bottom):

```
┌─────────────────────────────────────┐
│ ORDER ID: abc12345                  │
│ Date: 12/2/2024, 3:45 PM           │
├─────────────────────────────────────┤
│ Customer: John Doe                  │
│ john@example.com                    │
│ 📞 9876543210                       │
├─────────────────────────────────────┤
│ Order Status: [PENDING] ▼           │
│ Payment Status: [SUCCESS]           │
├─────────────────────────────────────┤
│ 📍 Delivery Address                 │
│ 101, Green Heights, MG Road         │
│ Bangalore, Karnataka 560001         │
│ Near Forum Mall                     │
├─────────────────────────────────────┤
│ 💳 Payment Details                  │
│ Transaction ID: MT164826...         │
│ Amount: ₹1,500.00                   │
│ Payment Method: PhonePe             │
├─────────────────────────────────────┤
│ 📦 Order Items (+)                  │
│ (Click to expand/collapse)          │
└─────────────────────────────────────┘
```

### Step 4: Test Phone Number Link
1. Click on phone number (should be clickable/formatted)
2. On desktop: Should attempt to dial (tel: link)
3. On mobile: Should open phone dialer

### Step 5: Verify Address Display
1. Address should show complete delivery location
2. Includes: Building, street, city, state, pincode, landmark

### Step 6: Verify Payment Details
1. Payment status should show: SUCCESS, PENDING, or FAILED
2. Show transaction ID (truncated)
3. Show amount in rupees
4. Show payment method

### Step 7: Expand Order Items
1. Click "+ Order Items (2)" to expand
2. Expected items display:
   ```
   ┌─────────────────────────────┐
   │ Chicken Biryani             │
   │ Qty: 2                      │ ₹600.00
   │ @ ₹300                      │
   ├─────────────────────────────┤
   │ Paneer Butter Masala        │
   │ Qty: 1                      │ ₹400.00
   │ @ ₹400                      │
   ├─────────────────────────────┤
   │ Order Total:                │ ₹1,000.00
   └─────────────────────────────┘
   ```

### Step 8: Test Status Update
1. Click status dropdown
2. Select "Shipped"
3. Expected:
   - ✓ Status updates immediately
   - ✓ Badge changes color
   - ✓ Toast: "Order status updated"
4. Change to "Delivered"
5. Badge should change to green

### Step 9: Collapse and Re-expand
1. Click "- Order Items" to collapse
2. Click "+ Order Items" to expand again
3. Expected: Smooth toggle animation

---

## ✅ Validation Checklist

### Address Form Phone Field
- [ ] Phone input appears at top of address form
- [ ] Blue highlight with phone icon
- [ ] Helper text shows valid formats
- [ ] Phone field is required
- [ ] Accepts 10-digit format (9876543210)
- [ ] Accepts +91 prefix (+919876543210)
- [ ] Accepts 91 prefix (919876543210)
- [ ] Rejects invalid formats with error message
- [ ] Rejects numbers starting with 0-5
- [ ] Real-time validation as user types
- [ ] Error message clears when user corrects it

### Guest Checkout
- [ ] Phone stored in guest data
- [ ] Phone passed to database function
- [ ] Address includes phone in submission
- [ ] Order created with correct parameters
- [ ] Payment initiated successfully

### Authenticated Checkout
- [ ] Phone field prefilled with user's saved phone
- [ ] Phone saved to user profile
- [ ] Address saved with phone
- [ ] Order created with user ID
- [ ] Payment includes phone in metadata

### Admin Panel
- [ ] Orders list loads without errors
- [ ] Phone number displayed prominently
- [ ] Phone is clickable (tel: link)
- [ ] Delivery address shows complete details
- [ ] Payment details section visible
- [ ] Payment status shown with correct color
- [ ] Order items expandable/collapsible
- [ ] Status update dropdown works
- [ ] All price calculations correct
- [ ] Order total matches order_items sum
- [ ] Real-time updates on status change

### Payment Integration
- [ ] Order created before payment redirect
- [ ] Payment transaction stored with correct ID
- [ ] Merchant transaction ID generated correctly
- [ ] Payment status tracked in database
- [ ] PhonePe redirect works
- [ ] Callback returns to app
- [ ] Order status updates on successful payment

---

## 🐛 Common Issues & Solutions

### Issue: Phone field not visible in address form
**Solution**: 
- Refresh page (Ctrl+Shift+R for hard refresh)
- Check that AddressForm.tsx is updated
- Check browser console for errors

### Issue: Phone validation too strict
**Solution**:
- Phone must start with 6-9 (Indian standard)
- Must be exactly 10 digits or 12 digits with 91 prefix
- No spaces or special characters except + at start

### Issue: Address not saving
**Solution**:
- Fill all required fields (marked with *)
- Phone validation must pass
- Address must be 10-500 characters
- Check Supabase for errors

### Issue: Order not creating
**Solution**:
- Verify phone is valid
- Verify address is complete
- Check Supabase create_order_with_items function
- Check browser console for error details

### Issue: Admin page not showing phone
**Solution**:
- Phone stored in different field? Check customer_phone vs profiles.phone
- Database query not joining payment_transactions? Check OrdersTab query
- Refresh admin page

---

## 📊 Expected Database State

After completing guest checkout with phone:

**Orders Table**:
```
id: uuid
user_id: null (or guest uuid)
customer_name: "John Doe"
customer_email: "john@example.com"
customer_phone: "9876543210"
address: "101, Green Heights, MG Road, Bangalore, Karnataka 560001, Near Forum Mall"
total_price: 1500.00
status: "pending"
created_at: timestamp
```

**Order Items Table**:
```
order_id: (link to order above)
product_id: uuid
product_name: "Chicken Biryani"
product_price: 300.00
quantity: 2
```

**Payment Transactions Table**:
```
order_id: (link to order)
merchant_transaction_id: "MT1701234567..."
amount: 150000 (in paisa)
status: "INITIATED" or "SUCCESS"
payment_method: "PhonePe"
response_code: "APPROVED" (if SUCCESS)
```

---

## 🚀 Performance Metrics

**Expected Performance**:
- Address form load: < 100ms
- Phone validation: < 50ms
- Order creation: < 1s
- Admin page load: < 2s (with 10 orders)
- Status update: < 500ms

---

## 📱 Testing on Mobile

1. Use Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on iPhone SE, Galaxy S9 viewports
4. Verify:
   - Phone input responsive
   - Address form readable on small screens
   - Admin order cards stack properly
   - Phone number clickable (tel: link works)

---

## 🔗 Important URLs

| Page | URL |
|------|-----|
| Home | http://localhost:8081/ |
| Products | http://localhost:8081/products |
| Checkout | http://localhost:8081/checkout |
| Auth | http://localhost:8081/auth |
| Admin | http://localhost:8081/admin |
| Admin Orders | http://localhost:8081/admin#orders |

---

## 📝 Test Data Reference

### Test Phone Numbers
- ✓ 9876543210 (valid 10-digit)
- ✓ 9123456789 (valid 10-digit)
- ✓ +919876543210 (valid with +91)
- ✓ 919876543210 (valid with 91)
- ❌ 8876543210 (invalid - starts with 8)
- ❌ 987654321 (invalid - 9 digits)
- ❌ 98765432100 (invalid - 11 digits)

### Test Addresses
```
Flat 101, Green Heights Tower,
MG Road, Bangalore,
Karnataka 560001,
Near Forum Mall, Bangalore
```

---

## 📞 Support

**If tests fail**:
1. Check browser console for errors (F12)
2. Check Supabase logs
3. Verify all environment variables set
4. Check PhonePe API status
5. Verify database schema includes payment_transactions table

---

**Last Updated**: November 12, 2025  
**Testing Environment**: Development (localhost:8081)  
**Status**: ✅ Ready for Testing
