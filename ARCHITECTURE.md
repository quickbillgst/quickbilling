# GST Billing Platform - System Architecture

Complete technical architecture documentation for the GST billing system.

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Application Architecture](#application-architecture)
4. [Database Schema](#database-schema)
5. [API Architecture](#api-architecture)
6. [Security Architecture](#security-architecture)
7. [Scalability & Performance](#scalability--performance)
8. [Deployment Architecture](#deployment-architecture)

---

## System Overview

The GST Billing Platform is a multi-tenant SaaS application designed to help Indian businesses manage invoicing, tax calculations, and GST compliance with minimal manual effort.

### Key Components

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Next.js 16 React Application             │   │
│  │  (Dashboard, Forms, Reports, Real-time Updates)  │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP/HTTPS
                     ▼
┌─────────────────────────────────────────────────────────┐
│              API Gateway & Routing                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Next.js Route Handlers (App Router)             │   │
│  │  - Authentication                                │   │
│  │  - Request Validation                            │   │
│  ��  - Rate Limiting                                 │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
    ┌────────┐  ┌────────┐  ┌──────────┐
    │ Cache  │  │Business│  │External  │
    │(Redis) │  │Logic   │  │ APIs     │
    └────────┘  └────────┘  └──────────┘
        │            │            │
        └────────────┼────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │  Data Access Layer      │
        │  (MongoDB Mongoose ORM) │
        └──────────┬──────────────┘
                   │
                   ▼
        ┌─────────────────────────┐
        │ MongoDB Atlas Cluster   │
        │ (Multi-tenant Data)     │
        └─────────────────────────┘
```

---

## Technology Stack

### Frontend
```
next: ^16.0.0              # React framework with SSR/SSG
react: ^19.0.0            # UI library
typescript: ^5.0.0        # Type safety
tailwindcss: ^4.0.0       # Styling
recharts: ^2.10.0         # Charts and graphs
react-hook-form: ^7.48.0  # Form management
zod: ^3.22.0              # Schema validation
sonner: ^1.2.0            # Toast notifications
shadcn/ui: Latest         # UI component library
```

### Backend
```
node: ^18.0.0             # JavaScript runtime
express (via Next.js):    # HTTP server
mongodb: ^6.0.0           # Database driver
mongoose: ^7.5.0          # ODM (Object Document Mapper)
jsonwebtoken: ^9.0.0      # JWT authentication
bcryptjs: ^2.4.3          # Password hashing
zod: ^3.22.0              # Runtime validation
```

### Infrastructure
```
Hosting:     Vercel / AWS / DigitalOcean / Self-hosted
Database:    MongoDB Atlas (Cloud) / Self-hosted MongoDB
CDN:         Vercel Edge Network / Cloudflare
Storage:     Vercel Blob / AWS S3
Email:       SendGrid / AWS SES
```

---

## Application Architecture

### Layered Architecture Pattern

```
┌─────────────────────────────────────┐
│      Presentation Layer             │
│  (React Components, UI Logic)       │
├─────────────────────────────────────┤
│      Business Logic Layer           │
│  (Tax Calculation, Validation)      │
├─────────────────────────────────────┤
│      Data Access Layer              │
│  (MongoDB Queries, Transactions)    │
├─────────────────────────────────────┤
│      External Integration Layer     │
│  (GSTN API, Payment Gateways)       │
└─────────────────────────────────────┘
```

### Directory Structure

```
gst-billing-system/
├── app/                              # Next.js App Router
│   ├── api/                          # Route handlers (backend)
│   │   ├── auth/
│   │   │   ├── register/route.ts
│   │   │   └── login/route.ts
│   │   ├── invoices/
│   │   │   ├── create/route.ts
│   │   │   ├── list/route.ts
│   │   │   └── [id]/route.ts
│   │   ├── customers/
│   │   ├── products/
│   │   ├── tax/
│   │   ├── payments/
│   │   ├── inventory/
│   │   ├── reports/
│   │   └── einvoice/
│   │
│   ├── dashboard/                    # Client-side pages
│   │   ├── page.tsx                  # Home/Overview
│   │   ├── invoices/page.tsx
│   │   ├── customers/page.tsx
│   │   ├── products/page.tsx
│   │   ├── payments/page.tsx
│   │   ├── inventory/page.tsx
│   │   ├── reports/page.tsx
│   │   └── settings/page.tsx
│   │
│   ├── layout.tsx
│   └── globals.css
│
├── components/                       # Reusable components
│   ├── ui/                           # shadcn/ui components
│   ├── invoice/                      # Invoice-specific
│   ├── forms/                        # Form components
│   └── layout/                       # Layout components
│
├── lib/                              # Utility functions
│   ├── db.ts                         # MongoDB connection
│   ├── auth-utils.ts                 # JWT handling
│   ├── tax-engine.ts                 # GST calculation
│   ├── validators.ts                 # Input validation
│   └── utils.ts                      # General utilities
│
├── types/                            # TypeScript interfaces
│   ├── index.ts
│   ├── invoice.ts
│   ├── customer.ts
│   ├── api.ts
│   └── database.ts
│
└── scripts/                          # Database & setup scripts
    ├── init-db.ts
    ├── seed-data.ts
    └── migrations/
```

### Data Flow Architecture

#### Invoice Creation Flow

```
1. User Form Input (React)
   └─> Client-side Validation (Zod)
       └─> API Request (/api/invoices/create)
           └─> Server-side Validation
               └─> Line Item Processing
                   └─> GST Calculation Engine
                       └─> Tax Summary Computation
                           └─> Database Transaction
                               ├─> Insert Invoice
                               ├─> Insert LineItems
                               ├─> Update Inventory
                               └─> Log Audit Trail
                               
   ◀─ Response with Invoice Details
     └─> State Update (React)
         └─> UI Refresh
```

#### Tax Calculation Flow

```
Line Item Input
  ├─ Product HSN Code
  ├─ Unit Price
  ├─ Quantity
  ├─ Discount %
  └─ Customer State

    │
    ▼

Tax Determination Engine
  ├─ Fetch HSN Tax Rate (5%, 12%, 18%, 28%)
  ├─ Extract Supplier State (from GSTIN)
  ├─ Extract Buyer State (from Customer Address)
  ├─ Check Intra-state vs Inter-state
  └─ Check Reverse Charge Applicability

    │
    ▼

GST Calculation
  ├─ If Intra-state (Same State)
  │   ├─ CGST = (Taxable Amount × Tax Rate) / 2
  │   └─ SGST = (Taxable Amount × Tax Rate) / 2
  │
  └─ If Inter-state (Different State)
      └─ IGST = Taxable Amount × Tax Rate

    │
    ▼

Line Amount Calculation
  ├─ Line Amount = Unit Price × Quantity
  ├─ Discount = Line Amount × Discount %
  ├─ Taxable Amount = Line Amount - Discount
  └─ Total = Taxable Amount + Tax

    │
    ▼

Invoice Level Aggregation
  ├─ Sum All Line Amounts
  ├─ Sum All Discounts
  ├─ Sum All CGST
  ├─ Sum All SGST
  ├─ Sum All IGST
  └─ Grand Total = Taxable + Total Tax
```

---

## Database Schema

### Collection Relationships

```
┌──────────────┐
│   tenants    │ (Business accounts)
└──────┬───────┘
       │ (1-to-Many)
       │
       ├─────────────┬──────────────┬──────────────┬────────────┐
       │             │              │              │            │
       ▼             ▼              ▼              ▼            ▼
   ┌────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐  ┌────────────┐
   │ users  │  │invoices  │  │customers│  │ products │  │ payments   │
   └────────┘  └────┬─────┘  └─────────┘  └──────────┘  └────────────┘
                    │
                    │ (1-to-Many)
                    │
                    ▼
            ┌──────────────────┐
            │ invoiceLineItems │
            └────────┬─────────┘
                     │
                     ▼
            ┌──────────────────┐
            │  stockLedger     │
            └──────────────────┘
```

### Key Collections

#### Invoices Collection
```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,           // Multi-tenant isolation
  invoiceNumber: string,        // Unique per tenant
  customerId: ObjectId,
  invoiceDate: Date,
  dueDate: Date,
  status: 'draft' | 'issued' | 'paid' | 'cancelled',
  
  lineItems: [{                 // Embedded array
    _id: ObjectId,
    productId: ObjectId,
    quantity: number,
    unitPrice: number,
    discountValue: number,
    discountType: 'fixed' | 'percentage',
    lineAmount: number,
    hsn: string,
    taxRate: number
  }],
  
  taxSummary: {
    lineAmount: number,
    discountAmount: number,
    taxableAmount: number,
    cgstAmount: number,
    sgstAmount: number,
    igstAmount: number,
    cessAmount: number,
    totalTax: number,
    grandTotal: number
  },
  
  complianceInfo: {
    isIntrastate: boolean,
    placeOfSupply: string,
    reverseChargeApplicable: boolean,
    isExport: boolean
  },
  
  eInvoice: {
    status: 'pending' | 'generated' | 'failed' | 'cancelled',
    irn: string,
    ackNum: string,
    qrCode: string,
    signedPayload: Object
  },
  
  auditTrail: [{
    action: string,
    userId: ObjectId,
    timestamp: Date,
    changes: Object
  }]
}
```

#### Database Indexes

```javascript
// Performance-critical indexes
db.invoices.createIndex({ tenantId: 1, createdAt: -1 })
db.invoices.createIndex({ invoiceNumber: 1, tenantId: 1 }, { unique: true })
db.customers.createIndex({ tenantId: 1, gstin: 1 })
db.products.createIndex({ tenantId: 1, sku: 1 }, { unique: true })
db.stockLedger.createIndex({ productId: 1, warehouseId: 1 })
db.payments.createIndex({ invoiceId: 1 })
db.users.createIndex({ email: 1 }, { unique: true })

// For reports
db.invoices.createIndex({ 
  tenantId: 1, 
  invoiceDate: -1 
})
```

---

## API Architecture

### RESTful API Design

#### Naming Conventions
- Resources: Plural nouns (`/invoices`, `/customers`, `/products`)
- Actions: HTTP verbs (GET, POST, PUT, DELETE)
- Filtering: Query parameters (`?status=issued&from=2024-01-01`)
- Pagination: `?page=1&limit=20`

#### Response Structure

```typescript
interface ApiResponse<T> {
  success: boolean;
  status_code: number;
  data: T;
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  } | null;
  meta: {
    timestamp: string;
    request_id: string;
    request_duration_ms: number;
  };
}
```

#### Error Handling Hierarchy

```
HTTP Status Code
├─ 400 Bad Request (Validation Error)
├─ 401 Unauthorized (Auth Required)
├─ 403 Forbidden (Permission Denied)
├─ 404 Not Found (Resource Missing)
├─ 409 Conflict (Business Logic Error)
├─ 422 Unprocessable Entity (Semantic Error)
├─ 429 Too Many Requests (Rate Limited)
└─ 500 Internal Server Error
```

#### Rate Limiting

```
Header: X-RateLimit-Limit: 1000
Header: X-RateLimit-Remaining: 999
Header: X-RateLimit-Reset: 1707381600

Limits:
- 1000 requests per hour per IP
- 100 requests per minute for authenticated users
- 10 requests per minute for write operations
```

### API Versioning Strategy

```
Current: /api/v1/invoices
Future: /api/v2/invoices (if breaking changes needed)

Backward compatibility maintained:
- API v1 supported for 12 months after v2 release
- Migration path provided to v2
- Deprecation warnings in headers
```

---

## Security Architecture

### Authentication Flow

```
1. User Credentials
   ├─ Email + Password
   └─ Bcrypt Comparison
       ├─ Match: Generate JWT
       └─ No Match: Reject

2. JWT Token Structure
   {
     "header": {
       "alg": "HS256",
       "typ": "JWT"
     },
     "payload": {
       "sub": "user_id",
       "tenantId": "tenant_id",
       "role": "admin|manager|employee",
       "iat": 1707381600,
       "exp": 1707468000    # 24 hours
     },
     "signature": "HMAC256(...)"
   }

3. Token Refresh Mechanism
   ├─ Access Token: 24 hours
   ├─ Refresh Token: 30 days (HTTP-only cookie)
   └─ Token Rotation on Refresh
```

### Row-Level Security (RLS)

```typescript
// Every query includes tenant filter
db.invoices.find({
  tenantId: req.user.tenantId,  // MANDATORY
  // ... other filters
})

// Prevents data leakage between tenants
```

### Encryption Strategy

```
┌─────────────────────────────────────┐
│     Data at Rest (Database)         │
├─────────────────────────────────────┤
│ • Sensitive Fields: AES-256 encrypted
│ • Fields: GSTIN, PAN, Bank Accounts │
│ • Encryption Key: Environment Var   │
│ • IV: Random per document           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│     Data in Transit (Network)       │
├─────────────────────────────────────┤
│ • HTTPS/TLS 1.3 (Enforced)         │
│ • HSTS Headers (1 year)             │
│ • No Cookies over HTTP              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│     Application Security            │
├─────────────────────────────────────┤
│ • CSRF Tokens on State Changes      │
│ • XSS Protection (React Escaping)   │
│ • Input Validation (Zod)            │
│ • SQL Injection Prevention (Params) │
└─────────────────────────────────────┘
```

### Permission Model

```
Tenant
├── Owner (Full Access)
│   ├── All Invoices
│   ├── All Customers
│   ├── All Products
│   ├── All Reports
│   ├── User Management
│   └── Settings
│
├── Manager
│   ├── Create/Edit Invoices
│   ├── View Customers
│   ├── View Products
│   ├── View Reports
│   └── Limited Settings
│
├── Accountant
│   ├── Create Invoices (View Only)
│   ├── View Customers
│   ├── View Reports
│   └── (No Edit Permission)
│
├── POS Operator
│   ├── Create Quick Invoices
│   ├── View Customers
│   └── (Limited Scope)
│
└── Viewer
    └── Read-Only Access
```

---

## Scalability & Performance

### Caching Strategy

```
Level 1: Browser Cache
├─ Static assets (30 days)
└─ API responses (5 minutes)

Level 2: CDN Cache (Vercel Edge)
├─ Images (1 week)
└─ Public data (1 day)

Level 3: Application Cache (Redis)
├─ Session data (30 days)
├─ Invoice lookups (1 hour)
├─ Product catalog (1 day)
└─ Tax rates (7 days)

Level 4: Database Cache
├─ Connection pooling (10-20 connections)
├─ Query result cache (N/A for real-time)
└─ Aggregation cache (1 day)
```

### Performance Targets

```
API Response Times (p95):
├─ GET Single Resource: <100ms
├─ GET List (paginated): <500ms
├─ POST Create: <500ms
├─ PUT Update: <300ms
├─ DELETE: <200ms
└─ Complex Queries: <2s

Database Query Times (p95):
├─ Simple Query: <10ms
├─ Indexed Query: <50ms
├─ Aggregation Pipeline: <500ms
└─ Full Scan: <5s (avoid)

Frontend Metrics:
├─ FCP (First Contentful Paint): <1.5s
├─ LCP (Largest Contentful Paint): <2.5s
├─ CLS (Cumulative Layout Shift): <0.1
└─ TTI (Time to Interactive): <3.5s
```

### Database Optimization

```
Connection Pool
├─ Min: 5 connections
├─ Max: 20 connections (adjust based on load)
└─ Idle Timeout: 60 seconds

Query Optimization
├─ Always use indexes
├─ Limit returned fields (projection)
├─ Paginate large result sets
├─ Avoid $lookup unless necessary
└─ Use aggregation pipeline for complex queries

Sharding Strategy (Future)
├─ Shard by tenantId
├─ Shard by invoiceDate (yearly partitions)
└─ Shard by region
```

### Load Distribution

```
                    ┌─────────────────┐
                    │ Vercel Edge     │
                    │ (Global CDN)    │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
            ┌───────▼────────┐    ┌──▼──────────┐
            │  US Region     │    │ EU Region   │
            │  Lambda/Node   │    │ Lambda/Node │
            └───────┬────────┘    └──┬──────────┘
                    │                │
                    └────────┬───────┘
                             │
                    ┌────────▼────────┐
                    │ MongoDB Atlas   │
                    │ (Multi-region)  │
                    └─────────────────┘
```

---

## Deployment Architecture

### Vercel Deployment

```
GitHub Repository
    │
    ├─ Push to main
    │
    ▼
Vercel CI/CD
    ├─ Build: npm run build
    ├─ Test: npm test
    ├─ Deploy: Next.js Optimized Build
    │
    ▼
Vercel Edge Functions
    ├─ API Routes
    ├─ Middleware (Auth, CORS)
    └─ Static Asset Serving

Environment Variables
    ├─ Production: Secure env vars in Vercel
    ├─ Preview: PR preview deployments
    └─ Development: .env.local
```

### Infrastructure Components

```
Domain & DNS
    ├─ Domain: yourdomain.com
    ├─ DNS Provider: Vercel / Cloudflare
    └─ SSL/TLS: Automatic (Let's Encrypt)

CDN
    ├─ Provider: Vercel Edge Network
    ├─ Cache Key: URL + headers
    └─ TTL: Configurable per route

File Storage
    ├─ Provider: Vercel Blob
    ├─ Use: Invoice PDFs, attachments
    └─ Retention: 90 days

Email Service
    ├─ Provider: SendGrid / AWS SES
    ├─ Use: Invoice delivery, notifications
    └─ Rate: 100 emails/second

Monitoring & Logging
    ├─ Provider: Sentry / LogRocket
    ├─ Metrics: Error tracking, performance
    └─ Logs: Centralized logging
```

### Database Backup Strategy

```
Automated Backups (MongoDB Atlas)
├─ Frequency: Daily
├─ Retention: 30 days
├─ Backup Type: Snapshot-based
└─ Recovery: Point-in-time restore

Manual Backup
├─ Frequency: Weekly
├─ Method: mongoexport JSON
├─ Storage: S3 / Cloud Storage
└─ Retention: 1 year

Disaster Recovery
├─ RTO (Recovery Time): 1 hour
├─ RPO (Recovery Point): 1 day
├─ Test: Monthly restoration test
└─ Documentation: Runbook maintained
```

---

## Compliance & Governance

### Audit Logging

```typescript
interface AuditLog {
  _id: ObjectId;
  tenantId: ObjectId;
  userId: ObjectId;
  action: 'create' | 'update' | 'delete' | 'view' | 'export';
  resourceType: 'invoice' | 'customer' | 'product' | 'payment';
  resourceId: string;
  changes: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

### Data Retention Policy

```
Invoices & Related Data
├─ Retention: 7 years (GST compliance)
├─ Archival: Year 2+ to cold storage
└─ Deletion: After 7 years (with approval)

User Activity Logs
├─ Retention: 1 year
├─ Archival: After 6 months
└─ Deletion: After 1 year

Payment Records
├─ Retention: 7 years
├─ Archival: Year 2+ to cold storage
└─ Deletion: After 7 years (with approval)

Temporary Data
├─ Cache: 7 days
├─ Logs: 90 days
└─ Backups: 30 days
```

---

## Scalability Roadmap

### Phase 1 (Current - MVP)
- Single MongoDB instance
- Single Vercel region
- Basic caching
- Up to 10,000 users

### Phase 2 (Year 1)
- MongoDB replication
- Multi-region deployment
- Redis caching layer
- Load balancing
- Up to 100,000 users

### Phase 3 (Year 2)
- MongoDB sharding
- Advanced caching strategies
- Message queue (for async jobs)
- Microservices separation
- Up to 1,000,000 users

### Phase 4 (Year 3+)
- Custom infrastructure
- Kubernetes orchestration
- Advanced analytics
- ML-based predictions
- Enterprise support

---

## Monitoring & Alerts

```
Key Metrics to Monitor
├─ API Response Time
│   └─ Alert: > 1s (p95)
├─ Error Rate
│   └─ Alert: > 1% of requests
├─ Database Query Time
│   └─ Alert: > 500ms (p95)
├─ Memory Usage
│   └─ Alert: > 80% utilization
├─ Disk Usage
│   └─ Alert: > 85% utilization
├─ SSL Certificate Expiry
│   └─ Alert: 30 days before expiration
└─ Invoice Creation Failures
    └─ Alert: > 5 in 1 hour
```

---

This architecture ensures scalability, security, performance, and maintainability for a production-grade GST billing platform.
