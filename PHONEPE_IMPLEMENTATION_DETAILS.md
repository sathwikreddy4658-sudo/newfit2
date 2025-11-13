# PhonePe Integration - Complete Implementation Plan

## 📋 Project Details
- **Website:** www.freelit.in  
- **Payment Methods:** UPI, Cards, Net Banking, PhonePe Wallet
- **Callback URL:** `https://www.freelit.in/api/payment-callback`
- **Environment:** Test/Sandbox → Production
- **Approach:** ✅ Test first, then production

---

## 🔐 Security & Best Practices

### 1. **Never Expose Secrets in Client Code** ❌❌❌
```typescript
// ❌ WRONG - NEVER do this
const response = await fetch('https://api.phonepe.com/...', {
  headers: { 
    'Authorization': process.env.VITE_PHONEPE_API_KEY 
  }
});

// ✅ CORRECT - Backend only
const response = await fetch('/api/payment/initiate', {
  method: 'POST',
  body: JSON.stringify({ orderId, amount })
});
```

### 2. **Backend Handles All Secrets** ✅
- All API credentials (Client ID, Client Secret, Salt Key) → Backend only
- Never expose in `.env` without `VITE_` prefix
- Supabase Edge Functions can access server-side env vars

### 3. **Webhook Signature Verification** ✅ (CRITICAL)
```typescript
// Every webhook from PhonePe must be verified
const isValid = verifySignature(
  webhookPayload,
  receivedSignature,
  saltKey
);

if (!isValid) {
  console.error('🚨 SECURITY: Invalid webhook signature!');
  return 401;
}
```

### 4. **Amount Verification on Backend** ✅ (PREVENT FRAUD)
```typescript
// NEVER trust amount from client - always verify
const order = await supabase
  .from('orders')
  .select('total_amount')
  .eq('id', orderId);

if (order.total_amount !== webhookAmount) {
  console.error('🚨 SECURITY: Amount mismatch!');
  return 400;
}
```

### 5. **Idempotent Webhook Handling** ✅ (HANDLE DUPLICATES)
```typescript
// PhonePe may send webhook multiple times
const existing = await supabase
  .from('payment_transactions')
  .select('id')
  .eq('phonepe_transaction_id', txnId)
  .single();

if (existing) {
  return 200; // Already processed, don't double-charge
}
```

### 6. **HTTPS Everywhere** ✅
```
Production:  https://www.freelit.in/api/payment-callback ✅
Staging:     https://staging-freelit.vercel.app/api/payment-callback ✅
Local Test:  http://localhost:5173/api/payment-callback ✅
```

### 7. **Rate Limiting on Payment Endpoints** ✅
```typescript
// Prevent abuse/brute force
POST /api/payment/initiate     → Max 5 requests per 15 minutes per user
POST /api/payment/webhook      → Accept from PhonePe IP only
GET  /api/payment/status       → Max 10 requests per minute
```

### 8. **Timeout Handling** ✅
```typescript
// What if payment succeeds but webhook is delayed?
// After 2 minutes, actively check status instead of waiting
setTimeout(() => {
  checkPhonePeOrderStatus(orderId);
}, 2 * 60 * 1000);
```

### 9. **Comprehensive Logging** ✅
```typescript
logger.info('Payment initiated', { orderId, amount, userId });
logger.warn('Payment pending', { orderId, timeout: '2min' });
logger.error('Payment failed', { orderId, phonepeError, timestamp });
```

### 10. **Error Messages for Customers** ✅
```typescript
// ❌ Don't show: "Error Code 1003"
// ✅ Show: "Card declined. Try UPI or different card."

// Help customer understand what went wrong
// Make it easy to retry
```

---

## 🔧 API Endpoints & Environments

### Sandbox (Testing):
```
Base URL: https://api-preprod.phonepe.com/apis/pg-sandbox/
```

### Production (Live):
```
Base URL: https://api.phonepe.com/apis/pg/
```

### Available APIs:
```
POST   /v1/oauth/token                              → Get auth token
POST   /checkout/v2/pay                             → Initiate payment
GET    /checkout/v2/order/{merchantOrderId}/status  → Check status
POST   /payments/v2/refund                          → Refund payment
GET    /payments/v2/refund/{merchantRefundId}/status → Check refund
POST   /webhook                                     → PhonePe calls your server
```

---

## 📝 Environment Variables Setup

