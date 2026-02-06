import mongoose, { Schema, Document } from 'mongoose';

// ============================================================================
// TENANT & ORGANIZATION SCHEMAS
// ============================================================================

export interface ITenant extends Document {
  _id: string;
  businessName: string;
  gstin: string;
  pan: string;
  registrationType: 'registered' | 'unregistered' | 'sez' | 'uin';
  financialYearStart: number; // Month (1-12)
  
  // Address
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  
  // Business Details
  businessType: string;
  industryCategory: string;
  turnoverAnnual: number;
  isComposition: boolean;
  
  // Configuration
  currency: string;
  timezone: string;
  
  // Status
  status: 'trial' | 'active' | 'suspended' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const TenantSchema = new Schema<ITenant>(
  {
    businessName: { type: String, required: true, index: true },
    gstin: { type: String, unique: true, sparse: true, index: true },
    pan: { type: String, unique: true, sparse: true },
    registrationType: { type: String, enum: ['registered', 'unregistered', 'sez', 'uin'], default: 'registered' },
    financialYearStart: { type: Number, default: 4 },
    
    address: {
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, required: true },
      state: { type: String, required: true, index: true },
      pincode: String,
      country: { type: String, default: 'IN' },
    },
    
    businessType: String,
    industryCategory: String,
    turnoverAnnual: Number,
    isComposition: { type: Boolean, default: false },
    
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    
    status: { type: String, enum: ['trial', 'active', 'suspended', 'cancelled'], default: 'active', index: true },
    deletedAt: { type: Date, index: true },
  },
  { timestamps: true }
);

// ============================================================================
// USER & AUTHENTICATION SCHEMAS
// ============================================================================

export interface IUser extends Document {
  _id: string;
  tenantId: string;
  email: string;
  phone?: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'manager' | 'accountant' | 'pos_operator' | 'viewer';
  isActive: boolean;
  isVerified: boolean;
  mfaEnabled: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    tenantId: { type: String, required: true, index: true, ref: 'Tenant' },
    email: { type: String, required: true, index: true },
    phone: String,
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, enum: ['owner', 'manager', 'accountant', 'pos_operator', 'viewer'], default: 'viewer' },
    isActive: { type: Boolean, default: true, index: true },
    isVerified: { type: Boolean, default: false },
    mfaEnabled: { type: Boolean, default: false },
    lastLogin: Date,
  },
  { timestamps: true }
);

UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });

// ============================================================================
// CUSTOMER & SUPPLIER SCHEMAS
// ============================================================================

export interface ICustomer extends Document {
  _id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  customerType: 'individual' | 'business' | 'government';
  
  // Tax Details
  gstRegistered: boolean;
  gstin?: string;
  pan?: string;
  
  // Addresses
  addresses: Array<{
    type: 'billing' | 'shipping';
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
  }>;
  
  // Billing
  creditLimit: number;
  creditUsed: number;
  outstandingAmount: number;
  
  // Compliance
  tdsTdsApplicable: boolean;
  tdsRate?: number;
  
  // Metadata
  tags: string[];
  notes?: string;
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    tenantId: { type: String, required: true, index: true, ref: 'Tenant' },
    name: { type: String, required: true, index: true },
    email: { type: String, index: true },
    phone: { type: String, index: true },
    customerType: { type: String, enum: ['individual', 'business', 'government'], default: 'business' },
    
    gstRegistered: { type: Boolean, default: false },
    gstin: { type: String, index: true },
    pan: String,
    
    addresses: [
      {
        type: { type: String, enum: ['billing', 'shipping'], required: true },
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String,
        isDefault: Boolean,
      },
    ],
    
    creditLimit: { type: Number, default: 0 },
    creditUsed: { type: Number, default: 0 },
    outstandingAmount: { type: Number, default: 0, index: true },
    
    tdsTdsApplicable: { type: Boolean, default: false },
    tdsRate: Number,
    
    tags: [String],
    notes: String,
    isActive: { type: Boolean, default: true, index: true },
    deletedAt: Date,
  },
  { timestamps: true }
);

CustomerSchema.index({ tenantId: 1, gstin: 1 }, { unique: true, sparse: true });

// ============================================================================
// PRODUCT & INVENTORY SCHEMAS
// ============================================================================

export interface IProduct extends Document {
  _id: string;
  tenantId: string;
  sku: string;
  name: string;
  description?: string;
  
  // Classification
  category?: string;
  hsn?: string; // Harmonized System Nomenclature
  sac?: string; // Service Accounting Code
  
  // Tax
  gstRate: number; // 5, 12, 18, 28
  gstType: 'cgst_sgst' | 'igst' | 'exempt';
  cessRate?: number;
  
