# POS Screen Flows & Component Architecture

## Screen Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│                  ENTRY POINT                        │
│         /dashboard/pos (Offline-Capable)            │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
   ┌────▼────────┐     ┌────────▼───────┐
   │ Online Mode │     │ Offline Mode    │
   │ (Live API)  │     │ (IndexedDB)     │
   └────┬────────┘     └────────┬───────┘
        │                       │
        │  ┌─────────────────────┘
        │  │
   ┌────▼──▼──────────────────────────┐
   │   POS DASHBOARD (Quick Entry)     │
   │  ┌──────────────────────────────┐ │
   │  │ 1. Search/Scan Barcode      │ │
   │  │ 2. Quick Product List        │ │
   │  │ 3. Cart Summary              │ │
   │  │ 4. Quick Actions             │ │
   │  └──────────────────────────────┘ │
   └────┬───────────────────────────────┘
        │
        ├─► [A] Quick Add Item
        ├─► [B] Edit Cart
        ├─► [C] Discount
        ├─► [D] Payment
        └─► [O] Offline Toggle
```

## Component Hierarchy

```
POSLayout
├── POSHeader
│   ├── OnlineStatus (Badge)
│   ├── SyncStatus (Badge)
│   └── QuickSettings
├── POSMainArea
│   ├── LeftPanel (Product Search)
│   │   ├── BarcodeScanner
│   │   ├── QuickSearch
│   │   └── RecentProducts
│   ├���─ CenterPanel (Cart)
│   │   ├── CartItems
│   │   │   ├── CartLineItem
│   │   │   ├── Quantity Controls
│   │   │   └── Delete Button
│   │   └── CartSummary
│   │       ├── Subtotal
│   │       ├── Discount
│   │       ├── GST Breakdown
│   │       └── Total
│   └── RightPanel (Payment)
│       ├── PaymentMethod
│       ├── PartialPayment
│       ├── PaymentForm
│       └── ActionButtons
├── POSFooter
│   ├── ShortcutHints
│   └── SyncIndicator
└── Modals
    ├── DiscountModal
    ├── PaymentModal
    ├── CustomerModal
    └── OfflineWarning
```

## Data Models

### InvoiceState (Cart)
```typescript
interface CartState {
  invoiceId: string; // local or server
  customerId: string;
  lineItems: LineItem[];
  discount: Discount;
  paymentMethod: PaymentMethod;
  status: 'draft' | 'processing' | 'completed' | 'syncing';
  totalAmount: number;
  taxBreakdown: TaxBreakdown;
  createdAt: Date;
  syncedAt?: Date;
}

interface LineItem {
  id: string;
  productId: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  lineTotal: number;
}
```

### SyncQueue
```typescript
interface SyncQueueItem {
  id: string;
  entityType: 'invoice' | 'payment';
  operation: 'create' | 'update';
  payload: any;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  lastError?: string;
  createdAt: Date;
  syncedAt?: Date;
}
```

## Keyboard Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| F2 | Open barcode scanner | Anytime |
| F3 | Quick customer search | Anytime |
| F4 | Apply discount | Cart active |
| F5 | Refresh/sync data | Anytime |
| F6 | Print receipt | After payment |
| F7 | Clear cart | Cart active |
| F8 | Partial payment | Payment modal |
| F9 | Hold invoice | Cart active |
| F10 | Held invoices | Anytime |
| Ctrl+A | Focus search | Anytime |
| Ctrl+D | Delete line item | Line item focused |
| Ctrl+E | Edit line item | Line item focused |
| Ctrl+P | Process payment | Cart active |
| Ctrl+K | Open command palette | Anytime |
| Esc | Close modal/Cancel | Modal open |
| Tab | Navigate next field | Form active |
| Shift+Tab | Navigate prev field | Form active |
| Enter | Confirm action | Action button |

## Screen Specifications

### POS Dashboard (Main Screen)

**Header**
- Left: Logo + "POS Terminal"
- Center: Current time, online/offline status
- Right: Sync status, notification bell, user menu

**Left Panel (Product Entry)**
- Barcode scanner input (auto-focus, F2 trigger)
- Quick search (Ctrl+A to focus)
- Recent products (last 10)
- Quick categories

**Center Panel (Cart)**
- Line items with:
  - Product name, SKU, quantity
  - Unit price, discount, line total
  - Delete button (Ctrl+D)
- Floating action buttons for add/edit
- Empty state with hints

**Right Panel (Totals & Payment)**
- Subtotal
- Discount amount (button to edit, F4)
- GST breakdown (CGST/SGST)
- Total amount (large, bold)
- Customer button (F3 to change)
- Payment button (Ctrl+P)

**Footer**
- "Online" or "Offline" badge
- Sync status (Syncing... / Synced / Error)
- Keyboard shortcut hints
- Help text

### Payment Modal

- Amount due (read-only)
- Payment method dropdown
- Amount paid input
- Change amount (calculated)
- Partial payment toggle (F8)
- Paid amount history
- Complete payment button
- Hold invoice (F9) / Draft button

### Quick Customer Lookup

- Search by name/phone/GST
- Recent customers list
- Add new customer button
- Tax profile display (GSTIN, TDS rate)

### Held Invoices (F10)

- List of draft invoices
- Resume button
- Delete button
- Time created
- Total amount
- Customer name

## Performance Targets

- Barcode scan to cart: <200ms
- Payment processing: <500ms
- Cart re-render: <100ms
- Offline switch: <50ms
- Search results: <300ms
- Sync operation: Background (non-blocking)
