# Quick Testing Guide - PhonePe v2.0 Integration

## What Changed & Why

**The "Bad Request - Api Mapping Not Found" Error is NOW FIXED:**
- ❌ Was using: PhonePe v1 API with Basic Auth
- ✅ Now using: PhonePe v2.0 Standard Checkout with OAuth tokens

## How to Test Payments

### 1. Start Your Application
```powershell
npm run dev
```

### 2. Go to Checkout
1. Add items to cart
2. Click "Proceed to Checkout"
3. Login if needed

### 3. Initiate Payment
1. Fill in address/details
2. Accept terms
3. Click "Continue to Payment"

### 4. Watch the Console
Open browser DevTools (F12) and watch:
```
[PhonePe] Initiating payment via Edge Function (attempt 1/3)
[PhonePe] Request body being sent: {...}
[PhonePe] Response status: 200
[PhonePe] Response data: {success: true, ...}
```

### 5. What to Expect

**If Fixed ✅:**
- Console shows: `[PhonePe] Response status: 200`
- Edge Function logs show: `[PhonePe Initiate] Payment initiated successfully`
- Should see PhonePe payment iframe or redirect

**If Still Broken ❌:**
- Console shows: `Error: Edge Function returned 400`
- Check `/functions/v1/phonepe-initiate` logs in Supabase Dashboard
- Look for: `OAuth token response` and `Payment API Response`

## Where to Check Logs

### 1. Browser Console (Frontend Logs)
- F12 or Right-click → Inspect → Console tab
- Look for `[PhonePe]` messages
- Check network tab for `/phonepe-initiate` request/response

### 2. Supabase Edge Function Logs
- Go to: https://supabase.com/dashboard/project/osromibanfzzthdmhyzp/functions
- Click "phonepe-initiate"
- Click "Invocations" tab
- Look for recent function calls
- Expand to see detailed logs

### 3. Database Check
After payment:
- Go to Supabase Dashboard
- Check `orders` table - should have new order
- Check `payment_transactions` table - should have transaction record

## Expected Log Sequence (Success Case)

```
[PhonePe] Initiating payment via Edge Function (attempt 1/3)
[PhonePe] Request body being sent: {
  merchantTransactionId: "MT...",
  amount: 12345,
  callbackUrl: "https://..../phonepe-webhook",
  merchantUserId: "...",
  redirectUrl: "http://localhost:8082/payment/callback?..."
}

[PhonePe] Response status: 200
[PhonePe] Response data: {
  success: true,
  code: "SUCCESS",
  message: "Payment initiated successfully",
  data: {
    orderId: "OMO...",
    state: "PENDING",
    redirectUrl: "https://mercury.phonepe.com/transact/..."
  }
}
```

## Troubleshooting

### Error: "Bad Request - Api Mapping Not Found"
- **OLD ERROR** - Should be fixed now
- If still seeing: Clear browser cache and reload
- Check Edge Function was deployed: `npx supabase functions list`

### Error: "Missing PHONEPE_CLIENT_SECRET"
- Credentials not set in Supabase
- Go to: Supabase Dashboard → Project Settings → Edge Function Secrets
- Add: `PHONEPE_CLIENT_SECRET` = (your client secret)

### Error: "OAuth token response: {status: 401...}"
- Client ID or Secret is wrong
- Check Supabase secrets are exactly as in PhonePe dashboard
- Don't include quotes in secret value

### Error: "Only POST requests allowed"
- Frontend is sending wrong method
- Should auto-fix with new code
- Try hard refresh (Ctrl+Shift+R)

### Order Created But Payment API Returns Error
- Check order was created (success response before payment call)
- Check `orders` table in Supabase for the order
- Check `payment_transactions` table is empty (good - we track on webhook)

## Testing Sandbox Payments

When ready to test with actual fake payments:

### Test Card Details (UAT Sandbox)
```
Visa Debit Card:
  Number: 4242 4242 4242 4242
  Expiry: 12/2023
  CVV: 936

Visa Credit Card:
  Number: 4208 5851 9011 6667
  Expiry: 06/2027
  CVV: 508

OTP: 123456
```

### Test UPI (Sandbox)
```
Success: success@ybl
Failure: failed@ybl
Pending: pending@ybl
```

## API Endpoints Used

**Current (Production):**
```
OAuth: https://api.phonepe.com/apis/identity-manager/v1/oauth/token
Payment: https://api.phonepe.com/apis/pg/checkout/v2/pay
Webhook: https://osromibanfzzthdmhyzp.supabase.co/functions/v1/phonepe-webhook
```

**Sandbox (Optional):**
```
OAuth: https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token
Payment: https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay
```

## Quick Test Script (Browser Console)

```javascript
// Test if Edge Function is reachable
fetch('https://osromibanfzzthdmhyzp.supabase.co/functions/v1/phonepe-initiate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`
  },
  body: JSON.stringify({
    merchantTransactionId: 'TEST' + Date.now(),
    amount: 100,
    callbackUrl: 'https://test.com',
    merchantUserId: 'test-user',
    redirectUrl: 'https://test.com'
  })
})
.then(r => r.json())
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e))
```

## Success Indicators

✅ Payment works if you see:
1. "Payment initiated successfully" message
2. PhonePe payment page loads
3. Order appears in `orders` table
4. Transaction appears in `payment_transactions` table
5. Webhook is called after payment completes

## Next: Move to Production

Once sandbox testing works:
1. Get production credentials from PhonePe
2. Update Supabase Edge Function Secrets with production credentials
3. The code auto-detects production and uses correct endpoints
4. Test one more time with production credentials

---

**Deployed**: 2025-11-18 ✅
**API Version**: PhonePe v2.0 (Standard Checkout)
**Status**: Ready for testing
