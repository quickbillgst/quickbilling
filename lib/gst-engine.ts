/**
 * GST Tax Engine
 * Handles all GST calculations, place of supply, IGST/CGST/SGST logic
 */

interface TaxContext {
  supplierState: string;
  supplierGstin?: string;
  supplierRegistered: boolean;
  buyerState: string;
  buyerGstin?: string;
  buyerRegistered: boolean;
  buyerIsSEZ?: boolean;
  isExport?: boolean;
  hsnCode?: string;
  sacCode?: string;
}

interface LineItemInput {
  amount: number;
  taxRate: number;
  description?: string;
  hsnCode?: string;
  quantity?: number;
  unitPrice?: number;
}

interface TaxBreakdown {
  taxableAmount: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  tdsAmount: number;
  totalTax: number;
  isIntraState: boolean;
  placeOfSupply: string;
  complianceFlags: string[];
}

interface InvoiceTaxSummary {
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  cessTotal: number;
  tdsTotal: number;
  totalTax: number;
  grandTotal: number;
  complianceFlags: string[];
}

// GST Rate Master
const GST_RATES: { [key: string]: number } = {
  '1101': 5, // Wheat Flour
  '0702': 5, // Tomato
  '1904': 5, // Rice
  '0805': 5, // Citrus fruits
  '6204': 12, // Women's garment
  '8471': 12, // Computer
  '4901': 5, // Books
  '9985': 18, // Watches
  '2104': 18, // Sauces, condiments
  '2105': 18, // Soups, broths
};

const CESS_APPLICABLE: { [key: string]: number } = {
  '2203': 20, // Beer
  '2204': 20, // Wine
  '6203': 20, // Men's garment
};

// Determine place of supply
export function determinePlace(context: TaxContext): {
  placeOfSupply: string;
  isIntraState: boolean;
} {
  // Export: Special handling
  if (context.isExport) {
    return {
      placeOfSupply: 'Export',
      isIntraState: false
    };
  }

  // SEZ: Special handling
  if (context.buyerIsSEZ) {
    return {
      placeOfSupply: 'SEZ',
      isIntraState: false
    };
  }

  // Registered buyer: Delivery location
  if (context.buyerRegistered && context.buyerGstin) {
    const buyerStateFromGstin = context.buyerGstin.substring(0, 2);
    const isIntra = buyerStateFromGstin === context.supplierState.substring(0, 2);
    return {
      placeOfSupply: context.buyerState,
      isIntraState: isIntra
    };
  }

  // Unregistered buyer: Supplier location
  const isIntra = context.supplierState.substring(0, 2) === context.buyerState.substring(0, 2);
  return {
    placeOfSupply: context.supplierState,
    isIntraState: isIntra
  };
}

// Get GST rate for HSN/SAC
export function getGSTRate(hsnCode?: string, sacCode?: string): number {
  if (hsnCode && GST_RATES[hsnCode]) {
    return GST_RATES[hsnCode];
  }
  // Default to 18% if not found
  return 18;
}

// Get cess rate
export function getCessRate(hsnCode?: string): number {
  if (hsnCode && CESS_APPLICABLE[hsnCode]) {
    return CESS_APPLICABLE[hsnCode];
  }
  return 0;
}

// Calculate TDS (Tax Deducted at Source)
export function calculateTDS(
  amount: number,
  context: TaxContext
): number {
  // TDS applicable when unregistered buyer + registered seller
  if (!context.buyerRegistered && context.supplierRegistered) {
    const tdsRate = 2.5; // 2.5% for goods
    return Math.round(amount * (tdsRate / 100));
  }
  return 0;
}

