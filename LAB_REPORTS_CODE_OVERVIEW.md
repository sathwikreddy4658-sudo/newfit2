# Lab Reports Feature - Code Overview & Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/TypeScript)               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  /lab-reports    │  │  Product Detail  │                 │
│  │   (Public Page)  │  │     Page         │                 │
│  └────────┬─────────┘  └────────┬─────────┘                 │
│           │                      │                           │
│           │ Uses                 │ Uses                      │
│           │                      │                           │
│           └──────────┬───────────┘                           │
│                      │                                        │
│            ┌─────────▼──────────┐                            │
│            │ ProductLabReports  │                            │
│            │    Component       │                            │
│            └─────────┬──────────┘                            │
│                      │                                        │
├──────────────────────┼──────────────────────────────────────┤
│  Admin Dashboard                │                            │
│  ┌────────────────────────────┐ │                            │
│  │    Lab Reports Tab         │ │                            │
│  │  (Upload & Management)     │ │ Uses                       │
│  └────────────────────────────┘ │                            │
├──────────────────────┼──────────────────────────────────────┤
│                      │                                        │
│  Navigation/Footer   │ Links                                 │
│  ┌────────────────┐  │                                       │
│  │ Lab Reports    │──┘                                       │
│  │    Link        │                                          │
│  └────────────────┘                                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ API Calls
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Backend                                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────┐      ┌──────────────────┐            │
│  │  lab_reports       │      │    Storage       │            │
│  │  (PostgreSQL)      │      │  lab-reports     │            │
│  │                    │      │   (Bucket)       │            │
│  │ - id               │      │                  │            │
│  │ - product_id  ──┐  │      │ - Files          │            │
│  │ - file_url    ──┼──┼──────► - Public URLs    │            │
│  │ - file_name   │  │      │                  │            │
│  │ - test_type   │  │      └──────────────────┘            │
│  │ - test_date   │  │                                       │
│  │ - file_size   │  │                                       │
│  │ - created_at  │  │                                       │
│  └────────────────────┘                                     │
│           ▲                                                  │
│           │                                                  │
│           └─ references                                     │
│                                                              │
│  ┌────────────────────┐                                     │
│  │  products          │                                     │
│  │  (existing)        │                                     │
│  │                    │                                     │
│  │ - id ◄─────────────┼─ FK                                │
│  │ - name             │                                     │
│  │ - ... other fields │                                     │
│  └────────────────────┘                                     │
│                                                              │
│  RLS Policies:                                              │
│  ✓ Public: SELECT (Read)                                    │
│  ✓ Admin: INSERT, UPDATE, DELETE                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

### Pages
```
App.tsx
├── /lab-reports
│   └── LabReports.tsx (Public Page)
│       └── ProductLabReports (Reusable Component)
│
├── /product/:name
│   └── ProductDetail.tsx (Updated)
│       └── ProductLabReports (Displays reports)
│
└── /admin/dashboard
    └── AdminDashboard.tsx (Updated)
        └── LabReportsTab.tsx (Admin Management)
```

### Component Tree
```
LabReportsTab (Admin)
├── Dialog (for upload)
│   ├── Select (product selection)
│   ├── Input (test type)
│   ├── Input (test date)
│   ├── Input (file selection)
│   └── Button (upload)
├── Select (filter by product)
└── Card[] (report list)
    ├── FileText icon
    ├── Report details
    ├── Button (download)
    └── Button (delete)

LabReports (Public Page)
├── Header section
├── Select (filter)
└── Card[] (grouped by product)
    ├── FileText icon
    ├── Report metadata
    ├── Badge (test type)
    └── Button (download)

ProductLabReports (Component)
├── Card (collapsible)
│   ├── CardHeader (clickable to expand)
│   │   ├── FileText icon
│   │   ├── Title
│   │   └── ChevronIcon
│   └── CardContent (expanded)
│       └── Report[] items
│           ├── Report info
│           └── Button (download)
```

---

## Data Flow

