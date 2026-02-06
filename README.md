# GST Billing & Invoice Management System.

A production-ready SaaS application for creating GST-compliant invoices with automatic tax calculations, built with Next.js, TypeScript, and MongoDB. Perfect for Indian SMEs, startups, and accountants managing multi-state businesses.

## 🎯 Key Features

### ✅ Automatic GST Calculation Engine
- **Intra-state transactions**: Automatic CGST + SGST calculation (9% + 9% = 18% total)
- **Inter-state transactions**: Automatic IGST calculation (18% single rate)
- **Multiple tax rates**: Full support for 0%, 5%, 12%, 18%, 28% HSN-based rates
- **Cess support**: Additional cess calculations for luxury items and specific products
- **Smart place of supply**: Automatic determination based on customer location and GSTIN

### 📄 Invoice Management
- Create, edit, and manage invoices with automatic numbering
- Support for all invoice types: Invoice, Credit Note, Debit Note
- Line-item level tax calculations with discount handling
- Flexible discounts: Fixed amount or percentage-based
- Invoice status tracking: Draft → Issued → Paid → Cancelled
- Mock customer and product data for demo purposes

### 🏙️ Multi-State Transaction Support
- Automatic tax determination based on place of supply
- GSTIN-based state code extraction (2-digit state code)
- Support for all 35+ Indian states and union territories
- Reverse charge mechanism for unregistered suppliers
- Export transactions with zero GST
- SEZ (Special Economic Zone) supply handling

### 📊 Analytics & Real-Time Dashboard
- Key metrics: Total invoices, monthly revenue, tax collected, pending payments
- Revenue & tax trend analysis (6-month history)
- Tax breakdown visualization (CGST vs SGST vs IGST pie chart)
- Invoice count by month (bar chart)
- Recent invoices with status indicators
- Quick action buttons for common workflows

### 🔒 Compliance & Security
- E-invoice (IRN) generation ready
- GST registration validation (15-character GSTIN format)
- Audit logging for all transactions
- Unregistered supplier handling with compliance notes
- Multi-tenant architecture with complete data isolation
- Role-based access control (Owner, Manager, Accountant, POS Operator, Viewer)

### 👥 Customer Management
- Customer profiles with GSTIN and tax registration status
- Billing and shipping address management
- TDS applicability tracking
- Credit limit management
- Customer tagging and segmentation

### 📦 Product & Service Management
- Product catalog with HSN (Harmonized System of Nomenclature) codes
- Service classification with SAC (Service Accounting Code) codes
- Tax rate assignment per product
- SKU tracking and barcode support
- Service vs goods classification
- Default pricing and tax rates per product

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (LTS recommended)
- MongoDB 5.0+ (local or Atlas)
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation & Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd gst-billing-system
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cat > .env.local << 'EOF'
   MONGODB_URI=mongodb://localhost:27017/gst-billing
   JWT_SECRET=your-secret-key-change-in-production
   NEXT_PUBLIC_API_URL=http://localhost:3000
   EOF
   ```

3. **Start MongoDB** (if running locally)
   ```bash
   # Using Docker (recommended)
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   
   # Or install locally: https://docs.mongodb.com/manual/installation/
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open http://localhost:3000 in your browser

### First Time Setup
- The system uses mock data for demo (customers: ABC Traders, XYZ Manufacturing, Local Retailer)
- Navigate to `/dashboard/invoices/new` to create your first invoice
- All tax calculations are automatic based on customer location
- No additional setup required for GST calculations

## 🧮 GST Calculation System

### How It Works

The system automatically determines the correct GST treatment based on:
1. **Supplier State** - Retrieved from tenant configuration
2. **Buyer State** - Retrieved from customer billing address
3. **Tax Rate** - Set per line item (0%, 5%, 12%, 18%, 28%)
4. **Place of Supply** - Automatically determined

### Intra-State Transactions (Same State)

When supplier and buyer are in the **same state**:

```
Line Amount:        ₹1,000
Discount:          -₹0
Taxable Amount:     ₹1,000

CGST (9%):         ₹90    (50% of tax rate)
SGST (9%):         ₹90    (50% of tax rate)
─────────────────────────
Total Tax:         ₹180
Final Amount:      ₹1,180
```

