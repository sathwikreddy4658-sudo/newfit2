# 📧 Email Confirmation Feature - Complete Guide

## ✅ What's Working Now

Your order confirmation email feature is **fully functional** on localhost:
- ✅ Admin can select "📧 Send Confirmation Email" from order status dropdown
- ✅ Beautiful HTML email template with order details, items, and address
- ✅ Plain text version for spam prevention
- ✅ Order status automatically updates to "confirmed" after email sent
- ✅ Express server running on port 3001
- ✅ Hostinger SMTP configured and working

---

## 📝 How to Edit the Email Template

### Location
All email customization is in: `api/emailTemplate.js`

### What You Can Customize

1. **Store/Brand Information** (Top of file):
```javascript
export const emailConfig = {
  storeName: 'Freelit',              // Your store name
  storeEmail: 'care@freelit.in',     // Your email
  websiteUrl: 'https://freelit.in',  // Your website
  supportEmail: 'care@freelit.in',   // Support email
  
  // Brand colors
  colors: {
    primary: '#5e4338',      // Main brown color
    secondary: '#3b2a20',    // Darker brown
    accent: '#b5edce',       // Mint green
    success: '#4caf50',
    warning: '#ffd700',
  },
  
  // Email subject line (use {orderId} as placeholder)
  subjectTemplate: 'Order Confirmed - #{orderId}',
  
  // Sender name that appears in inbox
  fromName: 'Freelit Order Confirmation',
};
```

2. **HTML Email Content** (`getOrderEmailTemplate` function):
   - Change the greeting message
   - Modify layout and styling
   - Add/remove sections
   - Customize footer text
   - Add social media links

3. **Plain Text Version** (`getOrderEmailText` function):
   - Edit the text-only version (for accessibility and spam prevention)

### Example: Change Colors
```javascript
colors: {
  primary: '#FF5722',      // Orange
  secondary: '#E64A19',    // Dark orange
  accent: '#FFC107',       // Amber
  success: '#4caf50',
  warning: '#ffd700',
}
```

### Example: Add Social Media
In `emailTemplate.js`, find the footer section and add:
```javascript
<p style="margin: 10px 0 0 0; font-size: 11px;">
  <a href="${websiteUrl}" style="color: #999;">Visit Website</a> | 
  <a href="mailto:${emailConfig.supportEmail}" style="color: #999;">Contact Support</a> |
  <a href="https://instagram.com/yourhandle" style="color: #999;">Instagram</a>
</p>
```

---

## 🚀 Production Deployment - Complete Checklist

### Step 1: DNS Configuration (CRITICAL for preventing spam)

**Go to your Hostinger control panel → Domains → DNS Records**

Add these records:

1. **SPF Record** (Prevents spoofing):
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.hosting.hostinger.com ~all
TTL: 3600
```

2. **DKIM Record** (Email authentication):
   - In Hostinger → Email → Advanced → DKIM
   - Click "Enable DKIM" 
   - Copy the generated DKIM record to DNS

3. **DMARC Record** (Email policy):
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:care@freelit.in
TTL: 3600
```

**⚠️ Without these DNS records, your emails WILL go to spam!**

---

### Step 2: Deploy the Email Server

You need to host the Express server (`server.js`) somewhere. Here are your options:

#### Option A: Hostinger (Recommended - since you're already using them)

1. **SSH into your Hostinger hosting:**
```bash
ssh username@freelit.in
```

2. **Upload files via FTP or cPanel File Manager:**
   - `server.js`
   - `api/send-email.js`
   - `api/emailTemplate.js`
   - `.env.email` (or set environment variables in cPanel)

3. **Install Node.js** (if not already):
   - Via cPanel → Setup Node.js App
   - Or contact Hostinger support

4. **Install dependencies:**
```bash
cd /path/to/your/app
npm install nodemailer express cors dotenv
```

5. **Start the server:**
```bash
node server.js
```

6. **Keep it running** with PM2:
```bash
npm install -g pm2
pm2 start server.js --name "email-server"
pm2 save
pm2 startup
```

7. **Configure reverse proxy** (in cPanel or .htaccess):
```apache
RewriteEngine On
RewriteRule ^api/send-email$ http://localhost:3001/api/send-email [P,L]
RewriteRule ^api/test-email$ http://localhost:3001/api/test-email [P,L]
```

#### Option B: Railway.app (Easiest - Free tier available)

