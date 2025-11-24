# 📧 Email Template Customization - Quick Reference

## 🎨 Change Colors, Text, Domain

**File to edit:** `api/emailTemplate.js` (lines 1-27)

```javascript
export const emailConfig = {
  // STORE INFO
  storeName: 'FREEL IT',                    // Shows in header & footer
  storeEmail: 'care@freelit.in',            // Support email
  websiteUrl: 'https://freelit.in',         // All "Visit Store" links
  supportEmail: 'care@freelit.in',          // Footer support contact
  
  // BRAND COLORS
  colors: {
    primary: '#5e4338',      // Header background, buttons
    secondary: '#3b2a20',    // Header gradient end
    accent: '#b5edce',       // Border highlights (mint)
    success: '#4caf50',      // Success messages
    warning: '#ffd700',      // COD notice background
  },
  
  // EMAIL SUBJECT
  subjectTemplate: 'Order Confirmed - #{orderId}',  // Email subject line
  
  // SENDER NAME
  fromName: 'Freelit Order Confirmation',  // Shows as sender in inbox
};
```

## ✏️ What Each Field Does

| Field | Example | Where it shows |
|-------|---------|----------------|
| `storeName` | FREEL IT | Email header, footer, body text |
| `websiteUrl` | https://freelit.in | "Visit Our Store" button, footer links |
| `supportEmail` | care@freelit.in | Footer "Contact Support" link |
| `colors.primary` | #5e4338 (brown) | Header background, buttons, headings |
| `colors.accent` | #b5edce (mint) | Order details box border |
| `colors.warning` | #ffd700 (gold) | COD payment notice |
| `subjectTemplate` | Order Confirmed - #{orderId} | Email subject in inbox |
| `fromName` | Freelit Order Confirmation | Sender name in inbox |

## 🔄 After Editing

1. Save `api/emailTemplate.js`
2. Restart server: `node server.js`
3. Test by sending confirmation email from admin panel

## 🌐 Production Domain Setup

Your domain is already configured correctly:
- ✅ **Admin API**: `https://freelit.in/api/send-email`
- ✅ **Email links**: `https://freelit.in`
- ✅ **From email**: `care@freelit.in`

**When you push to production:**
- Deploy email server to freelit.in (see EMAIL_SETUP_GUIDE.md)
- Server must respond at: `https://freelit.in/api/send-email`

## 🚀 Quick Deploy Options

### Vercel (Easiest)
```powershell
npm install -g vercel
vercel --prod
```
Add domain `freelit.in` in Vercel dashboard.

### PM2 (VPS)
```bash
pm2 start server.js --name email-api
```
Configure nginx reverse proxy.

## 🔐 Important

- Never commit `.env.email` (already in .gitignore)
- Store SMTP credentials as environment variables
- Production server needs: `SMTP_USER`, `SMTP_PASS`, `PORT`

---

**Need more details?** → See `EMAIL_SETUP_GUIDE.md`
