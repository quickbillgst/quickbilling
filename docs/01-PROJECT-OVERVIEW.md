# GST Billing Platform - Project Overview

## Project Information

**Name:** GST Billing Platform  
**Version:** 0.1.0  
**Type:** Full-stack web application  
**Framework:** Next.js 16 with React 19  
**Database:** MongoDB  
**Deployment:** Vercel  

## Purpose

Production-grade GST invoicing and billing solution designed for Indian small and medium enterprises (SMEs). The platform automates invoice generation, GST tax calculations, inventory management, and GST compliance reporting (GSTR-1, GSTR-3B filings).

## Key Features

### Core Billing
- Invoice creation and management with automatic GST calculations
- Support for multiple GST rates and exemptions
- Invoice templates and customization
- E-invoice generation capability
- Payment tracking and reconciliation

### Tax Compliance
- Automatic CGST/SGST/IGST calculations based on place of supply
- GSTR-1 (outward supplies) report generation
- GSTR-3B summary generation
- Tax audit trail and compliance flags
- Support for composition scheme and SEZ supplies

### Inventory Management
- Product catalog with HSN/SAC codes
- Stock tracking with batch management
- Expiry date monitoring
- Stock adjustment logs

### Business Features
- Multi-tenant support (multiple businesses/branches)
- Role-based access control (Owner, Manager, Accountant, POS Operator, Viewer)
- Customer management with GST validation
- Payment history and aging reports
- Real-time dashboard analytics

### POS System
- Point of Sale interface for retail operations
- Barcode scanning support
- Real-time inventory sync
- Offline-capable with automatic sync
- Receipt printing

## Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4 with custom theme
- **Components:** shadcn/ui + Radix UI
- **Forms:** React Hook Form + Zod validation
- **State:** React Context + SWR for client-side caching
- **Charts:** Recharts for analytics

### Backend
- **Runtime:** Node.js on Vercel
- **API:** Next.js Route Handlers
- **Database:** MongoDB 8.x with Mongoose ODM
- **Authentication:** JWT (jsonwebtoken)
- **Security:** bcryptjs for password hashing

### DevOps
- **Deployment:** Vercel with automatic CI/CD
- **Version Control:** Git
- **Package Manager:** npm
- **TypeScript:** 5.x for type safety

## Project Structure

```
gst-billing-platform/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Authentication routes
│   │   ├── login/page.tsx       # Login page
│   │   └── register/page.tsx    # Registration page
│   ├── api/                     # API routes
│   │   ├── auth/                # Authentication endpoints
│   │   ├── invoices/            # Invoice management
│   │   ├── customers/           # Customer management
│   │   ├── products/            # Product management
│   │   ├── inventory/           # Inventory operations
│   │   ├── payments/            # Payment tracking
│   │   ├── reports/             # GSTR reports
│   │   └── einvoice/            # E-invoice generation
│   ├── dashboard/               # Protected dashboard routes
│   │   ├── page.tsx             # Dashboard home
│   │   ├── invoices/            # Invoice management UI
│   │   ├── customers/           # Customer management UI
│   │   ├── products/            # Product management UI
│   │   ├── inventory/           # Inventory UI
│   │   ├── payments/            # Payment tracking UI
│   │   ├── reports/             # Reports UI
│   │   ├── pos/                 # Point of Sale system
│   │   └── settings/            # Settings UI
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home/landing page
│   └── globals.css              # Global styles
├── lib/                         # Core business logic
│   ├── models.ts                # MongoDB schemas & models
│   ├── auth-context.tsx         # Authentication context provider
│   ├── auth-utils.ts            # Auth utilities
│   ├── gst-engine.ts            # GST calculation engine
│   ├── db/                      # Database utilities
│   │   ├── indexed-db.ts        # Client-side IndexedDB
│   │   └── sync-engine.ts       # Offline sync engine
│   ├── hooks/                   # Custom React hooks
│   │   └── useKeyboardShortcuts.ts
│   ├── services/                # Business logic services
│   │   ├── gst-service.ts       # GSTR report generation
│   │   ├── inventory-service.ts # Inventory operations
│   │   └── accounting-service.ts # Accounting ledger
│   ├── context/                 # React contexts
│   │   └── pos-context.tsx      # POS system state
│   └── utils.ts                 # Utility functions
├── components/                  # Reusable React components
│   ├── dashboard/               # Dashboard components
│   │   ├── sidebar.tsx
│   │   └── header.tsx
│   ├── pos/                     # POS system components
│   │   ├── pos-header.tsx
│   │   ├── pos-main-area.tsx
│   │   ├── pos-cart-panel.tsx
│   │   └── modals/
│   ├── invoices/                # Invoice components
│   │   └── invoice-builder.tsx
│   └── ui/                      # Base UI components
├── public/                      # Static assets
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── next.config.mjs              # Next.js config
├── tailwind.config.ts           # Tailwind CSS config
├── postcss.config.js            # PostCSS config
└── docs/                        # Documentation (this folder)
```

## Environment Variables

Required environment variables for production:

```env
# Database
MONGODB_URI=mongodb+srv://...

# Authentication
JWT_SECRET=<32-byte base64 encoded secret>

# Optional
NODE_ENV=production
VERCEL_ENV=production
```

Generate JWT_SECRET: `openssl rand -base64 32`

## Getting Started

### Local Development

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
# Open http://localhost:3000
```

### Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Key Concepts

### Multi-Tenancy
Each business is a "Tenant" with its own data, users, and settings. Users are scoped to a single tenant.

### GST Compliance
The platform handles complex Indian GST rules including inter-state vs intra-state supplies, composition scheme, SEZ supplies, and exemptions.

### Real-time Sync
The POS system uses IndexedDB for offline capability with automatic server sync when online.

### JWT Authentication
Stateless authentication using JWT tokens with 24-hour expiration. Token includes userId, tenantId, role, and email.

## Production Checklist

- [x] JWT_SECRET configured and secured
- [x] MONGODB_URI validated at startup
- [x] All debug logs removed
- [x] Error handling with detailed messages
- [x] Type safety with TypeScript
- [x] Input validation on all API routes
- [x] Password hashing with bcryptjs
- [x] Environment variable validation
- [x] Database connection pooling
- [x] CORS configured appropriately

## Support & Documentation

- See `02-ARCHITECTURE.md` for system design
- See `03-DATABASE-SCHEMA.md` for data models
- See `04-API-REFERENCE.md` for API endpoints
- See `05-COMPONENT-GUIDE.md` for UI components
- See `06-SETUP-DEPLOYMENT.md` for deployment guide
- See `07-TROUBLESHOOTING.md` for common issues
