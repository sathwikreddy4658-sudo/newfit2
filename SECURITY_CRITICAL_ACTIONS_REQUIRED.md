# 🔴 CRITICAL SECURITY ACTIONS REQUIRED

## ⚠️ IMMEDIATE ACTION NEEDED (Within 24 Hours)

### 1. **API Keys & Credentials Exposed in Git** 🔥 CRITICAL

**Issue**: Your `.env` files are committed to Git with sensitive credentials:
- Firebase API keys
- Supabase Service Role Key (admin access)
- PhonePe webhook credentials

**Impact**: Anyone with repo access can compromise your:
- Firebase database
- Payment webhooks
- User data
- Admin access

### **STEP-BY-STEP FIX:**

#### Step 1: Rotate All Credentials

**Firebase:**
```bash
1. Go to: https://console.firebase.google.com/project/newfit-35320/settings/general
2. Web API Key → Regenerate
3. Update your production environment variables
```

**Supabase:**
```bash
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api
2. Service Role Key → Regenerate
3. Update environment variables
```

**PhonePe:**
```bash
1. Contact PhonePe support to rotate webhook credentials
2. Generate new merchant credentials
3. Update payment integration
```

#### Step 2: Remove Secrets from Git History

```bash
# Install BFG Repo Cleaner
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Backup your repo first!
git clone --mirror https://github.com/sathwikreddy4658-sudo/newfit2.git newfit2-backup

# Remove .env files from history
java -jar bfg.jar --delete-files '.env' newfit2-backup
cd newfit2-backup
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

#### Step 3: Update .gitignore

Your `.gitignore` already has `.env`, but the file was committed before `.gitignore` was added.

```bash
# Remove tracked .env files
git rm --cached .env
git rm --cached functions/.env
git rm --cached fix_cod_function.js  # Contains service key
git commit -m "Remove sensitive files"
git push
```

#### Step 4: Use Environment Variables Only

**Never commit these files again:**
- `.env`
- Any file with `API_KEY`, `SECRET`, `PASSWORD`

**For deployment:**
- Vercel: Project Settings → Environment Variables
- Firebase Functions: `firebase functions:config:set`
- Local dev: Keep `.env` local ONLY

---

## 🛡️ Security Fixes Implemented (Completed)

### ✅ 1. Price Manipulation Protection
**Fixed**: Checkout now validates all prices from Firestore server
- Prevents localStorage cart price tampering
- Server-side price fetching before order creation

### ✅ 2. Order Creation Validation
**Fixed**: Firestore rules now validate order data
- Required fields: items, total_amount, customer_email, phone
- Email format validation
- Phone number validation (10 digits)
- Price limit: ₹10 lakh max per order
- Item limit: 50 items max per order
- Status must be 'pending' or 'payment_initiated'

### ✅ 3. Product Rating Protection
**Fixed**: Strict validation for ratings
- User must be authenticated
- Rating 1-5 only
- Comment 10-500 characters
- userId must match authenticated user
- Prevents spam/fake reviews

### ✅ 4. XSS Protection Strengthened
**Fixed**: Blog content sanitization improved
- Blocks javascript: protocol
- Only allows http/https/mailto links
- Removes onerror, onclick handlers
- Blocks <script>, <iframe>, <form> tags

### ✅ 5. Storage Path Traversal Fixed
**Fixed**: Storage rules prevent directory traversal
- Blocks ".." in filenames
- Alphanumeric + safe chars only
- 200 char filename limit
- 5MB file size limit for user uploads

---

## ⚠️ Recommended Actions (Within 1 Week)

### 1. **Add Rate Limiting to Checkout**

**Current Risk**: Attackers can DDoS by creating unlimited orders

**Solution**: Use Firebase Extensions - Rate Limiting:
```bash
firebase ext:install firebase/firestore-counter
```

### 2. **Implement Promo Code Usage Tracking**

**Current Risk**: Users can reuse single-use promo codes

**Fix**: Add to `CartContext.tsx`:
```typescript
// Check usage before applying
const userOrders = await getDocs(
  query(
    collection(db, 'orders'),
    where('user_id', '==', userId),
    where('promo_code', '==', code)
  )
);

