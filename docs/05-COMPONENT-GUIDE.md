# Component and UI Guide

## Component Architecture

All reusable components are in `/components` directory. All pages are in `/app` directory.

### Folder Structure

```
components/
├── dashboard/
│   ├── sidebar.tsx          # Navigation sidebar
│   └── header.tsx           # Top header bar
├── pos/                     # Point of Sale system
│   ├── pos-header.tsx
│   ├── pos-main-area.tsx
│   ├── pos-left-panel.tsx   # Product browsing
│   ├── pos-cart-panel.tsx   # Shopping cart
│   ├── pos-right-panel.tsx  # Payment panel
│   ├── pos-footer.tsx
│   ├── receipt-printer.tsx
│   └── modals/
│       ├── payment-modal.tsx
│       ├── discount-modal.tsx
│       └── customer-modal.tsx
├── invoices/
│   └── invoice-builder.tsx
└── ui/                      # shadcn/ui components
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── form.tsx
    ├── input.tsx
    ├── select.tsx
    └── (other shadcn components)
```

## Page Structure

### Authentication Pages

#### `/app/(auth)/login/page.tsx`
Login page with email/password form.

**Features:**
- Form validation with React Hook Form
- Zod schema for validation
- Error toast notifications
- Loading state management
- Redirect to dashboard on success

**Key Props:**
- `AuthProvider` wraps authentication context

#### `/app/(auth)/register/page.tsx`
Registration page with business details.

**Features:**
- Multi-step form (optional)
- GSTIN validation
- Password strength indicator
- Terms acceptance checkbox

### Dashboard Pages

#### `/app/dashboard/page.tsx`
Main dashboard home with analytics.

**Features:**
- Key metrics cards
- Monthly revenue chart
- Recent invoices list
- Quick action buttons
- Real-time data with SWR

#### `/app/dashboard/invoices/page.tsx`
Invoice list with filters and actions.

**Features:**
- Sortable table
- Filter by status/date/customer
- Search functionality
- Bulk actions
- Export to PDF

#### `/app/dashboard/invoices/new/page.tsx`
Create/edit invoice page.

**Form Fields:**
- Customer selection (dropdown)
- Invoice date picker
- Due date picker
- Line items table (add/remove)
- Tax breakdown display
- Notes textarea

#### `/app/dashboard/customers/page.tsx`
Customer management.

**Features:**
- Customer list table
- Add/edit/delete actions
- Search by name/email
- GSTIN validation
- Credit limit management

#### `/app/dashboard/products/page.tsx`
Product catalog.

**Features:**
- Product list
- HSN/SAC code display
- Tax rate display
- Add/edit/delete
- Bulk import (optional)

#### `/app/dashboard/inventory/page.tsx`
Stock management.

**Features:**
- Stock levels by product
- Batch tracking
- Expiry monitoring
- Stock adjustments
- Stock history

#### `/app/dashboard/payments/page.tsx`
Payment tracking.

**Features:**
- Payment list
- Filter by customer/date
- Payment methods display
- Aging reports
- Reconciliation

#### `/app/dashboard/reports/page.tsx`
GST and financial reports.

**Reports:**
- GSTR-1 (outward supplies)
- GSTR-3B (monthly summary)
- Revenue by customer
- Tax summary
- Export functionality

#### `/app/dashboard/pos/page.tsx`
Point of Sale interface.

**Features:**
- Product grid/list
- Search and filters
- Shopping cart
- Discount application
- Payment methods
- Billing and receipt
- Keyboard shortcuts

#### `/app/dashboard/settings/page.tsx`
Business settings.

**Sections:**
- Business profile
- GST configuration
- User management
- Role permissions
- Integration settings

## Dashboard Layout

All dashboard pages use `/app/dashboard/layout.tsx` which provides:
- Sidebar navigation
- Header with user menu
- Protected route wrapper
- Theme toggle
- Notification system

### Sidebar Navigation Structure

```
Dashboard Home
├── Invoices
│   ├── View All
│   └── Create New
├── Customers
├── Products & Inventory
│   ├── Products
│   ├── Stock Levels
│   └── Batches
├── Payments
├── Reports
│   ├── GSTR-1
│   ├── GSTR-3B
│   └── Custom Reports
├── Point of Sale
├── Settings
└── Logout
```

## Key Components

### Dashboard Sidebar
**File:** `/components/dashboard/sidebar.tsx`

Responsive navigation sidebar with:
- Logo/branding
- Navigation links
- Collapsible sections
- User profile
- Logout button

```tsx
import { DashboardSidebar } from '@/components/dashboard/sidebar'

<DashboardSidebar />
```

### Dashboard Header
**File:** `/components/dashboard/header.tsx`

Top header bar with:
- Search functionality
- Notifications
- User menu
- Settings quick access

```tsx
import { DashboardHeader } from '@/components/dashboard/header'

<DashboardHeader />
```

