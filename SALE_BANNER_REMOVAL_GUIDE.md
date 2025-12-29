# Sale Banner Removal Guide

## Quick Removal Instructions

When the Year-End Sale ends (after December 30th), follow these simple steps to remove the banner:

### Option 1: Comment Out (Recommended for temporary removal)

Open `src/App.tsx` and comment out the SaleBanner line:

```tsx
<Header />
{/* <SaleBanner /> */}
<BackButton />
```

### Option 2: Delete Completely

1. **Remove from App.tsx:**
   - Open `src/App.tsx`
   - Delete the import line: `import SaleBanner from "@/components/SaleBanner";`
   - Delete the component line: `<SaleBanner />`

2. **Delete the component file (optional):**
   - Delete `src/components/SaleBanner.tsx`

## Banner Details

- **Location:** Appears globally on all pages, right below the header
- **Animation:** Continuous right-to-left scrolling
- **Text:** "YEAR END SALE IS LIVE - 26% OFF ON CHOCO NUT PROTEIN BAR (ONLY ON 29TH & 30TH DEC)"
- **Colors:** 
  - Background: #b5edce (mint green)
  - Text: #3b2a20 (dark brown)
- **Font:** Poppins Extra Bold

## To Re-enable Later

Simply uncomment the line in `src/App.tsx` or re-add the component.

## Customization

To change the banner text or styling, edit `src/components/SaleBanner.tsx`:
- Update the text in the `<span>` element
- Modify colors in the className attributes
- Adjust animation speed by changing `30s` in the animation property
