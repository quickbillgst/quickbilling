// LedgerEntry is not yet exported from /lib/models, defining interface here
class LedgerEntry {
  _id?: string;
  tenantId: string;
  entryType: 'debit' | 'credit';
  accountCode: string;
  accountName: string;
  amount: number;
  referenceType: string;
  referenceId: string;
  description?: string;
  createdByUserId?: string;
  createdAt?: Date;

  constructor(entry: any) {
    this._id = entry._id;
    this.tenantId = entry.tenantId;
    this.entryType = entry.entryType;
    this.accountCode = entry.accountCode;
    this.accountName = entry.accountName;
    this.amount = entry.amount;
    this.referenceType = entry.referenceType;
    this.referenceId = entry.referenceId;
    this.description = entry.description;
    this.createdByUserId = entry.createdByUserId;
    this.createdAt = entry.createdAt;
  }
}

import { Types } from 'mongoose';

// ============================================================================
// CHART OF ACCOUNTS
// ============================================================================

const CHART_OF_ACCOUNTS = {
  // ASSETS
  '1000': { name: 'Cash', type: 'asset', debitIncrease: true },
  '1010': { name: 'Bank Accounts', type: 'asset', debitIncrease: true },
  '1100': { name: 'Accounts Receivable', type: 'asset', debitIncrease: true },
  '1200': { name: 'Inventory', type: 'asset', debitIncrease: true },
  
  // LIABILITIES
  '2000': { name: 'Accounts Payable', type: 'liability', debitIncrease: false },
  '2100': { name: 'GST Payable (CGST)', type: 'liability', debitIncrease: false },
  '2110': { name: 'GST Payable (SGST)', type: 'liability', debitIncrease: false },
  '2120': { name: 'GST Payable (IGST)', type: 'liability', debitIncrease: false },
  '2200': { name: 'Tax Deducted at Source', type: 'liability', debitIncrease: false },
  
  // EQUITY
  '3000': { name: 'Capital', type: 'equity', debitIncrease: false },
  '3100': { name: 'Retained Earnings', type: 'equity', debitIncrease: false },
  
  // REVENUE
  '4000': { name: 'Sales - Local (GST)', type: 'revenue', debitIncrease: false },
  '4100': { name: 'Sales - Interstate (GST)', type: 'revenue', debitIncrease: false },
  '4200': { name: 'Sales - Export', type: 'revenue', debitIncrease: false },
  '4300': { name: 'Sales - SEZ', type: 'revenue', debitIncrease: false },
  
  // EXPENSES
  '5000': { name: 'Cost of Goods Sold', type: 'expense', debitIncrease: true },
  '5100': { name: 'Purchase - Local', type: 'expense', debitIncrease: true },
  '5200': { name: 'Purchase - Interstate', type: 'expense', debitIncrease: true },
  '5300': { name: 'Purchase - Import', type: 'expense', debitIncrease: true },
  '5400': { name: 'Freight & Forwarding', type: 'expense', debitIncrease: true },
  '5500': { name: 'Returns & Adjustments', type: 'expense', debitIncrease: true },
  
  // INPUT TAX CREDIT
  '6000': { name: 'Input Tax Credit (CGST)', type: 'asset', debitIncrease: true },
  '6100': { name: 'Input Tax Credit (SGST)', type: 'asset', debitIncrease: true },
  '6200': { name: 'Input Tax Credit (IGST)', type: 'asset', debitIncrease: true },
};

// ============================================================================
// GENERAL LEDGER SERVICE
// ============================================================================

export interface LedgerEntryInput {
  entryType: 'debit' | 'credit';
  accountCode: string;
  accountName: string;
  amount: number;
  referenceType: string;
  referenceId: string;
  description?: string;
  tenantId: string;
  createdByUserId: string;
}

export async function createLedgerEntry(entry: LedgerEntryInput): Promise<void> {
  const newEntry = new LedgerEntry({
    _id: new Types.ObjectId(),
    tenantId: entry.tenantId,
    entryType: entry.entryType,
    accountCode: entry.accountCode,
    accountName: entry.accountName,
    amount: entry.amount,
    referenceType: entry.referenceType,
    referenceId: entry.referenceId,
    description: entry.description,
    createdByUserId: entry.createdByUserId,
  });
  
  await newEntry.save();
}

// ============================================================================
// INVOICE POSTING
// ============================================================================