  // Pricing
  costPrice: number;
  sellingPrice: number;
  
  // Inventory
  trackInventory: boolean;
  reorderPoint: number;
  reorderQty: number;
  
  // Barcode
  barcode?: string;
  barcodeType?: 'ean13' | 'code128' | 'qr';
  
  // Status
  isService: boolean;
  isActive: boolean;
  hasVariants: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    tenantId: { type: String, required: true, index: true, ref: 'Tenant' },
    sku: { type: String, required: true, index: true },
    name: { type: String, required: true, index: true },
    description: String,
    
    category: String,
    hsn: { type: String, index: true },
    sac: { type: String, index: true },
    
    gstRate: { type: Number, required: true },
    gstType: { type: String, enum: ['cgst_sgst', 'igst', 'exempt'], default: 'cgst_sgst' },
    cessRate: { type: Number, default: 0 },
    
    costPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    
    trackInventory: { type: Boolean, default: true },
    reorderPoint: { type: Number, default: 10 },
    reorderQty: { type: Number, default: 100 },
    
    barcode: { type: String, index: true },
    barcodeType: String,
    
    isService: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    hasVariants: { type: Boolean, default: false },
    
    deletedAt: Date,
  },
  { timestamps: true }
);

ProductSchema.index({ tenantId: 1, sku: 1 }, { unique: true });

// ============================================================================
// BATCH & INVENTORY LEDGER SCHEMAS
// ============================================================================

export interface IBatch extends Document {
  _id: string;
  tenantId: string;
  productId: string;
  
  batchNumber: string;
  manufacturingDate?: Date;
  expiryDate?: Date;
  
  quantityReceived: number;
  unitOfMeasure: string;
  unitCost: number;
  
  supplierId?: string;
  supplierReference?: string;
  
  qualityStatus: 'pending' | 'passed' | 'rejected';
  qualityNotes?: string;
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    tenantId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true, ref: 'Product' },
    
    batchNumber: { type: String, required: true, index: true },
    manufacturingDate: Date,
    expiryDate: { type: Date, index: true },
    
    quantityReceived: { type: Number, required: true },
    unitOfMeasure: { type: String, default: 'piece' },
    unitCost: { type: Number, required: true },
    
    supplierId: { type: String, ref: 'Supplier' },
    supplierReference: String,
    
    qualityStatus: { type: String, enum: ['pending', 'passed', 'rejected'], default: 'pending' },
    qualityNotes: String,
    
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

BatchSchema.index({ tenantId: 1, productId: 1, batchNumber: 1 }, { unique: true });

// IMMUTABLE STOCK LEDGER
export interface IStockLedgerEntry extends Document {
  _id: string;
  tenantId: string;
  productId: string;
  warehouseId?: string;
  batchId?: string;
  
  // Transaction
  entryType: 'inward' | 'outward' | 'adjustment' | 'waste' | 'return' | 'transfer';
  referenceType: 'purchase' | 'sales' | 'manual' | 'return_inward' | 'return_outward';
  referenceId: string;
  
  // Quantity
  quantityChange: number;
  balanceQuantity: number;
  
  // Valuation
  unitCost: number;
  totalValue: number;
  
  notes?: string;
  createdByUserId: string;
  createdAt: Date;
}

