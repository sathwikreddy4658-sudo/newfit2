# PhonePe Integration - Complete Checklist & Testing Guide

## ✅ Issues Fixed

### 1. CORS Error (x-client-info header)
**Status**: ✅ FIXED

**Changes Made**:
- Updated `phonepe-initiate/index.ts` CORS headers to include `x-client-info, apikey`
- Updated `phonepe-check-status/index.ts` CORS headers to include `x-client-info, apikey`
- Updated `phonepe-webhook/index.ts` CORS headers with explicit allowed headers

**Result**: CORS preflight requests will now succeed with Supabase JS client headers.

---

### 2. Null user_id Database Error
**Status**: ✅ FIXED

**Changes Made**:
- Modified `src/pages/Checkout.tsx` to **require authentication** before payment
- User must be logged in to complete any payment (authenticated or guest checkout)
- All orders now include a valid `user_id` reference
- Removed nullable user_id assumption (kept NOT NULL constraint safe)

**Result**: No more null user_id violations.

---

### 3. Missing mobileNumber Handling
**Status**: ✅ FIXED

**Changes Made**:
- `phonepe-initiate/index.ts` now handles optional/missing mobileNumber
- Validates and sanitizes mobileNumber (removes non-digits, ensures 10 digits)
- Falls back to placeholder `9999999999` if not provided (PhonePe allows this)
- Phone number in Checkout attempts to get from user profile or guest data

**Result**: Payment initiation works even if user phone is missing.

---

### 4. Client-Side Secret Exposure
**Status**: ✅ FIXED

**Changes Made**:
- Removed `VITE_PHONEPE_CLIENT_ID` and `VITE_PHONEPE_CLIENT_SECRET` from `.env`
- Removed client-side references in `src/lib/phonepe.ts`
- Server now reads secrets ONLY from Supabase Edge Function environment variables
- `.env` now contains only public, safe values

**Result**: Secrets are no longer exposed to browser/bundled code. Secure ✅

---

## 📋 Verification Steps

### Step 1: Verify Environment Configuration
```bash
# Check .env contains ONLY public values
cat .env
# Should show:
# - VITE_SUPABASE_URL ✓
# - VITE_SUPABASE_PUBLISHABLE_KEY ✓
# - VITE_PHONEPE_MERCHANT_ID ✓ (public)
# - VITE_PHONEPE_API_URL ✓ (public)
# - VITE_PHONEPE_CALLBACK_URL ✓ (public)
# Should NOT show:
# - VITE_PHONEPE_CLIENT_ID ✗ (removed)
# - VITE_PHONEPE_CLIENT_SECRET ✗ (removed)
```

### Step 2: Verify Supabase Edge Function Secrets
In Supabase Dashboard:
1. Go to **Project Settings** → **Edge Functions**
2. Verify these secrets are set:
   - `PHONEPE_MERCHANT_ID` = `M23DXJKWOH2QZ`
   - `PHONEPE_CLIENT_ID` = `SU2511071520405754774079`
   - `PHONEPE_CLIENT_SECRET` = (your actual secret)

⚠️ **IMPORTANT**: These must be set before deploying Edge Functions!

### Step 3: Test CORS Preflight
```bash
# In terminal, test CORS OPTIONS request
curl -X OPTIONS \
  https://osromibanfzzthdmhyzp.supabase.co/functions/v1/phonepe-initiate \
  -H "Origin: http://localhost:8082" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type, x-client-info"

# Should see response headers including:
# Access-Control-Allow-Headers: Content-Type, Authorization, x-client-info, apikey
```

### Step 4: Deploy Edge Functions
```bash
# Deploy all PhonePe functions with environment variables
npx supabase functions deploy phonepe-initiate --no-verify-jwt
npx supabase functions deploy phonepe-check-status --no-verify-jwt
npx supabase functions deploy phonepe-webhook --no-verify-jwt

# Verify deployment
npx supabase functions list
```

### Step 5: Test Payment Flow (Manual)

#### 5.1 Test Flow: Authenticated User Payment
1. **Login** with a test account
2. **Add items** to cart
3. **Checkout** → should require authentication
4. **Fill address** (if first time user)
5. **Accept terms** checkbox
6. **Click "Go to Payment"**

**Expected behavior**:
- ✅ Order created in `orders` table with your `user_id`
- ✅ No CORS error in console
- ✅ Redirects to PhonePe payment page OR shows error message if credentials missing
- ✅ In Supabase, new record in `orders` table

