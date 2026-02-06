import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-utils';

/**
 * GET /api/payments/list
 * Retrieve payment records with filtering and pagination
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const invoiceId = url.searchParams.get('invoiceId');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    // Mock data for demo
    const mockPayments = [
      {
        id: 'pay_001',
        invoiceId: 'inv_001',
        amount: 45000,
        status: 'completed',
        method: 'bank_transfer',
        date: '2024-02-03',
        reference: 'NEFT-001',
      },
      {
        id: 'pay_002',
        invoiceId: 'inv_002',
        amount: 62000,
        status: 'pending',
        method: 'upi',
        date: '2024-02-02',
        reference: 'UPI-001',
      },
      {
        id: 'pay_003',
        invoiceId: 'inv_003',
        amount: 28000,
        status: 'completed',
        method: 'cash',
        date: '2024-02-01',
        reference: 'CASH-001',
      },
    ];

    let filtered = mockPayments;

    if (status) {
      filtered = filtered.filter((p) => p.status === status);
    }

    if (invoiceId) {
      filtered = filtered.filter((p) => p.invoiceId === invoiceId);
    }

    const total = filtered.length;
    const payments = filtered.slice((page - 1) * limit, page * limit);

    return NextResponse.json(
      {
        payments,
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
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
