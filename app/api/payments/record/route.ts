import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { Payment, Invoice, connectDB } from '@/lib/models';
import { postPaymentToGL } from '@/lib/services/accounting-service';
import { Types } from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verify JWT
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as { tenantId: string; userId: string };
    const tenantId = decoded.tenantId;
    const userId = decoded.userId;

    const body = await request.json();
    const {
      invoiceId,
      paymentAmount,
      paymentMethod,
      paymentDate,
      bankReference,
      paymentReferenceId,
      bankName,
      notes,
    } = body;

    // Verify invoice exists and belongs to tenant
    const invoice = await Invoice.findOne({ _id: invoiceId, tenantId });
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if payment exceeds invoice amount
    const totalPaid = await Payment.aggregate([
      {
        $match: {
          invoiceId: new Types.ObjectId(invoiceId),
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$paymentAmount' },
        },
      },
    ]);

    const alreadyPaid = totalPaid[0]?.totalAmount || 0;
    if (alreadyPaid + paymentAmount > invoice.totalAmount) {
      return NextResponse.json(
        { error: 'Payment exceeds invoice amount' },
        { status: 400 }
      );
    }

    // Create payment record
    const payment = new Payment({
      _id: new Types.ObjectId(),
      tenantId,
      invoiceId,
      paymentMethod,
      paymentAmount,
      currency: 'INR',
      status: 'completed',
      paymentDate: new Date(paymentDate),
      processedAt: new Date(),
      bankReference,
      paymentReferenceId,
      bankName,
      notes,
      createdByUserId: userId,
    });

    await payment.save();

    // Update invoice status
    const newTotalPaid = alreadyPaid + paymentAmount;
    invoice.paidAmount = newTotalPaid;

    if (newTotalPaid >= invoice.totalAmount) {
      invoice.status = 'paid';
    } else {
      invoice.status = 'partially_paid';
    }
    await invoice.save();

    // Post to GL
    await postPaymentToGL(
      tenantId,
      payment._id,
      invoiceId,
      paymentAmount,
      paymentMethod,
      userId
    );

    return NextResponse.json({
      success: true,
      payment: {
        _id: payment._id,
        invoiceId,
        paymentAmount,
        status: payment.status,
        createdAt: payment.createdAt,
      },
      invoice: {
        status: invoice.status,
        totalAmount: invoice.totalAmount,
        totalPaid: newTotalPaid,
        outstanding: invoice.totalAmount - newTotalPaid,
      },
    });
  } catch (error) {
    console.error('[Payment API Error]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
