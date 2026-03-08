# 🔒 SECURITY ISSUES - QUICK REFERENCE

## Overview
- 🚨 **2 CRITICAL** issues (1 fixed, 1 requires DB setup)
- 🔴 **4 HIGH** severity issues
- ⚠️ **6 MEDIUM** severity issues  
- 💡 **5 LOW** severity issues

---

## 🚨 CRITICAL PRIORITY

| Issue | Status | Impact | Action |
|-------|--------|--------|--------|
| Admin panel bypass (anyone could access `/admin`) | ✅ FIXED | Complete system compromise | Code updated, requires DB setup |
| Service role key in .env | ✅ REMOVED | Database backdoor possible | Already removed from .env |

---

## 🔴 HIGH PRIORITY

| # | Issue | Status | Fix Time |
|---|-------|--------|----------|
| 1 | PhonePe merchant credentials exposed | ⚠️ NEEDS FIX | 2 hours |
| 2 | Admin role not verified from database | ⚠️ NEEDS DB | 30 min |
| 3 | Payment webhook signature not verified | ⚠️ CHECK | 1 hour |
| 4 | Guest checkout no email verification | ⚠️ NEEDS FIX | 2 hours |

---

## ⚠️ MEDIUM PRIORITY

| # | Issue | Risk Level | Can Live With? |
|---|-------|-----------|----------------|
| 1 | Favorites stored in localStorage | Medium | With caveats |
| 2 | Cart stored in localStorage | Low-Medium | Yes |
| 3 | No rate limiting on payments | High | NO |
| 4 | No CSRF protection visible | Medium | NO |
| 5 | Order tracking no ownership check | High | NO |
| 6 | RatingComponent uses localStorage | Low | Yes |

---

## DATABASE SETUP REQUIRED

```sql
-- 1. Add role column to profiles
ALTER TABLE profiles ADD COLUMN role VARCHAR(50) DEFAULT 'customer';
ALTER TABLE profiles ADD CONSTRAINT valid_role CHECK (role IN ('customer', 'admin'));

-- 2. Mark your admin user(s)
UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_ADMIN_USER_ID';

-- 3. Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Add policies
CREATE POLICY "Admin access" ON profiles
  FOR SELECT USING (auth.uid() = id AND role = 'admin');

CREATE POLICY "User access" ON profiles  
  FOR SELECT USING (auth.uid() = id);
```

---

## CODE CHANGES REQUIRED

### 1. Admin Route Protection ✅ DONE
**File**: `src/components/admin/ProtectedAdminRoute.tsx`
**Status**: UPDATED - Now checks database for admin role

**Test**: 
```bash
# Login as non-admin, try: https://localhost:5173/admin
# Should redirect to home page
```

---

### 2. PhonePe Credentials (NEEDS FIX)
**Issue**: Remove from frontend environment
**Solution**: Move to Edge Function only

```typescript
// ❌ WRONG - Currently in frontend
const PHONEPE_MERCHANT_ID = import.meta.env.VITE_PHONEPE_MERCHANT_ID;

// ✅ CORRECT - Only in Edge Function
const PHONEPE_MERCHANT_ID = Deno.env.get('PHONEPE_MERCHANT_ID');
```

---

### 3. PhonePe Webhook Verification (NEEDS CHECK)
**Location**: Supabase Edge Functions
**Check**: Does signature validation exist?

```typescript
// Must have this validation
const XVerify = request.headers.get('x-verify');
if (!verifySignature(data, secret, XVerify)) {
  throw new Error('Invalid signature - potential attack');
}
```

---

### 4. Rate Limiting (NEEDS IMPLEMENTATION)
**Add to Checkout.tsx**:
```typescript
// Prevent payment spam
const [lastPaymentAttempt, setLastPaymentAttempt] = useState(0);

const handlePayment = async () => {
  const now = Date.now();
  if (now - lastPaymentAttempt < 5000) {
    toast.error("Please wait before trying again");
    return;
  }
  setLastPaymentAttempt(now);
  // ... rest of payment code
};
```

---

### 5. Order Ownership Validation (NEEDS CHECK)
**File**: `src/pages/TrackOrder.tsx`

Currently allows tracking ANY order. Should only show:
- Own orders for logged-in users
- Own order for guests (with OTP verification)

---

## SECURITY TESTING CHECKLIST

### Admin Access
- [ ] Non-admin cannot access `/admin/products`
- [ ] Non-admin cannot access `/admin/orders`
- [ ] Admin user can access admin panel
- [ ] Unauthenticated user redirected to auth

### Payment
- [ ] Can't spam checkout button
- [ ] Payment amount cannot be modified
- [ ] PhonePe signature verified
- [ ] Fake payment callback rejected

### Data Access
- [ ] Can't view other user's orders
- [ ] Can't modify other user's data
- [ ] Favorites stay private
- [ ] Cart is user-specific

---

## QUICK WINS (Easy Fixes)

1. **Add loading state to payment** (5 min)
   - Disable button after first click
   
2. **Add email verification for guests** (30 min)
   - Send OTP before order creation
   
3. **Add order ownership check** (10 min)
   - Only show own orders in TrackOrder

---

## BEFORE PRODUCTION DEPLOYMENT

- [ ] Run: `npm audit` for dependency vulnerabilities
- [ ] Enable all RLS policies in Supabase
- [ ] Setup WAF rules if available
- [ ] Enable HTTPS everywhere
- [ ] Setup rate limiting on Edge Functions
- [ ] Configure CSP headers
- [ ] Test admin access thoroughly
- [ ] Verify payment signature validation

---

## MONITORING & LOGGING

Add monitoring for:
1. Failed admin access attempts
2. Unusual order patterns
3. Repeated payment failures
4. PhonePe webhook failures
5. Guest account creation patterns

---

## INCIDENT RESPONSE

If you suspect a breach:

1. **Immediate**:
   - Rotate all API keys
   - Check admin access logs
   - Review recent orders

2. **Short-term**:
   - Audit database for suspicious changes
   - Notify affected customers
   - Update security measures

3. **Long-term**:
   - Conduct full security audit
   - Implement monitoring
   - Add audit logging

---

## RESOURCES

- Full Report: `SECURITY_AUDIT_REPORT.md`
- Setup Guide: `SECURITY_SETUP_GUIDE.md`
- Performance Fixes: `PERFORMANCE_AND_SECURITY_FIXES.md`

---

## SUPPORT

For help with:
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- PhonePe Integration: https://www.phonepe.com/business/developers
- Security Best Practices: https://owasp.org/www-project-top-10/

---

**Last Updated**: March 2, 2026
**Status**: In Progress - 2 Critical issues fixed, remaining issues catalogued
