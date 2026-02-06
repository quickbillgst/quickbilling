# Quick Reference Guide

Fast lookup for common patterns and commands.

## Environment Setup

```bash
# Generate JWT Secret
openssl rand -base64 32

# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Production server
npm start
```

## Environment Variables

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=<32-byte-base64-string>
NODE_ENV=production
VERCEL_ENV=production
```

## API Endpoints (Quick Reference)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/register` | Register new business |
| POST | `/auth/login` | Login user |
| GET | `/invoices/list` | List invoices |
| POST | `/invoices/create` | Create invoice |
| GET | `/customers` | List customers |
| POST | `/customers` | Create customer |
| GET | `/products` | List products |
| POST | `/products` | Create product |
| GET | `/inventory/stock` | Stock levels |
| POST | `/inventory/adjust` | Adjust stock |
| POST | `/payments/record` | Record payment |
| GET | `/payments/list` | List payments |
| GET | `/reports/gstr1` | GSTR-1 report |
| POST | `/einvoice/generate` | Generate e-invoice |

## Code Snippets

### Authentication

```typescript
// Login
const res = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})
const { data: { token } } = await res.json()

// Use token in requests
fetch('/api/invoices/list', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

### Create Form Component

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  amount: z.number().positive()
})

export function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      <button type="submit">Submit</button>
    </form>
  )
}
```

### Fetch Data with SWR

```typescript
import useSWR from 'swr'

function InvoiceList() {
  const { data, error, isLoading } = useSWR(
    '/api/invoices/list',
    (url) => fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json())
  )

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <ul>
      {data.map(invoice => (
        <li key={invoice.id}>{invoice.invoiceNumber}</li>
      ))}
    </ul>
  )
}
```

### Create API Endpoint

```typescript
// /app/api/feature/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/models'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Verify JWT
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      tenantId: string
      userId: string
    }

    // Process request
    const body = await request.json()

    // Return response
    return NextResponse.json(
      { success: true, data: result },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Request failed', details: message },
      { status: 500 }
    )
  }
}
```

### Add MongoDB Model

```typescript
// In /lib/models.ts, add before exports:

const featureSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: String,
    value: Number,
    createdAt: Date,
  },
  { timestamps: true }
)

// Export before other exports
export const Feature =
  mongoose.models.Feature || mongoose.model('Feature', featureSchema)
```

### Tax Calculation

```typescript
// CGST/SGST (Intra-state)
const taxRate = 18 // 18% for example
const baseAmount = 1000
const sgst = (baseAmount * taxRate) / 200  // Half of total
const cgst = (baseAmount * taxRate) / 200  // Half of total
const total = baseAmount + sgst + cgst

// IGST (Inter-state)
const igst = (baseAmount * taxRate) / 100  // Full amount
const totalIgst = baseAmount + igst
```

## Common Commands

### Git
```bash
# Commit changes
git add .
git commit -m "Description of changes"
git push origin main

# Revert recent changes
git revert HEAD
git push origin main
```

### MongoDB
```bash
# Connect to MongoDB Atlas
mongosh "mongodb+srv://user:pass@cluster..."

# List databases
show dbs

# Switch database
use gst-billing

# Show collections
show collections

# Count documents
db.invoices.countDocuments()

# Find document
db.invoices.findOne({ invoiceNumber: "INV-2024-00001" })

# Update document
db.invoices.updateOne(
  { _id: ObjectId("...") },
  { $set: { paymentStatus: "paid" } }
)
```

### npm/Node
```bash
# Install dependencies
npm install

# Install specific package
npm install package-name

# Update all packages
npm update

# Check for vulnerabilities
npm audit

# Run linter
npm run lint

# Build
npm run build

# Start
npm start
```

## Debugging

### Browser Console
```javascript
// Check authentication
const auth = JSON.parse(localStorage.getItem('auth'))
console.log(auth.token)
console.log(auth.user)

// Decode JWT
const parts = auth.token.split('.')
const decoded = JSON.parse(atob(parts[1]))
console.log(decoded)

// API request
fetch('/api/invoices/list', {
  headers: { 'Authorization': `Bearer ${auth.token}` }
})
.then(r => r.json())
.then(d => console.log(d))
```

