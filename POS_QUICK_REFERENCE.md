# POS System - Quick Reference Card

## Accessing the POS

```bash
Navigate to: http://localhost:3000/dashboard/pos
```

---

## Sales Transaction Flow

### Step 1: Add Products
```
F2 → Scan barcode OR Type product name → Enter
OR
Click product in left panel
```

### Step 2: Adjust Quantities
```
Click + or - buttons on cart items
OR
Click item quantity field and type new amount
```

### Step 3: Select Customer (Optional)
```
F3 → Search customer by name/phone/GSTIN
OR
Click "Add Customer" in right panel
```

### Step 4: Apply Discount (If Needed)
```
F4 → Enter discount amount or %
OR
Click "Add Discount" in right panel
```

### Step 5: Process Payment
```
Ctrl+P → Select payment method
OR
Click "Process Payment" button
```

---

## Keyboard Shortcut Cheat Sheet

### Most Used (Master These!)
```
F2  = Scan barcode / Open product search
F3  = Customer lookup
F4  = Apply discount
Ctrl+P = Process payment
Esc = Close dialog
```

### Cart Management
```
F7  = Clear entire cart
Ctrl+D = Delete selected item
+/- buttons = Adjust quantity
```

### Invoice Management
```
F9  = Hold invoice (pause transaction)
F10 = View held invoices (resume)
```

### System
```
F5  = Refresh / Manual sync
F6  = Print receipt
Ctrl+K = Command palette
```

### Navigation
```
Tab = Next field
Shift+Tab = Previous field
Enter = Confirm
```

---

## Cart Panel Operations

### Adding Items
```
1. Search product (F2 or type)
2. Click product or scan barcode
3. Item appears in cart
4. Quantity defaults to 1
```

### Editing Items
```
1. Click + button to increase qty
2. Click - button to decrease qty
3. Direct input in qty field
4. Auto-saves to cart
```

### Removing Items
```
1. Click trash icon on item
   OR
2. Select item & press Ctrl+D
3. Item removed from cart
4. Totals update immediately
```

---

## Tax Calculation (Auto)

For each product with price ₹100, tax rate 18%:
```
Line Total = 100 × Quantity

Tax = (100 × 18%) / 100 = ₹18 per unit
CGST = ₹9 (intra-state)
SGST = ₹9 (intra-state)
IGST = ₹18 (inter-state)

Final Price = 100 + 18 = ₹118 (per unit)
```

---

## Payment Methods

### Supported Methods
- **Cash** - Direct payment, no reconciliation
- **Card** - Requires POS terminal, ref number
- **UPI** - Mobile payment, auto-receipt
- **Bank Transfer** - NEFT/RTGS, reference number
- **Cheque** - Requires verification

### Processing Payment
```
1. Total Due: ₹1000
2. Select payment method
3. Enter amount paid (>= Total)
4. Change calculates automatically
5. Confirm payment
6. Receipt prints
7. Cart clears
```

---

## Discount Application

### Fixed Discount
```
F4 → Select "Fixed Amount"
→ Enter ₹ amount
→ Apply
```

### Percentage Discount
```
F4 → Select "Percentage"
→ Enter % (e.g., 10%)
→ Shows final amount
→ Apply
```

### Discount Reason
```
Optional field:
- Bulk purchase
- Loyalty/regular customer
- Damage
- Promotional
- Manager approval
```

---

## Customer Management

### Quick Lookup (F3)
```
Search by:
- Customer name
- Phone number
- GSTIN
- Results show order history
```

### Add New Customer
```
F3 → "New Customer" tab
→ Enter name (required)
→ Optional: phone, GSTIN
→ Create
```

### Customer Benefits
- Auto-populate on future orders
- Track purchase history
- GSTIN for B2B invoicing
- Loyalty/discount eligibility

---

## Offline Mode

### Indicators
```
Header shows badge:
- 🟢 Green = Online
- 🔴 Red = Offline
```

### Working Offline
```
✓ Can scan products
✓ Can add to cart
✓ Can apply discounts
✓ Can process payment (locally stored)
✓ Can print receipt

✗ Cannot sync to server
✗ Cannot access server products
✗ Cannot verify customer GSTIN
```

