# Firebase Migration Status

## ✅ Completed Migrations

### 1. **Auth.tsx** - User Authentication
- ✅ Sign in with email/password → `loginUser()`
- ✅ Sign up with email/password → `registerUser()`
- ✅ Password reset → `sendPasswordResetEmail()`
- ✅ Update password → `updatePassword()`
- ✅ Session state management → `onUserStateChanged()`
- ✅ Newsletter subscription on signup → `subscribeToNewsletter()`

### 2. **AdminAuth.tsx** - Admin Login
- ✅ Admin sign in → `loginUser()`
- ✅ Admin role verification (ready to implement)
- ✅ Session check → `getCurrentUser()`

### 3. **CartContext.tsx** - Cart Management
- ✅ Get current user → `getCurrentUser()`
- ✅ Verify product stock → `getAllProducts()`
- ✅ Apply promo codes → `getPromoCode()`
- ✅ Combo discount calculations (local logic)

### 4. **Footer.tsx** - Newsletter
- ✅ Newsletter subscription → `subscribeToNewsletter()`

---

## 📋 Remaining Components to Migrate

### High Priority (Core Functionality)
| Component | Supabase Calls | Firebase Equivalent | Status |
|-----------|---|---|---|
| **Checkout.tsx** | `create_order_with_items` RPC, `confirm_cod_order` RPC | `createOrder()`, custom order RPC | 🔴 TODO |
| **AdminLayout.tsx** | `supabase.auth.signOut()` | `signOut(auth)` | 🔴 TODO |
| **ProductDetail.tsx** | `products` table, auth state | `getProduct()`, `getCurrentUser()` | 🔴 TODO |
| **CartContext.tsx** | Remaining auth state listener | Remove old supabase.auth listener | 🟡 PARTIAL |

### Medium Priority (Display/Read)
| Component | Supabase Calls | Firebase Equivalent | Status |
|-----------|---|---|---|
| **ProductFAQ.tsx** | `product_faqs` table | `getProductFAQs(productId)` | 🔴 TODO |
| **ProductLabReports.tsx** | `lab_reports` table | `getProductLabReports(productId)` | 🔴 TODO |
| **Blogs.tsx** | `blogs` table | `getAllBlogs()` | 🔴 TODO |
| **BlogDetail.tsx** | `blogs` table by ID | `getBlog(id)` | 🔴 TODO |
| **LabReports.tsx** | `lab_reports` table | `getAllLabReports()` | 🔴 TODO |
| **Favorites.tsx** | `profiles.favorites` | Update `updateUserProfile()` | 🔴 TODO |

### Low Priority (Admin Functions)
| Component | Supabase Calls | Firebase Equivalent | Status |
|-----------|---|---|---|
| **BlogsTab.tsx** | Insert/Delete `blogs`, upload images | `createBlog()`, `deleteBlog()`, file upload | 🔴 TODO |
| **LabReportsTab.tsx** | Insert/Delete `lab_reports`, upload files | `createLabReport()`, `deleteLabReport()` | 🔴 TODO |
| **ProductFAQManager.tsx** | CRUD `product_faqs` | `createFAQ()`, `updateFAQ()`, `deleteFAQ()` | 🔴 TODO |
| **CustomerRatingsTab.tsx** | Update `product_ratings` | `updateRating()` | 🔴 TODO |
| **OrdersTab.tsx** | Select `orders` | `getUserOrders()` | 🔴 TODO |

### Special Cases
| Component | Issue | Solution |
|-----------|---|---|
| **Checkout.tsx** | Uses `supabase.rpc()` for order creation | Need to convert RPC to Firebase Cloud Function OR refactor to use `createOrder()` |
| **phonepe.ts** | Uses `supabase.functions.invoke()` | PhonePe webhook handling - may need separate backend |
| **API routes** | Various API endpoints using Supabase | Convert to Firebase Functions |

---

## 🚀 Migration Strategy

### Phase 1 (In Progress)
- ✅ Core authentication components
- Next: Checkout flow (critical for business)

### Phase 2  
1. Migrate all product display components
2. Migrate blog/lab report display
3. Migrate order history and tracking

### Phase 3
1. Migrate admin CRUD operations  
2. Migrate file uploads (images, PDFs)
3. Test PhonePe integration with Firebase

### Phase 4
1. Remove Supabase client from dependencies
2. Test entire app with Firebase only
3. Deprecate Supabase project

---

## 📝 Quick Reference - Code Patterns

### Authentication
**Before (Supabase):**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "password"
});
```

**After (Firebase):**
```typescript
import { loginUser } from '@/integrations/firebase/auth';
await loginUser("user@example.com", "password");
```

### Database Reads
**Before (Supabase):**
```typescript
const { data } = await supabase.from('products').select('*');
```

**After (Firebase):**
```typescript
import { getAllProducts } from '@/integrations/firebase/db';
const data = await getAllProducts();
```

### Promo Codes
**Before (Supabase):**
```typescript
const { data } = await supabase.from('promo_codes')
  .select('*')
  .eq('code', code);
```

**After (Firebase):**
```typescript
import { getPromoCode } from '@/integrations/firebase/db';
const data = await getPromoCode(code);
```

---

## 🔧 Next Actions

1. **Migrate Checkout.tsx** - Critical for orders
   - Replace `create_order_with_items` RPC with `createOrder()`
   - Replace `confirm_cod_order` RPC with custom logic

2. **Migrate AdminLayout.tsx** - Simple logout
   ```typescript
   import { signOut } from 'firebase/auth';
   import { auth } from '@/integrations/firebase/client';
   
   await signOut(auth);
   ```

3. **Migrate Product Display Components** - ProductDetail, ProductFAQ, ProductLabReports

4. **Test Everything** - Login → Browse → Cart → Checkout → PhonePe Payment

5. **Remove Supabase** - Once fully migrated and tested

---

## ⚠️ Known Issues to Handle

1. **AdminAuth.tsx** - Still needs `getUserRoles()` function
2. **File Uploads** - Need to implement Firebase Storage uploads in admin components
3. **PhonePe Integration** - Webhook handling may need backend refactoring
4. **RPC Calls** - Checkout.tsx uses custom RPCs that may need Firebase Functions

---

## 📊 Completion Estimate

- **Auth Components**: ~95% done (need role checking in AdminAuth)
- **Display Components**: 0% (but simple - mostly read operations)
- **Admin Components**: 0% (more complex - write operations + file uploads)
- **API/RPC**: 0% (requires backend refactoring)
- **Overall**: ~15% of full migration complete

**Estimated time to full migration**: 3-5 days for one developer

---

## 📞 Support

For each component migration, follow this template:
1. Replace Supabase imports with Firebase imports
2. Replace Supabase calls with Firebase equivalents from `/src/integrations/firebase/`
3. Handle error cases (Firebase errors are different from Supabase)
4. Test the component
5. Remove old Supabase import statement
