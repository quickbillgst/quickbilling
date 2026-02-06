# Database Schema Documentation

## Overview

MongoDB database with Mongoose ODM. All collections support multi-tenancy through `tenantId` field. Data models defined in `/lib/models.ts`.

## Collections

### 1. Tenants

Represents a business or organization.

```javascript
{
  _id: ObjectId,
  businessName: String,           // Company legal name
  gstin: String,                  // 15-digit GST ID (unique)
  pan: String,                    // PAN (unique)
  registrationType: String,       // 'registered' | 'unregistered' | 'sez' | 'uin'
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,                // Indian state code (e.g., "KA", "DL")
    pincode: String,
    country: String               // Default: "IN"
  },
  industryCategory: String,       // Industry type
  turnoverAnnual: Number,         // Annual turnover in rupees
  isComposition: Boolean,         // Composition scheme eligible?
  timezone: String,               // Default: "Asia/Kolkata"
  status: String,                 // 'trial' | 'active' | 'suspended'
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `businessName` (ascending)
- `gstin` (unique, sparse)
- `pan` (unique, sparse)

### 2. Users

User accounts with role-based access control.

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,             // Reference to Tenant
  email: String,                  // Unique across all users
  phone: String,
  passwordHash: String,           // bcryptjs hash
  firstName: String,
  lastName: String,
  role: String,                   // 'owner' | 'manager' | 'accountant' | 'pos_operator' | 'viewer'
  isActive: Boolean,              // Account active?
  isVerified: Boolean,            // Email verified?
  mfaEnabled: Boolean,            // Multi-factor auth enabled?
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email` (unique, ascending)
- `tenantId + email` (unique compound)
- `tenantId + isActive` (ascending)

**Roles:**
- **owner**: Full access, billing management
- **manager**: Full access except billing
- **accountant**: Read invoices, GST reports
- **pos_operator**: Only POS interface
- **viewer**: Read-only access

### 3. Customers

Customer master data for invoicing.

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,             // Reference to Tenant
  name: String,                   // Customer name
  email: String,
  phone: String,
  gstin: String,                  // Customer GST ID
  pan: String,
  registrationType: String,       // 'registered' | 'unregistered' | 'consumer'
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  creditLimit: Number,
  creditDaysAllowed: Number,
  isActive: Boolean,
  customerType: String,           // 'b2b' | 'b2c' | 'b2g'
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `tenantId + name` (ascending)
- `gstin` (sparse)
- `createdAt` (descending)

### 4. Products

Product catalog with tax codes.

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,             // Reference to Tenant
  name: String,
  description: String,
  sku: String,                    // Stock keeping unit
  hsnCode: String,                // HSN code for goods
  sacCode: String,                // SAC code for services
  unitOfMeasure: String,          // 'pcs' | 'kg' | 'litre' | etc
  hsn/sacDescription: String,     // HSN/SAC description
  taxRate: Number,                // GST rate in percentage (5, 12, 18, 28)
  sellingPrice: Number,
  costPrice: Number,
  manufacturerId: String,         // Manufacturer details
  countryOfOrigin: String,
  isActive: Boolean,
  isService: Boolean,
  isTaxExempt: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `tenantId + sku` (unique compound)
- `tenantId + name` (ascending)
- `hsnCode` (ascending)
- `isActive` (ascending)

### 5. Invoices

Invoice records with tax breakdown.

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,             // Reference to Tenant
  invoiceNumber: String,          // Unique per tenant
  invoiceDate: Date,
  dueDate: Date,
  customerId: ObjectId,           // Reference to Customer
  lineItems: [{
    productId: ObjectId,
    description: String,
    quantity: Number,
    unitPrice: Number,
    amount: Number,
    hsnCode: String,
    taxRate: Number,
    taxAmount: Number,
    discount: Number
  }],
  subtotal: Number,
  discountAmount: Number,         // Line item discounts
  discountPercentage: Number,     // Invoice-level discount
  taxableAmount: Number,          // After discounts
  cgstAmount: Number,
  sgstAmount: Number,
  igstAmount: Number,
  cessAmount: Number,
  totalTax: Number,
  totalAmount: Number,            // Grand total
  notes: String,
  termsAndConditions: String,
  invoiceType: String,            // 'invoice' | 'credit_note' | 'debit_note'
  placeOfSupply: String,          // State code
  reverseCharge: Boolean,
  eInvoiceStatus: String,         // 'pending' | 'generated' | 'cancelled'
  eInvoiceDetails: Object,        // Irn, Ack details
  paymentStatus: String,          // 'unpaid' | 'partial' | 'paid'
  paymentTerms: String,           // Days or fixed date
  createdByUserId: ObjectId,
  lastModifiedByUserId: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `tenantId + invoiceNumber` (unique compound)