const StockLedgerSchema = new Schema<IStockLedgerEntry>(
  {
    tenantId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    warehouseId: String,
    batchId: String,
    
    entryType: { type: String, enum: ['inward', 'outward', 'adjustment', 'waste', 'return', 'transfer'], required: true },
    referenceType: { type: String, enum: ['purchase', 'sales', 'manual', 'return_inward', 'return_outward'], required: true },
    referenceId: { type: String, required: true, index: true },
    
    quantityChange: { type: Number, required: true },
    balanceQuantity: { type: Number, required: true },
    
    unitCost: { type: Number, required: true },
    totalValue: { type: Number, required: true },
    
    notes: String,
    createdByUserId: { type: String, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

StockLedgerSchema.index({ tenantId: 1, productId: 1, createdAt: -1 });
StockLedgerSchema.index({ tenantId: 1, referenceId: 1 });

// ============================================================================
// INVOICE & INVOICING SCHEMAS
// ============================================================================

export interface IInvoiceLineItem extends Document {
  productId: string;
  batchId?: string;
  description: string;
  hsn?: string;
  sac?: string;
  
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  lineAmount: number;
  
  taxRate: number;
  lineTaxAmount: number;
}

export interface IInvoiceTaxBreak extends Document {
  taxType: 'cgst' | 'sgst' | 'igst' | 'cess' | 'tds';
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface IInvoice extends Document {
  _id: string;
  tenantId: string;
  
  // Invoice Identity
  invoiceNumber: string;
  invoiceSeries: string;
  invoiceType: 'invoice' | 'credit_note' | 'debit_note' | 'proforma';
  
  // Parties
  customerId: string;
  supplierId?: string;
  
  // Dates
  invoiceDate: Date;
  dueDate?: Date;
  
  // Amounts (in smallest unit, e.g., paise)
  subtotalAmount: number;
  discountAmount: number;
  taxableAmount: number;
  
  // Tax Breakdown
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  tdsAmount: number;
  totalTaxAmount: number;
  totalAmount: number;
  
  // Line Items & Tax
  lineItems: IInvoiceLineItem[];
  taxBreaks: IInvoiceTaxBreak[];
  
  // Special Cases
  isReverseCharge: boolean;
  isExport: boolean;
  isSez: boolean;
  placeOfSupply: string;
  
  // Status
  status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'cancelled' | 'overdue';
  
  // E-Invoice
  irn?: string;
  qrCodeUrl?: string;
  
  // References
  referenceInvoiceId?: string;
  
  // Notes
  internalNotes?: string;
  customerNotes?: string;
  
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const InvoiceLineItemSchema = new Schema<IInvoiceLineItem>({
  productId: { type: String, ref: 'Product' },
  batchId: String,
  description: { type: String, required: true },
  hsn: String,
  sac: String,
  
  quantity: { type: Number, required: true },
  unitOfMeasure: { type: String, default: 'piece' },
  unitPrice: { type: Number, required: true },
  
  discountType: String,
  discountValue: Number,
  lineAmount: { type: Number, required: true },
  
  taxRate: { type: Number, required: true },
  lineTaxAmount: { type: Number, required: true },
}, { _id: true });

const InvoiceTaxBreakSchema = new Schema<IInvoiceTaxBreak>({
  taxType: { type: String, enum: ['cgst', 'sgst', 'igst', 'cess', 'tds'], required: true },
  taxRate: Number,
  taxableAmount: Number,
  taxAmount: Number,
}, { _id: false });

const InvoiceSchema = new Schema<IInvoice>(
  {
    tenantId: { type: String, required: true, index: true },
    
    invoiceNumber: { type: String, required: true, index: true },
    invoiceSeries: { type: String, required: true },
    invoiceType: { type: String, enum: ['invoice', 'credit_note', 'debit_note', 'proforma'], default: 'invoice' },
    
    customerId: { type: String, required: true, index: true, ref: 'Customer' },
    supplierId: { type: String, ref: 'Supplier' },
    
    invoiceDate: { type: Date, required: true, index: true },
    dueDate: Date,
    
    subtotalAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    taxableAmount: { type: Number, required: true },
    
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    cessAmount: { type: Number, default: 0 },
    tdsAmount: { type: Number, default: 0 },
    totalTaxAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    
    lineItems: [InvoiceLineItemSchema],
    taxBreaks: [InvoiceTaxBreakSchema],
    
    isReverseCharge: { type: Boolean, default: false },
    isExport: { type: Boolean, default: false },
    isSez: { type: Boolean, default: false },
    placeOfSupply: String,
    
    status: { type: String, enum: ['draft', 'issued', 'partially_paid', 'paid', 'cancelled', 'overdue'], default: 'draft', index: true },
    
    irn: { type: String, index: true },
    qrCodeUrl: String,
    
    referenceInvoiceId: String,
    
    internalNotes: String,
    customerNotes: String,
    
    createdByUserId: { type: String, ref: 'User', required: true },
    deletedAt: Date,
  },
  { timestamps: true }
);

InvoiceSchema.index({ tenantId: 1, status: 1, invoiceDate: -1 });
InvoiceSchema.index({ tenantId: 1, customerId: 1 });
InvoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true, sparse: true });

// ============================================================================
// PAYMENT & ACCOUNTING SCHEMAS
// ============================================================================

export interface IPayment extends Document {
  _id: string;
  tenantId: string;
  invoiceId: string;
  
  paymentReferenceId?: string;
  paymentMethod: 'cash' | 'cheque' | 'bank_transfer' | 'card' | 'upi' | 'wallet' | 'other';
  
  paymentAmount: number;
  currency: string;
  
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  
  gatewayName?: string;
  gatewayResponse?: any;
  
  paymentDate: Date;
  processedAt?: Date;
  
  isReconciled: boolean;
  bankReference?: string;
  bankStatementDate?: Date;
  
  notes?: string;
  receiptNumber?: string;
  
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    tenantId: { type: String, required: true, index: true },
    invoiceId: { type: String, required: true, index: true, ref: 'Invoice' },
    
    paymentReferenceId: { type: String, index: true },
    paymentMethod: { type: String, enum: ['cash', 'cheque', 'bank_transfer', 'card', 'upi', 'wallet', 'other'], required: true },
    
    paymentAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'], default: 'pending', index: true },
    
    gatewayName: String,
    gatewayResponse: Schema.Types.Mixed,
    
    paymentDate: { type: Date, required: true },
    processedAt: Date,
    
    isReconciled: { type: Boolean, default: false },
    bankReference: String,
    bankStatementDate: Date,
    
    notes: String,
    receiptNumber: String,
    
    createdByUserId: { type: String, ref: 'User', required: true },
  },
  { timestamps: true }
);

PaymentSchema.index({ tenantId: 1, paymentDate: -1 });

// GENERAL LEDGER (IMMUTABLE ACCOUNTING)
export interface ILedgerEntry extends Document {
  _id: string;
  tenantId: string;
  
  entryType: 'debit' | 'credit';
  accountCode: string;
  accountName: string;
  
  amount: number;
  referenceType: string;
  referenceId: string;
  
  description: string;
  createdByUserId: string;
  createdAt: Date;
}

const LedgerEntrySchema = new Schema<ILedgerEntry>(
  {
    tenantId: { type: String, required: true, index: true },
    
    entryType: { type: String, enum: ['debit', 'credit'], required: true },
    accountCode: { type: String, required: true, index: true },
    accountName: { type: String, required: true },
    
    amount: { type: Number, required: true },
    referenceType: { type: String, required: true },
    referenceId: { type: String, required: true, index: true },
    
    description: String,
    createdByUserId: { type: String, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

LedgerEntrySchema.index({ tenantId: 1, accountCode: 1, createdAt: -1 });
LedgerEntrySchema.index({ tenantId: 1, referenceId: 1 });

// ============================================================================
// AUDIT LOG SCHEMA (IMMUTABLE)
// ============================================================================

export interface IAuditLog extends Document {
  _id: string;
  tenantId: string;
  userId: string;
  
  actionType: 'create' | 'update' | 'delete' | 'cancel' | 'export' | 'approve';
  entityType: string;
  entityId: string;
  
  oldValues?: any;
  newValues?: any;
  changeDescription?: string;
  
  ipAddress?: string;
  userAgent?: string;
  
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    
    actionType: { type: String, enum: ['create', 'update', 'delete', 'cancel', 'export', 'approve'], required: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    
    oldValues: Schema.Types.Mixed,
    newValues: Schema.Types.Mixed,
    changeDescription: String,
    
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ tenantId: 1, createdAt: -1 });
AuditLogSchema.index({ tenantId: 1, entityType: 1, entityId: 1 });

// ============================================================================
// E-INVOICE SCHEMA
// ============================================================================

export interface IEInvoice extends Document {
  _id: string;
  tenantId: string;
  invoiceId: string;
  
  irn: string;
  ackNum?: string;
  irnGeneratedAt: Date;
  
  qrCodeUrl: string;
  invoiceJson: any;
  
  status: 'pending' | 'generated' | 'failed' | 'cancelled';
  errorMessage?: string;
  errorCode?: string;
  
  cancelledAt?: Date;
  cancellationReason?: string;
  
  validFrom: Date;
  validTill: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const EInvoiceSchema = new Schema<IEInvoice>(
  {
    tenantId: { type: String, required: true, index: true },
    invoiceId: { type: String, required: true, unique: true, ref: 'Invoice' },
    
    irn: { type: String, index: true },
    ackNum: String,
    irnGeneratedAt: Date,
    
    qrCodeUrl: String,
    invoiceJson: Schema.Types.Mixed,
    
    status: { type: String, enum: ['pending', 'generated', 'failed', 'cancelled'], default: 'pending', index: true },
    errorMessage: String,
    errorCode: String,
    
    cancelledAt: Date,
    cancellationReason: String,
    
    validFrom: Date,
    validTill: Date,
  },
  { timestamps: true }
);

// ============================================================================
// EXPORTS
// ============================================================================

export const Tenant = mongoose.model<ITenant>('Tenant', TenantSchema);
export const User = mongoose.model<IUser>('User', UserSchema);
export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
export const Product = mongoose.model<IProduct>('Product', ProductSchema);
export const Batch = mongoose.model<IBatch>('Batch', BatchSchema);
export const StockLedger = mongoose.model<IStockLedgerEntry>('StockLedger', StockLedgerSchema);
export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
export const LedgerEntry = mongoose.model<ILedgerEntry>('LedgerEntry', LedgerEntrySchema);
export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export const EInvoice = mongoose.model<IEInvoice>('EInvoice', EInvoiceSchema);