### Invoice Builder
**File:** `/components/invoices/invoice-builder.tsx`

Complex form for creating invoices:
- Line items management
- Tax calculations
- Customer selection
- Date pickers

```tsx
import { InvoiceBuilder } from '@/components/invoices/invoice-builder'

<InvoiceBuilder onSubmit={handleSubmit} />
```

### POS Components

**POS Header** (`/components/pos/pos-header.tsx`)
- Terminal identification
- User info
- Quick settings

**POS Main Area** (`/components/pos/pos-main-area.tsx`)
- Product grid/list
- Search and filters
- Category selection

**POS Cart Panel** (`/components/pos/pos-cart-panel.tsx`)
- Shopping cart display
- Item quantity adjustment
- Line item removal
- Running total

**POS Right Panel** (`/components/pos/pos-right-panel.tsx`)
- Payment methods
- Amount tendered
- Change calculation
- Finalize sale

**Payment Modal** (`/components/pos/modals/payment-modal.tsx`)
- Payment method selection
- Card/UPI/Cash entry
- Amount input

**Receipt Printer** (`/components/pos/receipt-printer.tsx`)
- ESC/POS commands
- Receipt formatting
- Print handling

## Styling & Theme

### Color Scheme

**Primary Colors:**
- Primary: #2563eb (Blue)
- Secondary: #7c3aed (Purple)
- Accent: #f59e0b (Amber)

**Neutral Colors:**
- Background: #ffffff / #0f172a
- Surface: #f9fafb / #1e293b
- Text: #1f2937 / #f1f5f9

**Status Colors:**
- Success: #10b981 (Green)
- Warning: #f59e0b (Amber)
- Error: #ef4444 (Red)
- Info: #3b82f6 (Blue)

**GST Tax Colors:**
- CGST: #8b5cf6
- SGST: #ec4899
- IGST: #f59e0b

### Typography

**Font Stack:**
- Sans: Geist, system fonts
- Mono: Geist Mono, monospace

**Sizes:**
- xs: 12px (0.75rem)
- sm: 14px (0.875rem)
- base: 16px (1rem)
- lg: 18px (1.125rem)
- xl: 20px (1.25rem)
- 2xl: 24px (1.5rem)
- 3xl: 30px (1.875rem)

### Spacing Scale

Tailwind CSS spacing scale: 0, 1, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, etc.

Common patterns:
- Card padding: p-4, p-6
- Section gaps: gap-4, gap-6
- Component margins: mb-2, my-4

## Form Patterns

### Basic Form with React Hook Form + Zod

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8)
})

export default function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
    </form>
  )
}
```

### Data Table Pattern

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Invoice #</TableHead>
      <TableHead>Customer</TableHead>
      <TableHead>Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {invoices.map(invoice => (
      <TableRow key={invoice.id}>
        <TableCell>{invoice.invoiceNumber}</TableCell>
        <TableCell>{invoice.customerName}</TableCell>
        <TableCell>{invoice.totalAmount}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Modal Pattern

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function PaymentModal({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        {/* Form content */}
      </DialogContent>
    </Dialog>
  )
}
```

## Data Fetching with SWR

```tsx
import useSWR from 'swr'

export function InvoiceList() {
  const { data, error, isLoading } = useSWR(
    '/api/invoices/list',
    fetcher
  )

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {data.map(invoice => (
        <InvoiceRow key={invoice.id} invoice={invoice} />
      ))}
    </div>
  )
}
```

## State Management

### Authentication Context

```tsx
import { useAuth } from '@/lib/auth-context'

export function UserMenu() {
  const { user, logout } = useAuth()

  return (
    <div>
      <span>{user?.email}</span>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### POS Context

```tsx
import { usePOS } from '@/lib/context/pos-context'

export function Cart() {
  const { cart, removeItem } = usePOS()

  return (
    <div>
      {cart.items.map(item => (
        <CartItem
          key={item.id}
          item={item}
          onRemove={() => removeItem(item.id)}
        />
      ))}
    </div>
  )
}
```

## Accessibility Best Practices

1. **ARIA Labels:**
   ```tsx
   <Button aria-label="Delete invoice">×</Button>
   ```

2. **Semantic HTML:**
   ```tsx
   <main>
     <header>...</header>
     <nav>...</nav>
     <section>...</section>
     <footer>...</footer>
   </main>
   ```

3. **Keyboard Navigation:**
   - Tab through form fields
   - Enter to submit
   - Esc to close modals
   - Arrow keys for menus

4. **Screen Reader Text:**
   ```tsx
   <span className="sr-only">Loading invoices...</span>
   ```

## Testing Components

Example test pattern:

```tsx
import { render, screen } from '@testing-library/react'
import { LoginForm } from './login-form'

describe('LoginForm', () => {
  it('submits login on form submit', () => {
    render(<LoginForm />)
    // Test implementation
  })
})
```