### Local Testing (`.env.local`):
```env
# === PHONEPE TEST CREDENTIALS ===
VITE_PHONEPE_MERCHANT_ID_TEST=MERCHANTUAT
VITE_PHONEPE_ENV_TEST=sandbox
VITE_PHONEPE_BASE_URL_TEST=https://api-preprod.phonepe.com/apis/pg-sandbox
VITE_PHONEPE_CALLBACK_URL_TEST=http://localhost:5173/api/payment-callback
VITE_APP_URL_TEST=http://localhost:5173

# === SERVER-SIDE ONLY (Backend) ===
# These go in Supabase Edge Functions secrets or .env.local (not pushed)
PHONEPE_CLIENT_ID_TEST=your_test_client_id
PHONEPE_CLIENT_SECRET_TEST=your_test_client_secret
PHONEPE_SALT_KEY_TEST=your_test_salt_key
PHONEPE_SALT_INDEX_TEST=1
```

### Vercel Staging:
```env
# All TEST variables
# Callback URL: https://staging-freelit.vercel.app/api/payment-callback
```

### Vercel Production:
```env
# === PHONEPE PRODUCTION CREDENTIALS ===
VITE_PHONEPE_MERCHANT_ID_PROD=your_prod_merchant_id
VITE_PHONEPE_ENV_PROD=production
VITE_PHONEPE_BASE_URL_PROD=https://api.phonepe.com/apis/pg
VITE_PHONEPE_CALLBACK_URL_PROD=https://www.freelit.in/api/payment-callback
VITE_APP_URL_PROD=https://www.freelit.in

# === SERVER-SIDE ONLY ===
PHONEPE_CLIENT_ID_PROD=your_prod_client_id
PHONEPE_CLIENT_SECRET_PROD=your_prod_client_secret
PHONEPE_SALT_KEY_PROD=your_prod_salt_key
PHONEPE_SALT_INDEX_PROD=1
```

---

## 💾 Database (Already Ready!)

Your `payment_transactions` table exists with:

```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id),
  phonepe_transaction_id TEXT UNIQUE,
  merchant_order_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50),     -- 'UPI', 'CARD', 'NETBANKING', 'WALLET'
  payment_status VARCHAR(50),     -- 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'
  response_code VARCHAR(10),
  error_message TEXT,
  callback_signature TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

Orders table has `paid_status` field! ✅

---

## 🚀 Complete Payment Flow

```
Step 1: Customer clicks "Pay Now" button on checkout
   ↓
Step 2: Frontend calls: POST /api/payment/initiate
   Body: { orderId, amount, userEmail }
   ↓
Step 3: Backend:
   - Verifies order exists
   - Gets auth token from PhonePe
   - Creates payment request
   - Returns: redirectUrl or payment token
   ↓
Step 4: Frontend redirects customer to PhonePe payment page
   OR Opens iFrame with payment form
   ↓
Step 5: Customer selects payment method:
   - UPI (most popular in India)
   - Debit/Credit Card
   - Net Banking
   - PhonePe Wallet
   ↓
Step 6: Customer authorizes payment
   ↓
Step 7: PhonePe processes payment
   ↓
Step 8: PhonePe calls your webhook:
   POST https://www.freelit.in/api/payment/webhook
   With: { transactionId, merchantOrderId, status, signature, ... }
   ↓
Step 9: Your backend:
   - Verifies signature matches salt key
   - Verifies amount matches order
   - Checks transaction not already processed (idempotent)
   - Updates payment_transactions table
   - Updates orders table (paid_status = true)
   - Sends confirmation email
   - Returns 200 OK
   ↓
Step 10: Frontend:
   - Shows success page
   - Displays order confirmation
   - Sends customer to orders page
   ↓