export async function postInvoiceToGL(
  tenantId: string,
  invoiceId: string,
  customerId: string,
  totalAmount: number,
  cgstAmount: number,
  sgstAmount: number,
  igstAmount: number,
  isExport: boolean,
  isIntrastate: boolean,
  createdByUserId: string
): Promise<void> {
  // Debit: Accounts Receivable
  await createLedgerEntry({
    entryType: 'debit',
    accountCode: '1100',
    accountName: 'Accounts Receivable',
    amount: totalAmount,
    referenceType: 'invoice',
    referenceId: invoiceId,
    description: `Invoice ${invoiceId}`,
    tenantId,
    createdByUserId,
  });
  
  // Credit: Sales account (varies by transaction type)
  const saleAmount = totalAmount - cgstAmount - sgstAmount - igstAmount;
  let saleAccountCode = '4000';
  
  if (isExport) {
    saleAccountCode = '4200';
  } else if (igstAmount > 0) {
    saleAccountCode = '4100'; // Interstate
  } else {
    saleAccountCode = '4000'; // Local
  }
  
  await createLedgerEntry({
    entryType: 'credit',
    accountCode: saleAccountCode,
    accountName: CHART_OF_ACCOUNTS[saleAccountCode as keyof typeof CHART_OF_ACCOUNTS].name,
    amount: saleAmount,
    referenceType: 'invoice',
    referenceId: invoiceId,
    description: `Sales - Invoice ${invoiceId}`,
    tenantId,
    createdByUserId,
  });
  
  // Credit: GST Payable (if applicable)
  if (cgstAmount > 0) {
    await createLedgerEntry({
      entryType: 'credit',
      accountCode: '2100',
      accountName: 'GST Payable (CGST)',
      amount: cgstAmount,
      referenceType: 'invoice',
      referenceId: invoiceId,
      description: `CGST - Invoice ${invoiceId}`,
      tenantId,
      createdByUserId,
    });
  }
  
  if (sgstAmount > 0) {
    await createLedgerEntry({
      entryType: 'credit',
      accountCode: '2110',
      accountName: 'GST Payable (SGST)',
      amount: sgstAmount,
      referenceType: 'invoice',
      referenceId: invoiceId,
      description: `SGST - Invoice ${invoiceId}`,
      tenantId,
      createdByUserId,
    });
  }
  
  if (igstAmount > 0) {
    await createLedgerEntry({
      entryType: 'credit',
      accountCode: '2120',
      accountName: 'GST Payable (IGST)',
      amount: igstAmount,
      referenceType: 'invoice',
      referenceId: invoiceId,
      description: `IGST - Invoice ${invoiceId}`,
      tenantId,
      createdByUserId,
    });
  }
}

// ============================================================================
// PAYMENT POSTING
// ============================================================================

export async function postPaymentToGL(
  tenantId: string,
  paymentId: string,
  invoiceId: string,
  paymentAmount: number,
  paymentMethod: string,
  createdByUserId: string
): Promise<void> {
  // Determine bank/cash account
  let bankAccountCode = '1000'; // Cash by default
  if (paymentMethod === 'bank_transfer' || paymentMethod === 'cheque') {
    bankAccountCode = '1010'; // Bank account
  }
  
  // Debit: Bank/Cash
  await createLedgerEntry({
    entryType: 'debit',
    accountCode: bankAccountCode,
    accountName: CHART_OF_ACCOUNTS[bankAccountCode as keyof typeof CHART_OF_ACCOUNTS].name,
    amount: paymentAmount,
    referenceType: 'payment',
    referenceId: paymentId,
    description: `Payment for Invoice ${invoiceId} via ${paymentMethod}`,
    tenantId,
    createdByUserId,
  });
  
  // Credit: Accounts Receivable
  await createLedgerEntry({
    entryType: 'credit',
    accountCode: '1100',
    accountName: 'Accounts Receivable',
    amount: paymentAmount,
    referenceType: 'payment',
    referenceId: paymentId,
    description: `Payment received for Invoice ${invoiceId}`,
    tenantId,
    createdByUserId,
  });
}

// ============================================================================
// STOCK MOVEMENT POSTING
// ============================================================================

export async function postStockMovementToGL(
  tenantId: string,
  productId: string,
  entryType: 'inward' | 'outward',
  quantity: number,
  unitCost: number,
  referenceId: string,
  referenceType: string,
  createdByUserId: string
): Promise<void> {
  const totalValue = quantity * unitCost;
  
  if (entryType === 'inward') {
    // Purchase: Debit Inventory, Credit AP or Expense
    await createLedgerEntry({
      entryType: 'debit',
      accountCode: '1200',
      accountName: 'Inventory',
      amount: totalValue,
      referenceType: referenceType,
      referenceId,
      description: `Purchase: ${quantity} units @ ${unitCost} (Ref: ${referenceId})`,
      tenantId,
      createdByUserId,
    });
  } else {
    // Sale: Debit COGS, Credit Inventory
    await createLedgerEntry({
      entryType: 'debit',
      accountCode: '5000',
      accountName: 'Cost of Goods Sold',
      amount: totalValue,
      referenceType: referenceType,
      referenceId,
      description: `COGS: ${quantity} units @ ${unitCost} (Ref: ${referenceId})`,
      tenantId,
      createdByUserId,
    });
    
    await createLedgerEntry({
      entryType: 'credit',
      accountCode: '1200',
      accountName: 'Inventory',
      amount: totalValue,
      referenceType: referenceType,
      referenceId,
      description: `Inventory Reduction: ${quantity} units (Ref: ${referenceId})`,
      tenantId,
      createdByUserId,
    });
  }
}

// ============================================================================
// TRIAL BALANCE
// ============================================================================

