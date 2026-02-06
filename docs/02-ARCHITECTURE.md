# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client (Browser)                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ React 19 App (Next.js 16 App Router)                    │   │
│  │ - Authentication Context Provider                       │   │
│  │ - Dashboard UI & POS Interface                          │   │
│  │ - Real-time Analytics & Charts                          │   │
│  │ - Form Validation (React Hook Form + Zod)              │   │
│  └──────────────────────────────────────────────────────────┘   │
│              ↕ JWT Authentication + Fetch                       │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│            Vercel Edge / Serverless Functions                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Next.js Route Handlers (API Layer)                       │   │
│  │ - Authentication endpoints (register, login)             │   │
│  │ - CRUD endpoints (invoices, customers, products)         │   │
│  │ - GST calculation and compliance                         │   │
│  │ - Report generation (GSTR-1, GSTR-3B)                   │   │
│  │ - Inventory management                                   │   │
│  │ - E-invoice generation                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│              ↕ Connection Pooling                                │
└─────────────────────────────────────────────────────────────────┘
                              ↕ MongoDB Protocol
┌─────────────────────────────────────────────────────────────────┐
│                   MongoDB Database                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Collections:                                             │   │
│  │ - tenants (Business information)                         │   │
│  │ - users (User accounts & roles)                          │   │
│  │ - invoices (Invoice records)                             │   │
│  │ - customers (Customer database)                          │   │
│  │ - products (Product catalog)                             │   │
│  │ - stockledgers (Inventory tracking)                      │   │
│  │ - payments (Payment records)                             │   │
│  │ - auditlogs (Compliance audit trail)                     │   │
│  │ - ledgerentries (Accounting records)                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Layer-by-Layer Design

### 1. Presentation Layer (Frontend)

**File Location:** `/app` and `/components`

**Responsibility:** User interface and user experience

**Key Components:**
- **Authentication Pages** (`/app/(auth)/`)
  - Login form with email/password validation
  - Registration form with business details
  - JWT token storage in localStorage

- **Dashboard** (`/app/dashboard/`)
  - Protected routes with auth check
  - Sidebar navigation
  - Role-based UI rendering

- **Feature Pages**
  - Invoices: Create, list, view, edit
  - Customers: Manage customer database
  - Products: Inventory and HSN/SAC codes
  - Payments: Track received/pending payments
  - Reports: GSTR-1, GSTR-3B compliance
  - POS: Point of sale interface
  - Settings: Business configuration

**State Management:**
- React Context for global auth state
- SWR for server-side caching and synchronization
- React Hook Form for complex form handling
- Zod for runtime validation

### 2. API Layer (Backend)

**File Location:** `/app/api`

**Responsibility:** Business logic, data processing, external integrations

**Route Structure:**
```
/api/
├── auth/
│   ├── login          (POST) - User authentication
│   └── register       (POST) - New business registration
├── invoices/
│   ├── route          (GET, POST) - List & create invoices
│   ├── create/        (POST) - Detailed invoice creation
│   └── list/          (GET) - List with filters
├── customers/
│   └── route          (GET, POST) - Customer CRUD
├── products/
│   └── route          (GET, POST) - Product CRUD
├── inventory/
│   ├── stock/         (GET) - Stock levels
│   └── adjust/        (POST) - Stock adjustments
├── payments/
│   ├── record/        (POST) - Record payment
│   └── list/          (GET) - Payment history
├── reports/
│   ├── gstr1/         (GET) - GSTR-1 generation
│   └── gstr-filing/   (POST) - GSTR filing submission
└── einvoice/
    └── generate/      (POST) - E-invoice generation
```

**Common Pattern:**
1. Verify JWT token from Authorization header
2. Extract tenantId and userId from token
3. Connect to MongoDB (with connection pooling)
4. Validate input with TypeScript types
5. Perform business logic calculations
6. Write to database with tenant isolation
7. Return result with error handling

### 3. Business Logic Layer

**File Location:** `/lib/services` and `/lib`

**Responsibility:** Complex calculations and transformations

**Key Services:**
- **GST Service** (`/lib/services/gst-service.ts`)
  - GSTR-1 report generation
  - Tax summary calculations
  - Place of supply logic

- **Inventory Service** (`/lib/services/inventory-service.ts`)
  - Stock level calculations
  - Batch tracking
  - Expiry monitoring

- **Accounting Service** (`/lib/services/accounting-service.ts`)
  - Ledger entry creation
  - Financial summaries
  - GL posting