if (promoData.once_per_user && userOrders.size > 0) {
  throw new Error('Promo code already used');
}

if (promoData.current_uses >= promoData.max_uses) {
  throw new Error('Promo code limit reached');
}
```

### 3. **Add Guest Order Verification**

**Current Risk**: Anyone can view guest orders

**Solution**: Generate tokens for guest orders:
```typescript
const guestToken = crypto.randomUUID();
// Store in order, send to customer email
```

### 4. **Payment Webhook Security**

**Current Risk**: Webhooks can be spoofed

**Fix**: Verify PhonePe signatures:
```typescript
import crypto from 'crypto';

function verifyPhonePeSignature(payload, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', PHONEPE_SALT_KEY)
    .update(payload)
    .digest('hex');
  return signature === expectedSignature;
}
```

---

## 📊 Security Checklist

### Critical (Do Now)
- [ ] Rotate all API keys
- [ ] Remove .env from Git history  
- [ ] Update production environment variables
- [ ] Verify Firestore rules deployed
- [ ] Verify Storage rules deployed
- [ ] Test checkout with server-side pricing

### High Priority (This Week)
- [ ] Add rate limiting to checkout
- [ ] Implement promo code usage tracking
- [ ] Add guest order verification tokens
- [ ] Verify payment webhook signatures
- [ ] Add email verification for guest orders

### Medium Priority (This Month)
- [ ] Implement atomic stock deduction
- [ ] Add comprehensive error logging
- [ ] Set up security monitoring alerts
- [ ] Conduct penetration testing
- [ ] Add CAPTCHA to sensitive forms

---

## 🔒 Best Practices Moving Forward

### 1. **Never Commit Secrets**
```bash
# Add to pre-commit hook
if git diff --cached --name-only | grep -E '\\.env$'; then
  echo "ERROR: .env file detected in commit"
  exit 1
fi
```

### 2. **Use Environment Variables**
```typescript
// Good
const apiKey = process.env.VITE_FIREBASE_API_KEY;

// Bad
const apiKey = "AIzaSyC...hardcoded";
```

### 3. **Validate All User Input**
- Frontend validation (UX)
- Backend validation (Security)
- Firestore rules validation (Final defense)

### 4. **Principle of Least Privilege**
- Users can only access their data
- Admins explicitly granted via Firestore
- Guest orders have limited read access

### 5. **Regular Security Audits**
- Monthly review of Firestore rules
- Quarterly penetration testing
- Monitor suspicious activity logs

---

## 📞 Support

If you need help with any of these security fixes:
1. Firebase Security: https://firebase.google.com/support
2. Vercel Security: https://vercel.com/docs/security
3. OWASP Guidelines: https://owasp.org/www-project-web-security-testing-guide/

---

## ⚡ Quick Deploy Security Fixes

```bash
# Deploy updated Firestore rules
firebase deploy --only firestore:rules

# Deploy updated Storage rules  
firebase deploy --only storage

# Restart your app (Vercel will auto-deploy on push)
git add .
git commit -m "Security fixes: validation, XSS protection, path traversal"
git push

# Verify in production
# Test checkout with modified localStorage cart (should fetch server prices)
# Try creating fake orders (should be blocked by rules)
# Try path traversal in file uploads (should be blocked)
```

---

## 📝 Summary

**Security Fixes Deployed:**
✅ Server-side price validation (prevents cart manipulation)
✅ Order creation validation rules (prevents fake orders)
✅ Rating validation rules (prevents spam reviews)
✅ XSS protection enhanced (blocks malicious scripts)
✅ Storage path traversal blocked (prevents unauthorized access)

**Critical Actions Still Needed:**
🔴 Rotate all API keys & credentials
🔴 Remove secrets from Git history
🔴 Update production environment variables

**Next Priority:**
🟡 Rate limiting
🟡 Promo code usage tracking
🟡 Guest order verification
🟡 Payment webhook signatures

---

**Last Updated**: March 9, 2026
**Action Required**: IMMEDIATE
**Risk Level**: HIGH - Exposed credentials
