/**
 * GST Calculation Service
 * Handles all GST calculations for invoices based on Indian tax rules
 */

// GSTR-1 Summary interface
export interface GSTR1Summary {
  period: string;
  totalInvoices: number;
  totalSalesValue: number;
  totalTaxableValue: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalCESS: number;
  b2bInvoices: number;
  b2bValue: number;
  b2cInvoices: number;
  b2cValue: number;
  exportInvoices: number;
  exportValue: number;
  exemptInvoices: number;
  exemptValue: number;
}

/**
 * Generate GSTR-1 Summary from invoices
 */
export function generateGSTR1Summary(
  invoices: any[],
  period: string
): GSTR1Summary {
  const summary: GSTR1Summary = {
    period,
    totalInvoices: invoices.length,
    totalSalesValue: 0,
    totalTaxableValue: 0,
    totalCGST: 0,
    totalSGST: 0,
    totalIGST: 0,
    totalCESS: 0,
    b2bInvoices: 0,
    b2bValue: 0,
    b2cInvoices: 0,
    b2cValue: 0,
    exportInvoices: 0,
    exportValue: 0,
    exemptInvoices: 0,
    exemptValue: 0,
  };

  invoices.forEach((invoice) => {
    const totalAmount = invoice.totalAmount || 0;
    const taxableAmount = invoice.taxableAmount || 0;

    summary.totalSalesValue += totalAmount;
    summary.totalTaxableValue += taxableAmount;
    summary.totalCGST += invoice.cgstAmount || 0;
    summary.totalSGST += invoice.sgstAmount || 0;
    summary.totalIGST += invoice.igstAmount || 0;
    summary.totalCESS += invoice.cessAmount || 0;

    // Categorize by type
    if (invoice.isExport) {
      summary.exportInvoices += 1;
      summary.exportValue += totalAmount;
    } else if (invoice.customerType === 'business') {
      summary.b2bInvoices += 1;
      summary.b2bValue += totalAmount;
    } else if (invoice.customerType === 'individual') {
      summary.b2cInvoices += 1;
      summary.b2cValue += totalAmount;
    } else {
      summary.exemptInvoices += 1;
      summary.exemptValue += totalAmount;
    }
  });

  return summary;
}

interface LineItemInput {
  quantity: number;
  unitPrice: number;
  hsn?: string;
  taxRate: number;
  discountValue?: number;
  discountType?: 'percentage' | 'fixed';
}

interface TaxContext {
  state: string;
  isIntrastate: boolean;
  isIntegrated: boolean;
}

interface LineItemTaxResult {
  quantity: number;
  unitPrice: number;
  lineAmount: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  taxAmount: number;
  totalAmount: number;
}

interface InvoiceTaxResult {
  lineAmount: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  taxAmount: number;
  totalAmount: number;
  complianceNotes: string[];
}

/**
 * Calculate tax for a single line item
 */
