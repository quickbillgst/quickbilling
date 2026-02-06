import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { Invoice, connectDB } from '@/lib/models';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify JWT
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = verify(token, JWT_SECRET) as { tenantId: string; userId: string };
    const tenantId = decoded.tenantId;
    
    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    
    // Build query
    const query: any = { tenantId, deletedAt: null };
    
    if (status) query.status = status;
    if (customerId) query.customerId = customerId;
    
    if (fromDate || toDate) {
      query.invoiceDate = {};
      if (fromDate) query.invoiceDate.$gte = new Date(fromDate);
      if (toDate) query.invoiceDate.$lte = new Date(toDate);
    }
    
    // Fetch invoices with pagination
    const skip = (page - 1) * limit;
    const invoices = await Invoice.find(query)
      .sort({ invoiceDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Invoice.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Invoice List API Error]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