// Main tax calculation function
export function calculateLineItemTax(
  lineItem: LineItemInput,
  context: TaxContext
): TaxBreakdown {
  const place = determinePlace(context);
  const taxRate = lineItem.taxRate || getGSTRate(lineItem.hsnCode);
  const cessTax = getCessRate(lineItem.hsnCode);

  let cgstRate = 0;
  let sgstRate = 0;
  let igstRate = 0;

  // Determine CGST/SGST or IGST
  if (context.isExport) {
    // Export: 0% GST
    igstRate = 0;
  } else if (place.isIntraState) {
    // Intra-state: Split into CGST + SGST
    cgstRate = taxRate / 2;
    sgstRate = taxRate / 2;
  } else {
    // Inter-state: IGST only
    igstRate = taxRate;
  }

  // Calculate amounts
  const cgstAmount = Math.round(lineItem.amount * (cgstRate / 100));
  const sgstAmount = Math.round(lineItem.amount * (sgstRate / 100));
  const igstAmount = Math.round(lineItem.amount * (igstRate / 100));
  const cessAmount = Math.round(lineItem.amount * (cessTax / 100));

  // TDS
  const tdsAmount = calculateTDS(lineItem.amount, context);

  const totalTax = cgstAmount + sgstAmount + igstAmount + cessAmount + tdsAmount;

  // Compliance flags
  const complianceFlags: string[] = [];

  if (!context.buyerRegistered && context.supplierRegistered && tdsAmount > 0) {
    complianceFlags.push('TDS_APPLICABLE_2.5%');
  }

  if (context.isExport) {
    complianceFlags.push('EXPORT_ZERO_GST');
  }

  if (context.isExport && !context.buyerGstin) {
    complianceFlags.push('EXPORT_REQUIRES_E_INVOICE');
  }

  if (place.isIntraState && !context.supplierGstin) {
    complianceFlags.push('INTRA_STATE_UNREGISTERED_SUPPLIER');
  }

  return {
    taxableAmount: lineItem.amount,
    cgstRate,
    sgstRate,
    igstRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    cessAmount,
    tdsAmount,
    totalTax,
    isIntraState: place.isIntraState,
    placeOfSupply: place.placeOfSupply,
    complianceFlags
  };
}

// Calculate total invoice tax
export function calculateInvoiceTax(
  lineItems: LineItemInput[],
  context: TaxContext,
  discountAmount: number = 0
): InvoiceTaxSummary {
  const lineBreakdowns = lineItems.map(item => calculateLineItemTax(item, context));

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxableAmount = subtotal - discountAmount;

  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;
  let totalCess = 0;
  let totalTDS = 0;
  const allFlags = new Set<string>();

  for (const breakdown of lineBreakdowns) {
    totalCGST += breakdown.cgstAmount;
    totalSGST += breakdown.sgstAmount;
    totalIGST += breakdown.igstAmount;
    totalCess += breakdown.cessAmount;
    totalTDS += breakdown.tdsAmount;
    breakdown.complianceFlags.forEach(flag => allFlags.add(flag));
  }

  const totalTax = totalCGST + totalSGST + totalIGST + totalCess + totalTDS;
  const grandTotal = taxableAmount + totalTax;

  return {
    subtotal,
    totalDiscount: discountAmount,
    taxableAmount,
    cgstTotal: totalCGST,
    sgstTotal: totalSGST,
    igstTotal: totalIGST,
    cessTotal: totalCess,
    tdsTotal: totalTDS,
    totalTax,
    grandTotal,
    complianceFlags: Array.from(allFlags)
  };
}

// Validate GSTIN
export function validateGSTIN(gstin: string): boolean {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$/;
  return gstinRegex.test(gstin);
}

// Extract state from GSTIN
export function getStateFromGSTIN(gstin: string): string {
  if (!validateGSTIN(gstin)) return '';
  const stateCode = gstin.substring(0, 2);
  const stateMap: { [key: string]: string } = {
    '01': 'AN',
    '02': 'AP',
    '03': 'AR',
    '04': 'AS',
    '05': 'BR',
    '06': 'CG',
    '07': 'CH',
    '08': 'CT',
    '09': 'DL',
    '10': 'DN',
    '11': 'GA',
    '12': 'GJ',
    '13': 'HR',
    '14': 'HP',
    '15': 'JK',
    '16': 'JH',
    '17': 'KA',
    '18': 'KL',
    '19': 'LD',
    '20': 'MP',
    '21': 'MH',
    '22': 'MN',
    '23': 'ML',
    '24': 'MZ',
    '25': 'OD',
    '26': 'OL',
    '27': 'OR',
    '28': 'OL',
    '29': 'PB',
    '30': 'RJ',
    '31': 'SK',
    '32': 'TN',
    '33': 'TG',
    '34': 'TR',
    '35': 'UP',
    '36': 'UT',
    '37': 'WB'
  };
  return stateMap[stateCode] || '';
}

// GSTR-1 Categorization
export function categorizeForGSTR1(invoice: any): 'b2b' | 'b2c' | 'export' | 'sez' | 'other' {
  if (invoice.isExport) return 'export';
  if (invoice.buyerIsSEZ) return 'sez';
  if (invoice.customerGstin) return 'b2b';
  return 'b2c';
}
