# 🚀 Quick Deployment Reference

## 📋 Current Status

### ✅ COMPLETED
- [x] PhonePe edge function code created
- [x] Admin dashboard fixed (column names)
- [x] Thank you pages styled
- [x] Database schema SQL prepared
- [x] Pincode CSV cleaned (10,393 unique)
- [x] Deployment guides & scripts created

### ⚠️ PENDING (YOUR ACTION REQUIRED)

#### 1. Deploy PhonePe Edge Functions
**Choose ONE method:**

**Option A: PowerShell (Recommended)**
```powershell
cd "d:\New folder (2)\newfit2"
.\deploy-phonepe-functions.ps1
```

**Option B: Command Prompt**
```cmd
cd "d:\New folder (2)\newfit2"
deploy-phonepe-functions.bat
```

**Option C: Manual CLI**
```bash
npm install -g supabase
supabase login
supabase link --project-ref oikibnfnhauymhfpxiwi
supabase functions deploy phonepe-initiate --no-verify-jwt
supabase functions deploy phonepe-check-status --no-verify-jwt
supabase functions deploy phonepe-webhook --no-verify-jwt
```

**After deployment**, add secrets at:
https://supabase.com/dashboard/project/oikibnfnhauymhfpxiwi/settings/functions

```
PHONEPE_MERCHANT_ID = M23DXJKWOH2QZ
PHONEPE_CLIENT_ID = SU2511071520405754774079
PHONEPE_CLIENT_SECRET = c70dce3a-c985-4237-add4-b8b9ad647bbf
PHONEPE_API_URL = https://api.phonepe.com/apis/pg
```

---

#### 2. Deploy Database Functions
Go to: https://supabase.com/dashboard/project/oikibnfnhauymhfpxiwi/sql

**Copy and run:** `DEPLOY_ALL_CHECKOUT_FUNCTIONS.sql`

This fixes:
- ❌ 404 create_order_with_items not found
- ❌ 404 confirm_cod_order not found
- ❌ 400 cod_charge column not found
- ❌ 422 invalid enum "confirmed"

---

#### 3. Import Pincode Data (Optional)
**File:** `Complete_All_States_Combined_Pincodes_UNIQUE.csv`
**Rows:** 10,393 unique pincodes

**Method 1: SQL Import**
- Run `fix_pincode_import.sql` (SOLUTION 1 or 2)
- Then import CSV via Table Editor

**Method 2: Direct Import**
- Go to: https://supabase.com/dashboard/project/oikibnfnhauymhfpxiwi/editor
- Select `pincodes` table
- Click "Insert" → "Insert from CSV"
- Upload `Complete_All_States_Combined_Pincodes_UNIQUE.csv`

---

## 🧪 Testing Checklist

### After PhonePe Deployment
1. Open browser DevTools Console
2. Navigate to checkout page
3. Try online payment
4. Check Network tab: Should see 200 OK for phonepe-initiate
5. Should redirect to PhonePe payment page

### After Database Deployment
1. Clear cart: `localStorage.removeItem('cart'); location.reload();`
2. Add products to cart
3. Go to checkout
4. Fill address details
5. Test COD: Should create order successfully
6. Test Online: Should redirect to PhonePe
7. Check admin dashboard: New orders appear

---

## 🆘 Troubleshooting

### PhonePe CORS Still Failing?
1. Check function deployed: https://supabase.com/dashboard/project/oikibnfnhauymhfpxiwi/functions
2. Check secrets added: Settings → Functions → Secrets
3. Check Edge Function Logs for errors
4. Verify frontend URL matches: `src/lib/phonepe.ts` line 116

### Database Functions Not Working?
1. Verify SQL ran without errors
2. Check functions exist: Database → Functions
3. Check columns added: Database → orders table
4. Check RLS policies: Database → orders → Policies

### Admin Dashboard Errors?
1. Already fixed in code
2. Just refresh: `Ctrl+Shift+R`
3. Clear cache if needed

---

## 📞 Support Links

- **Supabase Dashboard:** https://supabase.com/dashboard/project/oikibnfnhauymhfpxiwi
- **Edge Functions:** https://supabase.com/dashboard/project/oikibnfnhauymhfpxiwi/functions
- **SQL Editor:** https://supabase.com/dashboard/project/oikibnfnhauymhfpxiwi/sql
- **Database Editor:** https://supabase.com/dashboard/project/oikibnfnhauymhfpxiwi/editor

---

## 📂 Key Files Reference

| File | Purpose | Status |
|------|---------|--------|
| `deploy-phonepe-functions.ps1` | PowerShell deployment script | ✅ Ready |
| `deploy-phonepe-functions.bat` | Batch deployment script | ✅ Ready |
| `FIX_PHONEPE_DEPLOYMENT.md` | Detailed deployment guide | ✅ Ready |
| `DEPLOY_ALL_CHECKOUT_FUNCTIONS.sql` | Database migrations | ⚠️ Not run |
| `Complete_All_States_Combined_Pincodes_UNIQUE.csv` | Pincode data | ✅ Ready |
| `supabase/functions/phonepe-initiate/` | Payment initiation | ⚠️ Not deployed |
| `supabase/functions/phonepe-check-status/` | Status check | ⚠️ Not deployed |
| `supabase/functions/phonepe-webhook/` | Webhook handler | ⚠️ Not deployed |

---

## ⚡ Quick Commands

### Start Dev Server
```bash
npm run dev
```

### Check Supabase Functions
```bash
supabase functions list
```

### View Edge Function Logs
```bash
supabase functions logs phonepe-initiate
```

### Deploy Single Function
```bash
supabase functions deploy phonepe-initiate --no-verify-jwt
```

---

## 🎯 Priority Order

1. **FIRST:** Deploy PhonePe edge functions (fixes online payment CORS)
2. **SECOND:** Run DEPLOY_ALL_CHECKOUT_FUNCTIONS.sql (fixes 404/400/422 errors)
3. **THIRD:** Import pincode data (enables pincode validation)
4. **FOURTH:** Test complete checkout flow
5. **FIFTH:** Monitor Edge Function logs for issues

---

## 📝 Notes

- **PhonePe Environment:** SANDBOX (testing mode)
- **Brand Colors:** `#b5edce` (mint), `#3b2a20` (dark brown)
- **Supabase Project:** `oikibnfnhauymhfpxiwi`
- **Frontend Port:** `localhost:8080` (CORS configured)

---

**Last Updated:** During conversation session
**Created By:** GitHub Copilot