- `tenantId + invoiceDate` (descending)
- `tenantId + customerId` (ascending)
- `tenantId + paymentStatus` (ascending)

### 6. Payments

Payment records for invoices.

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  invoiceId: ObjectId,            // Reference to Invoice
  customerId: ObjectId,           // Reference to Customer
  paymentDate: Date,
  amount: Number,                 // Amount paid
  paymentMethod: String,          // 'cash' | 'check' | 'bank_transfer' | 'upi' | 'card'
  transactionReference: String,   // Reference/cheque number
  bankAccount: String,            // Bank account credited
  notes: String,
  createdByUserId: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `tenantId + invoiceId` (ascending)
- `paymentDate` (descending)
- `customerId` (ascending)

### 7. StockLedgers

Inventory transaction history.

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  productId: ObjectId,            // Reference to Product
  transactionType: String,        // 'purchase' | 'sale' | 'adjustment' | 'waste'
  quantity: Number,               // Can be negative for usage
  unitPrice: Number,
  totalValue: Number,
  referenceType: String,          // 'invoice' | 'po' | 'manual'
  referenceId: ObjectId,
  batchNumber: String,
  expiryDate: Date,
  warehouseLocation: String,
  notes: String,
  createdByUserId: ObjectId,
  createdAt: Date
}
```

**Indexes:**
- `tenantId + productId + createdAt` (compound, descending on date)
- `batchNumber + expiryDate` (ascending)

### 8. Batches

Product batch tracking with expiry management.

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  productId: ObjectId,
  batchNumber: String,
  manufacturingDate: Date,
  expiryDate: Date,
  quantity: Number,               // Current stock
  unitCost: Number,
  supplierId: ObjectId,           // Reference to Customer (supplier)
  poReference: String,            // Purchase order reference
  certifications: [String],       // List of certifications
  status: String,                 // 'active' | 'expired' | 'archived'
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `tenantId + productId + batchNumber` (unique compound)
- `tenantId + expiryDate` (ascending)

### 9. LedgerEntries

Accounting ledger for financial reporting.

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  entryType: String,              // 'debit' | 'credit'
  accountCode: String,            // Account code (e.g., "1100")
  accountName: String,            // Account name
  amount: Number,
  referenceType: String,          // 'invoice' | 'payment' | 'journal'
  referenceId: ObjectId,
  description: String,
  createdByUserId: ObjectId,
  createdAt: Date
}
```

**Indexes:**
- `tenantId + accountCode + createdAt` (compound)
- `referenceType + referenceId` (ascending)

### 10. AuditLogs

Compliance audit trail.

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  userId: ObjectId,               // Reference to User
  action: String,                 // 'create' | 'update' | 'delete' | 'view'
  entityType: String,             // 'invoice' | 'customer' | 'payment'
  entityId: ObjectId,
  changes: Object,                // Before/after values
  ipAddress: String,
  userAgent: String,
  status: String,                 // 'success' | 'failure'
  errorMessage: String,
  createdAt: Date
}
```

**Indexes:**
- `tenantId + createdAt` (descending compound)
- `userId + createdAt` (descending compound)
- `entityType + entityId` (ascending compound)

## Relationships

```
Tenant
  ├── User (1-to-many)
  ├── Customer (1-to-many)
  ├── Product (1-to-many)
  ├── Invoice (1-to-many)
  │   └── Payment (1-to-many)
  ├── StockLedger (1-to-many)
  ├── Batch (1-to-many)
  ├── LedgerEntry (1-to-many)
  └── AuditLog (1-to-many)

Invoice
  ├── Customer (many-to-1)
  ├── LineItem
  │   └── Product (many-to-1)
  └── Payment (1-to-many)
```

## Tax Calculation Fields

Every invoice contains:
- **CGST** (Central GST): Intra-state transactions
- **SGST** (State GST): Intra-state transactions
- **IGST** (Integrated GST): Inter-state transactions
- **CESS**: Additional tax on specific goods
- **TDS** (Tax Deducted at Source): If applicable

## Multi-Tenancy Isolation

**Critical Fields:** Every collection has `tenantId` field
**Query Pattern:** All queries include `tenantId` filter
**API Protection:** JWT verification ensures correct tenantId
**Database Rule:** No document is accessible without valid tenantId

## Performance Optimization

### Indexes
- Compound indexes on frequently filtered combinations
- Descending indexes on date fields for sorting
- Unique indexes on business keys (GST ID, Invoice Number)
- Sparse indexes on optional fields

### Query Optimization
- Use `.lean()` for read-only queries
- Pagination for large datasets
- Batch operations for bulk updates
- Select specific fields when possible

### Data Retention
- Soft delete pattern (isActive flag)
- Audit logs retained for compliance
- Archive old data annually
