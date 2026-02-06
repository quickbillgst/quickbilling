# API Reference

## Overview

All API routes are protected with JWT authentication. Include token in Authorization header:

```
Authorization: Bearer <jwt_token>
```

**Base URL:** `https://yourdomain.com/api`

**Response Format:** JSON

**Error Responses:**
```json
{
  "error": "Error message",
  "details": "Technical details if available"
}
```

## Authentication Endpoints

### POST /auth/register

Register a new business with initial user.

**Request:**
```json
{
  "businessName": "Acme Corp",
  "email": "owner@acme.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "gstin": "29AAPCU9603R1Z5"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "owner@acme.com",
      "firstName": "John",
      "role": "owner",
      "tenantId": "507f1f77bcf86cd799439010"
    },
    "tenant": {
      "id": "507f1f77bcf86cd799439010",
      "businessName": "Acme Corp",
      "gstin": "29AAPCU9603R1Z5"
    }
  }
}
```

**Errors:**
- 400: Validation failed
- 409: Email already registered
- 500: Server error

### POST /auth/login

Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "owner@acme.com",
  "password": "securePassword123"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { /* user object */ },
    "tenant": { /* tenant object */ }
  }
}
```

**Errors:**
- 400: Email/password required
- 401: Invalid credentials
- 500: Server error

## Invoice Endpoints

### POST /invoices/create

Create a new invoice with line items.

**Request:**
```json
{
  "customerId": "507f1f77bcf86cd799439011",
  "invoiceDate": "2024-02-04",
  "dueDate": "2024-02-18",
  "lineItems": [
    {
      "productId": "507f1f77bcf86cd799439012",
      "description": "Widget Pro",
      "quantity": 10,
      "unitPrice": 1000,
      "hsnCode": "3402"
    }
  ],
  "notes": "Please pay by due date"
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "invoiceNumber": "INV-2024-00001",
    "totalAmount": 12800,
    "cgstAmount": 800,
    "sgstAmount": 800,
    "paymentStatus": "unpaid"
  }
}
```

### GET /invoices/list

List invoices with filters.

**Query Parameters:**
- `skip` (number): Pagination offset, default 0
- `limit` (number): Items per page, default 10
- `status` (string): 'unpaid' | 'partial' | 'paid'
- `startDate` (ISO date): Filter from date
- `endDate` (ISO date): Filter to date
- `customerId` (ObjectId): Filter by customer

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "invoiceNumber": "INV-2024-00001",
      "customerId": "507f1f77bcf86cd799439011",
      "invoiceDate": "2024-02-04",
      "totalAmount": 12800,
      "paymentStatus": "unpaid"
    }
  ],
  "total": 1
}
```

### GET /invoices/:id

Get invoice details.

**Response:** 200 OK (complete invoice object)

### POST /invoices/:id

Update invoice.

**Request:** Partial invoice object

**Response:** 200 OK (updated invoice)

## Customer Endpoints

### GET /customers

List all customers for tenant.

**Query Parameters:**
- `skip`, `limit` (pagination)
- `search` (string): Search by name/email/GSTIN

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "ABC Traders",
      "email": "contact@abc.com",
      "gstin": "29AAPCU9603R1Z5",
      "creditLimit": 100000
    }
  ],
  "total": 1
}
```

### POST /customers

Create new customer.

**Request:**
```json
{
  "name": "XYZ Corporation",
  "email": "info@xyz.com",
  "phone": "9876543210",
  "gstin": "29ABCDE1234F1Z2",
  "address": {
    "line1": "123 Business Park",
    "city": "Bangalore",
    "state": "KA",
    "pincode": "560001"
  }
}
```

## Product Endpoints

### GET /products

List products with HSN/SAC codes.

**Query Parameters:**
- `skip`, `limit` (pagination)
- `hsnCode` (string): Filter by HSN

**Response:** 200 OK (array of products)

### POST /products

Create new product.

**Request:**
```json
{
  "name": "Widget Pro",
  "sku": "WP-001",
  "hsnCode": "3402",
  "taxRate": 18,
  "sellingPrice": 1000,
  "costPrice": 700
}
```

## Inventory Endpoints

### GET /inventory/stock

Get current stock levels.

**Query Parameters:**
- `productId` (ObjectId): Optional filter

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "productId": "507f1f77bcf86cd799439012",
      "currentStock": 50,
      "reservedStock": 5,
      "availableStock": 45,
      "batches": [
        {
          "batchNumber": "BATCH001",
          "quantity": 45,
          "expiryDate": "2025-12-31"
        }
      ]
    }
  ]
}
```

