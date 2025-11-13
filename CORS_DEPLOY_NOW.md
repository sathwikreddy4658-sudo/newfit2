# 🚀 DEPLOY NOW: CORS Fix Edge Functions

**Copy-paste ready deployment instructions**

---

## STEP 1: Deploy Edge Functions

Run these commands from your project directory:

```bash
cd c:\Users\vivek\Downloads\newfit-main\newfit-main

# Deploy the two new edge functions
supabase functions deploy phonepe-initiate
supabase functions deploy phonepe-check-status

# Verify they're deployed
supabase functions list
```

**Expected Output**:
```
✓ phonepe-initiate deployed
✓ phonepe-check-status deployed
```

---

## STEP 2: Add Secrets in Supabase Dashboard

### Method A: Using Supabase CLI

```bash
# Set secrets for phonepe-initiate
supabase secrets set PHONEPE_MERCHANT_ID="M23DXJKWOH2QZ"
supabase secrets set PHONEPE_CLIENT_ID="SU2511071520405754774079"
supabase secrets set PHONEPE_CLIENT_SECRET="your_production_secret_here"
supabase secrets set PHONEPE_API_URL="https://api.phonepe.com/apis/pg"

# Verify secrets are set
supabase secrets list
```

### Method B: Using Web Dashboard

1. Open: https://app.supabase.com
2. Select your project (freelit)
3. Go to: Settings → Secrets
4. Add these secrets:
   ```
   PHONEPE_MERCHANT_ID = M23DXJKWOH2QZ
   PHONEPE_CLIENT_ID = SU2511071520405754774079
   PHONEPE_CLIENT_SECRET = <your_production_secret>
   PHONEPE_API_URL = https://api.phonepe.com/apis/pg
   ```

---

## STEP 3: Redeploy Functions After Adding Secrets

```bash
supabase functions deploy phonepe-initiate
supabase functions deploy phonepe-check-status
```

**Wait for completion** - Functions will pick up secrets on next deploy

---

## STEP 4: Test Locally

1. **Dev server already running** at http://localhost:8080/

2. **Test the flow**:
   - Open browser: http://localhost:8080/checkout
   - Add product to cart
   - Enter phone: `9876543210`
   - Enter address: `123 Main St, City, 560001`
   - Click: "Go to Payment"

3. **Verify**:
   - ✅ No CORS error
   - ✅ Page redirects
   - ✅ Console shows success (F12)

---

## STEP 5: Verify in Console

Open browser DevTools (F12) → Console, you should see:

```
[PhonePe] Initiating payment via Edge Function (attempt 1/3) {
  merchantTransactionId: "ORDER_...",
  amount: 99900
}

[PhonePe] Payment initiation response: {
  success: true,
  code: "SUCCESS",
  message: "Payment initiated successfully"
}
```

**If you see this** → ✅ **WORKING!**

---

## TROUBLESHOOTING

### Error: "supabase: command not found"
Install Supabase CLI:
```bash
npm install -g @supabase/cli
```

### Error: "Not authenticated"
Login to Supabase:
```bash
supabase login
```

### Error: "Function not found"
Verify function was deployed:
```bash
supabase functions list
# Should show phonepe-initiate and phonepe-check-status
```

### Error: "Credentials not configured"
Verify secrets in Supabase:
1. Go to Dashboard → Functions
2. Click on function
3. Settings → Verify secrets are there
4. Redeploy if changed

### Error: Still getting CORS error
1. Check deployed functions: `supabase functions list`
2. Check secrets are set
3. Check dev server restart: `npm run dev`
4. Check browser cache: Hard refresh (Ctrl+Shift+R)

---

## COMMANDS QUICK REFERENCE

```bash
# List all functions
supabase functions list

# View function details
supabase functions download phonepe-initiate

# View logs
supabase functions logs phonepe-initiate

# List secrets
supabase secrets list

# Redeploy after changes
supabase functions deploy phonepe-initiate

# Remove function (if needed)
supabase functions delete phonepe-initiate
```

---

## VALIDATION CHECKLIST

- [ ] Functions deployed successfully
- [ ] Secrets added to Supabase
- [ ] Functions redeployed after secrets added
- [ ] Dev server running (http://localhost:8080/)
- [ ] Checkout page loads
- [ ] No CORS error in console
- [ ] Payment page redirects
- [ ] Console shows [PhonePe] success logs

---

## COMPLETED ✅

Once you see the success message in console with no CORS error:

✅ **CORS Fix is WORKING**  
✅ **Payment Gateway is FUNCTIONAL**  
✅ **Ready for Staging**  
✅ **Ready for Production**

---

## WHAT HAPPENS NEXT

After you click "Go to Payment":

1. Frontend sends request to Supabase Edge Function
2. Edge Function authenticates with PhonePe API
3. PhonePe returns payment page URL
4. Browser redirects to PhonePe payment page
5. User completes payment on PhonePe
6. PhonePe calls your callback URL
7. Order status updates in admin panel
8. Customer receives confirmation email

**All without any CORS errors!** 🎉

---

## TIME ESTIMATE

- Deploy functions: 2 minutes
- Add secrets: 3 minutes  
- Redeploy: 1 minute
- Test: 5 minutes
- **Total: ~11 minutes** ⚡

---

**Status**: Ready to deploy immediately  
**Next**: Run Step 1 command above  
**Success**: When you see [PhonePe] logs in console ✅
