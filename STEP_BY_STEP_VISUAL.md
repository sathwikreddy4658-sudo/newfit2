# 📸 STEP-BY-STEP VISUAL GUIDE

## STEP 1️⃣: Deploy Edge Functions

### Terminal Window:
```
PowerShell

C:\Users\vivek\Downloads\newfit-main\newfit-main>
  ↓ Paste this command
```

### Command 1:
```bash
supabase functions deploy phonepe-initiate
```

**You'll see**:
```
Deploying function phonepe-initiate...
✓ phonepe-initiate deployed successfully
   URL: https://[project-id].supabase.co/functions/v1/phonepe-initiate
```

### Command 2:
```bash
supabase functions deploy phonepe-check-status
```

**You'll see**:
```
Deploying function phonepe-check-status...
✓ phonepe-check-status deployed successfully
   URL: https://[project-id].supabase.co/functions/v1/phonepe-check-status
```

✅ **STEP 1 COMPLETE** - Both functions deployed!

---

## STEP 2️⃣: Add Secrets to Supabase

### Command 1:
```bash
supabase secrets set PHONEPE_MERCHANT_ID="M23DXJKWOH2QZ"
```

**You'll see**:
```
✓ PHONEPE_MERCHANT_ID set successfully
```

### Command 2:
```bash
supabase secrets set PHONEPE_CLIENT_ID="SU2511071520405754774079"
```

**You'll see**:
```
✓ PHONEPE_CLIENT_ID set successfully
```

### Command 3:
```bash
supabase secrets set PHONEPE_CLIENT_SECRET="<your_production_secret>"
```

**Replace** `<your_production_secret>` with your actual PhonePe secret

**You'll see**:
```
✓ PHONEPE_CLIENT_SECRET set successfully
```

### Command 4:
```bash
supabase secrets set PHONEPE_API_URL="https://api.phonepe.com/apis/pg"
```

**You'll see**:
```
✓ PHONEPE_API_URL set successfully
```

### Verify Secrets Are Set:
```bash
supabase secrets list
```

**You'll see**:
```
PHONEPE_MERCHANT_ID = M23DXJKWOH2QZ
PHONEPE_CLIENT_ID = SU2511071520405754774079
PHONEPE_CLIENT_SECRET = [hidden]
PHONEPE_API_URL = https://api.phonepe.com/apis/pg
```

✅ **STEP 2 COMPLETE** - All secrets added!

---

## STEP 3️⃣: Redeploy Functions (Pick Up Secrets)

### Command 1:
```bash
supabase functions deploy phonepe-initiate
```

**You'll see**:
```
Deploying function phonepe-initiate...
✓ phonepe-initiate deployed successfully
```

### Command 2:
```bash
supabase functions deploy phonepe-check-status
```

**You'll see**:
```
Deploying function phonepe-check-status...
✓ phonepe-check-status deployed successfully
```

✅ **STEP 3 COMPLETE** - Functions redeployed with secrets!

---

## STEP 4️⃣: Test in Browser

### Open Browser:
Go to URL in address bar:
```
http://localhost:8080/checkout
```

**You'll see**:
```
╔════════════════════════════════════╗
║        Checkout Page               ║
║                                    ║
║  Products in Cart                  ║
║  ┌──────────────────────────────┐  ║
║  │ Product 1         ₹999       │  ║
║  │ Qty: 1                       │  ║
║  └──────────────────────────────┘  ║
║                                    ║
║  Phone: [          ]               ║
║  Address: [                    ]   ║
║                                    ║
║  [Go to Payment]                   ║
╚════════════════════════════════════╝
```

### Fill in Form:

1. **Phone Field**:
   - Click the phone input
   - Type: `9876543210`
   - Should show: ✓ Valid Indian phone

2. **Address Field**:
   - Click address input
   - Type: `123 Main Street, Bangalore, 560001`

3. **Click Button**:
   - Look for button labeled "Go to Payment"
   - Click it

