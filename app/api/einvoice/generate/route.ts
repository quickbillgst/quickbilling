import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-utils';

/**
 * POST /api/einvoice/generate
 * Generate e-Invoice with IRN from NIC API
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID required' },
        { status: 400 }
      );
    }

    // Generate mock IRN (32 alphanumeric characters)
    const irn = Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // Generate mock acknowledgement number
    const ackNum = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Mock e-invoice response
    const eInvoiceData = {
      invoiceId,
      irn,
      ackNum,
      ackDate: new Date().toISOString(),
      status: 'generated',
      qrCode: `https://api.invoice.gov.in/qr/${irn}`,
      pdfUrl: `https://api.invoice.gov.in/pdf/${irn}`,
      validFrom: new Date().toISOString(),
      validTill: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      signedPayload: {
        Irn: irn,
        DateTime: new Date().toISOString(),
        TranDtls: {
          taxSch: 'GST',
        },
      },
      complianceStatus: {
        qualified: true,
        turnoverMet: true,
        registeredStatus: true,
        registrationValid: true,
      },
    };

    // In production, this would call the actual NIC e-Invoice API
    // For now, returning mock data

    return NextResponse.json(
      {
        success: true,
        eInvoice: eInvoiceData,
        message: 'E-invoice generated successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate e-invoice' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/einvoice/cancel
 * Cancel an e-Invoice with IRN
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { irn, reason } = body;

    if (!irn) {
      return NextResponse.json(
        { error: 'IRN required for cancellation' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        irn,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        reason: reason || 'No reason provided',
        message: 'E-invoice cancelled successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to cancel e-invoice' },
      { status: 500 }
    );
  }
}