### POST /inventory/adjust

Adjust stock (manual addition/removal).

**Request:**
```json
{
  "productId": "507f1f77bcf86cd799439012",
  "quantity": 10,
  "transactionType": "adjustment",
  "notes": "Stock count correction"
}
```

## Payment Endpoints

### POST /payments/record

Record a payment against invoice.

**Request:**
```json
{
  "invoiceId": "507f1f77bcf86cd799439013",
  "amount": 12800,
  "paymentDate": "2024-02-05",
  "paymentMethod": "bank_transfer",
  "transactionReference": "NEFT123456"
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "invoiceId": "507f1f77bcf86cd799439013",
    "amount": 12800,
    "paymentStatus": "paid"
  }
}
```

### GET /payments/list

List payments.

**Query Parameters:**
- `skip`, `limit` (pagination)
- `customerId` (ObjectId): Filter by customer
- `startDate`, `endDate` (ISO dates): Date range

## Reporting Endpoints

### GET /reports/gstr1

Generate GSTR-1 report.

**Query Parameters:**
- `period` (string, required): "FY2024" or "JAN-2024"
- `format` (string): 'json' | 'csv' | 'pdf'

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "period": "JAN-2024",
    "totalInvoices": 25,
    "totalSalesValue": 500000,
    "totalTaxableValue": 480000,
    "totalCGST": 43200,
    "totalSGST": 43200,
    "totalIGST": 0,
    "b2bInvoices": 20,
    "b2bValue": 450000,
    "b2cInvoices": 5,
    "b2cValue": 50000,
    "exportInvoices": 0,
    "exemptInvoices": 0
  }
}
```

### POST /reports/gstr-filing

Submit GSTR-3B filing (mock integration).

**Request:**
```json
{
  "period": "JAN-2024",
  "outwardSupplies": { /* GSTR-1 data */ },
  "inwardSupplies": { /* Purchase data */ }
}
```

## E-Invoice Endpoints

### POST /einvoice/generate

Generate e-invoice (mock implementation).

**Request:**
```json
{
  "invoiceId": "507f1f77bcf86cd799439013"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "irn": "1234567890abcdef1234567890ab",
    "ackNum": "12345678",
    "ackDt": "05022024 113045",
    "signedInvoice": "base64..."
  }
}
```

## Rate Limiting

Currently no rate limiting. Production deployments should implement:

```
- 100 requests per minute per user
- 1000 requests per minute per IP
- Burst allowance for file uploads
```

## Pagination

All list endpoints support pagination:

```javascript
GET /api/invoices/list?skip=0&limit=10
```

Response includes total count:
```json
{
  "data": [],
  "total": 45,
  "skip": 0,
  "limit": 10
}
```

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate entry |
| 429 | Too Many Requests - Rate limited |
| 500 | Server Error - Internal error |

## Examples

### Complete Invoice Creation Flow

```javascript
// 1. Get JWT token (login)
const loginRes = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});
const { data: { token } } = await loginRes.json();

// 2. Create customer
const customerRes = await fetch('/api/customers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'ABC Corp',
    email: 'contact@abc.com',
    gstin: '29AAPCU9603R1Z5'
  })
});
const { data: customer } = await customerRes.json();

// 3. Create products
const productRes = await fetch('/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Widget',
    hsnCode: '3402',
    taxRate: 18,
    sellingPrice: 1000
  })
});
const { data: product } = await productRes.json();

// 4. Create invoice
const invoiceRes = await fetch('/api/invoices/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    customerId: customer._id,
    invoiceDate: '2024-02-04',
    lineItems: [{
      productId: product._id,
      quantity: 5,
      unitPrice: 1000
    }]
  })
});
const { data: invoice } = await invoiceRes.json();
```
