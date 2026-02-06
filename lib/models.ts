import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

let cachedConnection: typeof mongoose | null = null;

export async function connectDB() {
  if (mongoose.connections[0].readyState === 1) {
    return;
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const connection = await mongoose.connect(MONGODB_URI);
    cachedConnection = connection;
    return connection;
  } catch (error) {
    throw new Error(`MongoDB connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Tenant Schema
const tenantSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, index: true },
    email: { type: String }, // Company contact email
    phone: { type: String }, // Company contact phone
    gstin: { type: String, unique: true, sparse: true, index: true },
    pan: { type: String, unique: true, sparse: true },
    registrationType: {
      type: String,
      enum: ['registered', 'unregistered', 'sez', 'uin'],
      default: 'registered',
    },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'IN' },
    },
    industryCategory: String,
    turnoverAnnual: Number,
    isComposition: { type: Boolean, default: false },
    timezone: { type: String, default: 'Asia/Kolkata' },
    invoicePrefix: { type: String, default: 'INV-' },
    nextInvoiceNumber: { type: Number, default: 1 },
    nonGstInvoicePrefix: { type: String, default: 'BILL-' },
    nextNonGstInvoiceNumber: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['trial', 'active', 'suspended'],
      default: 'trial',
    },
    bankDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      ifscCode: String,
      branchName: String,
    },
    logo: { type: String }, // Base64 encoded logo image
  },
  { timestamps: true }
);

// User Schema
const userSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    email: { type: String, required: true, unique: true, index: true },
    phone: String,
    passwordHash: { type: String, required: true },
    firstName: String,
    lastName: String,
    role: {
      type: String,
      enum: ['owner', 'manager', 'accountant', 'pos_operator', 'viewer'],
      default: 'viewer',
    },
    isActive: { type: Boolean, default: true, index: true },
    isVerified: { type: Boolean, default: false },
    mfaEnabled: { type: Boolean, default: false },
    lastLogin: Date,
    emailPreferences: {
      invoiceSent: { type: Boolean, default: true },
      paymentReceived: { type: Boolean, default: true },
      lowStock: { type: Boolean, default: true },
      gstFiling: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: false },
    },
    notificationPreferences: {
      invoiceCreated: { type: Boolean, default: true },
      invoiceDue: { type: Boolean, default: true },
      invoiceOverdue: { type: Boolean, default: true },
      paymentReceived: { type: Boolean, default: true },
      paymentFailed: { type: Boolean, default: true },
      stockLow: { type: Boolean, default: true },
      stockCritical: { type: Boolean, default: true },
      gstFiling: { type: Boolean, default: true },
      invoiceRequired: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

// Customer Schema
const customerSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: { type: String, required: true, index: true },
    email: { type: String, index: true },
    phone: { type: String, index: true },
    customerType: {
      type: String,
      enum: ['individual', 'business', 'government'],
      default: 'business',
    },
    gstRegistered: { type: Boolean, default: false },
    gstin: { type: String, index: true },
    pan: String,
    billingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
    },
    creditLimit: { type: Number, default: 0 },
    tdsApplicable: { type: Boolean, default: false },
    tdsRate: Number,
    tags: [String],
  },
  { timestamps: true }
);

customerSchema.index({ tenantId: 1, gstin: 1 }, { unique: true, sparse: true });

// Product Schema
const productSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    sku: { type: String, required: true, index: true },
    name: { type: String, required: true, index: true },
    description: String,
    hsnCode: String,
    sacCode: String,
    gstRate: { type: Number, required: true },
    gstType: {
      type: String,
      enum: ['cgst_sgst', 'igst', 'exempt'],
      default: 'cgst_sgst',
    },
    costPrice: Number,
    sellingPrice: { type: Number, required: true },
    trackInventory: { type: Boolean, default: true },
    reorderPoint: { type: Number, default: 10 },
    barcodeValue: String,
    barcodeType: { type: String, enum: ['ean13', 'code128', 'qr'] },
    isService: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

productSchema.index({ tenantId: 1, sku: 1 }, { unique: true });

// Invoice Schema
const invoiceSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    invoiceNumber: { type: String, required: true, index: true },
    invoiceSeries: String,
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    invoiceType: {
      type: String,
      enum: ['invoice', 'credit_note', 'debit_note'],
      default: 'invoice',
    },
    invoiceDate: { type: Date, required: true, index: true },
    dueDate: Date,
    irn: String,
    lineItems: [
      {
        productId: mongoose.Schema.Types.ObjectId,
        description: String,
        hsnCode: String,
        quantity: Number,
        unitPrice: Number,
        discount: { type: Number, default: 0 },
        taxRate: Number,
        lineAmount: Number,
        lineTax: Number,
      },
    ],
    subtotalAmount: Number,
    discountAmount: Number,
    taxableAmount: Number,
    cgstAmount: Number,
    sgstAmount: Number,
    igstAmount: Number,
    totalTaxAmount: Number,
    totalAmount: { type: Number, required: true },
    roundOff: Number,
    isReverseCharge: { type: Boolean, default: false },
    isExport: { type: Boolean, default: false },
    placeOfSupply: String,
    status: {
      type: String,
      enum: ['draft', 'issued', 'partially_paid', 'paid', 'cancelled'],
      default: 'draft',
      index: true,
    },
    notes: String,
    createdByUserId: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
);

invoiceSchema.index({ tenantId: 1, status: 1, invoiceDate: -1 });
invoiceSchema.index({ tenantId: 1, customerId: 1 });
invoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true, sparse: true });

// Payment Schema
const paymentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    paymentReferenceId: { type: String, index: true },
    paymentMethod: {
      type: String,
      enum: ['cash', 'cheque', 'bank_transfer', 'card', 'upi', 'wallet'],
      default: 'cash',
    },
    paymentAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    gatewayName: String,
    paymentDate: Date,
    isReconciled: { type: Boolean, default: false },
    bankReference: String,
    notes: String,
    createdByUserId: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
);

paymentSchema.index({ tenantId: 1, paymentDate: -1 });

// Stock Ledger Schema (Immutable)
const stockLedgerSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    batchId: String,
    entryType: {
      type: String,
      enum: ['inward', 'outward', 'adjustment', 'return'],
      default: 'inward',
    },
    referenceType: String,
    referenceId: { type: String, index: true },
    quantityChange: { type: Number, required: true },
    balanceQuantity: Number,
    unitCost: Number,
    notes: String,
    createdByUserId: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

stockLedgerSchema.index({ tenantId: 1, productId: 1, createdAt: -1 });

// E-Invoice Schema
const eInvoiceSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      unique: true,
    },
    irn: { type: String, unique: true, sparse: true },
    ackNum: String,
    irnGeneratedAt: Date,
    qrCodeUrl: String,
    status: {
      type: String,
      enum: ['pending', 'generated', 'failed', 'cancelled'],
      default: 'pending',
    },
    errorMessage: String,
    errorCode: String,
    cancelledAt: Date,
    cancellationReason: String,
  },
  { timestamps: true }
);

// Audit Log Schema (Immutable)
const auditLogSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actionType: {
      type: String,
      enum: ['create', 'update', 'delete', 'cancel'],
      required: true,
    },
    entityType: { type: String, required: true, index: true },
    entityId: mongoose.Schema.Types.ObjectId,
    ipAddress: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ tenantId: 1, createdAt: -1 });

// Batch Schema
const batchSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    batchNumber: { type: String, required: true, index: true },
    manufacturingDate: Date,
    expiryDate: { type: Date, index: true },
    quantity: { type: Number, default: 0 },
    unitCost: { type: Number, default: 0 },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    poReference: String,
    certifications: [String],
    status: {
      type: String,
      enum: ['active', 'expired', 'archived'],
      default: 'active',
    },
  },
  { timestamps: true }
);

batchSchema.index({ tenantId: 1, productId: 1, batchNumber: 1 }, { unique: true });
batchSchema.index({ tenantId: 1, expiryDate: 1 });

// Export models - use mongoose.models to prevent re-compilation
export const Tenant =
  mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);
export const User =
  mongoose.models.User || mongoose.model('User', userSchema);
export const Customer =
  mongoose.models.Customer || mongoose.model('Customer', customerSchema);
export const Product =
  mongoose.models.Product || mongoose.model('Product', productSchema);
export const Invoice =
  mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
export const Payment =
  mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export const StockLedger =
  mongoose.models.StockLedger ||
  mongoose.model('StockLedger', stockLedgerSchema);
export const EInvoice =
  mongoose.models.EInvoice || mongoose.model('EInvoice', eInvoiceSchema);
export const AuditLog =
  mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
export const Batch =
  mongoose.models.Batch || mongoose.model('Batch', batchSchema);

// Payslip Schema
const payslipSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    payslipNumber: { type: String, required: true, index: true },

    // Employee Information
    employeeName: { type: String, required: true },
    employeeId: { type: String },
    designation: { type: String },
    department: { type: String },
    location: { type: String },
    costCenter: { type: String },
    dateOfBirth: { type: Date },
    dateOfJoining: { type: Date },
    gender: { type: String, enum: ['M', 'F', 'Other'] },

    // Statutory Details
    panNumber: { type: String },
    uan: { type: String }, // Universal Account Number
    pfNumber: { type: String },
    esiNumber: { type: String },
    epsNumber: { type: String },

    // Bank Details
    bankAccountNumber: { type: String },
    bankName: { type: String },
    ifscCode: { type: String },
    branchName: { type: String },

    // Pay Period
    payPeriod: { type: String, required: true }, // e.g., "January 2026"
    payDate: { type: Date, required: true },
    regimeType: { type: String, enum: ['old', 'new'], default: 'new' },

    // Earnings
    basicSalary: { type: Number, default: 0 },
    hra: { type: Number, default: 0 }, // House Rent Allowance
    conveyanceAllowance: { type: Number, default: 0 },
    medicalAllowance: { type: Number, default: 0 },
    foodAllowance: { type: Number, default: 0 },
    specialAllowance: { type: Number, default: 0 },
    otherEarnings: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 },
    milestoneAward: { type: Number, default: 0 },
    internetAllowance: { type: Number, default: 0 },
    shiftAllowance: { type: Number, default: 0 },
    birthdayAllowance: { type: Number, default: 0 },

    // Deductions
    providentFund: { type: Number, default: 0 }, // PF
    professionalTax: { type: Number, default: 0 },
    voluntaryPF: { type: Number, default: 0 },
    foodDeduction: { type: Number, default: 0 },
    incomeTax: { type: Number, default: 0 }, // TDS
    esi: { type: Number, default: 0 }, // Employee State Insurance
    loanDeduction: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },

    // YTD (Year-to-Date) Values
    ytdBasic: { type: Number, default: 0 },
    ytdHra: { type: Number, default: 0 },
    ytdConveyance: { type: Number, default: 0 },
    ytdMedical: { type: Number, default: 0 },
    ytdFood: { type: Number, default: 0 },
    ytdSpecial: { type: Number, default: 0 },
    ytdBonus: { type: Number, default: 0 },
    ytdMilestone: { type: Number, default: 0 },
    ytdInternet: { type: Number, default: 0 },
    ytdShift: { type: Number, default: 0 },
    ytdBirthday: { type: Number, default: 0 },
    ytdGrossEarnings: { type: Number, default: 0 },
    ytdPF: { type: Number, default: 0 },
    ytdPT: { type: Number, default: 0 },
    ytdVPF: { type: Number, default: 0 },
    ytdFoodDeduction: { type: Number, default: 0 },
    ytdIncomeTax: { type: Number, default: 0 },
    ytdTotalDeductions: { type: Number, default: 0 },

    // Summary
    grossEarnings: { type: Number, required: true },
    totalDeductions: { type: Number, required: true },
    netPay: { type: Number, required: true },
    netPayInWords: { type: String },

    // Attendance info
    workingDays: { type: Number },
    presentDays: { type: Number },
    lop: { type: Number, default: 0 }, // Loss of Pay days

    notes: { type: String },
    status: {
      type: String,
      enum: ['draft', 'generated', 'sent', 'paid'],
      default: 'draft',
      index: true,
    },
    createdByUserId: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
);

payslipSchema.index({ tenantId: 1, payslipNumber: 1 }, { unique: true });
payslipSchema.index({ tenantId: 1, employeeName: 1, payPeriod: 1 });

export const Payslip =
  mongoose.models.Payslip || mongoose.model('Payslip', payslipSchema);

// Auth Session Schema
const authSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    device: String, // e.g., "Chrome on Windows"
    ip: String,
    location: String,
    lastActive: { type: Date, default: Date.now },
    isValid: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const AuthSession = mongoose.models.AuthSession || mongoose.model('AuthSession', authSessionSchema);

// Password Reset Schema
const passwordResetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-delete expired tokens after 24 hours
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

export const PasswordReset =
  mongoose.models.PasswordReset || mongoose.model('PasswordReset', passwordResetSchema);

// Alias for backwards compatibility
export const connect = connectDB;
