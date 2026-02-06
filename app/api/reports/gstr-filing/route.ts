import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-utils';

/**
 * GET /api/reports/gstr-filing
 * Generate GSTR-1 (outward supplies) filing data
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const month = url.searchParams.get('month') || new Date().getMonth() + 1;
    const year = url.searchParams.get('year') || new Date().getFullYear();

    // Mock GSTR-1 data
    const gstrData = {
      period: `${year}-${String(month).padStart(2, '0')}`,
      filingDeadline: '10th of next month',
      supplierGstin: '27AABCT1234C1Z5',
      supplierName: 'ABC Corporation',
      status: 'ready_to_file',

      // B2B supplies (registered customers)
      b2b: {
        count: 45,
        invoices: [
          {
            gstinOfRecipient: '27AABCT1234C1Z1',
            invoiceNumber: 'INV-00001',
            invoiceDate: '2024-02-01',
            invoiceValue: 45000,
            taxableAmount: 45000,
            cgstAmount: 4050,
            sgstAmount: 4050,
            igstAmount: 0,
            cessAmount: 0,
            totalTaxAmount: 8100,
          },
        ],
        totalValue: 1200000,
        totalTax: 216000,
      },

      // B2C supplies (unregistered customers, amount > 5L in a day)
      b2c: {
        count: 120,
        totalValue: 450000,
        totalTax: 81000,
        description: 'B2C supplies where invoice not issued',
      },

      // Exports (0% GST)
      exports: {
        count: 8,
        totalValue: 250000,
        totalTax: 0,
        description: 'Supplies to foreign customers with shipping bill',
      },

      // Credit notes (returns, amendments)
      amendments: {
        creditNotes: 3,
        debitNotes: 1,
        value: 125000,
        taxImpact: 22500,
      },

      summary: {
        totalInvoices: 176,
        totalSupplyValue: 1900000,
        totalTaxableValue: 1900000,
        totalTaxAmount: 319500,
        totalIgst: 0,
        totalCgst: 159750,
        totalSgst: 159750,
        totalCess: 0,
      },

      complianceChecks: [
        {
          check: 'GSTIN Format',
          status: 'valid',
          description: '15-character GSTIN is valid',
        },
        {
          check: 'Invoice Numbering',
          status: 'valid',
          description: 'All invoices have unique numbers',
        },
        {
          check: 'Tax Calculation',
          status: 'valid',
          description: 'All line-level taxes correctly calculated',
        },
        {
          check: 'Place of Supply',
          status: 'valid',
          description: '100% of B2B supplies have valid place of supply',
        },
      ],

      readyToFile: true,
      warnings: [],
      errors: [],
    };

    return NextResponse.json(gstrData, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate GSTR-1 data' },
      { status: 500 }
    );
  }
}
