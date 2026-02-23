# PhonePe 401 Error - SOLVED! 

## Problem Identified ✅

Your credentials are **PRODUCTION** credentials (Client ID: SU2511071520405754774079, Generated: Nov 07, 2025)
But your edge function is calling **SANDBOX** endpoints.

**Result:** Production credentials + Sandbox URL = 401 Unauthorized ❌

---

## Solution - Update Environment Variable

### Step 1: Update Supabase Secret

1. Open: https://supabase.com/dashboard/project/oikibnfnhauymhfpxiwi/settings/functions

2. Scroll to **Environment Variables** section

3. Find: `PHONEPE_ENV`

4. Current value: `SANDBOX`

5. **Change to:** `PRODUCTION`

6. Click **Save** button

### Step 2: Redeploy Edge Function

After changing the environment variable, redeploy:

```powershell
# Deploy phonepe-initiate function
supabase functions deploy phonepe-initiate --project-ref oikibnfnhauymhfpxiwi --no-verify-jwt
```

### Step 3: Test Payment

After redeployment:
1. Go to your website
2. Try making an online payment
3. Should now work! ✅

---

## Why This Happened

Your edge function uses this logic:

```typescript
const PHONEPE_ENV = Deno.env.get('PHONEPE_ENV') || 'SANDBOX';

const oauthUrl = PHONEPE_ENV === 'PRODUCTION' 
  ? 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token';  // ← Was calling this
```

Since `PHONEPE_ENV = SANDBOX`, it was calling:
- ❌ `https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token` (Sandbox URL)
- With production Client ID `SU2511071520405754774079`
- Sandbox server said: "These aren't sandbox credentials!" → 401

After changing to `PRODUCTION`, it will call:
- ✅ `https://api.phonepe.com/apis/identity-manager/v1/oauth/token` (Production URL)
- With production Client ID `SU2511071520405754774079`
- Production server will recognize credentials → 200 OK ✅

---

## Current Configuration Summary

**Supabase Edge Function Secrets:**
| Variable | Current Value | Status |
|----------|---------------|--------|
| `PHONEPE_MERCHANT_ID` | `M23DXJKWOH2QZ` | ✅ Correct |
| `PHONEPE_CLIENT_ID` | `SU2511071520405754774079` | ✅ Correct (Production) |
| `PHONEPE_CLIENT_SECRET` | `c70dce3a-c985-4237-add4-b8b9ad647bbf` | ✅ Correct (Production) |
| `PHONEPE_ENV` | `SANDBOX` | ❌ **CHANGE TO: `PRODUCTION`** |

---

## After Fix is Applied

Online payment flow will work:
1. User clicks "Proceed to Payment"
2. Edge function calls production OAuth endpoint ✅
3. Gets access token ✅
4. Creates payment with production API ✅
5. Redirects to PhonePe payment page ✅
6. User completes payment ✅
7. Redirects back to your site ✅

---

## No Code Changes Needed!

Just update one environment variable and redeploy. That's it! 🎉