1. Go to [Railway.app](https://railway.app)
2. Create new project → Deploy from GitHub
3. Connect your repository
4. Railway auto-detects Node.js
5. Add environment variables:
   - `SMTP_USER=care@freelit.in`
   - `SMTP_PASS=Sathwikreddy77wk$`
   - `PORT=3001`
6. Deploy! You'll get a URL like: `https://yourapp.railway.app`

#### Option C: Vercel (Alternative - Free)

**⚠️ Note:** Vercel uses serverless functions, so you need to slightly modify:

1. Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    { "src": "api/send-email.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/send-email", "dest": "api/send-email.js" }
  ]
}
```

2. Deploy:
```bash
npm i -g vercel
vercel
```

---

### Step 3: Update Frontend API URL

**Already done!** Your `OrdersTab.tsx` is configured:
```javascript
const apiUrl = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api/send-email'
  : 'https://freelit.in/api/send-email';  // ✅ Production URL
```

**Verify this points to your deployed server!**

If using Railway, change to:
```javascript
: 'https://yourapp.railway.app/api/send-email'
```

---

### Step 4: Build and Deploy Your React App

1. **Build for production:**
```bash
npm run build
```

2. **Deploy to Hostinger:**
   - Upload `dist/` folder contents to `public_html/`
   - Or use FTP/cPanel File Manager

3. **Verify CSP allows your email server:**
   In `index.html`:
```html
<meta http-equiv="Content-Security-Policy" content="
  ...
  connect-src 'self' https://freelit.in https://*.supabase.co http://localhost:*;
">
```

---

### Step 5: Test Everything

1. **Check email server is running:**
```bash
curl https://freelit.in/api/health
# Should return: {"status":"ok"}
```

2. **Send test email to mail-tester:**
   - In admin panel, create a test order
   - Use customer email: `test-17hb62vei@srv1.mail-tester.com`
   - Click "📧 Send Confirmation Email"
   - Check score at: https://www.mail-tester.com

3. **Check real customer email:**
   - Send to your personal Gmail/Yahoo
   - Verify it arrives in inbox (not spam)
   - Check formatting looks good on mobile

---

## 📊 Expected Mail-Tester Score

With proper DNS configuration, you should get:
- ✅ **8-10/10** score
- ✅ SPF: PASS
- ✅ DKIM: PASS
- ✅ DMARC: PASS
- ✅ Not blacklisted

Without DNS records:
- ❌ 2-5/10 score
- ❌ Emails go to spam

---

## 🔧 Troubleshooting

### Email goes to spam
**Solution:** Add SPF, DKIM, DMARC DNS records (see Step 1)

### 404 Error on /api/send-email
**Solution:** Email server not running or reverse proxy not configured

### CORS Error
**Solution:** Check CSP in `index.html` includes your production domain

### Email not sending
**Solution:** Check SMTP credentials in `.env.email` or environment variables

### Server crashes
**Solution:** Use PM2 process manager (see Hostinger deployment)

---

## 📂 File Summary

| File | Purpose | Need to Deploy? |
|------|---------|----------------|
| `server.js` | Express API server | ✅ Yes (backend) |
| `api/send-email.js` | Email sending logic | ✅ Yes (backend) |
| `api/emailTemplate.js` | **Email template (EDIT THIS!)** | ✅ Yes (backend) |
| `.env.email` | SMTP credentials | ✅ Yes (backend) |
| `src/components/admin/OrdersTab.tsx` | Admin frontend | ✅ Yes (frontend build) |

---

## 🎯 Quick Start Checklist

Before going live:

- [ ] DNS records added (SPF, DKIM, DMARC)
- [ ] Email template customized in `api/emailTemplate.js`
- [ ] Server deployed (Hostinger/Railway/Vercel)
- [ ] Environment variables set on server
- [ ] Frontend built and deployed
- [ ] Production API URL updated in `OrdersTab.tsx`
- [ ] Tested with mail-tester.com (score 8+)
- [ ] Tested with real customer email
- [ ] Server process manager configured (PM2)

---

## 📞 Support

If you need help with deployment:
- **DNS Issues:** Contact Hostinger support chat
- **Server Issues:** Check server logs: `pm2 logs email-server`
- **Email Issues:** Check Nodemailer debug: Add `debug: true` to transporter config

---

## 🔗 Useful Links

- Mail Tester: https://www.mail-tester.com
- Hostinger Docs: https://support.hostinger.com
- Railway Docs: https://docs.railway.app
- PM2 Docs: https://pm2.keymetrics.io/docs

---

**🎉 You're ready to deploy! Good luck!**
