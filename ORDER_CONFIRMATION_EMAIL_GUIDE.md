# Order Confirmation Email Setup Guide

## Overview
Admins can now send order confirmation emails to customers directly from the admin panel by selecting "📧 Send Confirmation Email" in the order status dropdown.

## What Was Added

### 1. Admin Panel Feature
- **New dropdown option**: "📧 Send Confirmation Email" at the top of the status dropdown
- **Confirmation dialog**: Shows customer email, order ID, total, and item count before sending
- **Automatic status update**: Order status changes to "confirmed" after successful email send
- **Toast notifications**: Real-time feedback on email sending status

### 2. Email Template
Beautiful HTML email template includes:
- ✅ Order confirmation header with gradient design
- ✅ Order details (ID, date, payment method)
- ✅ Items table with quantities and prices
- ✅ Delivery address
- ✅ COD notice (if applicable)
- ✅ Total amount
- ✅ Mobile-responsive design

## Setup Instructions

### Step 1: Install Supabase CLI
```bash
# Install Supabase CLI if you haven't already
npm install -g supabase
```

### Step 2: Link Your Project
```bash
# In your project directory
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 3: Set Up SMTP Credentials in Supabase
1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** → **Edge Functions** → **Manage secrets**
3. Add these secrets (one by one):

   **SMTP_HOST**
   - Value: `smtp.hostinger.com`
   
   **SMTP_PORT**
   - Value: `465`
   
   **SMTP_USER**
   - Value: Your full Hostinger email (e.g., `orders@yourdomain.com`)
   
   **SMTP_PASS**
   - Value: Your Hostinger email password
   
   **SMTP_FROM** (optional, defaults to SMTP_USER)
   - Value: Your sender email (e.g., `orders@yourdomain.com`)

4. Click **Save** after adding each secret

### Step 4: Deploy the Edge Function
```bash
# In your project root directory
supabase functions deploy send-order-confirmation
```

## How to Use

### For Admins:
1. Go to **Admin Panel** → **Orders Tab**
2. Find the order you want to confirm
3. Click on the **Status dropdown**
4. Select **"📧 Send Confirmation Email"** (first option, blue background)
5. Review the confirmation dialog
6. Click **OK** to send
7. Wait for success notification

### What Happens:
- ✅ Email is sent to customer immediately
- ✅ Order status automatically changes to "confirmed"
- ✅ Customer receives beautiful HTML email with:
  - Order confirmation
  - All order details
  - Items purchased
  - Delivery address
  - Payment method info
  - COD reminder (if applicable)

## Email Preview

The customer will receive an email like this:

```
🎉 Order Confirmed!
Thank you for your order

Hi [Customer Name],

Great news! Your order has been confirmed and is being 
prepared for delivery. We'll notify you once it's shipped.

📦 Order Details
Order ID: abc12345
Order Date: November 24, 2025, 10:30 AM
Payment Method: COD / Online Payment

🛒 Items Ordered
[Beautiful table with all items, quantities, prices]

Order Total: ₹XXX.XX

📍 Delivery Address
[Customer's full delivery address]

💰 Cash on Delivery
Please keep the exact amount ready when our delivery partner arrives.
```

## Testing

### Test Email Functionality:
1. Create a test order with your own email
2. Go to admin panel
3. Select "Send Confirmation Email"
4. Check your inbox (and spam folder)

### Troubleshooting:
- **"Failed to send email"**: Check that all SMTP credentials are set correctly in Supabase
- **"No email address found"**: Ensure the order has customer_email field populated
- **Email not received**: 
  - Check spam folder
  - Verify SMTP credentials are correct
  - Check Supabase Edge Function logs for errors
  - Verify Hostinger email account is active
- **Authentication failed**: Double-check SMTP_USER and SMTP_PASS are correct

## SMTP Configuration Details

Your Hostinger SMTP settings:
- **Host**: smtp.hostinger.com
- **Port**: 465 (SSL/TLS)
- **Security**: TLS enabled
- **Username**: Your full email address
- **Password**: Your email account password

## Resend Free Tier Limits
- ✅ 100 emails per day
- ✅ 3,000 emails per month
- ✅ Perfect for small to medium businesses

For higher volumes, upgrade to paid plan:
- $20/mo for 50,000 emails/month

## Alternative Email Services

If you want to use a different service instead of Resend:

### Gmail SMTP
- Update function to use nodemailer with Gmail
- Requires app password setup

### SendGrid
- Similar setup to Resend
- Free tier: 100 emails/day

### Amazon SES
- Very cheap for high volume
- More complex setup

## Security Notes
- ✅ Email function uses SECURITY DEFINER (safe)
- ✅ SMTP credentials stored as Supabase secrets (encrypted)
- ✅ Confirmation dialog prevents accidental sends
- ✅ Email validation before sending
- ✅ CORS headers properly configured
- ✅ TLS encryption for SMTP connection

## Files Modified
1. `src/components/admin/OrdersTab.tsx` - Added email sending UI and logic
2. `supabase/functions/send-order-confirmation/index.ts` - Edge function with Hostinger SMTP (NEW)
3. `ORDER_CONFIRMATION_EMAIL_GUIDE.md` - This guide (NEW)

## Next Steps After Setup
1. ✅ Set SMTP credentials in Supabase secrets
2. ✅ Deploy the edge function
3. ✅ Test with a real order
4. ✅ Push changes to GitHub

## Quick Setup Checklist

- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Link project: `supabase link --project-ref YOUR_PROJECT_REF`
- [ ] Add SMTP_HOST secret: `smtp.hostinger.com`
- [ ] Add SMTP_PORT secret: `465`
- [ ] Add SMTP_USER secret: your_email@yourdomain.com
- [ ] Add SMTP_PASS secret: your_email_password
- [ ] Deploy function: `supabase functions deploy send-order-confirmation`
- [ ] Test email from admin panel

---

**Created**: November 24, 2025
**Status**: Ready to Deploy