**Tax Split**: 50-50 between CGST and SGST for all tax rates

### Inter-State Transactions (Different State)

When supplier and buyer are in **different states**:

```
Line Amount:        ₹1,000
Discount:          -₹0
Taxable Amount:     ₹1,000

IGST (18%):        ₹180   (full tax rate)
─────────────────────────
Total Tax:         ₹180
Final Amount:      ₹1,180
```

**Tax Split**: 100% IGST, no CGST/SGST split

### Real-World Examples

**Example 1: Wheat Flour (5% Tax)**
- Unit Price: ₹50 per kg
- Quantity: 100 kg
- Intra-state transaction
- Line Amount: ₹5,000
- CGST: ₹125 (2.5%)
- SGST: ₹125 (2.5%)
- Total: ₹5,250

**Example 2: Garments (12% Tax)**
- Unit Price: ₹500 per piece
- Quantity: 10 pieces
- Inter-state transaction
- Line Amount: ₹5,000
- IGST: ₹600 (12%)
- Total: ₹5,600

**Example 3: With Discount**
- Unit Price: ₹1,000
- Quantity: 2 pieces
- Discount: 10% (₹200)
- Line Amount: ₹2,000
- Discount: -₹200
- Taxable Amount: ₹1,800
- Tax (18%): ₹324
- Total: ₹2,124

### Supported Tax Rates

| HSN/SAC Range | Typical Items | Tax Rate |
|---|---|---|
| 0101-0713 | Agricultural goods | 0% / 5% |
| 0801-2209 | Food items, spices | 5% / 12% |
| 2201-2308 | Chemicals, minerals | 12% / 18% |
| 3001-5207 | Garments, textiles | 5% / 12% |
| 6001-6309 | Apparel, footwear | 5% / 12% |
| 7001-8517 | Metals, machinery | 12% / 18% |
| 8501-8706 | Electrical equipment | 12% / 18% |
| 9001-9706 | Optical goods | 12% / 18% |
| 9801-9905 | Services | 5% / 12% / 18% |

### Tax Compliance Checks

The system automatically validates:
- ✅ Intra-state vs inter-state determination
- ✅ Correct CGST/SGST split for same-state
- ✅ IGST for inter-state transactions
- ✅ Discount applied before tax calculation
- ✅ Rounding to nearest paisa (2 decimal places)
- ✅ Tax rate applicability per HSN code

## 📱 User Roles & Permissions

| Role | Invoices | Customers | Products | Reports | Users | Settings |
|------|----------|-----------|----------|---------|-------|----------|
| **Owner** | Create/Edit/Delete | Full | Full | Full | Manage | Full |
| **Manager** | Create/Edit | View | View | Full | - | Limited |
| **Accountant** | Create/Edit | View | View | View | - | Limited |
| **POS Operator** | Create (POS) | View | View | Limited | - | - |
| **Viewer** | View | View | View | View | - | - |

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 16 with React 19
- **UI Components**: shadcn/ui
- **Styling**: TailwindCSS v4
- **State Management**: SWR for data fetching
- **Forms**: React Hook Form + Zod validation

### Backend
- **Runtime**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcrypt
- **Validation**: Zod schemas
- **Error Handling**: Comprehensive error responses

### Database Models
- **Tenants**: Multi-tenant isolation
- **Users**: Role-based access control
- **Customers**: GST profiles and addresses
- **Products**: Catalog with HSN/SAC codes
- **Invoices**: Billing with line items and taxes
- **Payments**: Transaction history
- **StockLedger**: Immutable inventory trail
- **EInvoices**: e-Invoice status and IRN
- **AuditLogs**: Compliance audit trail

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new business
- `POST /api/auth/login` - User login

### Invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices` - List invoices (paginated)
- `GET /api/invoices/:id` - Get invoice details
- `POST /api/invoices/:id/issue` - Issue invoice
- `POST /api/invoices/:id/cancel` - Cancel invoice

### Customers
- `POST /api/customers` - Create customer
- `GET /api/customers` - List customers (paginated)
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer

### Products
- `POST /api/products` - Create product
- `GET /api/products` - List products (paginated)
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product

