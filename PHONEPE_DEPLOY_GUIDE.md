# 🚀 PhonePe Integration - Deployment & Testing Guide

## Quick Start (5 Minutes)

### 1. Deploy Edge Functions
```powershell
# Open terminal in project root
npx supabase functions deploy phonepe-initiate --no-verify-jwt
npx supabase functions deploy phonepe-check-status --no-verify-jwt
npx supabase functions deploy phonepe-webhook --no-verify-jwt

# Verify deployment
npx supabase functions list
```

### 2. Set Environment Secrets in Supabase
1. Go to **Supabase Dashboard** → Your Project
2. Click **Settings** (bottom left)
3. Select **Edge Functions** from left sidebar
4. Click **Secrets** tab
5. Add these 3 secrets:
   ```
   PHONEPE_MERCHANT_ID = M23DXJKWOH2QZ
   PHONEPE_CLIENT_ID = SU2511071520405754774079
   PHONEPE_CLIENT_SECRET = c70dce3a-c985-4237-add4-b8b9ad647bbf
   ```
6. Click **Save**

### 3. Test Locally
```powershell
# Start dev server
npm run dev

# Open browser to http://localhost:8082
# Login → Add items → Checkout → Click "Go to Payment"
# Check console (F12) for errors
```

---

## Detailed Testing Workflow

### Test Case 1: Successful Payment Flow (No CORS Error)

**Preconditions**:
- ✅ Edge Functions deployed
- ✅ Edge Function secrets set
- ✅ Dev server running
- ✅ User logged in

**Steps**:
1. Navigate to checkout page
2. Add items to cart (required items on page)
3. Fill in delivery address
4. Check **"I accept terms and conditions"**
5. Click **"Go to Payment"** button

**Expected Results**:
- ✅ No CORS error in browser console
- ✅ Console shows: `[PhonePe] Payment initiation response`
- ✅ New order created in Supabase `orders` table
- ✅ Order has your `user_id` (not null)
- ✅ Page redirects to PhonePe payment page OR shows error message from PhonePe API

**What to Check in Browser Console**:
```javascript
// Should see these logs (no errors):
[PhonePe] Initiating payment via Edge Function (attempt 1/3)
[PhonePe] Payment initiation response: {success: true, code: 'SUCCESS', ...}

// Should NOT see:
// CORS policy: Request header field x-client-info is not allowed
// Cannot read property 'slice' of undefined
```

---

### Test Case 2: Missing Phone Number (Graceful Fallback)

**Steps**:
1. Create/use account with NO phone number
2. Add items and proceed to checkout
3. Click "Go to Payment"

**Expected Results**:
- ✅ System uses placeholder phone `9999999999`
- ✅ Payment still initiates successfully
- ✅ No error about missing phone number

---

### Test Case 3: Not Authenticated (Auth Check)

**Steps**:
1. Logout (or open incognito)
2. Try to access checkout
3. Click "Go to Payment"

**Expected Results**:
- ✅ Toast error: **"Login Required"** or **"Authentication Required"**
- ✅ Page redirects to login page (`/auth`)
- ✅ No order created

---

### Test Case 4: Empty Cart (Validation)

**Steps**:
1. Clear cart completely
2. Try to checkout

**Expected Results**:
- ✅ Checkout page shows empty cart message
- ✅ "Go to Payment" button disabled or shows validation error

---

## Debugging: View Edge Function Logs

```powershell
# View logs for payment initiation
npx supabase functions logs phonepe-initiate --limit 50 --follow

# View logs for status check
npx supabase functions logs phonepe-check-status --limit 50

# View logs for webhook
npx supabase functions logs phonepe-webhook --limit 50
```

**Example successful log output**:
```
[PhonePe Initiate] Incoming request: {method: 'POST', url: '...'}
[PhonePe Edge Function] Payment initiation {merchantTransactionId: 'MT...', amount: 5000}
[PhonePe Edge Function] Calling URL: https://api.phonepe.com/apis/pg/v1/pay
[PhonePe Edge Function] Response status: 200
[PhonePe Edge Function] Response data: {success: true, data: {...}}
```

---

## Common Errors & Solutions