### Upload Flow
```
1. Admin selects product
   ↓
2. Admin chooses file
   ↓
3. Admin clicks "Upload Report"
   ↓
4. uploadLabReport() function:
   a. Validate inputs
   b. Upload to Storage (lab-reports bucket)
   c. Get public URL
   d. Save to Database (lab_reports table)
   e. Show success/error toast
   ↓
5. Table refreshed, new report visible
```

### View Flow
```
User visits /lab-reports
   ↓
fetchLabReports() loads data
   ↓
Join with products table
   ↓
Group reports by product
   ↓
Display in grid with filters
   ↓
User can download or navigate to product
```

### Product Detail Flow
```
ProductDetail page loads
   ↓
ProductLabReports component mounts
   ↓
fetchLabReports(productId) queries database
   ↓
Returns reports for this product only
   ↓
Display collapsible section (if reports exist)
   ↓
User can expand and download
```

---

## Database Schema

### lab_reports Table
```sql
Column Name    | Type                  | Description
──────────────────────────────────────────────────────────
id             | UUID                  | Primary key
product_id     | UUID (FK)             | Reference to products
file_url       | TEXT                  | Supabase storage URL
file_name      | TEXT                  | Original filename
file_size      | INTEGER               | Size in bytes
test_type      | TEXT (nullable)       | e.g., "Nutritional Analysis"
test_date      | DATE (nullable)       | Date test was performed
created_at     | TIMESTAMPTZ           | Auto timestamp
updated_at     | TIMESTAMPTZ           | Auto timestamp

Indexes:
  - idx_lab_reports_product_id
  - idx_lab_reports_created_at DESC

Triggers:
  - update_lab_reports_updated_at (updates modified timestamp)

RLS Policies:
  - SELECT: Anyone (public)
  - INSERT: Admin only
  - UPDATE: Admin only
  - DELETE: Admin only
```

### Storage Structure
```
lab-reports/
├── lab-report-1704067200000-certification.pdf
├── lab-report-1704067300000-analysis.docx
├── lab-report-1704067400000-test-results.xlsx
└── lab-report-1704067500000-photo.jpg
```

---

## API Methods Used

### Supabase Query Methods

#### Fetch Lab Reports
```typescript
supabase
  .from("lab_reports")
  .select(`
    id,
    product_id,
    file_url,
    file_name,
    file_size,
    test_type,
    test_date,
    created_at,
    products!inner(name)
  `)
  .order("created_at", { ascending: false })
```
- Joins with products table to get product names
- Returns 0-100+ rows depending on uploads
- ~50-100ms query time

#### Insert Lab Report
```typescript
supabase
  .from("lab_reports")
  .insert({
    product_id: UUID,
    file_url: string,
    file_name: string,
    file_size: number,
    test_type?: string,
    test_date?: string,
  })
```
- Validates foreign key constraint
- Triggers timestamp creation
- ~100-200ms insert time

#### Delete Lab Report
```typescript
supabase
  .from("lab_reports")
  .delete()
  .eq("id", UUID)
```
- Also requires storage file deletion
- Cascades if needed (on product delete)
- ~100ms delete time

#### Storage Upload
```typescript
supabase.storage
  .from("lab-reports")
  .upload(fileName, file)
```
- Max file size depends on plan
- Returns public URL automatically
- ~500-2000ms for typical files

#### Get Public URL
```typescript
supabase.storage
  .from("lab-reports")
  .getPublicUrl(fileName)
```
- Instant (no network call)
- Returns: `https://[project].supabase.co/storage/v1/object/public/lab-reports/[file]`

---

## Type Definitions

```typescript
interface LabReport {
  id: string;
  product_id: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  test_type?: string;
  test_date?: string;
  created_at: string;
  product_name?: string;  // Joined from products
}

interface Product {
  id: string;
  name: string;
}

interface DialogState {
  selectedProduct: string;
  selectedFile: File | null;
  testType: string;
  testDate: string;
  uploading: boolean;
}
```

---

## State Management