export function calculateLineItemTax(
  item: LineItemInput,
  context: TaxContext,
  isReverseCharge: boolean = false,
  isExport: boolean = false
): LineItemTaxResult {
  // Calculate base amounts
  const lineAmount = item.quantity * item.unitPrice;

  // Calculate discount
  let discountAmount = 0;
  if (item.discountValue) {
    if (item.discountType === 'percentage') {
      discountAmount = (lineAmount * item.discountValue) / 100;
    } else {
      discountAmount = item.discountValue;
    }
  }

  const taxableAmount = lineAmount - discountAmount;

  // Initialize tax amounts
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let cessAmount = 0;

  // Calculate taxes based on transaction type
  if (isExport) {
    // Exports are zero-rated
    cgstAmount = 0;
    sgstAmount = 0;
    igstAmount = 0;
    cessAmount = 0;
  } else if (isReverseCharge) {
    // Reverse charge - no tax on supplier, but can be claimed
    cgstAmount = 0;
    sgstAmount = 0;
    igstAmount = 0;
    cessAmount = 0;
  } else if (context.isIntrastate) {
    // Intra-state: CGST + SGST (9% + 9% for 18% items)
    const halfRate = item.taxRate / 2;
    cgstAmount = (taxableAmount * halfRate) / 100;
    sgstAmount = (taxableAmount * halfRate) / 100;
    igstAmount = 0;
  } else {
    // Inter-state: IGST
    igstAmount = (taxableAmount * item.taxRate) / 100;
    cgstAmount = 0;
    sgstAmount = 0;
  }

  // Calculate cess if applicable (typically on specific items)
  // For now, cess is 0 for most items
  cessAmount = 0;

  const taxAmount = cgstAmount + sgstAmount + igstAmount + cessAmount;
  const totalAmount = taxableAmount + taxAmount;

  return {
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineAmount: Math.round(lineAmount * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    cgstAmount: Math.round(cgstAmount * 100) / 100,
    sgstAmount: Math.round(sgstAmount * 100) / 100,
    igstAmount: Math.round(igstAmount * 100) / 100,
    cessAmount: Math.round(cessAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
}

/**
 * Calculate GST for entire invoice
 */
export function calculateInvoiceTax(
  lineItems: LineItemInput[],
  context: TaxContext,
  isReverseCharge: boolean = false,
  isExport: boolean = false
): InvoiceTaxResult {
  const taxCalculations = lineItems.map((item) =>
    calculateLineItemTax(item, context, isReverseCharge, isExport)
  );

  // Sum up all amounts
  const totals = taxCalculations.reduce(
    (acc, calc) => ({
      lineAmount: acc.lineAmount + calc.lineAmount,
      discountAmount: acc.discountAmount + calc.discountAmount,
      taxableAmount: acc.taxableAmount + calc.taxableAmount,
      cgstAmount: acc.cgstAmount + calc.cgstAmount,
      sgstAmount: acc.sgstAmount + calc.sgstAmount,
      igstAmount: acc.igstAmount + calc.igstAmount,
      cessAmount: acc.cessAmount + calc.cessAmount,
      taxAmount: acc.taxAmount + calc.taxAmount,
    }),
    {
      lineAmount: 0,
      discountAmount: 0,
      taxableAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      cessAmount: 0,
      taxAmount: 0,
    }
  );

  const totalAmount = totals.taxableAmount + totals.taxAmount;

  // Generate compliance notes
  const complianceNotes: string[] = [];

  if (isExport) {
    complianceNotes.push('Export transaction - zero-rated');
  }

  if (isReverseCharge) {
    complianceNotes.push('Reverse charge applicable - recipient liable for tax');
  }

  if (context.isIntrastate && lineItems.length > 0) {
    complianceNotes.push(
      `Intra-state supply - CGST and SGST applicable at respective rates`
    );
  }

  if (!context.isIntrastate && lineItems.length > 0) {
    complianceNotes.push(`Inter-state supply - IGST applicable`);
  }

  return {
    lineAmount: Math.round(totals.lineAmount * 100) / 100,
    discountAmount: Math.round(totals.discountAmount * 100) / 100,
    taxableAmount: Math.round(totals.taxableAmount * 100) / 100,
    cgstAmount: Math.round(totals.cgstAmount * 100) / 100,
    sgstAmount: Math.round(totals.sgstAmount * 100) / 100,
    igstAmount: Math.round(totals.igstAmount * 100) / 100,
    cessAmount: Math.round(totals.cessAmount * 100) / 100,
    taxAmount: Math.round(totals.taxAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    complianceNotes,
  };
}

/**
 * Validate GST number format
 */
export function validateGSTNumber(gstin: string): boolean {
  if (!gstin || typeof gstin !== 'string') return false;

  // GSTIN format: 2 digits (state code) + 10 chars (PAN) + 1 digit (entity) + 1 digit (checksum)
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  return gstinRegex.test(gstin);
}

/**
 * Get state code from GSTIN
 */
export function getStateCodeFromGSTIN(gstin: string): string | null {
  if (!validateGSTNumber(gstin)) return null;
  return gstin.substring(0, 2);
}

/**
 * State codes mapping
 */
export const STATE_CODES: Record<string, string> = {
  '01': 'AP', // Andhra Pradesh
  '02': 'AR', // Arunachal Pradesh
  '03': 'AS', // Assam
  '04': 'BR', // Bihar
  '05': 'CT', // Chhattisgarh
  '06': 'GA', // Goa
  '07': 'GJ', // Gujarat
  '08': 'HR', // Haryana
  '09': 'HP', // Himachal Pradesh
  '10': 'JK', // Jammu & Kashmir
  '11': 'JH', // Jharkhand
  '12': 'KA', // Karnataka
  '13': 'KL', // Kerala
  '14': 'MP', // Madhya Pradesh
  '15': 'MN', // Manipur
  '16': 'MG', // Meghalaya
  '17': 'MZ', // Mizoram
  '18': 'NL', // Nagaland
  '19': 'OD', // Odisha
  '20': 'PB', // Punjab
  '21': 'RJ', // Rajasthan
  '22': 'SK', // Sikkim
  '23': 'TN', // Tamil Nadu
  '24': 'TG', // Telangana
  '25': 'TR', // Tripura
  '26': 'UP', // Uttar Pradesh
  '27': 'UK', // Uttarakhand
  '28': 'WB', // West Bengal
  '29': 'UT', // Union Territory of Puducherry
  '30': 'UT', // Union Territory of Chandigarh
  '31': 'UT', // Union Territory of Andaman and Nicobar Islands
  '32': 'UT', // Union Territory of Lakshadweep
  '33': 'UT', // Union Territory of Daman and Diu and Dadra and Nagar Haveli
  '34': 'UT', // Union Territory of Delhi
  '35': 'UT', // Union Territory of Ladakh
  '97': 'DUM', // Dumas
};