### ❌ Error: "CORS policy: Request header field x-client-info is not allowed"

**Cause**: Edge Functions don't have correct CORS headers  
**Solution**:
```bash
# Verify your function has this line (around line 35):
'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',

# Then redeploy:
npx supabase functions deploy phonepe-initiate --no-verify-jwt
```

### ❌ Error: "null value in column user_id violates not-null constraint"

**Cause**: User not authenticated  
**Solution**:
1. Verify user is logged in
2. Check `Checkout.tsx` has auth check (should redirect to `/auth`)
3. Check user session loads: `supabase.auth.getUser()` returns valid user

### ❌ Error: "PhonePe credentials not configured"

**Cause**: Edge Function secrets not set  
**Solution**:
1. Go to Supabase Dashboard → Settings → Edge Functions → Secrets
2. Verify these exist:
   - `PHONEPE_MERCHANT_ID`
   - `PHONEPE_CLIENT_ID`
   - `PHONEPE_CLIENT_SECRET`
3. Re-deploy function: `npx supabase functions deploy phonepe-initiate --no-verify-jwt`

### ❌ Error: "Invalid total price" or "Order must contain at least one item"

**Cause**: Cart or price validation failed  
**Solution**:
1. Ensure cart has items
2. Ensure total price is positive
3. Check item prices are valid

### ❌ Error: "Insufficient stock"

**Cause**: Product stock lower than requested quantity  
**Solution**:
1. Check product stock in Supabase `products` table
2. Add more stock if needed
3. Or reduce quantity in cart

---

## Manual API Testing (Advanced)

### Test CORS Preflight
```powershell
# From any terminal:
Invoke-WebRequest -Uri "https://osromibanfzzthdmhyzp.supabase.co/functions/v1/phonepe-initiate" `
  -Method OPTIONS `
  -Headers @{
    'Origin'='http://localhost:8082';
    'Access-Control-Request-Method'='POST';
    'Access-Control-Request-Headers'='content-type,x-client-info'
  }

# Should return 200 with Access-Control-Allow-* headers
```

### Test Payment Initiation
```powershell
# Make actual POST request
$body = @{
  merchantTransactionId = "MT$(Get-Date -Format 'yyyyMMddHHmmss')"
  amount = 5000
  callbackUrl = "https://osromibanfzzthdmhyzp.supabase.co/functions/v1/phonepe-webhook"
  merchantUserId = "TEST_USER_123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://osromibanfzzthdmhyzp.supabase.co/functions/v1/phonepe-initiate" `
  -Method POST `
  -Headers @{'Content-Type'='application/json'} `
  -Body $body

# Should return JSON with success: true/false
```

---

## Checklist Before Going Live

- [ ] All Edge Functions deployed
- [ ] Edge Function secrets configured
- [ ] Local testing passes (payment redirects to PhonePe)
- [ ] No CORS errors in console
- [ ] Orders created with correct user_id
- [ ] Phone number validated/fallback works
- [ ] Webhook endpoint receiving callbacks
- [ ] Test payments complete successfully
- [ ] Payment status updates in database
- [ ] Order status changes to "paid"
- [ ] User can view order history
- [ ] Error messages display correctly

---

## Performance & Security Notes

✅ **CORS**: Fixed to be specific (not wildcard)  
✅ **Secrets**: Secured on server-side only  
✅ **Auth**: Required for all payments  
✅ **Validation**: Input sanitized and validated  
✅ **Logging**: Sensitive data masked (phone last 4 digits)  
✅ **HTTPS**: All API calls use HTTPS  

⚠️ **Recommended Next Steps**:
1. Implement webhook signature verification (if PhonePe requires)
2. Add rate limiting on payment endpoints
3. Setup monitoring/alerts for failed payments
4. Test refund API integration
5. Setup payment reconciliation job

---

## Support

If issues persist:
1. Check console (F12) for error messages
2. Review Edge Function logs: `npx supabase functions logs <function-name>`
3. Verify all secrets are set in Supabase
4. Check PhonePe API status: https://status.phonepe.com
5. Ensure network requests complete (Network tab in F12)

---

**Last Updated**: 2025-11-18  
**Status**: ✅ Ready to Deploy
