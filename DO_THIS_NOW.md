# ⚡ QUICK START - DO THIS NOW

## Copy & Paste These Commands

Open PowerShell and paste each command:

### Command 1: Navigate to project
```powershell
cd 'c:\Users\vivek\Downloads\newfit-main\newfit-main'
```

### Command 2: Deploy first function
```powershell
supabase functions deploy phonepe-initiate
```
Wait for: `✓ phonepe-initiate deployed successfully`

### Command 3: Deploy second function
```powershell
supabase functions deploy phonepe-check-status
```
Wait for: `✓ phonepe-check-status deployed successfully`

### Command 4-7: Add all secrets (one by one)
```powershell
supabase secrets set PHONEPE_MERCHANT_ID="M23DXJKWOH2QZ"
supabase secrets set PHONEPE_CLIENT_ID="SU2511071520405754774079"
supabase secrets set PHONEPE_CLIENT_SECRET="<your_production_secret>"
supabase secrets set PHONEPE_API_URL="https://api.phonepe.com/apis/pg"
```

### Command 8-9: Redeploy with secrets
```powershell
supabase functions deploy phonepe-initiate
supabase functions deploy phonepe-check-status
```

---

## Then Test

1. Open browser: **http://localhost:8080/checkout**
2. Fill in:
   - Phone: `9876543210`
   - Address: `123 Main St, City, 560001`
3. Click: **"Go to Payment"**
4. Press **F12** → **Console**
5. Look for: `[PhonePe] Payment initiation response: { success: true }`

**If you see this** → ✅ **DONE! Everything works!**

---

## That's it! 🎉

3 main steps:
1. ✅ Deploy functions (2 commands)
2. ✅ Add secrets (4 commands)
3. ✅ Test (1 URL)

~10 minutes total.

**Questions?** See `STEP_BY_STEP_VISUAL.md` for detailed walkthrough.
