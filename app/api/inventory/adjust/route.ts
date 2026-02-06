import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-utils';

/**
 * POST /api/inventory/adjust
 * Adjust inventory for sales, returns, and cancellations
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      invoiceId,
      adjustmentType, // 'sale' | 'return' | 'cancellation'
      lineItems,
    } = body;

    if (!invoiceId || !adjustmentType || !lineItems) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate adjustment type
    if (!['sale', 'return', 'cancellation'].includes(adjustmentType)) {
      return NextResponse.json(
        { error: 'Invalid adjustment type' },
        { status: 400 }
      );
    }

    const adjustments = lineItems.map((item: any) => {
      let quantityChange = item.quantity;

      // For returns and cancellations, reverse the quantity
      if (adjustmentType === 'return' || adjustmentType === 'cancellation') {
        quantityChange = -item.quantity;
      }

      return {
        productId: item.productId,
        adjustmentType,
        quantityChange,
        reference: {
          type: 'invoice',
          id: invoiceId,
        },
        timestamp: new Date(),
        notes: `${adjustmentType === 'sale' ? 'Sale' : adjustmentType === 'return' ? 'Customer Return' : 'Invoice Cancelled'}`,
      };
    });

    // In production, save to MongoDB
    // await db.inventoryLedger.insertMany(adjustments);

    return NextResponse.json(
      {
        success: true,
        adjustments,
        message: `${adjustmentType} adjustment recorded for ${lineItems.length} items`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to adjust inventory' },
      { status: 500 }
    );
  }
}
