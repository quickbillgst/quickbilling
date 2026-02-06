# POS System Implementation Guide

## Quick Start

### 1. Access POS Dashboard
Navigate to `/dashboard/pos` to enter the POS Terminal.

### 2. Core POS Flow
```
1. Search/Scan Product (F2)
2. Add Items to Cart
3. Select Customer (F3)
4. Apply Discount if needed (F4)
5. Process Payment (Ctrl+P)
6. Complete Transaction
```

## System Architecture

### Frontend Layer
- **POS Context** (`/lib/context/pos-context.tsx`)
  - State management using useReducer
  - Cart operations (add, update, remove items)
  - Tax calculation
  - Payment tracking

- **Components** (`/components/pos/`)
  - `pos-header.tsx` - Status badges, sync indicator, time
  - `pos-left-panel.tsx` - Product search & barcode scanner
  - `pos-cart-panel.tsx` - Line items with quantity controls
  - `pos-right-panel.tsx` - Totals, customer, payment button
  - `modals/payment-modal.tsx` - Payment processing
  - `modals/discount-modal.tsx` - Discount application
  - `modals/customer-modal.tsx` - Customer selection

### Database Layer
- **IndexedDB** (`/lib/db/indexed-db.ts`)
  - 8 object stores: invoices, lineItems, customers, products, payments, syncQueue, metadata
  - Offline-first architecture
  - Full CRUD operations

- **Sync Engine** (`/lib/db/sync-engine.ts`)
  - Background sync to server
  - Retry logic (max 3 retries)
  - Conflict resolution
  - Network listener

### State Management
```typescript
interface CartState {
  id: string;                    // Invoice ID
  customerId?: string;           // Customer reference
  lineItems: LineItemRecord[];   // Products in cart
  discount: {
    amount: number;
    type: 'fixed' | 'percentage';
    reason?: string;
  };
  subtotal: number;              // Before discount/tax
  totalTax: number;              // Total GST
  totalAmount: number;           // Final amount due
  taxBreakdown: TaxBreakdown;    // CGST/SGST/IGST breakdown
  paymentMethod?: string;
  status: 'draft' | 'processing' | 'completed';
}
```

## Keyboard Shortcuts Reference

### Essential Actions
| Shortcut | Action | Use Case |
|----------|--------|----------|
| F2 | Barcode Scanner | Scan product codes |
| F3 | Customer Lookup | Select/add customer |
| F4 | Apply Discount | Add bulk/special discounts |
| F7 | Clear Cart | Empty cart and start over |
| F9 | Hold Invoice | Pause and resume later (F10) |
| F10 | View Held | Retrieve paused invoices |
| Ctrl+P | Process Payment | Submit to payment modal |
| Esc | Close Modal | Cancel dialog |

### Line Item Controls
| Shortcut | Action |
|----------|--------|
| Ctrl+D | Delete selected item |
| Ctrl+E | Edit line item |
| +/- Buttons | Adjust quantity |
| Tab | Navigate between fields |
| Enter | Confirm input |

## Offline-First Sync Strategy

### Sync States
```
Pending → Syncing → Synced ✓
                 ↘ Failed (retry up to 3x)
```

### Automatic Sync
- Triggers every 30 seconds when online
- Monitors network changes
- Retries failed operations
- Non-blocking (background process)

### Manual Sync
```typescript
const { syncNow } = syncEngine;
await syncNow(); // F5
```

### Sync Queue
Operations are queued locally:
```typescript
{
  id: 'invoice-123',
  entityType: 'invoice',
  operation: 'create',
  status: 'pending',
  retryCount: 0,
  payload: { /* invoice data */ }
}
```

## Tax Calculation

### Automatic Tax Breakdown
For each line item, taxes are calculated as:
- **CGST** = (Unit Price × Quantity × Tax Rate) / 100 / 2
- **SGST** = (Unit Price × Quantity × Tax Rate) / 100 / 2
- **IGST** = (Unit Price × Quantity × Tax Rate) / 100

