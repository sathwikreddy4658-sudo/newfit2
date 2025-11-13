# PhonePe Payment Gateway Integration Guide

## Complete Setup Guide for PhonePe Business Account

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [PhonePe Account Registration](#phonepe-account-registration)
3. [Business Verification](#business-verification)
4. [Obtaining API Credentials](#obtaining-api-credentials)
5. [Understanding PhonePe Credentials](#understanding-phonepe-credentials)
6. [Environment Configuration](#environment-configuration)
7. [Testing in Sandbox](#testing-in-sandbox)
8. [Going Live](#going-live)
9. [Important Notes](#important-notes)

---

## Prerequisites

### Business Requirements
- **Registered Business Entity** (Proprietorship, Partnership, LLP, Private Limited, or Public Limited)
- **Valid PAN Card** of the business
- **GST Registration** (mandatory for most businesses)
- **Business Bank Account**
- **Business Address Proof**
- **Authorized Signatory KYC** (Aadhaar, PAN, etc.)

### Technical Requirements
- **Website/App** with HTTPS enabled
- **Valid Domain** (for production)
- **Server** to host webhook endpoints
- **Developer** with API integration knowledge

---

## PhonePe Account Registration

### Step 1: Visit PhonePe Business Portal
1. Go to: **https://business.phonepe.com/**
2. Click on **"Get Started"** or **"Sign Up"**

### Step 2: Choose Account Type
- Select **"Payment Gateway"** option
- Choose your business type:
  - Sole Proprietorship
  - Partnership
  - Private Limited Company
  - Public Limited Company
  - LLP (Limited Liability Partnership)

### Step 3: Initial Registration
1. **Enter Business Details:**
   - Legal Business Name
   - Business PAN
   - Business Email
   - Business Phone Number
   - Business Address

2. **Create Account:**
   - Set up login credentials
   - Verify email and phone number via OTP

---

## Business Verification

### Step 4: Complete KYC Process

#### Documents Required:
1. **Business Documents:**
   - Certificate of Incorporation (for companies)
   - Partnership Deed (for partnerships)
   - GST Registration Certificate
   - PAN Card of Business
   - Cancelled Cheque or Bank Statement

2. **Authorized Signatory Documents:**
   - PAN Card
   - Aadhaar Card
   - Photograph
   - Address Proof

3. **Business Proof:**
   - Shop/Office Address Proof
   - Rent Agreement or Ownership Deed
   - Utility Bills (Electricity/Water)

#### Upload Process:
1. Log in to PhonePe Business Dashboard
2. Navigate to **"KYC Section"**
3. Upload all required documents
4. Submit for verification

#### Verification Timeline:
- **Initial Review:** 2-3 business days
- **Additional Documents (if required):** 1-2 business days
- **Final Approval:** 1-2 business days
- **Total Time:** 5-7 business days (approximately)

---

## Obtaining API Credentials

### Step 5: Access Developer Dashboard

Once your business account is verified:

1. **Log in** to PhonePe Business Portal
2. Navigate to **"Developers"** or **"API Credentials"** section
3. You'll find two environments:
   - **UAT (Sandbox)** - For testing
   - **Production** - For live transactions

### Step 6: Generate Credentials

#### For UAT/Sandbox Environment:
1. Click on **"UAT Credentials"**
2. You'll receive:
   - **Merchant ID** (e.g., `MERCHANTUAT`)
   - **Salt Key** (e.g., `099eb0cd-02cf-4e2a-8aca-3e6c6aff0399`)
   - **Salt Index** (usually `1`)
   - **API Endpoint:** `https://api-preprod.phonepe.com/apis/pg-sandbox`

#### For Production Environment:
1. Complete all compliance requirements
2. Submit production access request
3. After approval, click on **"Production Credentials"**
4. You'll receive:
   - **Merchant ID** (e.g., `MERCHANTPROD`)
   - **Salt Key** (unique production key)
   - **Salt Index** (usually `1`)
   - **API Endpoint:** `https://api.phonepe.com/apis/hermes`

---

## Understanding PhonePe Credentials

### Merchant ID
- **What it is:** Unique identifier for your business
- **Format:** Alphanumeric string (e.g., `M1234567890`)
- **Usage:** Included in every API request
- **Security:** Can be public (included in client-side code)

### Salt Key
- **What it is:** Secret key for generating checksums
- **Format:** UUID format (e.g., `099eb0cd-02cf-4e2a-8aca-3e6c6aff0399`)
- **Usage:** Used to create SHA256 hash for request verification
- **Security:** ⚠️ **MUST BE KEPT SECRET** - Never expose in client-side code
- **Storage:** Store in environment variables only

### Salt Index
- **What it is:** Version number of the salt key
- **Format:** Usually `1` (can be `2`, `3` if keys are rotated)
- **Usage:** Sent with X-VERIFY header
- **Purpose:** Allows key rotation without breaking existing integrations

### How They Work Together:
```
Request Payload (Base64) + API Endpoint + Salt Key = SHA256 Hash
SHA256 Hash + "###" + Salt Index = X-VERIFY Header
```

---

## Environment Configuration

### Step 7: Set Up Environment Variables

#### Create `.env` file in your project root:

```env
# PhonePe UAT/Sandbox Credentials (for testing)
VITE_PHONEPE_MERCHANT_ID=MERCHANTUAT
VITE_PHONEPE_SALT_KEY=099eb0cd-02cf-4e2a-8aca-3e6c6aff0399
VITE_PHONEPE_SALT_INDEX=1
VITE_PHONEPE_ENV=sandbox

# PhonePe Production Credentials (for live)
# VITE_PHONEPE_MERCHANT_ID=your_production_merchant_id
# VITE_PHONEPE_SALT_KEY=your_production_salt_key
# VITE_PHONEPE_SALT_INDEX=1
# VITE_PHONEPE_ENV=production
```

#### Important Security Notes:
- ✅ Add `.env` to `.gitignore`
- ✅ Never commit credentials to version control
- ✅ Use different credentials for development and production
- ✅ Rotate salt keys periodically
- ✅ Store production keys in secure environment variable managers

---

## Testing in Sandbox

### Step 8: Sandbox Testing

#### Sandbox Environment Details:
- **Base URL:** `https://api-preprod.phonepe.com/apis/pg-sandbox`
- **No Real Money:** All transactions are simulated
- **Test Cards:** PhonePe provides test card numbers
- **Instant Results:** Payments complete immediately

#### Test Payment Flow:
1. **Initiate Payment** with sandbox credentials
2. **Redirect to PhonePe** payment page
3. **Use Test Credentials:**
   - Any UPI ID works in sandbox
   - Test card numbers provided by PhonePe
   - All payments auto-succeed or can be manually failed

#### Test Scenarios:
```javascript
// Success Scenario
Amount: Any amount
Status: Will show SUCCESS

// Failure Scenario
Amount: Specific amounts trigger failures (check PhonePe docs)
Status: Will show FAILED

// Pending Scenario
Amount: Specific amounts trigger pending state
Status: Will show PENDING
```

#### Sandbox Test Cards (if provided by PhonePe):
- Check PhonePe developer documentation for latest test cards
- Usually any card number works in sandbox

---

## Going Live

### Step 9: Production Checklist

#### Before Going Live:
- [ ] Complete all KYC verification
- [ ] Test thoroughly in sandbox environment
- [ ] Implement webhook handler
- [ ] Set up proper error handling
- [ ] Configure production environment variables
- [ ] Set up SSL certificate (HTTPS)
- [ ] Test payment flow end-to-end
- [ ] Set up monitoring and logging
- [ ] Prepare customer support process
- [ ] Review PhonePe's terms and conditions

#### Compliance Requirements:
1. **Website Requirements:**
   - Privacy Policy page
   - Terms & Conditions page
   - Refund & Cancellation policy
   - Contact information
   - Business details

2. **Technical Requirements:**
   - HTTPS enabled
   - Valid SSL certificate
   - Webhook endpoint configured
   - Proper error handling
   - Transaction logging

3. **Business Requirements:**
   - Active GST registration
   - Valid business bank account
   - Proper invoicing system
   - Customer support setup

#### Switching to Production:
1. **Update Environment Variables:**
   ```env
   VITE_PHONEPE_MERCHANT_ID=your_production_merchant_id
   VITE_PHONEPE_SALT_KEY=your_production_salt_key
   VITE_PHONEPE_SALT_INDEX=1
   VITE_PHONEPE_ENV=production
   ```

2. **Update API Base URL** in code:
   ```typescript
   const PHONEPE_BASE_URL = import.meta.env.VITE_PHONEPE_ENV === 'production'
     ? 'https://api.phonepe.com/apis/hermes'
     : 'https://api-preprod.phonepe.com/apis/pg-sandbox';
   ```

3. **Test with Small Amount:**
   - Make a real transaction with minimum amount (₹1)
   - Verify payment flow
   - Check webhook callbacks
   - Verify order status updates

4. **Monitor First Transactions:**
   - Watch logs closely
   - Check for any errors
   - Verify customer experience
   - Monitor payment success rate

---

## Important Notes

### Transaction Fees
- **PhonePe Charges:** Typically 1.5% - 2% per transaction
- **GST:** 18% on transaction fees
- **Settlement:** T+1 or T+2 days (next business day)
- **Minimum Amount:** ₹1
- **Maximum Amount:** As per your merchant category

### Payment Methods Supported
- ✅ UPI (Google Pay, PhonePe, Paytm, etc.)
- ✅ Credit Cards (Visa, Mastercard, Amex, RuPay)
- ✅ Debit Cards (All major banks)
- ✅ Net Banking (All major banks)
- ✅ Wallets (PhonePe Wallet)

### API Rate Limits
- **Sandbox:** Usually unlimited
- **Production:** Check with PhonePe (typically 100-1000 requests/minute)

### Webhook Configuration
- **Callback URL:** Must be HTTPS
- **IP Whitelisting:** May be required
- **Signature Verification:** Always verify webhook signatures
- **Retry Logic:** PhonePe retries failed webhooks

### Common Issues & Solutions

#### Issue 1: Invalid Signature Error
**Solution:** 
- Verify Salt Key is correct
- Check Salt Index matches
- Ensure proper SHA256 hash generation
- Verify Base64 encoding of payload

#### Issue 2: Merchant Not Found
**Solution:**
- Verify Merchant ID is correct
- Check if using correct environment (sandbox vs production)
- Ensure merchant account is active

#### Issue 3: Payment Stuck in Pending
**Solution:**
- Implement proper webhook handler
- Check payment status via API
- Set up automatic status checking
- Contact PhonePe support if persists

#### Issue 4: Webhook Not Receiving
**Solution:**
- Verify webhook URL is accessible
- Check HTTPS certificate is valid
- Ensure no firewall blocking
- Test webhook endpoint manually

### Support & Resources

#### PhonePe Support:
- **Email:** merchantsupport@phonepe.com
- **Phone:** Check PhonePe Business Portal
- **Developer Docs:** https://developer.phonepe.com/
- **Business Portal:** https://business.phonepe.com/

#### Useful Links:
- **API Documentation:** https://developer.phonepe.com/v1/docs/
- **Integration Guide:** Available in developer portal
- **Postman Collection:** Available for API testing
- **Status Page:** Check PhonePe service status

---

## Next Steps After Getting Credentials

Once you have your credentials:

1. **Update `.env` file** with your credentials
2. **Test in sandbox** environment first
3. **Implement webhook handler** for automatic status updates
4. **Add error handling** for failed payments
5. **Set up monitoring** for payment transactions
6. **Create admin dashboard** for payment tracking
7. **Test thoroughly** before going live
8. **Switch to production** credentials when ready

---

## Security Best Practices

### DO's ✅
- Store Salt Key in environment variables
- Use HTTPS for all API calls
- Verify webhook signatures
- Log all transactions
- Implement retry logic
- Set up monitoring alerts
- Keep credentials secure
- Rotate keys periodically

### DON'Ts ❌
- Never expose Salt Key in client-side code
- Don't commit credentials to Git
- Don't skip signature verification
- Don't ignore webhook callbacks
- Don't store sensitive data in logs
- Don't use production credentials in development
- Don't share credentials via email/chat

---

## Estimated Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Account Registration | 1 day | Sign up and initial setup |
| Document Submission | 1-2 days | Gather and upload documents |
| KYC Verification | 5-7 days | PhonePe reviews documents |
| Sandbox Testing | 3-5 days | Integration and testing |
| Production Approval | 2-3 days | Request and get approval |
| Go Live | 1 day | Switch to production |
| **Total** | **2-3 weeks** | **Complete setup** |

---

## Cost Breakdown

### One-Time Costs:
- **Setup Fee:** Usually ₹0 (free)
- **Integration:** Developer time
- **SSL Certificate:** ₹500 - ₹5,000/year

### Recurring Costs:
- **Transaction Fee:** 1.5% - 2% per transaction
- **GST on Fees:** 18% on transaction fees
- **Settlement Charges:** Usually ₹0
- **Annual Maintenance:** Usually ₹0

### Example Calculation:
```
Transaction Amount: ₹1,000
PhonePe Fee (2%): ₹20
GST (18% on fee): ₹3.60
Total Deduction: ₹23.60
You Receive: ₹976.40
```

---

## Conclusion

PhonePe integration is straightforward once you have the credentials. The key is to:
1. Complete business verification properly
2. Test thoroughly in sandbox
3. Implement proper error handling
4. Set up webhook for automatic updates
5. Monitor transactions closely

For any issues during setup, contact PhonePe merchant support directly.

---

**Document Version:** 1.0  
**Last Updated:** November 2024  
**Author:** Development Team
