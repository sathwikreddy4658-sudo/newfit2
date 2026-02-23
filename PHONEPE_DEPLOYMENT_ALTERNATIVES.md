# PhonePe Deployment - All Methods

COD is working ✅. Now we need to deploy PhonePe edge functions for online payments.

## ⚡ METHOD 1: Batch Script (Simplest)

Run this in Command Prompt:

```cmd
cd "d:\New folder (2)\newfit2"
deploy-phonepe-simple.bat
```

This script checks for Node.js, installs CLI, and deploys. **If Node.js is missing**, it will open the download page.

---

## 🔑 METHOD 2: Manual CLI with Access Token

If login fails, use an access token:

### Get Access Token
1. Go to: https://app.supabase.com/account/tokens
2. Click "Generate new token"
3. Copy the token

### Deploy Using Token
```cmd
set SUPABASE_ACCESS_TOKEN=your-token-here
npx supabase link --project-ref oikibnfnhauymhfpxiwi
npx supabase functions deploy phonepe-initiate --no-verify-jwt
npx supabase functions deploy phonepe-check-status --no-verify-jwt
npx supabase functions deploy phonepe-webhook --no-verify-jwt
```

---

## 📧 METHOD 3: Contact Supabase Support

If CLI continues to fail, **Supabase support can deploy for you**:

**Email:** support@supabase.io

**Subject:** Deploy Edge Functions for Project oikibnfnhauymhfpxiwi

**Message:**
```
Hello,

I need help deploying 3 edge functions to my project.

Project Reference: oikibnfnhauymhfpxiwi
Project URL: https://oikibnfnhauymhfpxiwi.supabase.co

Functions to deploy (with --no-verify-jwt flag):
1. phonepe-initiate
2. phonepe-check-status  
3. phonepe-webhook

The function code is attached. My CLI deployment is failing due to [describe your error].

After deployment, I'll add the required environment secrets via the dashboard.

Thank you!
```

**Attachments:** Zip these 3 folders:
- `d:\New folder (2)\newfit2\supabase\functions\phonepe-initiate\`
- `d:\New folder (2)\newfit2\supabase\functions\phonepe-check-status\`
- `d:\New folder (2)\newfit2\supabase\functions\phonepe-webhook\`

---

## ☁️ METHOD 4: GitHub Codespaces (Cloud CLI)

If local CLI doesn't work, use Codespaces (has CLI pre-installed):

### Setup
1. Push your code to GitHub
2. Open repository on GitHub
3. Click: **Code** → **Codespaces** → **Create codespace**
4. Wait for codespace to start (2-3 minutes)

### Deploy
```bash
npm install -g supabase
supabase login
supabase link --project-ref oikibnfnhauymhfpxiwi
supabase functions deploy phonepe-initiate --no-verify-jwt
supabase functions deploy phonepe-check-status --no-verify-jwt
supabase functions deploy phonepe-webhook --no-verify-jwt
```

---

## 🌐 METHOD 5: Replit (Browser-based)

Another cloud option:

1. Go to: https://replit.com/
2. Create account (free)
3. Click "Create Repl"
4. Choose "Bash"
5. Upload your `supabase/functions/` folder
6. Run deployment commands:

```bash
npm install -g supabase
export SUPABASE_ACCESS_TOKEN="your-token-here"
supabase link --project-ref oikibnfnhauymhfpxiwi
supabase functions deploy phonepe-initiate --no-verify-jwt
supabase functions deploy phonepe-check-status --no-verify-jwt
supabase functions deploy phonepe-webhook --no-verify-jwt
```

---

## 🛠️ METHOD 6: GitHub Actions (CI/CD)

Automate deployment with GitHub Actions:

**File:** `.github/workflows/deploy-functions.yml` (already created)

### Setup
1. Push code to GitHub
2. Go to: https://app.supabase.com/account/tokens
3. Generate access token
4. In GitHub: **Settings** → **Secrets and variables** → **Actions**
5. Add secrets:
   - `SUPABASE_ACCESS_TOKEN` = your token
   - `SUPABASE_PROJECT_REF` = oikibnfnhauymhfpxiwi
6. Go to: **Actions** tab → **Deploy Supabase Functions** → **Run workflow**

---

## 🔍 Troubleshooting Common Errors

### Error: "npm not found"
**Fix:** Install Node.js from https://nodejs.org/

### Error: "supabase login failed"
**Fix:** Use access token method (Method 2)

### Error: "Function already exists"
**Fix:** This is OK! It means the function deployed successfully.

### Error: "Invalid project ref"
**Fix:** Make sure you're a member of the Supabase project. Check at:
https://supabase.com/dashboard/project/oikibnfnhauymhfpxiwi/settings/general

### Error: "CORS policy" (in browser)
**Cause:** Functions not deployed yet. Verify at:
https://supabase.com/dashboard/project/oikibnfnhauymhfpxiwi/functions

Should see:
- ✅ phonepe-initiate (green dot)
- ✅ phonepe-check-status (green dot)
- ✅ phonepe-webhook (green dot)

---

## ✅ After Deployment: Add Secrets

Once functions are deployed, add environment secrets:

1. Go to: https://supabase.com/dashboard/project/oikibnfnhauymhfpxiwi/settings/functions
2. Click **"Secrets"** tab
3. Add these 4 secrets:

| Name | Value |
|------|-------|
| `PHONEPE_MERCHANT_ID` | `M23DXJKWOH2QZ` |
| `PHONEPE_CLIENT_ID` | `SU2511071520405754774079` |
| `PHONEPE_CLIENT_SECRET` | `c70dce3a-c985-4237-add4-b8b9ad647bbf` |
| `PHONEPE_API_URL` | `https://api.phonepe.com/apis/pg` |

4. Click **Save**

---

## 🧪 Verify Deployment

### Check Functions Exist
https://supabase.com/dashboard/project/oikibnfnhauymhfpxiwi/functions

Should see 3 functions listed.

### Test in Browser Console
```javascript
// On your checkout page (http://localhost:8080)
const response = await fetch('https://oikibnfnhauymhfpxiwi.supabase.co/functions/v1/phonepe-initiate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + 'your-anon-key'
  },
  body: JSON.stringify({
    merchantTransactionId: 'TEST123',
    amount: 100
  })
});
console.log(await response.json());
```

Should return a valid response (not CORS error).

---

## 📊 Current Status

| Component | Status |
|-----------|--------|
| Database Functions | ✅ Deployed (COD working) |
| COD Checkout | ✅ Working |
| PhonePe Edge Functions | ❌ Not deployed |
| Online Payment | ❌ CORS error |

**Next:** Use any of the 6 methods above to deploy edge functions.

---

## 🆘 Need Help?

Share the exact error you're getting:
1. Run: `deploy-phonepe-simple.bat`
2. Copy the full error message
3. Share it for specific troubleshooting

Alternatively, use **Method 3** (Supabase Support) for guaranteed deployment.
