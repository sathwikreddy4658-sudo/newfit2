# PhonePe Integration - Quick Start Guide

## 🚀 Get Started in 5 Steps

---

## Step 1: Get PhonePe Credentials (2-3 weeks)

### Option A: Use Sandbox for Testing (Immediate)
You can start testing immediately with PhonePe's sandbox environment:

```env
VITE_PHONEPE_MERCHANT_ID=MERCHANTUAT
VITE_PHONEPE_SALT_KEY=099eb0cd-02cf-4e2a-8aca-3e6c6aff0399
VITE_PHONEPE_SALT_INDEX=1
VITE_PHONEPE_ENV=sandbox
```

### Option B: Get Production Credentials (Required for Live)
Follow the detailed guide in `PHONEPE_SETUP_GUIDE.md`

**Quick Summary:**
1. Visit https://business.phonepe.com/
2. Sign up as a merchant
3. Complete KYC verification (5-7 days)
4. Get production credentials from dashboard

---

## Step 2: Configure Environment Variables (5 minutes)

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file with your credentials:**
   ```env
   # For Testing (Sandbox)
   VITE_PHONEPE_MERCHANT_ID=MERCHANTUAT
   VITE_PHONEPE_SALT_KEY=099eb0cd-02cf-4e2a-8aca-3e6c6aff0399
   VITE_PHONEPE_SALT_INDEX=1
   VITE_PHONEPE_ENV=sandbox
   
   # Your Supabase credentials
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   
   # Your app URL
   VITE_APP_URL=http://localhost:5173
   ```

3. **Verify `.env` is in `.gitignore`:**
   ```bash
   # Check if .env is ignored
   git check-ignore .env
   # Should output: .env
   ```

---

## Step 3: Set Up Database (10 minutes)

### Current Status:
✅ Basic orders table exists with `payment_id` field  
🔄 Enhanced payment tracking table needed (optional but recommended)

### To Add Enhanced Payment Tracking:

Run the migration (will be created in implementation):
```bash
# This will be available after implementation
supabase db push
```

---

## Step 4: Test the Integration (30 minutes)

### 4.1 Start Development Server
```bash
npm run dev
```

### 4.2 Test Payment Flow

1. **Add items to cart**
2. **Go to checkout**
3. **Click "Go to Payment"**
4. **You'll be redirected to PhonePe payment page**
5. **In sandbox, any payment will succeed**
6. **You'll be redirected back with payment status**

### 4.3 Test Scenarios

**Success Flow:**
- Add product to cart → Checkout → Pay → Success page → Order created

**Failure Flow:**
- Add product to cart → Checkout → Pay → Close payment page → Failure handling

**Guest Checkout:**
- Add to cart → Checkout as guest → Enter details → Pay → Success

---

## Step 5: Monitor & Debug (Ongoing)

### Check Logs
```bash
# Browser console for frontend errors
# Check Network tab for API calls
# Check Supabase logs for backend errors
```

### Common Issues & Solutions

#### Issue: "Invalid Merchant ID"
**Solution:** Check if `VITE_PHONEPE_MERCHANT_ID` is set correctly in `.env`

#### Issue: "Invalid Signature"
**Solution:** Verify `VITE_PHONEPE_SALT_KEY` and `VITE_PHONEPE_SALT_INDEX` are correct

#### Issue: Payment stuck in "Verifying"
**Solution:** Check browser console for errors, verify callback URL is accessible

#### Issue: Order created but payment not recorded
**Solution:** Check if `payment_id` is being stored in orders table

---

## 📋 Current Implementation Status

### ✅ What's Already Working

1. **Payment Initiation**
   - Creates order in database
   - Generates unique transaction ID
   - Redirects to PhonePe payment page

2. **Payment Callback**
   - Verifies payment status
   - Updates order with payment ID
   - Clears cart on success
   - Shows success/failure message

3. **Guest Checkout**
   - Allows non-registered users to checkout
   - Collects necessary information
   - Processes payment

4. **Order Management**
   - Stores order details
   - Links payment to order
   - Tracks order status

### 🔄 What Needs Enhancement

1. **Payment Tracking**
   - Dedicated payment transactions table
   - Detailed payment history
   - Better status tracking

2. **Webhook Handler**
   - Automatic status updates
   - No manual status checking needed
   - Real-time order updates

3. **Error Handling**
   - Better error messages
   - Retry functionality
   - Timeout handling

4. **Admin Dashboard**
   - Payment analytics
   - Failed payment reports
   - Refund management

---

## 🎯 Next Steps

### For Testing (Now)
1. ✅ Use sandbox credentials
2. ✅ Test payment flow
3. ✅ Verify order creation
4. ✅ Check payment status updates

### For Production (Later)
1. 🔄 Get production credentials
2. 🔄 Implement enhancements (see PHONEPE_IMPLEMENTATION_TODO.md)
3. 🔄 Set up webhook handler
4. 🔄 Test thoroughly
5. 🔄 Deploy to production
6. 🔄 Monitor transactions

---

## 📚 Additional Resources

- **Detailed Setup:** `PHONEPE_SETUP_GUIDE.md`
- **Implementation Plan:** `PHONEPE_IMPLEMENTATION_TODO.md`
- **Environment Template:** `.env.example`
- **PhonePe Docs:** https://developer.phonepe.com/

---

## 🆘 Need Help?

### PhonePe Support
- Email: merchantsupport@phonepe.com
- Portal: https://business.phonepe.com/

### Common Questions

**Q: Can I test without PhonePe account?**  
A: Yes! Use the sandbox credentials provided in `.env.example`

**Q: How long to get production credentials?**  
A: 2-3 weeks including KYC verification

**Q: What's the transaction fee?**  
A: Typically 1.5-2% + 18% GST

**Q: Is webhook mandatory?**  
A: Not mandatory but highly recommended for production

**Q: Can I use this for international payments?**  
A: No, PhonePe only supports Indian payments (INR)

---

## ✅ Pre-Launch Checklist

Before going live with production credentials:

- [ ] PhonePe account verified
- [ ] Production credentials obtained
- [ ] Environment variables updated
- [ ] SSL certificate active (HTTPS)
- [ ] Webhook handler deployed
- [ ] Tested in sandbox thoroughly
- [ ] Privacy policy updated
- [ ] Terms & conditions updated
- [ ] Refund policy published
- [ ] Customer support ready
- [ ] Monitoring set up
- [ ] Backup plan ready

---

**Ready to implement enhancements?** Check `PHONEPE_IMPLEMENTATION_TODO.md` for the full roadmap!

**Last Updated:** November 2024
