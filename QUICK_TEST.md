# Quick Payment Test - After Fix

## What Changed?
The code was looking for the redirect URL in the wrong location:
- ❌ **Before**: `paymentResponse.data?.instrumentResponse?.redirectInfo?.url` (v1 API format)
- ✅ **After**: `paymentResponse.data?.redirectUrl` (v2.0 API format)

## Test It Now

### 1. Start Your App
```bash
npm run dev
```

### 2. Test Payment Flow
1. Navigate to http://localhost:8082
2. Add items to cart
3. Click "Checkout"
4. Login with your email
5. Fill in address/details
6. Accept terms and conditions
7. **Click "Continue to Payment"**

### 3. What You Should See

**In Console (F12 → Console tab):**
```
[Checkout] Payment response received: {
  success: true,
  code: "SUCCESS",
  message: "Payment initiated successfully",
  data: {
    orderId: "OMO123456789",
    state: "PENDING",
    redirectUrl: "https://mercury.phonepe.com/transact/uat_v2?token=...",
    expireAt: 1234567890
  }
}

[Checkout] Opening PhonePe payment page: https://mercury.phonepe.com/transact/...

[Checkout] Using PhonePeCheckout iframe mode
```

**Expected Result:**
- ✅ PhonePe payment form appears (embedded in iframe on your page)
- ✅ Can enter card/UPI details
- ✅ Can click "Pay" to complete
- ✅ Can click "Cancel" to go back

### 4. Complete the Payment

**Using Test Card (Sandbox):**
```
Card Number: 4242 4242 4242 4242
Expiry: 12/2025
CVV: 123
OTP: 123456
```

**Or Use Test UPI:**
```
Success: success@ybl
Failure: failed@ybl
Pending: pending@ybl
```

### 5. Verify Success

After payment completes:
1. Check browser console for: `[Checkout] Payment callback response: CONCLUDED`
2. Check Supabase → orders table → your order should show `status: 'paid'`
3. Check Supabase → payment_transactions table → should have status 'SUCCESS'
4. Should be redirected to success page

## Troubleshooting

### ❌ Payment Page Doesn't Appear

**Check 1: Response has redirectUrl**
- Look in console: `data: { redirectUrl: "https://mercury..." }`
- If missing: Edge Function might be failing
  - Go to Supabase Dashboard → Functions → phonepe-initiate → Invocations
  - Look for error in logs

**Check 2: PhonePe script loaded**
- In browser console, type: `window.PhonePeCheckout`
- Should return: `Object { transact: ƒ, closePage: ƒ }`
- If undefined: Script didn't load (check Network tab in DevTools)

**Check 3: Redirect URL is correct**
- Should start with: `https://mercury.phonepe.com/`
- Check full URL in console log: `Opening PhonePe payment page: [URL]`
- If wrong domain: PhonePe API failed to create order

### ❌ Error: "Payment initiation failed"

**Check Edge Function logs:**
1. Go to: Supabase Dashboard
2. Click: Functions → phonepe-initiate
3. Click: Invocations tab
4. Find latest call and expand it
5. Look for error message

**Common errors:**
- `OAuth token response: {status: 401...}` → Wrong credentials
- `Payment API Response status: 400` → Invalid payload
- `Missing PHONEPE_CLIENT_SECRET` → Secret not set in Supabase

## Files That Were Fixed

1. **src/pages/Checkout.tsx**
   - Line ~240: Fixed `redirectUrl` extraction
   - Line ~250: Added PhonePe iframe logic
   - Added proper logging and error handling

2. **src/lib/phonepe.ts**
   - Updated `PhonePeOrderResponse` interface
   - Now correctly types v2.0 response

3. **index.html**
   - Added PhonePe checkout script (line ~37)
   - `<script src="https://mercury.phonepe.com/web/bundle/checkout.js"></script>`

## After Verification

Once you confirm payment opens correctly:
1. Test with test card above ✓
2. Test cancelling payment ✓
3. Test webhook callback received ✓
4. Test database updates ✓
5. Ready for production! 🎉

## Need Help?

If payment still doesn't work:
1. **Share console logs** - Copy [PhonePe] messages from console
2. **Share Edge Function logs** - Check Supabase → Functions → phonepe-initiate → Invocations
3. **Check .env** - Verify VITE_PHONEPE_MERCHANT_ID is set
4. **Verify Supabase secrets** - Check PHONEPE_CLIENT_SECRET is in Edge Function secrets

---

**Status**: ✅ Fix Applied
**Expected**: Payment page should now open
**Test**: Run through flow above to verify
