# Know Your Food Links Fix & Adaptable Config

## Issue Fixed: Links Not Showing on KYF Page

**Root Cause**: The KnowYourFood page had hardcoded subsection IDs in two separate arrays that didn't match the dynamically fetched links.

**Solution Implemented**:
1. Created centralized config file at `src/config/kyfSections.ts`
2. Updated KnowYourFood.tsx to use `getKYFLinksForSection()` (which returns all links for a section)
3. Links are now grouped by subsectionId dynamically
4. Updated KnowYourFoodTab.tsx to import from the shared config

## How Links Now Display

1. **Admin creates a link** with:
   - sectionId: "how-to-read" 
   - subsectionId: "nutrition"
   - title: "Learn about nutrition labels"
   - url: "https://..."

2. **KYF Page fetches links**:
   - Calls `getKYFLinksForSection("how-to-read")`
   - Returns all links from that section
   - Groups by subsectionId: `kyfLinks["nutrition"] = [link1, link2]`

3. **Links display** in the subsection when expanded:
   ```
   Nutrition Information ▼
   - All the points about nutrition
   
   Learn more:
   → Learn about nutrition labels
   ```

## How to Add New KYF Subsections (Highly Adaptable)

To add new subsections, **only update one file**: `src/config/kyfSections.ts`

### Example: Adding new subsections

```typescript
// In src/config/kyfSections.ts

const KYF_SECTIONS: KYFSection[] = [
  {
    id: "how-to-read",
    name: "HOW TO READ A FOOD PACK",
    subsections: [
      { id: "nutrition", name: "Nutrition Information" },
      { id: "ingredients", name: "Ingredients List" },
      { id: "claims", name: "Claims" },
      { id: "allergen", name: "Allergen Information" },
      // ADD NEW SUBSECTIONS HERE:
      { id: "expiry-date", name: "Expiry Date Guidelines" },
      { id: "storage", name: "Storage Instructions" },
    ],
  },
  // ... other sections
];
```

That's it! The changes will automatically propagate to:
- ✅ Admin panel (shows new subsections in tabs)
- ✅ KYF page (fetches and displays links for new subsections)
- ✅ Link fetching (dynamically gets all subsection IDs)

## Files Changed

1. **NEW**: `src/config/kyfSections.ts` - Centralized configuration
2. **UPDATED**: `src/components/admin/KnowYourFoodTab.tsx` - Uses config instead of hardcoded array
3. **UPDATED**: `src/pages/KnowYourFood.tsx` - Uses `getKYFLinksForSection()` and dynamic config

## Testing the Fix

1. Go to Admin Panel → Know Your Food
2. Select a section (e.g., "HOW TO READ A FOOD PACK")
3. Select a subsection (e.g., "Nutrition Information")
4. Add a link with title and URL
5. Go to the public KYF page
6. Expand "Nutrition Information"
7. ✅ Link should now appear in "Learn more:" section

## Benefits

- **Centralized**: Single source of truth for all KYF sections/subsections
- **Scalable**: Add, remove, or rename subsections in one place
- **Adaptive**: Both admin and public pages automatically reflect changes
- **Type-safe**: TypeScript interfaces ensure consistency
- **DRY**: No more duplicated section definitions across files