### Expected Result:

✅ **NO error message**  
✅ **Browser doesn't show CORS error**  
✅ **Page either redirects or shows loading**  

---

## STEP 5️⃣: Verify in Developer Console

### Open Console:
Press **F12** on keyboard (or **Ctrl+Shift+I**)

**You'll see**:
```
┌─────────────────────────────────────┐
│ DevTools Window Opens               │
│                                     │
│ Elements | Console | Network | ...  │
│                                     │
│ (Click Console tab)                 │
└─────────────────────────────────────┘
```

### Look for These Messages:

```
[PhonePe] Initiating payment via Edge Function (attempt 1/3) {
  merchantTransactionId: "ORDER_1731421234567",
  amount: 99900
}

[PhonePe] Payment initiation response: {
  success: true,
  code: "SUCCESS",
  message: "Payment initiated successfully"
}
```

### If You See This:
✅ **SUCCESS!** Everything is working!
✅ Payment gateway is connected!
✅ No CORS error!

---

## ❌ If Something Goes Wrong

### Scenario 1: CORS Error Still Appears
```
❌ Error: Access to fetch at 'https://api.phonepe.com...' 
   has been blocked by CORS policy
```

**Fix**:
1. Hard refresh browser: `Ctrl+Shift+R`
2. Check functions deployed: `supabase functions list`
3. Check secrets set: `supabase secrets list`
4. Redeploy: `supabase functions deploy phonepe-initiate`

### Scenario 2: "Function not found" Error
```
❌ Error: Could not find function phonepe-initiate
```

**Fix**:
```bash
# Check what functions exist
supabase functions list

# If empty, deploy again
supabase functions deploy phonepe-initiate
supabase functions deploy phonepe-check-status
```

### Scenario 3: No Logs in Console
```
❌ Console is empty when clicking "Go to Payment"
```

**Fix**:
1. Make sure dev server is running: `npm run dev`
2. Page is open at: `http://localhost:8080/checkout`
3. You filled in phone and address
4. You clicked the payment button
5. Check Network tab (next to Console) for requests

---

## 📊 Summary Visual

```
TERMINAL                          BROWSER
─────────────────                 ──────────────────

1. Deploy Functions               
   supabase functions deploy ✓    

2. Add Secrets                    
   supabase secrets set ✓         

3. Redeploy                       
   supabase functions deploy ✓    

4. Ready for testing              → http://localhost:8080/checkout
                                  
5. User fills form                → Phone: 9876543210
                                  → Address: ...
                                  
6. Clicks "Go to Payment"         → [Button Click]
                                  ↓
                                  Calls Supabase Edge Function
                                  ↓
                                  Edge Function calls PhonePe API
                                  ↓
                                  Returns payment URL
                                  ↓
7. Console shows logs             ← [PhonePe] Payment initiated
                                  
8. No CORS error ✅               ← Ready for payment!
```

---

## ✅ FINAL VERIFICATION

After clicking "Go to Payment", check:

- [ ] **Console (F12)**
  ```
  Look for: [PhonePe] Payment initiation response: { success: true }
  ```

- **No Errors**
  ```
  Should NOT see: CORS error, Failed to fetch, TypeError
  ```

- **Page Behavior**
  ```
  Should: Redirect to PhonePe page OR show loading
  ```

- **Success**
  ```
  ✅ All above conditions met = WORKING!
  ```

---

## 🎯 YOU'RE DONE WHEN:

1. ✅ Both Edge Functions deployed to Supabase
2. ✅ All 4 secrets added to Supabase
3. ✅ Functions redeployed
4. ✅ Checkout page loads at http://localhost:8080/
5. ✅ Form accepts phone and address
6. ✅ Clicking payment button shows no CORS error
7. ✅ Console shows [PhonePe] success logs
8. 🎉 **Payment gateway is working!**

---

**Questions?** Open the full `DEPLOY_WALKTHROUGH.md` for detailed troubleshooting!
