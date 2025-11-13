# 🚀 DEPLOYMENT WALKTHROUGH (Brief Steps)

## Step 1: Deploy Edge Functions (2 minutes)

Open PowerShell and run these commands:

```powershell
# Navigate to project
cd 'c:\Users\vivek\Downloads\newfit-main\newfit-main'

# Deploy first function
supabase functions deploy phonepe-initiate

# Wait for completion...
# You should see: ✓ Deployed successfully

# Deploy second function
supabase functions deploy phonepe-check-status

# Wait for completion...
# You should see: ✓ Deployed successfully
```

**What to expect**:
```
✓ phonepe-initiate deployed
✓ phonepe-check-status deployed
```

---

## Step 2: Add Secrets to Supabase (3 minutes)

### Option A: Using CLI (Fastest)
```powershell
# Run these commands in PowerShell:
supabase secrets set PHONEPE_MERCHANT_ID="M23DXJKWOH2QZ"
supabase secrets set PHONEPE_CLIENT_ID="SU2511071520405754774079"
supabase secrets set PHONEPE_CLIENT_SECRET="<your_production_secret>"
supabase secrets set PHONEPE_API_URL="https://api.phonepe.com/apis/pg"
```

**Expected output**:
```
✓ PHONEPE_MERCHANT_ID set
✓ PHONEPE_CLIENT_ID set
✓ PHONEPE_CLIENT_SECRET set
✓ PHONEPE_API_URL set
```

### Option B: Using Web Dashboard (If CLI doesn't work)
1. Go to: **https://app.supabase.com**
2. Select your **freelit** project
3. Go to: **Functions → Settings**
4. Click: **Add a new secret**
5. Add each secret one by one:
   - `PHONEPE_MERCHANT_ID` = `M23DXJKWOH2QZ`
   - `PHONEPE_CLIENT_ID` = `SU2511071520405754774079`
   - `PHONEPE_CLIENT_SECRET` = `<your_production_secret>`
   - `PHONEPE_API_URL` = `https://api.phonepe.com/apis/pg`

---

## Step 3: Redeploy Functions (1 minute)

After adding secrets, redeploy to pick them up:

```powershell
supabase functions deploy phonepe-initiate
supabase functions deploy phonepe-check-status
```

**Then continue to testing...**

---

## Step 4: Test in Browser (5 minutes)

### 1. Open Browser
```
Go to: http://localhost:8080/checkout
```

### 2. Follow These Steps
- [ ] Add a product to cart (click any product)
- [ ] Scroll down to checkout form
- [ ] Enter phone: `9876543210` (or your test number)
- [ ] Enter address: `123 Main St, City, 560001`
- [ ] Click "Go to Payment"

### 3. What You Should See
✅ **NO CORS error** in browser  
✅ Page loads payment gateway  
✅ Redirects to PhonePe page  

### 4. Verify in Console (F12)
Press **F12** to open Developer Tools → **Console** tab

You should see:
```
[PhonePe] Initiating payment via Edge Function (attempt 1/3) {
  merchantTransactionId: "ORDER_...",
  amount: 99900
}

[PhonePe] Payment initiation response: {
  success: true,
  code: "SUCCESS"
}
```

**If you see this** → ✅ **EVERYTHING WORKS!**

---

## ✅ Success Indicators

| Step | Success Sign | What to Do |
|------|---|---|
| **Deploy** | Functions appear in Supabase | ✓ Continue |
| **Secrets** | No errors when setting | ✓ Continue |
| **Test** | No CORS error, page loads | ✓ SUCCESS! |
| **Console** | See [PhonePe] logs | ✅ DONE! |

---

## 🆘 If Something Goes Wrong

### Problem: "supabase: command not found"
```powershell
npm install -g @supabase/cli
```

### Problem: "Not authenticated"
```powershell
supabase login
```

### Problem: Still seeing CORS error
1. Check functions deployed: `supabase functions list`
2. Verify secrets set: `supabase secrets list`
3. Hard refresh browser: `Ctrl+Shift+R`
4. Check console: `F12 → Console`

### Problem: Function not found
```powershell
# Verify both are deployed
supabase functions list

# Should show both:
# phonepe-initiate
# phonepe-check-status
```

---

## 📝 Copy-Paste Quick Reference

### All Deploy Commands (Copy & Paste Together)
```powershell
cd 'c:\Users\vivek\Downloads\newfit-main\newfit-main'
supabase functions deploy phonepe-initiate
supabase functions deploy phonepe-check-status
supabase secrets set PHONEPE_MERCHANT_ID="M23DXJKWOH2QZ"
supabase secrets set PHONEPE_CLIENT_ID="SU2511071520405754774079"
supabase secrets set PHONEPE_CLIENT_SECRET="your_secret_here"
supabase secrets set PHONEPE_API_URL="https://api.phonepe.com/apis/pg"
supabase functions deploy phonepe-initiate
supabase functions deploy phonepe-check-status
```

### Test URL
```
http://localhost:8080/checkout
```

### Test Phone Numbers
```
✓ 9876543210
✓ +919876543210
✓ 919876543210
```

---

## ⏱️ Timeline

```
Step 1 (Deploy):        2 min
Step 2 (Secrets):       3 min
Step 3 (Redeploy):      1 min
Step 4 (Test):          5 min
                        ────
TOTAL:                 ~11 minutes
```

---

## 🎯 FINAL CHECKLIST

- [ ] Ran `supabase functions deploy phonepe-initiate`
- [ ] Ran `supabase functions deploy phonepe-check-status`
- [ ] Added 4 secrets to Supabase
- [ ] Redeployed both functions
- [ ] Opened http://localhost:8080/checkout
- [ ] Entered test data (phone, address)
- [ ] Clicked "Go to Payment"
- [ ] ✅ No CORS error!
- [ ] ✅ Console shows [PhonePe] logs
- [ ] 🎉 SUCCESS!

---

**THAT'S IT!** You're done! 🚀

If you see the [PhonePe] logs in console with no CORS error → **Everything is working perfectly!**

Next: You can now test with real payments or deploy to staging.

**Questions?** See `CORS_DEPLOY_NOW.md` for more details.