### Auto-Sync When Online
```
- Automatic every 30 seconds
- Shows "Syncing..." badge
- Uploads pending invoices
- Marks as synced when done
```

### Manual Sync
```
Press F5 to force sync immediately
```

---

## Receipt Printing

### Automatic
```
After payment → Receipt prints automatically
```

### Manual Print
```
After payment, click "Print Receipt"
OR
Press F6
```

### Receipt Contains
```
- Business details (name, GSTIN)
- Date & time
- Invoice number
- Customer details (if provided)
- All items with prices
- Tax breakdown
- Payment method
- Total amount
```

---

## Held Invoices

### Why Hold an Invoice?
```
- Customer needs to decide
- Payment method unavailable
- Waiting for verification
- Network issues
```

### Holding (F9)
```
- Current cart status: Draft
- Invoice saved locally
- Cart clears
- Can create new invoice
```

### Resuming (F10)
```
- View list of held invoices
- Click to resume
- Cart populates with items
- Continue from where left off
```

---

## Troubleshooting Quick Fix

### Problem: Barcode not found
```
Solution: 
1. Check barcode is correct
2. Product may not be in system
3. Try searching by product name
4. Add to inventory if missing
```

### Problem: Payment failing
```
Solution:
1. Check internet connection
2. Verify amount is correct
3. Try different payment method
4. Hold invoice and retry
```

### Problem: Customer not found
```
Solution:
1. Check spelling of name
2. Try searching by phone
3. Create new customer
4. Continue without customer (cash)
```

### Problem: Offline badge appears
```
Solution:
1. Check wifi/network connection
2. Press F5 to retry sync
3. Continue - operations saved locally
4. System auto-syncs when online
```

### Problem: Cart not updating
```
Solution:
1. Try refreshing (F5)
2. Close and reopen POS
3. Check browser storage (not full)
4. Clear cache and reload
```

---

## Performance Tips

### Faster Operations
```
1. Use barcode scanner (fastest)
2. Use recent products list
3. Pre-select customer at start
4. Use category filters
5. Keep product catalog updated
```

### Better Offline Experience
```
1. Sync before losing connection (F5)
2. Download daily product updates
3. Keep customer list cached
4. Monitor sync status badge
5. Hold invoices for later if needed
```

### Tips for High Volume
```
1. Use keyboard shortcuts (much faster)
2. Master F2, F3, F4, Ctrl+P
3. Batch similar transactions
4. Use discounts efficiently
5. Clear held invoices regularly
```

---

## Common Transactions

### Quick Sale (No Customer)
```
1. F2 (scan) or click product
2. Add items to cart
3. Ctrl+P (payment)
4. Cash payment
5. Done! Receipt prints
```

### B2B Transaction (With GSTIN)
```
1. F3 (select customer with GSTIN)
2. F2 (add products)
3. F4 (apply bulk discount if needed)
4. Ctrl+P (payment)
5. Payment method selection
6. Invoice with GSTIN recorded
```

### Bulk Purchase
```
1. Select customer (F3)
2. Add multiple products
3. Increase quantities with + button
4. Apply percentage discount (F4)
5. Ctrl+P payment
6. Print receipt
```

---

## Key Files to Know

```
POS Interface:      /app/dashboard/pos/
Components:        /components/pos/
State Management:  /lib/context/pos-context.tsx
Database:          /lib/db/indexed-db.ts
Sync Engine:       /lib/db/sync-engine.ts
Keyboard Hooks:    /lib/hooks/useKeyboardShortcuts.ts

Documentation:
- /POS_SYSTEM_SUMMARY.md
- /POS_GUIDE.md
- /SCREEN_FLOWS.md
```

---

## Contact & Support

For issues or questions:
1. Check `/POS_GUIDE.md` for detailed explanation
2. Check `/POS_SYSTEM_SUMMARY.md` for architecture
3. Review `/SCREEN_FLOWS.md` for component hierarchy
4. Check keyboard shortcuts in this document
5. Review error messages in notification area

---

**Last Updated**: 2024-02-03
**Version**: 1.0.0
**Status**: Production Ready
