# GST Billing Platform - Complete Documentation

Welcome to the comprehensive documentation for the GST Billing Platform. This folder contains all necessary information for developers, DevOps engineers, and system administrators.

## Documentation Structure

### Getting Started

Start here if you're new to the project:

1. **[01-PROJECT-OVERVIEW.md](./01-PROJECT-OVERVIEW.md)**
   - Project purpose and vision
   - Key features overview
   - Tech stack summary
   - Project structure
   - Environment variables
   - Production checklist
   - **Time to read: 15 minutes**

2. **[06-SETUP-DEPLOYMENT.md](./06-SETUP-DEPLOYMENT.md)**
   - Local development setup
   - Database configuration (MongoDB/MongoDB Atlas)
   - Building for production
   - Deploying to Vercel
   - Post-deployment verification
   - Monitoring and maintenance
   - **Time to read: 30 minutes**

### For Developers

Deep dive into how the system works:

3. **[02-ARCHITECTURE.md](./02-ARCHITECTURE.md)**
   - High-level architecture diagram
   - Layer-by-layer design explanation
   - Data flow examples
   - Key architectural decisions
   - Extension points for adding features
   - Performance considerations
   - **Time to read: 20 minutes**

4. **[03-DATABASE-SCHEMA.md](./03-DATABASE-SCHEMA.md)**
   - Complete MongoDB schema documentation
   - All 10 collections with field descriptions
   - Relationships and foreign keys
   - Indexes and optimization
   - Multi-tenancy isolation
   - Tax calculation fields
   - **Time to read: 25 minutes**

5. **[04-API-REFERENCE.md](./04-API-REFERENCE.md)**
   - Complete API endpoint documentation
   - All 14 route groups
   - Request/response examples
   - Query parameters and filters
   - Error codes and handling
   - Complete code example flow
   - **Time to read: 20 minutes**

6. **[05-COMPONENT-GUIDE.md](./05-COMPONENT-GUIDE.md)**
   - Component folder structure
   - Page and layout organization
   - Key component descriptions
   - Styling and theme system
   - Form patterns and examples
   - Data fetching with SWR
   - State management patterns
   - Accessibility guidelines
   - **Time to read: 20 minutes**

### For Operations & Support

Operational and troubleshooting documentation:

7. **[07-TROUBLESHOOTING.md](./07-TROUBLESHOOTING.md)**
   - Common issues and solutions
   - Authentication troubleshooting
   - Invoice and transaction issues
   - Inventory problems
   - Reporting issues
   - Performance troubleshooting
   - Data consistency issues
   - Debugging techniques
   - How to report bugs
   - **Time to read: 30 minutes**

## Quick Navigation

### By Role

**Project Manager:**
- Start: [PROJECT-OVERVIEW.md](./01-PROJECT-OVERVIEW.md)
- Then: [SETUP-DEPLOYMENT.md](./06-SETUP-DEPLOYMENT.md)

**Frontend Developer:**
- Start: [PROJECT-OVERVIEW.md](./01-PROJECT-OVERVIEW.md)
- Then: [COMPONENT-GUIDE.md](./05-COMPONENT-GUIDE.md)
- Then: [ARCHITECTURE.md](./02-ARCHITECTURE.md)

**Backend Developer:**
- Start: [PROJECT-OVERVIEW.md](./01-PROJECT-OVERVIEW.md)
- Then: [ARCHITECTURE.md](./02-ARCHITECTURE.md)
- Then: [DATABASE-SCHEMA.md](./03-DATABASE-SCHEMA.md)
- Then: [API-REFERENCE.md](./04-API-REFERENCE.md)

**Full Stack Developer:**
- Read all documents in order

**DevOps/Infrastructure:**
- Start: [SETUP-DEPLOYMENT.md](./06-SETUP-DEPLOYMENT.md)
- Reference: [PROJECT-OVERVIEW.md](./01-PROJECT-OVERVIEW.md)