Step 11: Customer receives email with order details
```

---

## 📊 Callback Request from PhonePe

When customer completes payment, PhonePe POSTs to your callback:

```json
POST /api/payment/webhook
{
  "transactionId": "T1234567890",
  "merchantOrderId": "ORDER-UUID-12345",
  "merchantId": "MERCHANTUAT",
  "amount": 50000,  // Amount in paise (₹500.00)
  "status": "SUCCESS",  // or "FAILURE", "PENDING"
  "responseCode": "0000",  // 0000 = success
  "responseMessage": "Transaction Successful",
  "paymentMethod": "UPI",  // or "CARD", "NETBANKING", "WALLET"
  "approvalRefNumber": "918765432101",
  "signature": "hash_calculated_with_salt_key",
  "timestamp": 1699876543000
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: Successful Payment ✅
- Amount: ₹1 (100 paise)
- Payment method: UPI
- Expected: Order status → PAID, email sent

### Scenario 2: Failed Payment ❌
- Insufficient funds
- Declined card
- Expected: Order status → FAILED, retry option shown

### Scenario 3: Cancelled Payment 🛑
- Customer clicks back during payment
- Expected: Order status → PENDING, allow retry

### Scenario 4: Webhook Timeout ⏱️
- Payment succeeds but webhook delayed
- Expected: Active status check after 2 minutes, order marked paid

### Scenario 5: Duplicate Webhook 🔄
- PhonePe sends same webhook twice
- Expected: Only one charge, no duplication

### Scenario 6: Amount Mismatch 🚨
- Customer manipulates amount in client code
- Expected: Backend rejects, logs security alert

---

## 📝 Files I Will Create

### 1. **`src/lib/phonepe.ts`**
- Initialize PhonePe client with test/prod credentials
- Generate merchant transactions
- Verify webhook signatures (CRITICAL)
- Check order status
- Handle refunds
- Utility functions

### 2. **`src/pages/PaymentCallback.tsx`** (Enhanced)
- Handle redirect from PhonePe
- Parse payment response
- Show success/failure messages
- Redirect to appropriate page

### 3. **Backend Endpoints** (Supabase Edge Functions)
```
POST   /api/payment/initiate       - Start payment
GET    /api/payment/status         - Check order payment status
POST   /api/payment/webhook        - PhonePe sends confirmation here
POST   /api/payment/refund         - Refund a payment
```

### 4. **`src/components/CheckoutPayment.tsx`**
- PhonePe pay button styling
- Amount display
- Loading states
- Error messages

### 5. **Testing utilities**
- Mock PhonePe webhook testing
- Payment flow simulation
- Signature generation helpers

### 6. **Documentation**
- How to test locally
- Production checklist
- Troubleshooting guide

---

## 🎯 Special Features for Smoother Experience

### 1. **Instant Order Confirmation**
- Update UI immediately when webhook received
- Don't make customer wait

### 2. **Clear Payment Method Display**
- "Paid via UPI ✓"
- "Paid via Visa Debit Card ✓"

### 3. **Email Immediately**
- Send order confirmation email as soon as payment verified
- Include: Order ID, Items, Total, Reference Number

### 4. **Retry Logic**
- If payment fails, keep order in PENDING
- Show "Try Again" button
- Prevent data loss

### 5. **Timeout Polling**
- If webhook delayed, poll PhonePe every 5 seconds
- Max wait: 30 seconds
- Then show "Verifying your payment..."

### 6. **Clear Error Messages**
- ✅ "Card declined. Try UPI or a different card."
- ❌ "Error Code 1003"

### 7. **Confirmation Page**
- Show order number prominently
- Show items ordered
- Show expected delivery date
- Link to track order

### 8. **Email Confirmation**
- Order number
- Items & prices
- Delivery address
- Tracking link
- Support contact

---

## ✅ Implementation Checklist

### Phase 1: Setup (1-2 hours)
- [ ] Provide test credentials from PhonePe
- [ ] Add to environment variables
- [ ] Test PhonePe connection

### Phase 2: Development (3-4 hours)
- [ ] Create payment service (`src/lib/phonepe.ts`)
- [ ] Add checkout integration
- [ ] Create webhook endpoint
- [ ] Email notifications

### Phase 3: Local Testing (2-3 hours)
- [ ] Test successful payment
- [ ] Test failed payment
- [ ] Test cancelled payment
- [ ] Test webhook handling
- [ ] Test error scenarios

### Phase 4: Staging (1-2 hours)
- [ ] Deploy to staging Vercel
- [ ] Test callback URLs work
- [ ] End-to-end testing
- [ ] Security review

### Phase 5: Production (1-2 hours)
- [ ] Get production credentials
- [ ] Update environment variables
- [ ] Deploy to production
- [ ] Monitor first transactions

---

## 🔍 What I Need From You

To start implementation, provide:

1. **PhonePe Test Credentials:**
   - Test Merchant ID (e.g., MERCHANTUAT)
   - Test Client ID
   - Test Client Secret
   - Test Salt Key
   - Test Salt Index (usually 1)

2. **Confirmation:**
   - Start with Sandbox/Test? (YES ✅)
   - Deploy to staging Vercel first? (YES ✅)
   - Then production? (YES ✅)

3. **Preferences:**
   - Use Hostinger SMTP for emails? (YES ✅)
   - Auto-confirm orders after payment? (Suggest: YES)
   - Allow partial refunds? (Suggest: YES)

---

## ⏱️ Timeline

- **Setup & Credentials:** 15 min (your time)
- **Coding & Integration:** 3-4 hours
- **Local Testing:** 2-3 hours
- **Staging Testing:** 1-2 hours
- **Production Deployment:** 1 hour

**Total: 8-11 hours to full production** ✅

---

## 🚀 Ready to Implement!

Once you provide test credentials, I will:

1. ✅ Create all payment files
2. ✅ Integrate with checkout
3. ✅ Set up webhook handling
4. ✅ Create testing guide
5. ✅ Prepare for production

**Let's make your payment system secure & smooth!** 💪