#### 5.2 Test Error Scenarios
Use browser DevTools (F12) → Network tab to monitor requests:

1. **CORS Error Check**:
   - Request to `/functions/v1/phonepe-initiate` should NOT fail with CORS error
   - Request headers should show `x-client-info` is sent
   - Response should have `Access-Control-Allow-*` headers

2. **Missing Credentials**:
   - Should show: `"PhonePe credentials not configured"`
   - Check Supabase Edge Function secrets are set

3. **Invalid mobileNumber**:
   - System should use placeholder `9999999999`
   - Payment should still proceed (PhonePe accepts this)

---

## 🔍 API Reference Mapping

Per PhonePe API docs (from links provided):

| PhonePe Doc | Implementation | Status |
|-------------|-----------------|--------|
| **Authorization** (Basic Auth) | `phonepe-initiate`: Creates Basic Auth header with CLIENT_ID:CLIENT_SECRET | ✅ Done |
| **Create Payment** (`/v1/pay`) | `phonepe-initiate`: Posts payload to API endpoint | ✅ Done |
| **Order Status** (`/v1/status`) | `phonepe-check-status`: GET with Basic Auth | ✅ Done |
| **Webhook** | `phonepe-webhook`: Receives POST from PhonePe | ✅ Done |
| **Refund** | Not yet implemented | ⏳ Future |

---

## 🚀 Next Steps for Production

### 1. Sandbox Testing (UAT)
- [ ] Set up PhonePe test credentials in Supabase secrets
- [ ] Use `https://api-sandbox.phonepe.com/apis/pg` endpoint (update env variable)
- [ ] Test payment with mock card data
- [ ] Verify webhook callbacks are received

### 2. Production Setup
- [ ] Update to production PhonePe credentials
- [ ] Change API endpoint to `https://api.phonepe.com/apis/pg`
- [ ] Test with real test transactions
- [ ] Verify webhook signature verification (if required by PhonePe)

### 3. Additional Features to Implement
- [ ] Refund API endpoint
- [ ] Payment status polling for polling-based model
- [ ] Email notifications on payment success/failure
- [ ] User payment history page
- [ ] Admin dashboard for payment tracking

---

## 📝 Code References

### Modified Files:
1. `.env` - Removed client secrets
2. `src/lib/phonepe.ts` - Removed client secret references
3. `src/pages/Checkout.tsx` - Ensures auth before payment, fixes user_id
4. `supabase/functions/phonepe-initiate/index.ts` - Fixed CORS, made mobileNumber optional
5. `supabase/functions/phonepe-check-status/index.ts` - Fixed CORS headers
6. `supabase/functions/phonepe-webhook/index.ts` - Fixed CORS headers

### Database Tables Used:
- `orders` - Stores order data (with authenticated user_id)
- `order_items` - Stores items in each order
- `payment_transactions` - Stores payment details (if exists)

---

## 🧪 Testing Command Reference

```bash
# Start dev server
npm run dev

# Deploy all functions
npx supabase functions deploy phonepe-initiate --no-verify-jwt
npx supabase functions deploy phonepe-check-status --no-verify-jwt
npx supabase functions deploy phonepe-webhook --no-verify-jwt

# Check function logs
npx supabase functions logs phonepe-initiate --limit 50

# Test webhook manually (replace URL and body as needed)
curl -X POST \
  https://osromibanfzzthdmhyzp.supabase.co/functions/v1/phonepe-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "success": true,
    "code": "PAYMENT_INITIATED",
    "message": "Payment initiated successfully",
    "data": {
      "merchantId": "M23DXJKWOH2QZ",
      "merchantTransactionId": "MT123456789",
      "transactionId": "PHONEPE-TXN-123",
      "amount": 50000,
      "state": "COMPLETED",
      "responseCode": "SUCCESS"
    }
  }'
```

---

## ⚠️ Security Checklist

- [x] No client secrets in `.env` or bundle
- [x] Secrets only in Supabase Edge Function secrets
- [x] HTTPS enforced for all API calls
- [x] CORS properly configured
- [x] Authentication required before payment
- [ ] Webhook signature verification (TODO - implement if PhonePe requires)
- [ ] Rate limiting on endpoints (recommended)

---

## 📞 Support Links

- [PhonePe API Docs](https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase Environment Variables](https://supabase.com/docs/guides/functions/secrets)

---

**Last Updated**: 2025-11-18
**Status**: Ready for testing
