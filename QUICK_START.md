# GST Billing Platform - Quick Start Guide

Get up and running with the GST Billing Platform in 5 minutes.

## Prerequisites

- Node.js 18+ (Check: `node --version`)
- MongoDB (local or MongoDB Atlas)
- npm or yarn
- Git

## Step 1: Clone & Install (2 minutes)

```bash
# Clone the repository
git clone <your-repo-url>
cd gst-billing-system

# Install dependencies
npm install
```

## Step 2: Configure Environment (1 minute)

Create `.env.local` file in the root directory:

```bash
cat > .env.local << 'EOF'
# Database Connection
MONGODB_URI=mongodb://localhost:27017/gst-billing

# Authentication
JWT_SECRET=your-super-secret-key-change-in-production-12345

# API URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# Optional: External Services
# RAZORPAY_KEY_ID=your_key
# RAZORPAY_KEY_SECRET=your_secret
# GSTIN_API_KEY=your_key
EOF
```

### Option A: Local MongoDB

```bash
# Using Docker (recommended)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or install MongoDB locally
# https://docs.mongodb.com/manual/installation/
```

### Option B: MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create a cluster (AWS, us-east-1)
4. Get connection string
5. Update `MONGODB_URI` in `.env.local`

## Step 3: Run Development Server (1 minute)

```bash
npm run dev
```

The application will start at **http://localhost:3000**

## Step 4: Access & Explore (1 minute)

### Dashboard
- **URL**: http://localhost:3000/dashboard
- **Login**: Sample credentials (after data seeding)
  - Email: `admin@example.com`
  - Password: `password123`

### Sample Data

To populate with demo data:

```bash
npm run seed
```

This creates:
- 1 business account (ABC Corporation)
- 10 sample customers
- 20 sample products
- 50 sample invoices
- Mock payments and inventory

## Key Features to Try

### 1. Create an Invoice
1. Navigate to **Dashboard → Invoices → New Invoice**
2. Select a customer
3. Add line items with products
4. Watch GST calculate automatically
5. Create and issue the invoice

### 2. View Tax Calculation
1. Go to **Reports → Tax Summary**
2. See CGST/SGST breakdown
3. Understand intra-state vs inter-state tax

### 3. Check Inventory
1. Go to **Inventory**
2. View stock levels
3. Adjust stock for a product

### 4. Generate Reports
1. Go to **Reports**
2. Select GSTR-1
3. View compliance checklist
4. Export as PDF/Excel

### 5. Configure Settings
1. Go to **Settings → Business**
2. Update business details
3. Configure bank account
4. Set invoice prefix

## API Testing

### Using cURL

```bash
# Login to get token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }' | jq -r '.token')

# Create invoice
curl -X POST http://localhost:3000/api/invoices/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-id-here",
    "invoiceDate": "2024-02-03",
    "dueDate": "2024-03-03",
    "lineItems": [
      {
        "productId": "product-id",
        "quantity": 5,
        "unitPrice": 10000
      }
    ]
  }'
```

### Using Postman

1. Open Postman
2. Import: `./postman-collection.json`
3. Set environment variables
4. Run requests

## Database Management

### View Data

```bash
# Connect to MongoDB
mongosh

# List databases
show dbs

# Use our database
use gst-billing

# View invoices
db.invoices.find().limit(5).pretty()

# Count invoices
db.invoices.countDocuments()
```

### Create Indexes

```bash
# Performance optimization
npm run db:index
```

### Reset Database

```bash
# Clear all data (development only)
npm run db:reset

# Then reseed
npm run seed
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### MongoDB Connection Failed

```bash
# Check MongoDB is running
mongosh

# If not, start MongoDB (if local)
docker run -d -p 27017:27017 mongo:latest

# Verify connection string in .env.local
echo $MONGODB_URI
```

### Build Error

```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

### Import Errors

```bash
# TypeScript might need a restart
npm run dev

# Or rebuild type definitions
npm run type-check
```

## Next Steps

### 1. Customize for Your Business
- Update business name in Settings
- Configure invoice prefix
- Add your bank details
- Upload company logo

### 2. Add Customers
```bash
# Go to Dashboard → Customers
# Click "Add Customer"
# Enter GSTIN, address, contact info
```

