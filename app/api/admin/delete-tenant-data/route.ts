import { NextRequest, NextResponse } from 'next/server';
import {
  connectDB,
  Invoice,
  Payment,
  Customer,
  Product,
  AuditLog,
  StockLedger,
} from '@/lib/models';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: NextRequest) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    await connectDB();

    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      console.error('[v0] No token provided in delete tenant data request');
      return NextResponse.json(
        { error: 'Unauthorized', details: 'No authentication token provided' },
        { status: 401 }
      );
    }

    let decoded: { tenantId: string; userId: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as {
        tenantId: string;
        userId: string;
      };
    } catch (verifyError) {
      console.error('[v0] Token verification failed:', verifyError instanceof Error ? verifyError.message : 'Unknown error');
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Invalid token' },
        { status: 401 }
      );
    }

    const { confirmDelete } = await request.json() as { confirmDelete: boolean };

    if (!confirmDelete) {
      return NextResponse.json(
        { error: 'Deletion not confirmed' },
        { status: 400 }
      );
    }

    const tenantId = decoded.tenantId;

    // Delete all tenant data
    const results = {
      invoices: await Invoice.deleteMany({ tenantId }),
      payments: await Payment.deleteMany({ tenantId }),
      customers: await Customer.deleteMany({ tenantId }),
      products: await Product.deleteMany({ tenantId }),
      stockLedger: await StockLedger.deleteMany({ tenantId }),
      auditLogs: await AuditLog.deleteMany({ tenantId }),
    };

    return NextResponse.json(
      {
        success: true,
        message: 'All user data deleted successfully',
        deletedRecords: results,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to delete data', details: message },
      { status: 500 }
    );
  }
}
