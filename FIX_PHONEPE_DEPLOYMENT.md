# 🚀 Fix PhonePe Payment - Deploy Edge Functions

## ❌ Current Error:
```
CORS policy: Response to preflight request doesn't pass access control check
POST https://oikibnfnhauymhfpxiwi.supabase.co/functions/v1/phonepe_initiate net::ERR_FAILED
```

**Cause**: Edge functions exist in code but aren't deployed to Supabase yet.

---

## ✅ Quick Fix (Web Dashboard - NO CLI NEEDED)

### **Step 1: Prepare Edge Functions for Manual Deployment**

The easiest way since CLI might have issues is to deploy via Supabase Dashboard using the SQL Editor approach or wait for Supabase to add web-based edge function deployment.

**However**, I'll create deployment scripts for you:

---

## 🎯 Solution A: Deploy via Supabase CLI (Recommended if CLI works)

### 1. Install Supabase CLI (if not installed)
```powershell
# Install via npm
npm install -g supabase

# Or via chocolatey
choco install supabase
```

### 2. Login to Supabase
```powershell
supabase login
```

### 3. Link to Your Project
```powershell
supabase link --project-ref oikibnfnhauymhfpxiwi
```

### 4. Deploy PhonePe Edge Functions
```powershell
# Deploy all 3 PhonePe functions
supabase functions deploy phonepe-initiate --no-verify-jwt
supabase functions deploy phonepe-check-status --no-verify-jwt  
supabase functions deploy phonepe-webhook --no-verify-jwt

# Verify deployment
supabase functions list
```

### 5. Set Environment Secrets in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/oikibnfnhauymhfpxiwi/settings/functions
2. Click **"Secrets"** tab
3. Add these 4 secrets (one by one):

```
PHONEPE_MERCHANT_ID = M23DXJKWOH2QZ
PHONEPE_CLIENT_ID = SU2511071520405754774079
PHONEPE_CLIENT_SECRET = c70dce3a-c985-4237-add4-b8b9ad647bbf
PHONEPE_API_URL = https://api.phonepe.com/apis/pg
```

4. Click **Save** after all secrets are added

---

## 🔄 Solution B: If CLI Doesn't Work (Contact Supabase Support)

Since Supabase doesn't have web UI for edge function deployment yet, you'll need to either:

1. **Fix CLI issues** (if you see CLI errors, share them with me)
2. **Contact Supabase Support** and ask them to deploy the functions for you:
   - Provide them with the function code from `supabase/functions/phonepe-initiate/index.ts`
   - Or give them GitHub repo access

---

## 📋 After Deployment: Verify Everything Works

### Step 1: Test Edge Function Endpoint (in Browser Console)
Open browser console (F12) and run:
```javascript
fetch('https://oikibnfnhauymhfpxiwi.supabase.co/functions/v1/phonepe-initiate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    merchantTransactionId: 'TEST123',
    amount: 100,
    redirectUrl: 'http://localhost:8080',
    callbackUrl: 'http://localhost:8080',
    mobileNumber: '9999999999'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

**Expected Response** (if deployed correctly):
```json
{
  "success": false,
  "code": "AUTHENTICATION_ERROR",
  "message": "OAuth token missing or invalid"
}
```
This error is GOOD - it means the function is deployed and running!

**Bad Response** (function not deployed):
```
net::ERR_FAILED
CORS error
```

---

### Step 2: Test Payment Flow in Your App
1. Start dev server: `npm run dev`
2. Add items to cart
3. Go to checkout
4. Fill in address and accept terms
5. Click **"Pay Now"** or **"Go to Payment"**
6. Check console - should NOT see CORS errors

---

## 🆘 Troubleshooting

### Issue: "Command not found: supabase"
**Solution**: Install Supabase CLI:
```powershell
npm install -g supabase
```

### Issue: "Project ref is required"  
**Solution**: Your project ref is `oikibnfnhauymhfpxiwi`, use:
```powershell
supabase link --project-ref oikibnfnhauymhfpxiwi
```

### Issue: "Failed to deploy function"
**Solution**: Check if you're logged in:
```powershell
supabase login
# Opens browser for OAuth
```

### Issue: Still getting CORS errors after deployment
**Solutions**:
1. Wait 30 seconds for deployment to propagate
2. Clear browser cache (Ctrl+Shift+Delete)
3. Check function logs in Supabase Dashboard → Edge Functions → Logs
4. Verify secrets are set correctly

---

## 📁 Files That Need to Be Deployed

These 3 edge functions are in your project:

1. **`supabase/functions/phonepe-initiate/index.ts`**
   - Initiates payment with PhonePe
   - Called when user clicks "Pay Now"

2. **`supabase/functions/phonepe-check-status/index.ts`**
   - Checks payment status
   - Called after payment completion

3. **`supabase/functions/phonepe-webhook/index.ts`**
   - Receives payment webhooks from PhonePe
   - Updates order status automatically

---

## 🎯 Quick Test Commands

After deploying, verify with these commands:

### Check if functions are deployed:
```powershell
supabase functions list
```

Should show:
```
┌──────────────────────┬─────────┬──────────────┐
│ NAME                 │ STATUS  │ REGION       │
├──────────────────────┼─────────┼──────────────┤
│ phonepe-initiate     │ ACTIVE  │ ap-south-1   │
│ phonepe-check-status │ ACTIVE  │ ap-south-1   │
│ phonepe-webhook      │ ACTIVE  │ ap-south-1   │
└──────────────────────┴─────────┴──────────────┘
```

### View function logs:
```powershell
supabase functions logs phonepe-initiate
```

---

## ✅ Success Checklist

- [ ] Supabase CLI installed and logged in
- [ ] Edge functions deployed (all 3)
- [ ] 4 environment secrets set in Supabase Dashboard
- [ ] Test endpoint returns response (not CORS error)
- [ ] Payment flow works without CORS errors
- [ ] Orders created successfully in database

---

## 📞 Need Help?

If you encounter any errors during deployment, share:
1. The exact error message
2. Output of `supabase functions list`
3. Screenshot of Supabase Dashboard → Edge Functions page

I'll help you fix it immediately!