**Support/Operations:**
- Start: [TROUBLESHOOTING.md](./07-TROUBLESHOOTING.md)
- Reference: [PROJECT-OVERVIEW.md](./01-PROJECT-OVERVIEW.md)

### By Task

**I need to...**

- **...set up local development**
  → [06-SETUP-DEPLOYMENT.md](./06-SETUP-DEPLOYMENT.md) → Local Development Setup

- **...deploy to production**
  → [06-SETUP-DEPLOYMENT.md](./06-SETUP-DEPLOYMENT.md) → Deployment to Vercel

- **...understand how invoicing works**
  → [02-ARCHITECTURE.md](./02-ARCHITECTURE.md) → Data Flow Examples
  → [04-API-REFERENCE.md](./04-API-REFERENCE.md) → Invoice Endpoints

- **...add a new feature**
  → [02-ARCHITECTURE.md](./02-ARCHITECTURE.md) → Extension Points
  → [03-DATABASE-SCHEMA.md](./03-DATABASE-SCHEMA.md) → Collections
  → [05-COMPONENT-GUIDE.md](./05-COMPONENT-GUIDE.md) → Component Architecture

- **...fix a bug**
  → [07-TROUBLESHOOTING.md](./07-TROUBLESHOOTING.md) → Debugging Techniques

- **...understand the database**
  → [03-DATABASE-SCHEMA.md](./03-DATABASE-SCHEMA.md)

- **...build a new UI page**
  → [05-COMPONENT-GUIDE.md](./05-COMPONENT-GUIDE.md)

- **...create an API endpoint**
  → [04-API-REFERENCE.md](./04-API-REFERENCE.md)
  → [02-ARCHITECTURE.md](./02-ARCHITECTURE.md) → API Layer

- **...debug authentication issues**
  → [07-TROUBLESHOOTING.md](./07-TROUBLESHOOTING.md) → Authentication Issues

- **...understand multi-tenancy**
  → [03-DATABASE-SCHEMA.md](./03-DATABASE-SCHEMA.md) → Multi-Tenancy Isolation
  → [02-ARCHITECTURE.md](./02-ARCHITECTURE.md) → Multi-Tenancy Design

## Key Concepts

### Multi-Tenancy
Every business is a separate "Tenant" with isolated data. All queries filter by tenantId. See [03-DATABASE-SCHEMA.md](./03-DATABASE-SCHEMA.md).

### GST Compliance
Complex Indian tax calculations including CGST/SGST/IGST based on place of supply. See [02-ARCHITECTURE.md](./02-ARCHITECTURE.md) and [04-API-REFERENCE.md](./04-API-REFERENCE.md).

### JWT Authentication
Stateless authentication using JWT tokens (24-hour expiration). Token contains userId, tenantId, role, email. See [04-API-REFERENCE.md](./04-API-REFERENCE.md) → Authentication.

### Real-time Sync
POS system uses IndexedDB for offline capability with automatic sync. See [05-COMPONENT-GUIDE.md](./05-COMPONENT-GUIDE.md) → POS Components.

### Component Architecture
React with shadcn/ui + Radix UI. Forms use React Hook Form + Zod. State via Context + SWR. See [05-COMPONENT-GUIDE.md](./05-COMPONENT-GUIDE.md).

## Common Tasks

### Local Development Workflow

```bash
# 1. Set up environment
npm install
cp .env.example .env.local
# Edit .env.local with MongoDB URI and JWT secret

# 2. Start development
npm run dev
# Visit http://localhost:3000

# 3. Make changes
# Edit files, auto-reload in browser

# 4. Test API
# Use browser console to fetch API
fetch('/api/invoices/list', {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json()).then(d => console.log(d))
```

### Adding a New Invoice Field

1. **Database:**
   - Edit schema in `/lib/models.ts`
   - Add field to invoiceSchema

