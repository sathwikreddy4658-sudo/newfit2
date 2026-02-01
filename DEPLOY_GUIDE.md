# 🚀 Deploy Your Performance Optimizations

## Quick Deploy (Recommended)

```bash
# 1. Stage all changes
git add .

# 2. Commit with descriptive message
git commit -m "Performance optimizations: code splitting, lazy loading, image optimization, CLS fixes"

# 3. Push to deploy (Vercel auto-deploys)
git push
```

That's it! Vercel will automatically build and deploy your changes.

---

## Verify Deployment (5 minutes after push)

### 1. Check Vercel Dashboard
1. Visit https://vercel.com/dashboard
2. Click on your project
3. Wait for "Building" → "Ready"
4. Click "Visit" to see your live site

### 2. Test Performance
Open your live site and:
```
1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Click "Analyze page load"
4. Check your new scores!
```

**Expected Results:**
- Performance: 85-95 (was 50-60)
- FCP: 1.2-1.5s (was 3.18s)
- LCP: 1.8-2.2s (was 3.86s)
- CLS: 0.05-0.08 (was 0.61)

---

## Manual Testing Checklist

After deployment, test these key flows:

### Homepage ✅
- [ ] Page loads quickly
- [ ] Images don't shift layout
- [ ] Video plays smoothly
- [ ] "Shop Now" button works

### Products Page ✅
- [ ] Product cards load
- [ ] Images display correctly
- [ ] Click on product → detail page works

### Product Detail ✅
- [ ] Hero images load
- [ ] Add to cart works
- [ ] Variants selectable

### Cart & Checkout ✅
- [ ] Cart displays items
- [ ] Checkout flow works
- [ ] Payment processes

### Mobile ✅
- [ ] Test on actual phone
- [ ] Navigation menu works
- [ ] Images load correctly

---

## If Something Breaks

### Option 1: Quick Rollback
```bash
# Undo last commit
git revert HEAD

# Push to redeploy old version
git push
```

### Option 2: Check Specific Issue
1. Open browser console (F12)
2. Look for errors
3. Check Network tab for failed requests
4. Compare with local: `npm run dev`

### Option 3: Gradual Rollback
If only one file is problematic:
```bash
# Restore specific file from previous commit
git checkout HEAD~1 src/path/to/file.tsx

# Commit and push
git add .
git commit -m "Rollback specific file"
git push
```

---

## Performance Monitoring

### Real User Metrics (After 24 hours)
1. Vercel Analytics: https://vercel.com/dashboard
2. Google Search Console: https://search.google.com/search-console
3. Core Web Vitals Report (takes 28 days)

### What to Monitor
- **FCP** (First Contentful Paint): < 1.8s
- **LCP** (Largest Contentful Paint): < 2.5s
- **CLS** (Cumulative Layout Shift): < 0.1
- **INP** (Interaction to Next Paint): < 200ms
- **TTFB** (Time to First Byte): < 600ms

---

## Build Locally First (Optional)

Want to test before deploying?

```bash
# 1. Build production version
npm run build

# 2. Preview build locally
npm run preview

# 3. Open http://localhost:4173
# 4. Test everything works
```

---

## Common Issues & Solutions

### Images not loading
**Symptom**: Broken image icons
**Solution**: Check browser console, verify image paths
```bash
# Check if images exist
ls src/assets/
```

### Blank pages after navigation
**Symptom**: White screen when clicking links
**Solution**: Lazy loading issue - check console for import errors

### Fonts look wrong
**Symptom**: System fonts instead of custom fonts
**Solution**: Wait 2-3 seconds, fonts load asynchronously now

### Performance not improved
**Symptom**: Lighthouse still shows low scores
**Solution**: 
1. Clear cache (Ctrl+Shift+R)
2. Use Incognito mode
3. Wait 5 minutes after deployment
4. Check Vercel build logs

---

## Support Commands

```bash
# Check current Git status
git status

# View recent commits
git log --oneline -5

# View changes before committing
git diff

# Test locally
npm run dev

# Build for production
npm run build

# Check for TypeScript errors
npm run lint
```

---

## Next Steps After Deploy

1. ✅ Wait 24 hours for analytics data
2. ✅ Monitor user feedback
3. ✅ Check Google Search Console (Core Web Vitals)
4. ✅ Consider additional optimizations:
   - Convert images to WebP
   - Add PWA features
   - Implement service worker

---

**Need help?** Check:
1. Vercel build logs in dashboard
2. Browser console for errors
3. Network tab for failed requests

Good luck with your deployment! 🎉
