# ⚡ QUICK FIX - No CLI Needed

## The Problem
```
supabase : The term 'supabase' is not recognized
```

## The Solution
**Use Web Dashboard instead of CLI!** It's actually easier.

---

## 3 Simple Steps

### Step 1: Add Secrets (5 minutes)
1. Go to: https://app.supabase.com
2. Select: **freelit** project
3. Click: **Settings → Secrets**
4. Add these 4 secrets:
   - `PHONEPE_MERCHANT_ID` = `M23DXJKWOH2QZ`
   - `PHONEPE_CLIENT_ID` = `SU2511071520405754774079`
   - `PHONEPE_CLIENT_SECRET` = `<your_secret>`
   - `PHONEPE_API_URL` = `https://api.phonepe.com/apis/pg`

### Step 2: Deploy Functions (2 minutes)
In PowerShell:
```powershell
cd 'c:\Users\vivek\Downloads\newfit-main\newfit-main'
git push
```

**Supabase auto-deploys when you push!**

### Step 3: Test (5 minutes)
1. Open: http://localhost:8080/checkout
2. Enter: Phone `9876543210`, Address
3. Click: "Go to Payment"
4. Press: F12 → Console
5. Look for: `[PhonePe] Payment initiated... { success: true }`

✅ **Done!**

---

## That's It!

No CLI installation needed. Web dashboard is simpler and works perfectly.

**Detailed guides**:
- `SUPABASE_WEB_DASHBOARD_GUIDE.md` - Step-by-step with visuals
- `SUPABASE_SETUP_WITHOUT_CLI.md` - Full reference

**Start now**: https://app.supabase.com 🚀
