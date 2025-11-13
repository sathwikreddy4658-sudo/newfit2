# ⚡ CRITICAL: Manual Supabase Configuration Required

The CORS error is happening because Supabase Edge Functions require additional configuration in the dashboard.

## 🔧 Step-by-Step Manual Configuration

### Step 1: Open Supabase Dashboard
1. Go to: https://app.supabase.com
2. Login and select your **freelit** project

### Step 2: Configure Edge Function Authentication
For each Edge Function (`phonepe-initiate`, `phonepe-check-status`, `cors-test`):

1. Go to: **Functions** (left sidebar)
2. Click on the function name (`phonepe-initiate` first)
3. Click the **Settings** tab (gear icon) in the top right
4. Find: **JWT Verification** or **Auth Configuration**
5. **Toggle OFF** "Require JWT" or "Enforce Auth"
6. Click **Save** or **Update**

### Step 3: Add Environment Variables
1. Still in Functions section
2. Find: **Secrets** or **Environment Variables**
3. Add these 4 secrets:

```
PHONEPE_MERCHANT_ID = M23DXJKWOH2QZ
PHONEPE_CLIENT_ID = SU2511071520405754774079
PHONEPE_CLIENT_SECRET = c70dce3a-c985-4237-add4-b8b9ad647bbf
PHONEPE_API_URL = https://api.phonepe.com/apis/pg
```

4. Click **Add Secret** for each
5. Wait for ✅ confirmation

### Step 4: Redeploy Functions
1. Go back to **Functions** list
2. Select each function and click the **...** menu
3. Select **Redeploy** 
4. Wait for green status indicator

### Step 5: Test CORS
After redeployment completes:

1. Open: http://localhost:8080/debug.html
2. Click: **"Test Direct Fetch (Show All Headers)"**
3. Check the response

**If you see status 200 and success message = ✅ FIXED!**

---

## 🆘 If Still Not Working

Please screenshot and share:
1. The exact error message in browser console
2. The Supabase Function settings page
3. Whether the secrets show as "Added"

---

## ⚠️ Important Note

The `supabase.json` configuration file in the repo might not apply to already-deployed functions. The manual dashboard configuration is what actually controls the behavior.