2. **API:**
   - Update POST /api/invoices/create in `/app/api/invoices/create/route.ts`
   - Add field to validation
   - Save to database

3. **Frontend:**
   - Add form field in `/components/invoices/invoice-builder.tsx`
   - Add to form validation
   - Display in invoice details

4. **Documentation:**
   - Update [03-DATABASE-SCHEMA.md](./03-DATABASE-SCHEMA.md)
   - Update [04-API-REFERENCE.md](./04-API-REFERENCE.md)

### Debugging Production

```bash
# 1. Check Vercel logs
# Vercel Dashboard → Project → Logs
# Filter by timestamp or error type

# 2. Check database
# MongoDB Atlas → Cluster → Collections
# Query data directly or check backup

# 3. Check frontend errors
# Browser console (F12) → Console tab
# Look for [v0] prefixed messages

# 4. Reproduce locally
# Set environment to match production
# Debug with npm run dev
```

## Technology Stack Reference

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend Framework** | Next.js | 16.0.10 | App router, SSR, API routes |
| **UI Library** | React | 19.2.0 | Component framework |
| **Styling** | Tailwind CSS | 4.1.9 | Utility-first CSS |
| **UI Components** | shadcn/ui | Latest | Pre-built accessible components |
| **Forms** | React Hook Form | 7.60.0 | Form state management |
| **Validation** | Zod | 3.25.76 | Runtime schema validation |
| **Backend Runtime** | Node.js | 18.x+ | JavaScript runtime on Vercel |
| **Database** | MongoDB | 8.x | NoSQL database |
| **ORM** | Mongoose | 8.0.3 | MongoDB ODM |
| **Auth** | jsonwebtoken | 9.0.3 | JWT token handling |
| **Security** | bcryptjs | 2.4.3 | Password hashing |
| **Data Fetch** | SWR | 2.2.4 | React hook for data fetching |
| **Charts** | Recharts | 2.15.4 | Chart components |
| **Notifications** | Sonner | 1.7.4 | Toast notifications |
| **Deployment** | Vercel | Latest | Serverless platform |

## File Organization

```
docs/
├── README.md                      # This file
├── 01-PROJECT-OVERVIEW.md         # Project intro
├── 02-ARCHITECTURE.md             # System design
├── 03-DATABASE-SCHEMA.md          # Database docs
├── 04-API-REFERENCE.md            # API docs
├── 05-COMPONENT-GUIDE.md          # UI/Component docs
├── 06-SETUP-DEPLOYMENT.md         # Setup guide
└── 07-TROUBLESHOOTING.md          # Troubleshooting
```

## Maintenance Schedule

### Daily
- Check error logs and alerts
- Respond to user issues
- Monitor uptime

### Weekly
- Review analytics
- Check deployment status
- Update dependencies (if needed)

### Monthly
- Perform security audit
- Review performance metrics
- Plan upcoming features
- Update documentation if needed

### Quarterly
- Full codebase security review
- Database optimization
- Plan major releases

## Support & Contributions

### Getting Help

1. **Search existing documentation** - Most answers are in these docs
2. **Check troubleshooting guide** - [07-TROUBLESHOOTING.md](./07-TROUBLESHOOTING.md)
3. **Review code comments** - Implementation details in source files
4. **Check external docs** - Next.js, React, MongoDB docs

### Contributing

1. Follow existing code patterns
2. Update relevant documentation
3. Test changes locally
4. Follow TypeScript best practices
5. Keep commits atomic and descriptive

### Reporting Bugs

Include:
- Environment (dev/prod)
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/logs
- Versions (browser, Node, etc.)

See [07-TROUBLESHOOTING.md](./07-TROUBLESHOOTING.md) → Reporting Bugs

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2024-02-04 | Initial production release |
| - | - | Complete documentation created |

---

**Last Updated:** February 4, 2024  
**Documentation Version:** 1.0  
**Status:** Complete and Production-Ready

For questions or updates needed, please open an issue or contact the development team.