### 3. Create Product Catalog
```bash
# Go to Dashboard → Products
# Add products with HSN codes
# Set tax rates (auto-fetched based on HSN)
```

### 4. Generate First Invoice
```bash
# Go to Dashboard → Invoices → Create
# Select customer and products
# Review automatic GST calculation
# Issue and send invoice
```

### 5. Set Up Payment Tracking
```bash
# Go to Dashboard → Payments
# Record payment against invoice
# Track payment status
```

## Common Tasks

### Generate GSTR-1 Report

```bash
# Endpoint: GET /api/reports/gstr-1?month=02&year=2024

curl http://localhost:3000/api/reports/gstr-1?month=02&year=2024 \
  -H "Authorization: Bearer $TOKEN"
```

### Calculate Tax for Item

```bash
# Endpoint: POST /api/tax/calculate

curl -X POST http://localhost:3000/api/tax/calculate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lineItems": [{
      "amount": 10000,
      "taxRate": 18,
      "hsn": "6204"
    }],
    "buyerState": "MH",
    "supplierState": "TG"
  }'
```

### Record Payment

```bash
# Endpoint: POST /api/payments/record

curl -X POST http://localhost:3000/api/payments/record \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": "inv_123",
    "amount": 100000,
    "method": "bank_transfer",
    "reference": "NEFT-001",
    "date": "2024-02-03"
  }'
```

## File Structure Guide

```
Key Files to Know:

lib/
  ├─ tax-engine.ts        # GST calculation logic
  ├─ auth-utils.ts        # JWT authentication
  ├─ db.ts                # MongoDB connection
  └─ validators.ts        # Input validation

app/api/
  ├─ invoices/create      # Invoice creation
  ├─ tax/calculate        # Tax calculation
  └─ reports/gstr-1       # GSTR-1 generation

app/dashboard/
  ├─ invoices/page.tsx    # Invoice management UI
  ├─ reports/page.tsx     # Reports & compliance
  └─ settings/page.tsx    # Configuration
```

## Performance Tips

1. **Use Indexes**: `npm run db:index`
2. **Enable Caching**: Set up Redis (optional)
3. **Optimize Queries**: Always filter by `tenantId`
4. **Paginate Lists**: Use `?page=1&limit=20`
5. **Cache Static Content**: Static assets cached 30 days

## Security Checklist

Before going to production:

- [ ] Change `JWT_SECRET` to random 32+ char string
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS/TLS
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Enable 2FA for admin accounts
- [ ] Review Row-Level Security (RLS)
- [ ] Set up audit logging
- [ ] Test rate limiting
- [ ] Configure CORS properly

## Deployment Quick Links

- **Vercel**: [DEPLOYMENT.md](./DEPLOYMENT.md#vercel-recommended-for-v0)
- **AWS**: [DEPLOYMENT.md](./DEPLOYMENT.md#aws-ec2)
- **DigitalOcean**: [DEPLOYMENT.md](./DEPLOYMENT.md#digitalocean-app-platform)
- **Docker**: [Dockerfile](./Dockerfile) (create if needed)

## Getting Help

### Documentation
- [Full README](./README.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)

### Troubleshooting
1. Check logs: `npm run logs`
2. View database state: `mongosh`
3. Test API: Use Postman or curl
4. Check environment variables: `env | grep MONGODB`

### Community Support
- GitHub Issues: Open an issue for bugs
- GitHub Discussions: Ask questions
- Email: support@yourdomain.com

## Frequently Asked Questions

**Q: How do I calculate GST for multiple items?**
A: GST is calculated per line item automatically. The system applies the correct CGST/SGST or IGST based on state.

**Q: Can I edit an issued invoice?**
A: No, you must cancel and create a new one. This is GST compliance requirement.

**Q: How do I generate e-invoices?**
A: E-invoices are generated via `/api/einvoice/generate` (requires GSTN credentials).

**Q: How long are backups kept?**
A: MongoDB Atlas keeps 30-day automated backups. Custom backups stored 1 year.

**Q: Can I use this for multiple businesses?**
A: Yes, multi-tenant architecture supports unlimited businesses.

**Q: What's the maximum invoice size?**
A: 1000 line items per invoice (configurable).

---

**Ready to start? Run `npm run dev` and visit http://localhost:3000**

For production deployment, follow the [DEPLOYMENT.md](./DEPLOYMENT.md) guide.