### Common Tax Rates
- 5% - Groceries, basic food items
- 12% - Processed food, some services
- 18% - Electronics, luxury items
- 28% - Luxury goods, sin goods

## Payment Processing

### Payment Flow
1. User clicks "Process Payment" (Ctrl+P)
2. Payment Modal opens with:
   - Order summary
   - Payment method selection
   - Amount paid input
   - Change calculation
3. Amount validation (must be >= total)
4. Payment submission
5. Invoice generation
6. Receipt printing (optional)
7. Cart cleared for next transaction

### Payment Methods
- Cash
- Card (via POS terminal)
- UPI (via QR code)
- Bank Transfer
- Cheque

### Data Stored
```typescript
{
  invoiceId: string;
  amount: number;
  method: string;
  change: number;
  status: 'processing' | 'completed' | 'failed';
  timestamp: Date;
}
```

## Performance Optimization

### Target Metrics
- Barcode scan to cart: <200ms
- Payment processing: <500ms
- Cart re-render: <100ms
- Search results: <300ms
- Offline switch: <50ms

### Optimization Techniques
1. **Memoization** - useMemo for expensive calculations
2. **Debouncing** - Search queries (300ms)
3. **Virtualization** - Large product lists
4. **Code Splitting** - Modal components loaded on demand
5. **IndexedDB Indexes** - Fast lookups by barcode/category

## Integration with Main System

### API Endpoints to Connect
```typescript
// Invoice Management
POST /api/invoices/create
PUT /api/invoices/:id
DELETE /api/invoices/:id

// Payments
POST /api/payments/record
PUT /api/payments/:id

// Tax Reports
GET /api/reports/gstr-filing
GET /api/reports/tax-summary

// Products & Customers (for POS)
GET /api/products/list
POST /api/customers/search
```

### Local-to-Server Flow
```
User creates invoice offline
↓
Stored in IndexedDB (invoices table)
↓
Added to SyncQueue (pending)
↓
Network comes online
↓
SyncEngine picks up pending items
↓
POST /api/invoices/create with deviceId
↓
Server validates & issues invoice number
↓
Response includes invoiceNumber, invoiceDate
↓
Local record updated with these fields
↓
SyncQueue item marked 'synced'
```

## Error Handling

### Network Errors
- Displays "Offline" badge
- Queues operations locally
- Auto-retries when online
- Shows failed count in header

### Validation Errors
- Barcode not found → "Product not found"
- Customer not selected → "Please select customer"
- Invalid amount → "Invalid payment amount"
- Insufficient payment → "Insufficient amount"

### Sync Errors
- Logged in SyncQueue with error message
- Retried up to 3 times
- Manual retry via UI button
- Admin notification if persistently failed

## Testing Checklist

- [ ] Barcode scanning works (F2)
- [ ] Products add to cart correctly
- [ ] Quantities update (+ / - buttons)
- [ ] Discount applies correctly (fixed & %)
- [ ] Tax calculated correctly (CGST/SGST)
- [ ] Total updates when items change
- [ ] Payment modal shows correct amount
- [ ] Change calculated correctly
- [ ] Customer selection persists
- [ ] Offline mode works without network
- [ ] Sync happens in background
- [ ] Failed operations retry
- [ ] Keyboard shortcuts work
- [ ] Modal closes on Esc
- [ ] Notifications display

## Performance Tips

### For Fast Operations
1. Use barcode scanner (F2) instead of search
2. Create customer shortcuts for regular buyers
3. Use percentage discounts for bulk items
4. Keep product catalog up to date
5. Clear held invoices periodically

### For Offline Use
1. Sync before losing connection
2. Monitor pending operations count
3. Check sync status in header badge
4. Hold invoices (F9) if payment fails
5. Retry manually if auto-sync fails

## Future Enhancements

1. Receipt printing (thermal printer)
2. Partial payments support
3. Loyalty points integration
4. Barcode label generation
5. Inventory tracking from POS
6. Customer loyalty discounts
7. Multi-store POS sync
8. Advanced reporting per terminal
9. Staff performance metrics
10. Biometric authentication
