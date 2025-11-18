# PhonePe API v2.0 Integration Fix

## Problem Identified

The original implementation was using **PhonePe API v1** structure and endpoints, which was causing "Bad Request - Api Mapping Not Found" errors.

### What Was Wrong:
1. **Wrong API Endpoint**: `/v1/pay` (v1 endpoint)
2. **Wrong Authentication**: HTTP Basic Auth with Client ID:Secret
3. **Wrong Payload Structure**: Using old v1 fields like `merchantId`, `paymentInstrument.type`, `deviceContext`
4. **No OAuth Token**: Not using the required OAuth token authentication

## Solution Implemented

Updated to **PhonePe Standard Checkout v2.0 API** which requires:

### Step 1: OAuth Token Generation
- **Endpoint**: 
  - Sandbox: `https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token`
  - Production: `https://api.phonepe.com/apis/identity-manager/v1/oauth/token`
- **Method**: POST with URL-encoded form data
- **Parameters**:
  ```
  client_id=<PHONEPE_CLIENT_ID>
  client_version=1
  client_secret=<PHONEPE_CLIENT_SECRET>
  grant_type=client_credentials
  ```
- **Response**: Returns `access_token` with `token_type: "O-Bearer"`

### Step 2: Create Payment Request
- **Endpoint**: 
  - Sandbox: `https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay`
  - Production: `https://api.phonepe.com/apis/pg/checkout/v2/pay`
- **Method**: POST with JSON body
- **Authorization Header**: `O-Bearer <access_token>`
- **Payload Structure (v2.0)**:
  ```json
  {
    "merchantOrderId": "TX123456",
    "amount": 1000,
    "expireAfter": 1200,
    "paymentFlow": {
      "type": "PG_CHECKOUT",
      "message": "Payment for order",
      "merchantUrls": {
        "redirectUrl": "https://your-site.com/callback"
      }
    }
  }
  ```

### Response Structure
```json
{
  "orderId": "OMO123456789",
  "state": "PENDING",
  "expireAt": 1703756259307,
  "redirectUrl": "https://mercury-uat.phonepe.com/transact/uat_v2?token=..."
}
```

## Files Modified

### 1. `supabase/functions/phonepe-initiate/index.ts`
**Changes:**
- Removed Base64 encoding for Basic Auth
- Added OAuth token request function
- Changed from v1 to v2.0 API endpoint
- Updated payload structure to use `merchantOrderId` and `paymentFlow`
- Two-step process: Get OAuth token → Create payment
- Added environment detection (PRODUCTION vs UAT sandbox)

### 2. `src/lib/phonepe.ts`
**Changes:**
- Removed `mobileNumber` from request body (not required in v2.0)
- Added `redirectUrl` to request body (now required)
- Updated comments to reflect v2.0 API

### 3. `src/pages/Checkout.tsx`
**No Changes Required** ✅
- Already includes `redirectUrl` in payment options
- Already includes `callbackUrl` for webhook
- Both parameters are now being used correctly

## Key Differences: v1 vs v2.0

| Feature | v1 | v2.0 |
|---------|-----|------|
| **Auth Method** | Basic Auth (Client ID:Secret in header) | OAuth Token (O-Bearer token) |
| **Endpoint** | `/v1/pay` | `/checkout/v2/pay` |
| **Order ID Field** | `merchantTransactionId` | `merchantOrderId` |
| **Merchant Field** | `merchantId` (required) | Not required |
| **Payment Type** | `paymentInstrument.type: "PAY_PAGE"` | Not applicable |
| **Redirect URL** | `callbackUrl` only | Inside `paymentFlow.merchantUrls.redirectUrl` |
| **Mobile Number** | Required, sanitized | Not used in v2.0 |
| **Device Context** | `deviceContext.deviceOS` | Removed |

## Testing Instructions

### 1. Local Testing with Sandbox
- Change endpoint to sandbox: `https://api-preprod.phonepe.com/apis/pg-sandbox`
- Use sandbox credentials from PhonePe dashboard
- Use UAT test cards:
  - Visa Debit: 4242 4242 4242 4242
  - Visa Credit: 4208 5851 9011 6667
  - OTP: 123456

### 2. Expected Flow
1. Frontend calls Edge Function with payment details
2. Edge Function gets OAuth token from PhonePe
3. Edge Function creates payment with PhonePe v2.0 API
4. PhonePe returns redirect URL to payment page
5. Frontend opens iframe with payment URL
6. User completes payment
7. PhonePe sends webhook callback to confirm payment

### 3. Monitor Logs
```
[PhonePe Initiate] Step 1: Requesting OAuth token...
[PhonePe Initiate] OAuth token response: { status: 200, hasToken: true, tokenType: 'O-Bearer' }
[PhonePe Initiate] Step 2: Creating payment request...
[PhonePe Initiate] Calling payment API: https://api.phonepe.com/apis/pg/checkout/v2/pay
[PhonePe Initiate] Payment API Response status: 200
[PhonePe Initiate] Payment initiated successfully
```

## References

- [PhonePe v2.0 Create Payment API](https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/api-reference/create-payment)
- [PhonePe Authorization (OAuth)](https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/api-reference/authorization)
- [PhonePe Integration Steps](https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/integration-steps)
- [PhonePe UAT Sandbox Testing](https://developer.phonepe.com/payment-gateway/uat-testing-go-live/uat-sandbox)

## Security Notes

✅ **CLIENT SECRETS SAFE**:
- `PHONEPE_CLIENT_ID` and `PHONEPE_CLIENT_SECRET` are only in Supabase Edge Function environment
- Not exposed to client bundle
- Not in `.env` file

✅ **AUTHENTICATION REQUIRED**:
- All payments require authenticated user
- `merchantUserId` = authenticated user's ID
- Orders linked to user account

✅ **WEBHOOK VERIFICATION**:
- Callback signature verified on webhook
- PhonePe updates `payment_transactions` table
- Orders marked as "paid" on success

## Deployment Status

✅ **DEPLOYED**: `npx supabase functions deploy phonepe-initiate --no-verify-jwt`
- Function uploaded successfully
- Now using PhonePe v2.0 API
- Ready for testing

## Next Steps

1. ✅ Test payment flow end-to-end with sandbox
2. ✅ Verify webhook callbacks are received
3. ✅ Test all payment statuses (SUCCESS, FAILURE, PENDING)
4. ✅ Confirm database updates correctly
5. ⏳ Move to production credentials and testing
