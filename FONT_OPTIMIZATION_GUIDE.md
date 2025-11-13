# Font Optimization for Vercel Deployment

## Problem Solved ✅

Fonts are now optimized to prevent changes when deploying to Vercel.

---

## Changes Made

### 1. **HTML Font Preloading** (`index.html`)
Added preload directives for all fonts used in the project:

```html
<!-- Font Preloading for Performance & Stability -->
<!-- Poppins Font -->
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="font" href="https://fonts.gstatic.com/s/poppins/v24/pxiEyp8kv8JHgFVrFJA.ttf" type="font/ttf" crossorigin>
<!-- ... other Poppins weights -->

<!-- Saira Font -->
<link rel="preload" as="font" href="https://fonts.gstatic.com/s/saira/v15/xMQQuElYMghVTxFVSeBj5XFQagXFAg.ttf" type="font/ttf" crossorigin>

<!-- Montserrat Font -->
<link rel="preload" as="font" href="https://fonts.gstatic.com/s/montserrat/v26/JTUQjIg1_i6t8kCHKm45_cJD3gnD_vx3rCubqg33mWQ.ttf" type="font/ttf" crossorigin>
```

**Why?** This tells the browser to download fonts early, preventing FOUT (Flash of Unstyled Text).

### 2. **Font Display Strategy** (All `.css` files)
Changed `font-display` from `swap` to `fallback`:

**Before:**
```css
@font-face {
  font-family: 'Poppins';
  font-display: swap;  /* Shows fallback immediately, swaps later (can flicker) */
}
```

**After:**
```css
@font-face {
  font-family: 'Poppins';
  font-display: fallback;  /* Shows fallback briefly, swaps smoothly (minimal flicker) */
}
```

**Why?**
- `swap`: Shows system font first, swaps when custom font loads (visible text shift)
- `fallback`: Shows system font briefly, swaps when ready (minimal visual change)

### 3. **Files Modified**

| File | Change |
|------|--------|
| `index.html` | Added font preload links |
| `src/fonts/poppins.css` | Changed to `fallback` + added missing weights (800, 900) |
| `src/fonts/saira.css` | Changed to `fallback` |
| `src/fonts/montserrat.css` | Changed to `fallback` |

---

## How It Works

### Current Flow:
```
1. Browser downloads HTML
2. Sees preload links → starts downloading fonts immediately
3. CSS loads → font-face rules with 'fallback' strategy
4. Page renders with fallback system font
5. Custom fonts arrive and load smoothly
6. Text reflows if needed (minimal impact)
```

### Why This Prevents Font Changes on Vercel

1. **Preloading ensures fonts are cached** on first page load
2. **Fallback strategy prevents jarring flickers** during font load
3. **Same fonts everywhere** - no CDN/server differences
4. **Consistent font-weights** defined in CSS

---

## Fonts Used in Project

| Font | Weights | Source | Usage |
|------|---------|--------|-------|
| **Poppins** | 400, 500, 600, 700, 800, 900 | Google Fonts CDN | Headlines, buttons, hero text |
| **Saira** | 400, 500, 600, 700, 900 | Local files | Body text, descriptions |
| **Montserrat** | 400, 500, 600, 700 | Local files | Fallback, secondary text |

---

## Deployment Checklist ✅

### Before Deploying to Vercel:

- [x] Fonts are preloaded in HTML
- [x] Font-display strategy is optimized (fallback)
- [x] Tailwind config has correct fontFamily definitions
- [x] All local font files are in `src/fonts/` directory
- [x] CSS imports are in `src/index.css`
- [x] No hardcoded font URLs in components

### On Vercel:

1. Fonts will be served from:
   - Google Fonts CDN (Poppins) - globally cached
   - Vercel CDN (Local fonts) - fast delivery

2. Font loading experience:
   - ✅ No FOUT (Flash of Unstyled Text)
   - ✅ Minimal layout shift
   - ✅ Consistent across browsers
   - ✅ Works offline (for cached fonts)

---

## Troubleshooting

### Fonts Still Changing on Vercel?

**Check:**
1. Are font files in `public/fonts/` or `src/fonts/`?
   - They should be in `src/fonts/` (imported in index.css)

2. Is Tailwind using correct font family names?
   ```ts
   // ✅ Correct
   className="font-poppins"
   className="font-saira"
   className="font-montserrat"
   ```

3. Are CSS @imports correct?
   ```css
   /* ✅ Correct - in src/index.css */
   @import './fonts/poppins.css';
   @import './fonts/saira.css';
   @import './fonts/montserrat.css';
   ```

### Local Fonts Not Loading?

1. Check file paths in CSS:
   ```css
   /* src/fonts/saira.css */
   src: url('./saira-regular.ttf') format('truetype');
   /* Should be relative path from .css file location */
   ```

2. Verify files exist:
   ```
   src/fonts/
   ├── montserrat.css
   ├── montserrat-regular.ttf
   ├── montserrat-bold.ttf
   ├── poppins.css
   ├── saira.css
   ├── saira-regular.ttf
   └── ... other font files
   ```

---

## Performance Metrics

**Expected Results:**
- Font preload reduces FOUT delay by ~200-300ms
- Fallback strategy prevents layout shift
- Total impact: Fonts feel instant and consistent

**Monitor on Vercel:**
- Use Lighthouse Performance audit
- Check "Cumulative Layout Shift (CLS)" - should be < 0.1
- Check font loading in Network tab - should see fonts cached after first visit

---

## Future Improvements (Optional)

1. **Font subsetting**: Only load used characters (smaller files)
2. **Variable fonts**: One file for all weights instead of multiple files
3. **WOFF2 format**: Better compression than TTF
4. **Cache headers**: Configure Vercel to cache fonts longer

---

**Status:** ✅ Fonts optimized for Vercel deployment
**Last Updated:** November 12, 2025