### Check Network
1. Open DevTools (F12)
2. Network tab
3. Make action
4. Click request
5. Check Headers and Response

## File Locations

| File | Purpose |
|------|---------|
| `/lib/models.ts` | Database schemas |
| `/lib/auth-context.tsx` | Authentication state |
| `/lib/gst-engine.ts` | GST calculations |
| `/app/api/**/*.ts` | API endpoints |
| `/app/dashboard/**/*.tsx` | Dashboard pages |
| `/components/**/*.tsx` | React components |
| `/public/` | Static files |
| `.env.local` | Environment variables |

## Schema Field Names

**Always use these field names for consistency:**

| Entity | Fields |
|--------|--------|
| Tenant | businessName, gstin, pan, status |
| User | email, passwordHash, role, isActive |
| Invoice | invoiceNumber, invoiceDate, dueDate, totalAmount |
| Customer | name, email, gstin, address |
| Product | name, sku, hsnCode, taxRate |
| Payment | amount, paymentMethod, paymentDate |

## Status/Enum Values

```typescript
// User Roles
type Role = 'owner' | 'manager' | 'accountant' | 'pos_operator' | 'viewer'

// Invoice Status
type InvoiceStatus = 'draft' | 'final' | 'cancelled'
type PaymentStatus = 'unpaid' | 'partial' | 'paid'

// Tenant Status
type TenantStatus = 'trial' | 'active' | 'suspended'

// Payment Methods
type PaymentMethod = 'cash' | 'check' | 'bank_transfer' | 'upi' | 'card'

// GST Registration
type RegistrationType = 'registered' | 'unregistered' | 'sez' | 'uin'

// Transaction Type
type TransactionType = 'purchase' | 'sale' | 'adjustment' | 'waste'
```

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Request completed |
| 400 | Bad Request | Check input validation |
| 401 | Unauthorized | Login required |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate data |
| 500 | Server Error | Check logs |

## Common Errors & Fixes

| Error | Solution |
|-------|----------|
| "MongoDB connection failed" | Check MONGODB_URI |
| "JWT_SECRET not set" | Add JWT_SECRET to env |
| "Invalid credentials" | Check email/password |
| "Unauthorized" | Include Authorization header |
| "Email already exists" | Use different email |
| "Cannot read property X" | Check null/undefined |

## Performance Tips

1. **Database:** Use indexes on frequently queried fields
2. **API:** Return only needed fields (lean queries)
3. **Frontend:** Use SWR for caching and deduplication
4. **Images:** Optimize and use next/image
5. **CSS:** Tailwind purges unused styles automatically
6. **Bundles:** Code split at route level

## Security Best Practices

1. ✅ Always hash passwords (bcryptjs)
2. ✅ Use JWT with expiration (24h)
3. ✅ Validate all inputs (Zod)
4. ✅ Enforce tenantId filters
5. ✅ Use HTTPS only
6. ✅ Never log sensitive data
7. ✅ Check user permissions
8. ✅ Rate limit API (TODO)

## Deployment Checklist

- [ ] JWT_SECRET set in Vercel
- [ ] MONGODB_URI set in Vercel
- [ ] NODE_ENV = production
- [ ] npm run build succeeds
- [ ] No console errors in browser
- [ ] Login works
- [ ] Create invoice works
- [ ] GSTR reports work
- [ ] Check Vercel logs for errors
- [ ] Test on production URL

## Getting Documentation

| Question | See Doc |
|----------|---------|
| How do I set up? | [06-SETUP-DEPLOYMENT.md](./06-SETUP-DEPLOYMENT.md) |
| How does it work? | [02-ARCHITECTURE.md](./02-ARCHITECTURE.md) |
| What are the APIs? | [04-API-REFERENCE.md](./04-API-REFERENCE.md) |
| Database structure? | [03-DATABASE-SCHEMA.md](./03-DATABASE-SCHEMA.md) |
| How to build UI? | [05-COMPONENT-GUIDE.md](./05-COMPONENT-GUIDE.md) |
| Something broken? | [07-TROUBLESHOOTING.md](./07-TROUBLESHOOTING.md) |
| What is this project? | [01-PROJECT-OVERVIEW.md](./01-PROJECT-OVERVIEW.md) |

---

**Pro Tip:** Bookmark this page! It has all the quick answers.
