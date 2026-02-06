# GST Billing Platform - API Documentation

Complete REST API reference for the GST billing system.

## Base URL

```
https://api.yourdomain.com/v1
```

## Authentication

All endpoints require Bearer token authentication:

```
Authorization: Bearer <jwt_token>
```

## Response Format

All responses follow this format:

```json
{
  "success": true,
  "status_code": 200,
  "data": {},
  "error": null,
  "meta": {
    "timestamp": "2024-02-03T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

---

## Authentication Endpoints

### POST /auth/register

Register a new business account.

**Request:**
```json
{
  "businessName": "ABC Corporation",
  "email": "owner@abc.com",
  "password": "secure_password",
  "gstin": "27AABCT1234C1Z5",
  "state": "TG",
  "address": "123 Main Street, Hyderabad"
}
```

**Response (201):**
```json
{
  "success": true,
  "tenant": {
    "id": "tenant_abc123",
    "businessName": "ABC Corporation",
    "gstin": "27AABCT1234C1Z5"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### POST /auth/login

Login with email and password.

**Request:**
```json
{
  "email": "owner@abc.com",
  "password": "secure_password"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "tenant": {
    "id": "tenant_abc123",
    "businessName": "ABC Corporation"
  }
}
```

---

## Invoice Endpoints

### POST /invoices/create

Create a new invoice with automatic GST calculation.

**Request:**
```json
{
  "customerId": "cust_abc123",
  "invoiceDate": "2024-02-03",
  "dueDate": "2024-03-03",
  "lineItems": [
    {
      "productId": "prod_001",
      "quantity": 5,
      "unitPrice": 50000,
      "unitOfMeasure": "piece",
      "discountValue": 0,
      "discountType": "fixed"
    }
  ],
  "isExport": false,
  "isSez": false
}
```

**Response (201):**
```json
{
  "success": true,
  "invoice": {
    "id": "inv_abc123",
    "invoiceNumber": "INV-2024-00001",
    "status": "draft",
    "customerId": "cust_abc123",
    "invoiceDate": "2024-02-03",
    "lineItems": [
      {
        "id": "line_001",
        "quantity": 5,
        "unitPrice": 50000,
        "discountAmount": 0,
        "lineAmount": 250000
      }
    ],
    "taxSummary": {
      "lineAmount": 250000,
      "discountAmount": 0,
      "taxableAmount": 250000,
      "cgstAmount": 22500,
      "sgstAmount": 22500,
      "igstAmount": 0,
      "totalTax": 45000,
      "grandTotal": 295000
    },
    "complianceInfo": {
      "isIntrastate": true,
      "placeOfSupply": "TG",
      "reverseChargeApplicable": false
    }
  }
}
```

### GET /invoices/list

Retrieve paginated list of invoices with filtering.

**Query Parameters:**
```
GET /invoices/list?status=issued&from_date=2024-01-01&to_date=2024-02-03&page=1&limit=20
```

**Response (200):**
```json
{
  "success": true,
  "invoices": [
    {
      "id": "inv_abc123",
      "invoiceNumber": "INV-2024-00001",
      "customerName": "ABC Traders",
      "amount": 295000,
      "tax": 45000,
      "status": "issued",
      "invoiceDate": "2024-02-03"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

### GET /invoices/{invoiceId}

Get detailed invoice with full tax breakdown.

**Response (200):**
```json
{
  "success": true,
  "invoice": {
    "id": "inv_abc123",
    "invoiceNumber": "INV-2024-00001",
    "lineItems": [ /* ... */ ],
    "taxBreakdown": {
      "CGST": { "rate": 9, "amount": 22500 },
      "SGST": { "rate": 9, "amount": 22500 }
    },
    "eInvoice": {
      "status": "generated",
      "irn": "192201000000abc123def456",
      "qrCodeUrl": "https://..."
    }
  }
}
```

### POST /invoices/{invoiceId}/issue

Issue a draft invoice (change status to issued).

**Response (200):**
```json
{
  "success": true,
  "invoice": {
    "id": "inv_abc123",
    "status": "issued",
    "issuedAt": "2024-02-03T10:30:00Z"
  }
}
```

### POST /invoices/{invoiceId}/cancel

Cancel an invoice with a reason.

**Request:**
```json
{
  "reason": "Customer request"
}
```

**Response (200):**
```json
{
  "success": true,
  "invoice": {
    "id": "inv_abc123",
    "status": "cancelled",
    "cancelledAt": "2024-02-03T11:00:00Z"
  }
}
```

---

## Customer Endpoints

### POST /customers/create

Create a new customer.

**Request:**
```json
{
  "name": "ABC Traders",
  "email": "contact@abc.com",
  "phone": "9876543210",
  "gstin": "27AABCT1234C1Z1",
  "gstRegistered": true,
  "billingAddress": {
    "line1": "123 MG Road",
    "city": "Hyderabad",
    "state": "TG",
    "pincode": "500001"
  },
  "tdsApplicable": false,
  "creditLimit": 500000
}
```

**Response (201):**
```json
{
  "success": true,
  "customer": {
    "id": "cust_abc123",
    "name": "ABC Traders",
    "gstin": "27AABCT1234C1Z1",
    "state": "TG"
  }
}
```

### GET /customers/list

Get list of customers.

**Response (200):**
```json
{
  "success": true,
  "customers": [
    {
      "id": "cust_abc123",
      "name": "ABC Traders",
      "gstin": "27AABCT1234C1Z1",
      "outstandingAmount": 150000,
      "creditLimit": 500000
    }
  ],
  "pagination": { "total": 15 }
}
```

---

## Product Endpoints

### POST /products/create

Create a product with HSN code and tax rate.

**Request:**
```json
{
  "sku": "PROD-001",
  "name": "Wheat Flour",
  "description": "High-quality wheat flour",
  "hsn": "1101",
  "taxRate": 5,
  "costPrice": 2000,
  "sellingPrice": 3000,
  "reorderPoint": 50,
  "trackInventory": true
}
```

**Response (201):**
```json
{
  "success": true,
  "product": {
    "id": "prod_001",
    "sku": "PROD-001",
    "name": "Wheat Flour",
    "hsn": "1101",
    "taxRate": 5
  }
}
```

---

## Tax Calculation Endpoints

### POST /tax/calculate

Calculate GST for line items.

**Request:**
```json
{
  "lineItems": [
    {
      "amount": 50000,
      "taxRate": 18,
      "hsn": "6204"
    }
  ],
  "buyerState": "TG",
  "supplierState": "MH"
}
```

**Response (200):**
```json
{
  "success": true,
  "calculation": {
    "lineAmount": 50000,
    "taxableAmount": 50000,
    "cgstAmount": 0,
    "sgstAmount": 0,
    "igstAmount": 9000,
    "totalTax": 9000,
    "isIntrastate": false,
    "taxType": "IGST"
  }
}
```

---

## Payment Endpoints

### POST /payments/record

Record a payment against an invoice.

**Request:**
```json
{
  "invoiceId": "inv_abc123",
  "amount": 295000,
  "method": "bank_transfer",
  "reference": "NEFT-12345",
  "date": "2024-02-03"
}
```

**Response (201):**
```json
{
  "success": true,
  "payment": {
    "id": "pay_abc123",
    "invoiceId": "inv_abc123",
    "amount": 295000,
    "status": "completed",
    "date": "2024-02-03"
  }
}
```

### GET /payments/list

Get list of payments.

**Query Parameters:**
```
GET /payments/list?status=completed&invoiceId=inv_abc123&page=1&limit=20
```

---

## Inventory Endpoints

### POST /inventory/adjust

Record inventory adjustment (sale, return, cancellation).

**Request:**
```json
{
  "invoiceId": "inv_abc123",
  "adjustmentType": "sale",
  "lineItems": [
    {
      "productId": "prod_001",
      "quantity": 5
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "adjustments": [ /* ... */ ]
}
```

### GET /inventory/stock

Get current stock levels.

**Query Parameters:**
```
GET /inventory/stock?productId=prod_001&warehouseId=wh_001
```

**Response (200):**
```json
{
  "success": true,
  "stock": {
    "productId": "prod_001",
    "currentQuantity": 145,
    "reorderPoint": 50,
    "batches": [
      {
        "batchId": "batch_001",
        "quantity": 100,
        "expiryDate": "2025-12-31"
      }
    ]
  }
}
```

---

## Reports Endpoints

### GET /reports/gstr-1

Generate GSTR-1 (outward supplies) report.

**Query Parameters:**
```
GET /reports/gstr-1?month=02&year=2024
```

**Response (200):**
```json
{
  "success": true,
  "gstr1": {
    "period": "2024-02",
    "b2b": {
      "count": 45,
      "totalValue": 1200000,
      "totalTax": 216000
    },
    "b2c": {
      "count": 120,
      "totalValue": 450000,
      "totalTax": 81000
    },
    "exports": {
      "count": 8,
      "totalValue": 250000,
      "totalTax": 0
    },
    "readyToFile": true
  }
}
```

### GET /reports/tax-summary

Get tax summary report.

**Response (200):**
```json
{
  "success": true,
  "summary": {
    "period": "2024-02",
    "totalInvoices": 156,
    "totalSales": 1900000,
    "totalCgst": 159750,
    "totalSgst": 159750,
    "totalIgst": 0,
    "totalTax": 319500
  }
}
```

---

## E-Invoice Endpoints

### POST /einvoice/generate

Generate e-invoice with IRN from NIC API.

**Request:**
```json
{
  "invoiceId": "inv_abc123"
}
```

**Response (201):**
```json
{
  "success": true,
  "eInvoice": {
    "invoiceId": "inv_abc123",
    "irn": "192201000000abc123def456",
    "ackNum": "1082024001000",
    "qrCode": "https://api.invoice.gov.in/qr/...",
    "status": "generated"
  }
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": "Invalid input",
  "details": {
    "field": "invoiceDate",
    "message": "Invalid date format"
  }
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Insufficient permissions for this operation"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Not Found",
  "message": "Invoice with id inv_abc123 not found"
}
```

### 500 Server Error

```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

- Rate limit: 1000 requests per hour per IP
- Rate limit headers:
  - `X-RateLimit-Limit: 1000`
  - `X-RateLimit-Remaining: 999`
  - `X-RateLimit-Reset: 1707381600`

---

## Pagination

All list endpoints support pagination:

```
GET /invoices/list?page=1&limit=20
```

Response includes:
```json
{
  "data": [ /* ... */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

---

## Webhooks

Webhooks for payment completion (coming soon):

```json
{
  "event": "payment.completed",
  "invoice_id": "inv_abc123",
  "amount": 295000,
  "timestamp": "2024-02-03T10:30:00Z"
}
```

Configure webhooks in Settings → Webhooks

---

## Testing

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@abc.com","password":"password"}'

# Create Invoice
curl -X POST http://localhost:3000/api/invoices/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### Using Postman

Import the collection from: `/postman-collection.json`

---

For API support, email: api-support@yourdomain.com
