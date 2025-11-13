# Add PhonePe Secrets to Supabase Edge Functions

## ⚡ Quick Steps (2 minutes)

### Step 1: Open Supabase Dashboard
- Go to: https://app.supabase.com
- Sign in with your email

### Step 2: Select Your Project
- Click on "freelit" project (or your project name)

### Step 3: Navigate to Edge Functions Settings
- Left sidebar → Click "Functions"
- Click the three dots menu (⋯) in top right
- Select "Manage Secrets"
- OR: Settings → Secrets

### Step 4: Add the Secrets
Click "New secret" and add these **exactly**:

#### Secret 1: PHONEPE_MERCHANT_ID
```
Name: PHONEPE_MERCHANT_ID
Value: M23DXJKWOH2QZ
```
Click "Add secret"

#### Secret 2: PHONEPE_CLIENT_ID
```
Name: PHONEPE_CLIENT_ID
Value: SU2511071520405754774079
```
Click "Add secret"

#### Secret 3: PHONEPE_CLIENT_SECRET ⭐ CRITICAL
```
Name: PHONEPE_CLIENT_SECRET
Value: c70dce3a-c985-4237-add4-b8b9ad647bbf
```
Click "Add secret"

#### Secret 4: PHONEPE_API_URL
```
Name: PHONEPE_API_URL
Value: https://api.phonepe.com/apis/pg
```
Click "Add secret"

### Step 5: Verify
- All 4 secrets should show as "Added" ✅
- Look for green checkmarks

## ✅ What Happens Next

1. Edge Functions automatically reload with the new secrets
2. Your backend can now authenticate with PhonePe
3. CORS error will be resolved
4. Payment flow will work end-to-end

## 🧪 Test After Adding Secrets

1. Go to: http://localhost:8080/checkout
2. Fill form: Phone 9876543210, Address Test
3. Click: "Go to Payment"
4. Press: F12 → Console
5. Look for: `[PhonePe] Payment initiated... { success: true }`

**No CORS error = Success! ✅**

---

**Note:** These secrets are now also in your local `supabase/.env.local` file for local Edge Function development.