### Payments
- `POST /api/payments` - Record payment
- `GET /api/payments` - List payments
- `POST /api/payment-links` - Generate payment link
- `POST /api/upi-qr` - Generate UPI QR code

### Tax Calculation
- `POST /api/tax/calculate` - Calculate GST for items
- `POST /api/tax/gstr-1` - Get GSTR-1 data

## 🔐 Security Features

1. **Multi-Tenant Isolation**
   - Row-level security policies
   - Tenant ID in all queries
   - Complete data separation

2. **Authentication & Authorization**
   - JWT tokens with 24h expiry
   - Role-based access control
   - IP whitelisting (optional)
   - MFA support (TOTP ready)

3. **Data Protection**
   - AES-256 encryption for sensitive fields
   - bcrypt password hashing (cost=12)
   - HTTPS only (TLS 1.3)
   - No sensitive data in logs

4. **Audit & Compliance**
   - Immutable audit logs
   - Action tracking (create, update, delete)
   - IP and user agent logging
   - 7-year retention for invoices

5. **Input Validation**
   - Zod schema validation
   - SQL injection prevention
   - XSS protection
   - CSRF tokens on forms

## 📈 Scaling Strategy

### Database
- Connection pooling (Mongoose default)
- Indexing on frequently queried fields
- Partitioning invoices by month
- Read replicas for reports

### Caching
- Redis for session storage
- Browser cache for static assets
- CDN for images and downloads

### API
- Horizontal scaling with load balancer
- Rate limiting per IP and user
- Request timeout management
- Background job processing

### Deployment
- Docker containerization
- Kubernetes orchestration
- Auto-scaling based on CPU/memory
- Blue-green deployments

## 🚢 Deployment

### Docker

```bash
# Build Docker image
docker build -t gst-billing:latest .

# Run container
docker run -p 3000:3000 \
  -e MONGODB_URI=mongodb://mongo:27017/gst-billing \
  -e JWT_SECRET=your-secret \
  gst-billing:latest
```

### Vercel (Recommended for v0)

```bash
# Connect GitHub repository
# Environment variables in Vercel dashboard:
# - MONGODB_URI
# - JWT_SECRET

# Deploy
vercel deploy
```

### AWS

```bash
# Push to ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.ap-south-1.amazonaws.com
docker tag gst-billing:latest <account>.dkr.ecr.ap-south-1.amazonaws.com/gst-billing:latest
docker push <account>.dkr.ecr.ap-south-1.amazonaws.com/gst-billing:latest

# Deploy to ECS/EKS
# Use Terraform or CloudFormation for infrastructure
```

## 📋 Development Roadmap

### Phase 1 (MVP - Current)
- [x] Core invoicing with GST
- [x] Customer management
- [x] Product catalog
- [x] Dashboard
- [x] Authentication & RBAC
- [x] Reports framework

### Phase 2
- [ ] Payment gateway integration (Razorpay, Stripe)
- [ ] e-Invoice generation (NIC API)
- [ ] e-Way Bill integration
- [ ] Payment reconciliation
- [ ] Advanced tax reports

### Phase 3
- [ ] POS terminal (React Native)
- [ ] Offline sync capability
- [ ] Thermal printer support
- [ ] Mobile app for iOS/Android
- [ ] Real-time inventory sync

### Phase 4
- [ ] AI-powered insights
- [ ] Predictive analytics
- [ ] GST compliance assistant
- [ ] Multi-branch management
- [ ] API marketplace

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 💬 Support

For support, email support@gst-billing.in or open an issue on GitHub.

## 🙏 Acknowledgments

- GST regulations and compliance guidelines from GSTN
- Inspired by platforms like Swipe, Zoho Books, and Tally
- Built with Next.js, React, and MongoDB
- UI components from shadcn/ui

---

**Made with ❤️ for Indian Small Business Owners**

---

## Getting Started with v0

This project was bootstrapped with v0. To run locally:

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Environment Variables

Create a `.env.local` file:

```
MONGODB_URI=mongodb://localhost:27017/gst-billing
JWT_SECRET=your-development-secret-key
NEXT_PUBLIC_API_URL=http://localhost:3000
```

For production, set these in your deployment platform's environment variables.
