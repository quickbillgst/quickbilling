import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-utils';
import { connectDB, Payment, Invoice, Customer } from '@/lib/models';

/**
 * GET /api/payments/list
 * Retrieve payment records with filtering and search
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    let query: any = { tenantId: auth.tenantId };

    if (status && status !== 'all') {
      query.status = status;
    }

    // Fetch payments with population
    // Note: Search is complex with population, we might need aggregation if search is across joined fields
    // For now, let's fetch and filter if search is present, or simple fetch if not

    let payments = await Payment.find(query)
      .populate({
        path: 'invoiceId',
        select: 'invoiceNumber customerId totalAmount',
        populate: {
          path: 'customerId',
          select: 'name'
        }
      })
      .sort({ paymentDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Filter by search if provided (searching invoice number or customer name)
    if (search) {
      const searchLower = search.toLowerCase();
      payments = payments.filter((p: any) => {
        const invNum = p.invoiceId?.invoiceNumber?.toLowerCase() || '';
        const custName = p.invoiceId?.customerId?.name?.toLowerCase() || '';
        const refId = p.paymentReferenceId?.toLowerCase() || '';
        return invNum.includes(searchLower) || custName.includes(searchLower) || refId.includes(searchLower);
      });
    }

    const total = await Payment.countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        data: payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Payments List API Error]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
