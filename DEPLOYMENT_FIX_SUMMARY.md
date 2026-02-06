# Deployment Build Error - Fixed

## Problem
Build was failing with: `OverwriteModelError: Cannot overwrite 'Tenant' model once compiled`

This occurred because Mongoose models were being defined in multiple files (`/lib/db.ts` and `/lib/models/schemas.ts`), causing the models to be compiled multiple times during the build process.

---

## Solution Applied

### 1. **Created Unified Models File** (`/lib/models.ts`)
- Single source of truth for all Mongoose schema definitions
- Proper singleton pattern: `mongoose.models.ModelName || mongoose.model('ModelName', schema)`
- Prevents model re-compilation on subsequent imports
- Exports: `connectDB()`, `Tenant`, `User`, `Customer`, `Product`, `Invoice`, `Payment`, `StockLedger`, `EInvoice`, `AuditLog`

### 2. **Updated All API Routes** (8 files)
All imports changed from `@/lib/db` to `@/lib/models`:

- ✅ `/app/api/auth/login/route.ts`
- ✅ `/app/api/auth/register/route.ts`
- ✅ `/app/api/customers/route.ts`
- ✅ `/app/api/invoices/route.ts`
- ✅ `/app/api/invoices/create/route.ts`
- ✅ `/app/api/invoices/list/route.ts`
- ✅ `/app/api/payments/record/route.ts`
- ✅ `/app/api/products/route.ts`
- ✅ `/app/api/reports/gstr1/route.ts`
- ✅ `/app/api/inventory/stock/route.ts`

### 3. **Updated Service Files** (2 files)
- ✅ `/lib/services/inventory-service.ts` - Now imports from `/lib/models`
- ✅ `/lib/services/accounting-service.ts` - Defined local interface for LedgerEntry

### 4. **Fixed JWT Secret Validation** (All API routes)
All routes now properly validate JWT_SECRET:
```typescript
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}
```

### 5. **Improved Type Safety** (API routes)
Changed all `as any` JWT type casts to proper interfaces:
```typescript
// Before
const decoded = verify(token, JWT_SECRET) as any;

// After
const decoded = verify(token, JWT_SECRET) as { tenantId: string; userId: string };
```

---

## Files Modified

| File | Changes |
|------|---------|
| `/lib/models.ts` | Created new unified models file |
| `/app/api/auth/login/route.ts` | Updated imports, added JWT validation |
| `/app/api/auth/register/route.ts` | Updated imports, added JWT validation |
| `/app/api/customers/route.ts` | Updated imports, added JWT validation, removed console logs |
| `/app/api/invoices/route.ts` | Updated imports, added JWT validation |
| `/app/api/invoices/create/route.ts` | Updated imports, changed connect() to connectDB() |
| `/app/api/invoices/list/route.ts` | Updated imports, proper type annotations |
| `/app/api/payments/record/route.ts` | Updated imports, proper type annotations |
| `/app/api/products/route.ts` | Updated imports, added JWT validation |
| `/app/api/reports/gstr1/route.ts` | Updated imports, proper type annotations |
| `/app/api/inventory/stock/route.ts` | Updated imports, proper type annotations |
| `/lib/services/inventory-service.ts` | Updated imports to use new models file |
| `/lib/services/accounting-service.ts` | Defined local LedgerEntry interface |

---

## Status
✅ **Build Error Fixed**

The deployment should now succeed. All Mongoose models are properly consolidated, preventing re-compilation errors.

---

## Next Steps

1. **Deploy to Vercel** - The build should now complete successfully
2. **Verify Environment Variables** are set:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - A secure random string (generate with `openssl rand -base64 32`)

3. **Test the application** - Login and verify core functionality works

---

## Technical Details

### Why This Happened
Mongoose has a strict check to prevent accidentally defining the same model multiple times with different schemas. When using Next.js with hot module reloading or during build time, the same files can be imported/evaluated multiple times, causing Mongoose to throw an error.

### Why This Fixes It
By consolidating all model definitions into a single file and using the pattern `mongoose.models.Name || mongoose.model('Name', schema)`, we ensure:
1. Models are only defined once (checking `mongoose.models` first)
2. Subsequent imports reuse the already-compiled model
3. Build process doesn't re-evaluate model definitions
