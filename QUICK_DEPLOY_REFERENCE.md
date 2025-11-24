# 🚀 Quick Deployment Reference Card

## 📝 Edit Email Template
**File:** `api/emailTemplate.js`
- Change colors: `emailConfig.colors`
- Change store name: `emailConfig.storeName`
- Change subject: `emailConfig.subjectTemplate`
- Edit HTML: `getOrderEmailTemplate` function
- Edit plain text: `getOrderEmailText` function

---

## 🔧 Production URLs Configured

### Frontend (OrdersTab.tsx) ✅
```javascript
localhost: http://localhost:3001/api/send-email
production: https://freelit.in/api/send-email
```

### Email Server Endpoints
- `/api/send-email` - Send order confirmation
- `/api/test-email` - Test with mail-tester
- `/api/health` - Health check

---

## ⚡ Deploy Server Commands

### Hostinger/VPS:
```bash
# Upload files
scp -r server.js api/ .env.email user@freelit.in:~/app/

# Install & start
cd ~/app
npm install nodemailer express cors dotenv
pm2 start server.js --name email-server
pm2 save
```

### Railway.app:
```bash
# Just push to GitHub, Railway auto-deploys
# Add env vars in Railway dashboard
```

---

## 🌐 DNS Records (Add in Hostinger)

```
TXT @ v=spf1 include:_spf.hosting.hostinger.com ~all
TXT _dmarc v=DMARC1; p=none; rua=mailto:care@freelit.in
```
+ Enable DKIM in Hostinger Email settings

---

## ✅ Deployment Checklist

**Backend:**
- [ ] DNS records added (wait 24hrs)
- [ ] Server deployed and running
- [ ] Environment variables set
- [ ] Test `/api/health` endpoint

**Frontend:**
- [ ] `npm run build`
- [ ] Upload `dist/` to hosting
- [ ] Verify production URL in code

**Testing:**
- [ ] Send to mail-tester.com
- [ ] Check spam score (target: 8+)
- [ ] Test with real email

---

## 🐛 Quick Fixes

| Problem | Solution |
|---------|----------|
| Email → spam | Add DNS records, wait 24hrs |
| 404 on /api/send-email | Server not running |
| CORS error | Update CSP in index.html |
| Server crash | Use PM2: `pm2 restart email-server` |

---

## 📞 Test Mail-Tester

1. Create order with email: `test-17hb62vei@srv1.mail-tester.com`
2. Send confirmation from admin
3. Check: https://www.mail-tester.com

---

## 📂 Files to Deploy

**Backend (Server):**
- `server.js`
- `api/send-email.js`
- `api/emailTemplate.js` ⭐ (edit this!)
- `.env.email`

**Frontend (Build):**
- `dist/*` (after `npm run build`)

---

## 🎯 Server Status Check

```bash
# Check if running
curl https://freelit.in/api/health

# View logs
pm2 logs email-server

# Restart
pm2 restart email-server
```

---

**Need help?** See `EMAIL_PRODUCTION_GUIDE.md` for full details!
