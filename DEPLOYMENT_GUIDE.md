# 🚀 Deployment Guide

## ✅ Pre-Deployment Checklist

- [x] COD Checkout working
- [x] Database functions deployed (DEPLOY_ALL_CHECKOUT_FUNCTIONS.sql)
- [x] Edge functions deployed (phonepe-initiate, phonepe-check-status, phonepe-webhook)
- [x] .env file in .gitignore
- [ ] PhonePe credentials updated (needed for online payment)
- [ ] Production domain configured

---

## 📦 Step 1: Commit to Git

```bash
cd "d:\New folder (2)\newfit2"

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Production ready: COD checkout working, PhonePe edge functions deployed"

# Create GitHub repo and push
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

---

## ☁️ Step 2: Deploy to Vercel (Recommended)

### Option A: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? newfit2 (or your name)
# - Directory? ./
# - Build command? npm run build
# - Output directory? dist
```

### Option B: Via Vercel Dashboard

1. Go to: https://vercel.com/new
2. Import your GitHub repository
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. **Add Environment Variables:**
   - `VITE_SUPABASE_URL` = `https://oikibnfnhauymhfpxiwi.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pa2libmZuaGF1eW1oZnB4aXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODk5NTgsImV4cCI6MjA4NzM2NTk1OH0.pJMkTdAqKMtkcB34iHSvXCSs-D3t2jHsofvqAPDkNYU`
7. Click **Deploy**

---

## 🌐 Step 3: Alternative Platforms

### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod

# Build directory: dist
```

### Cloudflare Pages
1. Go to: https://dash.cloudflare.com/
2. Pages → Create a project
3. Connect GitHub repo
4. Build command: `npm run build`
5. Build output: `dist`

---

## 🔧 Step 4: Post-Deployment Configuration

### Update CORS for Production Domain

After deployment, update PhonePe edge function CORS to allow your production domain:

**File:** `supabase/functions/phonepe-initiate/index.ts`

Change:
```typescript
'Access-Control-Allow-Origin': '*'
```

To:
```typescript
'Access-Control-Allow-Origin': 'https://yourdomain.com'
```

Redeploy functions:
```bash
supabase functions deploy phonepe-initiate --no-verify-jwt
supabase functions deploy phonepe-check-status --no-verify-jwt
supabase functions deploy phonepe-webhook --no-verify-jwt
```

---

## 🔐 Environment Variables for Production

Your hosting platform needs these environment variables:

```env
VITE_SUPABASE_URL=https://oikibnfnhauymhfpxiwi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pa2libmZuaGF1eW1oZnB4aXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODk5NTgsImV4cCI6MjA4NzM2NTk1OH0.pJMkTdAqKMtkcB34iHSvXCSs-D3t2jHsofvqAPDkNYU
```

**DO NOT commit these to git!** Add them in your hosting dashboard.

---

## 🧪 Step 5: Test Production Deployment

After deployment:

1. ✅ **Test COD Checkout:**
   - Add products to cart
   - Fill checkout form
   - Select "Cash on Delivery"
   - Place order
   - Should redirect to thank you page

2. ⚠️ **Test Online Payment (if PhonePe credentials valid):**
   - Same steps but select "Online Payment"
   - Should redirect to PhonePe

3. ✅ **Test Admin Dashboard:**
   - Login as admin
   - Check orders appear
   - Verify analytics

---

## 📊 What Works in Production

| Feature | Status | Notes |
|---------|--------|-------|
| Product Catalog | ✅ Working | All products visible |
| Shopping Cart | ✅ Working | LocalStorage based |
| User Auth | ✅ Working | Supabase auth |
| COD Checkout | ✅ Working | Database functions deployed |
| Online Payment | ⚠️ Needs PhonePe | Edge functions ready, need valid credentials |
| Admin Dashboard | ✅ Working | All features functional |
| Order Management | ✅ Working | Full CRUD operations |

---

## 🔄 Continuous Deployment

### Auto-deploy on Git Push

**Vercel/Netlify:**
- Automatically deploys on every push to `main` branch
- Preview deployments for pull requests

**To Update:**
```bash
git add .
git commit -m "Your update message"
git push
```

Site auto-updates in ~2 minutes!

---

## 🆘 Troubleshooting Production Issues

### Issue: "Vite environment variables not found"
**Fix:** Make sure variables start with `VITE_` prefix

### Issue: "Supabase connection failed"
**Fix:** Check environment variables in hosting dashboard

### Issue: "PhonePe payment not working"
**Fix:** 
1. Get new PhonePe credentials
2. Update in Supabase Dashboard → Functions → Secrets
3. Your domain must be registered with PhonePe

### Issue: "Admin functions not working"
**Fix:** Verify service role key is NOT exposed (it's in .env which is ignored)

---

## 📞 Production Support Checklist

- Database: Supabase (already configured)
- Edge Functions: Deployed to Supabase
- Frontend: Deploy to Vercel/Netlify
- Domain: Add custom domain in hosting dashboard
- SSL: Automatically handled by hosting platform

---

## 🎉 Launch Checklist

Before going live:

- [ ] Test all checkout flows (COD + Online)
- [ ] Verify admin dashboard access
- [ ] Check email notifications (if configured)
- [ ] Test on mobile devices
- [ ] Verify payment gateway (PhonePe) integration
- [ ] Set up monitoring/analytics
- [ ] Configure custom domain
- [ ] Update PhonePe with production URLs

---

**Ready to deploy? Run the commands above!**