export async function generateTrialBalance(
  tenantId: string,
  fromDate?: Date,
  toDate?: Date
): Promise<{
  totalDebits: number;
  totalCredits: number;
  accounts: Array<{
    accountCode: string;
    accountName: string;
    debitAmount: number;
    creditAmount: number;
    balance: number;
    balanceType: 'debit' | 'credit';
  }>;
  isBalanced: boolean;
}> {
  const query: any = { tenantId };
  
  if (fromDate || toDate) {
    query.createdAt = {};
    if (fromDate) query.createdAt.$gte = fromDate;
    if (toDate) query.createdAt.$lte = toDate;
  }
  
  const entries = await LedgerEntry.find(query).lean();
  
  const accountBalances: Record<string, any> = {};
  let totalDebits = 0;
  let totalCredits = 0;
  
  for (const entry of entries) {
    if (!accountBalances[entry.accountCode]) {
      accountBalances[entry.accountCode] = {
        accountCode: entry.accountCode,
        accountName: entry.accountName,
        debitAmount: 0,
        creditAmount: 0,
      };
    }
    
    if (entry.entryType === 'debit') {
      accountBalances[entry.accountCode].debitAmount += entry.amount;
      totalDebits += entry.amount;
    } else {
      accountBalances[entry.accountCode].creditAmount += entry.amount;
      totalCredits += entry.amount;
    }
  }
  
  // Calculate balance for each account
  const accounts = Object.values(accountBalances).map((acc: any) => {
    const balance = acc.debitAmount - acc.creditAmount;
    return {
      ...acc,
      balance: Math.abs(balance),
      balanceType: balance >= 0 ? 'debit' : 'credit',
    };
  });
  
  return {
    totalDebits,
    totalCredits,
    accounts: accounts.sort((a, b) => a.accountCode.localeCompare(b.accountCode)),
    isBalanced: Math.abs(totalDebits - totalCredits) < 0.01, // Allow small rounding difference
  };
}

// ============================================================================
// FINANCIAL STATEMENTS
// ============================================================================

export async function generateIncomeStatement(
  tenantId: string,
  fromDate: Date,
  toDate: Date
): Promise<{
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  expenses: number;
  netIncome: number;
  details: {
    revenueItems: any[];
    expenseItems: any[];
  };
}> {
  const query = {
    tenantId,
    createdAt: { $gte: fromDate, $lte: toDate },
  };
  
  const entries = await LedgerEntry.find(query).lean();
  
  const revenueAccounts = ['4000', '4100', '4200', '4300'];
  const expenseAccounts = ['5000', '5100', '5200', '5300', '5400', '5500'];
  
  let totalRevenue = 0;
  let totalExpenses = 0;
  const revenueItems: any[] = [];
  const expenseItems: any[] = [];
  
  for (const entry of entries) {
    if (revenueAccounts.includes(entry.accountCode)) {
      const amount = entry.entryType === 'credit' ? entry.amount : -entry.amount;
      totalRevenue += amount;
      revenueItems.push({
        accountCode: entry.accountCode,
        accountName: entry.accountName,
        amount,
      });
    } else if (expenseAccounts.includes(entry.accountCode)) {
      const amount = entry.entryType === 'debit' ? entry.amount : -entry.amount;
      totalExpenses += amount;
      expenseItems.push({
        accountCode: entry.accountCode,
        accountName: entry.accountName,
        amount,
      });
    }
  }
  
  const grossProfit = totalRevenue - totalExpenses;
  
  return {
    revenue: totalRevenue,
    costOfGoodsSold: totalExpenses,
    grossProfit,
    expenses: 0, // For simplified version
    netIncome: grossProfit,
    details: {
      revenueItems,
      expenseItems,
    },
  };
}

export async function generateBalanceSheet(
  tenantId: string,
  asOfDate: Date
): Promise<{
  assets: {
    current: any[];
    total: number;
  };
  liabilities: {
    current: any[];
    total: number;
  };
  equity: {
    total: number;
  };
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}> {
  const query = {
    tenantId,
    createdAt: { $lte: asOfDate },
  };
  
  const trialBalance = await generateTrialBalance(tenantId, undefined, asOfDate);
  
  const assetAccounts = trialBalance.accounts.filter(acc =>
    ['1000', '1010', '1100', '1200', '6000', '6100', '6200'].includes(acc.accountCode)
  );
  
  const liabilityAccounts = trialBalance.accounts.filter(acc =>
    ['2000', '2100', '2110', '2120', '2200'].includes(acc.accountCode)
  );
  
  const equityAccounts = trialBalance.accounts.filter(acc =>
    ['3000', '3100'].includes(acc.accountCode)
  );
  
  const totalAssets = assetAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalLiabilities = liabilityAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalEquity = equityAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  
  return {
    assets: {
      current: assetAccounts,
      total: totalAssets,
    },
    liabilities: {
      current: liabilityAccounts,
      total: totalLiabilities,
    },
    equity: {
      total: totalEquity,
    },
    totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
  };
}
