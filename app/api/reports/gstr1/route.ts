import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { Invoice, connectDB } from '@/lib/models';
import { generateGSTR1Summary } from '@/lib/services/gst-service';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = verify(token, JWT_SECRET) as { tenantId: string; userId: string };
    const tenantId = decoded.tenantId;
    
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period'); // Format: 2024-01
    
    if (!period) {
      return NextResponse.json({ error: 'period required (format: YYYY-MM)' }, { status: 400 });
    }
    
    // Parse period
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    // Fetch all invoices for the period
    const invoices = await Invoice.find({
      tenantId,
      invoiceDate: { $gte: startDate, $lte: endDate },
      status: { $ne: 'draft' },
    }).lean();
    
    const summary = generateGSTR1Summary(invoices);
    
    // Calculate net tax payable
    const totalGstPayable =
      summary.b2b.cgst +
      summary.b2b.sgst +
      summary.b2b.igst +
      summary.exports.igst;
    
    const readyToFile = invoices.length > 0;
    
    return NextResponse.json({
      success: true,
      summary,
      readyToFile,
      totalGstPayable,
      invoiceCount: invoices.length,
    });
  } catch (error) {
    console.error('[GSTR-1 API Error]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