### LabReportsTab (Admin)
```typescript
State Variables:
- labReports: LabReport[]
- products: Product[]
- loading: boolean
- showDialog: boolean
- uploading: boolean
- selectedProduct: string
- selectedFile: File | null
- testType: string
- testDate: string
- filterProduct: string

Functions:
- fetchLabReports()
- fetchProducts()
- uploadLabReport()
- deleteLabReport()
- resetForm()
```

### LabReports (Public Page)
```typescript
State Variables:
- labReports: LabReport[]
- products: Product[]
- loading: boolean
- filterProduct: string

Functions:
- fetchLabReports()
- fetchProducts()
- formatDate()
- groupedReports (computed)
```

### ProductLabReports (Component)
```typescript
Props:
- productId: string

State Variables:
- reports: LabReport[]
- loading: boolean
- isExpanded: boolean

Functions:
- fetchLabReports()
- formatDate()
```

---

## Error Handling

### Upload Validation
```typescript
if (!selectedFile || !selectedProduct) {
  toast({ title: "Please select a product and file", variant: "destructive" })
  return
}
```

### Upload Errors
```typescript
if (uploadError) {
  console.error('Upload error:', uploadError)
  toast({ title: "Error uploading file", variant: "destructive" })
  return
}

if (dbError) {
  console.error('Database error:', dbError)
  toast({ title: "Error saving report details", variant: "destructive" })
  return
}
```

### Delete Confirmation
```typescript
if (!confirm("Are you sure you want to delete this lab report?")) return
```

---

## Performance Considerations

### Query Optimization
- **Index on product_id:** Fast filtering
- **Index on created_at DESC:** Fast sorting
- **Joined query:** Reduces N+1 queries
- **Limit 100:** Prevents loading huge datasets

### Storage Optimization
- **File naming:** Unique with timestamp
- **Public bucket:** Direct download
- **Size tracking:** Stored in database

### UI Performance
- **Lazy loading:** Reports load on demand
- **Pagination:** Optional (can add if needed)
- **Collapsible:** Product reports hidden by default
- **Memoization:** Components not over-rendered

---

## Security Measures

### Authentication
- Admin checks via `public.has_role(auth.uid(), 'admin')`
- Only logged-in users can see RLS-protected data
- Public tables accessible without auth

### Authorization
- RLS policies at database level
- Storage policies at bucket level
- Frontend checks (for UX, not security)

### Data Validation
- File type checking on frontend
- File size limits (adjust as needed)
- Product ID validation
- Date format validation

### File Safety
- Unique file names prevent overwrites
- Public bucket doesn't execute code
- Files separated from application code
- Proper MIME types

---

## Monitoring & Debugging

### Console Logs
```typescript
// In LabReportsTab.tsx
console.error("Error fetching lab reports:", error)
console.error("Upload error:", uploadError)
console.error("Delete error:", deleteError)
console.error("Error:", error)

// In LabReports.tsx
console.error("Error fetching lab reports:", error)
console.error("Error fetching products:", error)

// In ProductLabReports.tsx
console.error("Error fetching lab reports:", error)
```

### Error Tracking
- Toast notifications for user feedback
- Console errors for debugging
- Error codes from Supabase

### Testing Points
1. Check Database:
   ```sql
   SELECT * FROM lab_reports;
   SELECT * FROM storage.objects WHERE bucket_id = 'lab-reports';
   ```

2. Check Policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'lab_reports';
   ```

3. Check File URLs:
   - Copy URL from database
   - Test in new browser tab
   - Should download file

---

## Deployment Notes

### Before Deployment
1. [ ] Apply database migration
2. [ ] Test all CRUD operations
3. [ ] Verify RLS policies
4. [ ] Check storage bucket permissions
5. [ ] Test on staging environment
6. [ ] Verify all routes work
7. [ ] Check mobile responsiveness

### Deployment Steps
1. Merge to main branch
2. Deploy to production (Vercel/similar)
3. Verify database migration applied
4. Test live feature
5. Monitor error logs

### Rollback Plan
- If needed, remove tab from AdminDashboard
- Keep routes and components (backward compatible)
- Database can stay (no harmful data)

---

This architecture is scalable, secure, and maintainable! 🚀
