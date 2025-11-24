# 📧 Email Confirmation Setup Guide

## ✅ What's Already Done

- **Email template** with your brand colors (brown/mint)
- **Hostinger SMTP** configured (care@freelit.in)
- **Admin panel** with "Send Confirmation Email" option
- **Production URLs** set to freelit.in

---

## 📝 How to Edit Email Template

### File: `api/emailTemplate.js`

All customization is in the **top section**:

```javascript
export const emailConfig = {
  storeName: 'FREEL IT',           // Change store name
  storeEmail: 'care@freelit.in',   // Support email
  websiteUrl: 'https://freelit.in', // Your domain
  
  colors: {
    primary: '#5e4338',      // Brown - header/buttons
    accent: '#b5edce',       // Mint - borders/highlights
    warning: '#ffd700',      // COD notice color
  },
  
  subjectTemplate: 'Order Confirmed - #{orderId}',
  fromName: 'Freelit Order Confirmation',
};
```

**To customize:**
1. Open `api/emailTemplate.js`
2. Edit values in `emailConfig` section
3. Save file
4. Restart email server: `node server.js`

---

## 🚀 Production Deployment

Your email server needs to run at `https://freelit.in/api/send-email`

### Option 1: Deploy to Vercel (Recommended)

1. **Install Vercel CLI:**
   ```powershell
   npm install -g vercel
   ```

2. **Create `vercel.json`:**
   ```json
   {
     "version": 2,
     "builds": [
       { "src": "server.js", "use": "@vercel/node" }
     ],
     "routes": [
       { "src": "/api/(.*)", "dest": "server.js" }
     ]
   }
   ```

3. **Deploy:**
   ```powershell
   vercel --prod
   ```

4. **Add Environment Variables in Vercel Dashboard:**
   - `SMTP_USER`: care@freelit.in
   - `SMTP_PASS`: [your password]
   - `PORT`: 3001

5. **Update Domain:**
   - In Vercel dashboard, add custom domain: `freelit.in`

### Option 2: Deploy to Railway/Render

1. Push code to GitHub
2. Connect Railway/Render to your repo
3. Add environment variables
4. Deploy
5. Point freelit.in to your Railway/Render URL

### Option 3: VPS/Hostinger Server

If you have a VPS or Hostinger server:

1. **Upload files:**
   ```powershell
   scp -r api/ server.js package.json user@freelit.in:/var/www/email-api/
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run with PM2:**
   ```bash
   npm install -g pm2
   pm2 start server.js --name email-api
   pm2 save
   ```

4. **Nginx Reverse Proxy:**
   ```nginx
   location /api/ {
     proxy_pass http://localhost:3001/api/;
   }
   ```

---

## 🔒 Security Checklist

- [x] `.env.email` added to `.gitignore`
- [ ] SMTP credentials stored as environment variables (not hardcoded)
- [ ] CORS configured for your domain only
- [ ] HTTPS enabled on production

---

## 📬 Prevent Emails Going to Spam

### Configure DNS Records (Important!)

Add these records in your domain DNS settings (Hostinger control panel):

#### 1. SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.hostinger.com ~all
```

#### 2. DKIM Record
Ask Hostinger support for your DKIM key, then add:
```
Type: TXT
Name: default._domainkey
Value: [Hostinger will provide]
```

#### 3. DMARC Record
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:care@freelit.in
```

### Additional Tips:
- ✅ Plain text version already included
- ✅ Reply-to headers already set
- ✅ From name includes "Order Confirmation"
- 📧 Test with mail-tester.com before production

---

## 🧪 Testing Before Production

### Test with Mail-Tester

1. **Start local server:**
   ```powershell
   node server.js
   ```

2. **Get test email from https://www.mail-tester.com/**

3. **Send test via API:**
   ```powershell
   Invoke-RestMethod -Uri http://localhost:3001/api/test-email -Method POST -ContentType "application/json" -Body '{"testEmail":"test-xxxxx@srv1.mail-tester.com"}'
   ```

4. **Check score** (aim for 8+/10)

---

## 📁 File Structure

```
newfit2/
├── api/
│   ├── send-email.js        # Main email sending logic
│   └── emailTemplate.js     # EDIT THIS for customization
├── server.js                # Express server
├── .env.email               # SMTP credentials (DO NOT COMMIT)
└── src/components/admin/
    └── OrdersTab.tsx        # Admin panel UI
```

---

## 🐛 Troubleshooting

### Email not sending?
- Check server logs: `node server.js` output
- Verify SMTP credentials in `.env.email`
- Test SMTP connection: `telnet smtp.hostinger.com 465`

### Wrong domain links?
- Edit `websiteUrl` in `api/emailTemplate.js`
- Should be `https://freelit.in`

### Template not updating?
- Restart server after editing `emailTemplate.js`
- Hard refresh browser (Ctrl+Shift+R)

---

## 📞 Support

If you need help:
- Email: care@freelit.in
- Check Hostinger docs: https://support.hostinger.com/en/articles/1583288-how-to-set-up-smtp