- **GST Engine** (`/lib/gst-engine.ts`)
  - Core tax calculations
  - CGST/SGST/IGST determination
  - Compliance flag generation

### 4. Data Access Layer

**File Location:** `/lib/models.ts`

**Responsibility:** Database schema and ORM

**Pattern:**
- Mongoose schemas for all data models
- Proper indexing for query performance
- Unique constraints for business logic
- Timestamps for audit trails
- Tenant isolation at model level

### 5. Authentication & Security Layer

**File Location:** `/lib/auth-context.tsx` and `/lib/auth-utils.ts`

**Responsibility:** User authentication and authorization

**Flow:**
1. **Registration**
   - Validate business details
   - Hash password with bcryptjs
   - Create Tenant and User
   - Generate JWT token
   - Return token + user data

2. **Login**
   - Find user by email
   - Compare password with hash
   - Generate JWT token (24h expiry)
   - Return token + user + tenant data

3. **Authorization**
   - Verify JWT on every API request
   - Extract tenantId and userId
   - Enforce multi-tenant isolation
   - Check role-based permissions

## Data Flow Examples

### Invoice Creation Flow

```
User submits invoice form
    ↓
Client validates with Zod schema
    ↓
POST /api/invoices/create
    ↓
Backend verifies JWT token
    ↓
connectDB() - get MongoDB connection
    ↓
Extract line items, calculate subtotal
    ↓
calculateInvoiceTax() - GST Engine
    ↓
Validate customer, products exist
    ↓
Create Invoice record in DB
    ↓
Create AuditLog record
    ↓
Return Invoice with GST breakdown
    ↓
Client updates UI with response
    ↓
SWR revalidates invoice list
```

### GST Report Generation Flow

```
User requests GSTR-1 report for period
    ↓
GET /api/reports/gstr1?period=FY2024
    ↓
Backend verifies JWT, gets tenantId
    ↓
Query all invoices for tenant in period
    ↓
generateGSTR1Summary() - calculate
    ↓
Categorize by:
  - B2B (with GSTIN)
  - B2C (no GSTIN)
  - Exports
  - Exempts
    ↓
Aggregate tax amounts
    ↓
Return structured GSTR-1 data
    ↓
Client renders in UI or exports to PDF
```

## Key Architectural Decisions

### 1. Multi-Tenancy Design
- **Tenant isolation at database level**: Every collection has tenantId
- **Enforced in API routes**: All queries filter by tenantId
- **No cross-tenant data leakage**: JWT contains tenantId for verification

### 2. Stateless API
- **JWT-based authentication**: No server sessions needed
- **Scalable on Vercel**: Each request is independent
- **Can be cached**: Responses are deterministic

### 3. Connection Pooling
- **MongoDB connection cached**: Reused across serverless requests
- **Single connection per Node process**: Prevents connection exhaustion
- **Graceful error handling**: Falls back if connection fails

### 4. Real-time Capabilities
- **IndexedDB for offline**: POS system works without network
- **SyncEngine for data sync**: Automatic server sync when online
- **Conflict resolution**: Server-side wins on conflicts

### 5. Type Safety
- **TypeScript everywhere**: Frontend, backend, shared types
- **Zod for runtime validation**: Catches data inconsistencies
- **Mongoose schemas**: Enforce structure at database level

## Extension Points

### Adding a New Feature

1. **Database**: Add schema in `/lib/models.ts`
2. **API**: Create route handler in `/app/api/feature/route.ts`
3. **Service**: Add business logic in `/lib/services/feature-service.ts`
4. **Frontend**: Add component in `/components/feature/`
5. **Page**: Add page in `/app/dashboard/feature/page.tsx`
6. **Documentation**: Update `/docs/`

### Adding a New Report Type

1. Add interface in `/lib/services/reports.ts`
2. Add generation function
3. Export from `/lib/services/index.ts`
4. Create API endpoint in `/app/api/reports/new-report/route.ts`
5. Create UI component
6. Add to dashboard navigation

## Performance Considerations

### Database Queries
- Indexed fields: tenantId, email, invoiceNumber, createdAt
- Use `.lean()` for read-only queries
- Batch operations where possible
- Pagination for large result sets

### API Response Times
- Cached connections reduce latency
- Vercel edge functions for global distribution
- Response compression enabled by default

### Frontend Rendering
- Code splitting at route level
- Lazy load heavy components (charts, modals)
- SWR deduplication prevents duplicate requests
- Tailwind CSS minification reduces CSS size
