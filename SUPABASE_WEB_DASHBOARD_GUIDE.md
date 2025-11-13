# 🌐 Web Dashboard Setup - Step by Step

## ✅ No CLI Needed! Use Web Browser Instead

---

## Step 1: Open Supabase Dashboard

### Click This Link:
```
https://app.supabase.com
```

**You'll see**:
```
┌─────────────────────────────────┐
│  Supabase Dashboard             │
│                                 │
│  [Your Projects]                │
│  - freelit                      │
│  - other-project                │
└─────────────────────────────────┘
```

### Click on: **freelit** project

---

## Step 2: Add Secrets

### In Left Sidebar:
- Scroll down
- Click: **Settings**

### Then:
- Click: **Secrets**

**You'll see**:
```
┌─────────────────────────────────┐
│ Secrets                         │
│                                 │
│ [+ New secret] button           │
│                                 │
│ Existing secrets (if any)       │
│ - DATABASE_URL                  │
│ - ANON_KEY                      │
└─────────────────────────────────┘
```

### Click: **[+ New secret]**

---

## Step 3: Add Each Secret (4 times)

### Secret #1:

**Click**: [+ New secret]

**Fill in**:
```
Name: PHONEPE_MERCHANT_ID
Value: M23DXJKWOH2QZ
```

**Click**: [Save]

---

### Secret #2:

**Click**: [+ New secret]

**Fill in**:
```
Name: PHONEPE_CLIENT_ID
Value: SU2511071520405754774079
```

**Click**: [Save]

---

### Secret #3:

**Click**: [+ New secret]

**Fill in**:
```
Name: PHONEPE_CLIENT_SECRET
Value: <paste_your_production_secret_here>
```

**Click**: [Save]

---

### Secret #4:

**Click**: [+ New secret]

**Fill in**:
```
Name: PHONEPE_API_URL
Value: https://api.phonepe.com/apis/pg
```

**Click**: [Save]

---

## Step 4: Verify All Secrets Added

**You should see**:
```
┌─────────────────────────────────┐
│ Secrets                         │
│                                 │
│ ✓ PHONEPE_MERCHANT_ID          │
│ ✓ PHONEPE_CLIENT_ID            │
│ ✓ PHONEPE_CLIENT_SECRET        │
│ ✓ PHONEPE_API_URL              │
│ ✓ DATABASE_URL                 │
│ ✓ ANON_KEY                     │
└─────────────────────────────────┘
```

---

## Step 5: Deploy Functions

### Option A: Using Git (Automatic)

In PowerShell:
```powershell
cd 'c:\Users\vivek\Downloads\newfit-main\newfit-main'
git add supabase/functions/
git commit -m "Add PhonePe Edge Functions"
git push
```

**Supabase automatically deploys when you push!**

---

### Option B: Manual Upload

1. **In Supabase Dashboard**
2. Click: **Functions** (in left sidebar)
3. Click: **[Create a new function]**
4. Name: `phonepe-initiate`
5. Select Language: **TypeScript**
6. Copy code from: `supabase/functions/phonepe-initiate/index.ts`
7. Paste it in the editor
8. Click: **Deploy**

Repeat for `phonepe-check-status`

---

## Step 6: Verify Functions Deployed

**In Supabase Dashboard**:
- Go to: **Functions**
- You should see:
  ```
  ✓ phonepe-initiate    Deployed
  ✓ phonepe-check-status Deployed
  ```

---

## Step 7: Test in Your App

### Open Browser:
```
http://localhost:8080/checkout
```

### Fill in Form:
- Phone: `9876543210`
- Address: `123 Main St, City, 560001`

### Click: "Go to Payment"

### Press F12 → Console

**Look for**:
```
[PhonePe] Payment initiation response: { success: true }
```

✅ **If you see this → EVERYTHING WORKS!**

---

## 📊 Visual Summary

```
YOU (Browser)                 SUPABASE DASHBOARD
──────────────                ──────────────────

1. Open dashboard ────────→  https://app.supabase.com
2. Select project ─────────→  freelit
3. Go to Settings ─────────→  Settings → Secrets
4. Add secrets (4x) ───────→  PHONEPE_*
5. Go to Functions ────────→  Functions
6. Verify deployed ────────→  ✓ phonepe-initiate
                              ✓ phonepe-check-status

Then:

7. Test app ───────────────→  http://localhost:8080/checkout
8. Click "Go to Payment" ──→  Check console (F12)
9. See success logs ───────→  [PhonePe] response...
10. 🎉 Done!
```

---

## ✅ Checklist

- [ ] Opened https://app.supabase.com
- [ ] Selected freelit project
- [ ] Added PHONEPE_MERCHANT_ID secret
- [ ] Added PHONEPE_CLIENT_ID secret
- [ ] Added PHONEPE_CLIENT_SECRET secret
- [ ] Added PHONEPE_API_URL secret
- [ ] Deployed functions (via Git or manually)
- [ ] Verified functions show "Deployed"
- [ ] Opened http://localhost:8080/checkout
- [ ] Filled in phone and address
- [ ] Clicked "Go to Payment"
- [ ] Pressed F12 → Console
- [ ] Saw [PhonePe] success logs
- ✅ **DONE!**

---

## 🆘 Troubleshooting

### Problem: "Functions not found"
**Solution**: 
1. Deploy via Git: `git push`
2. Or manually upload code from `supabase/functions/` folder

### Problem: "Secrets not working"
**Solution**:
1. Verify all 4 secrets added
2. Redeploy functions to pick up new secrets
3. Hard refresh browser: Ctrl+Shift+R

### Problem: "Still getting CORS error"
**Solution**:
1. Check console for errors (F12)
2. Check Network tab for failed requests
3. Verify functions are deployed
4. Verify secrets are set

---

## 📞 Still Need CLI?

**For later use**, install via Scoop:

```powershell
# Install scoop first (if needed)
iwr -useb get.scoop.sh | iex

# Then install supabase
scoop install supabase
```

**But for now, use Web Dashboard - it's easier!** 🌐

---

**Next**: Open https://app.supabase.com and add your secrets! 🚀
