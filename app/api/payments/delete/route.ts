import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Payment, Invoice } from '@/lib/models';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function DELETE(request: NextRequest) {
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
      console.error('[v0] No token provided in delete payment request');
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

    const { paymentId } = await request.json() as { paymentId: string };

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Find and delete the payment
    const payment = await Payment.findOneAndDelete({
      _id: paymentId,
      tenantId: decoded.tenantId,
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Update invoice status if needed
    if (payment.invoiceId) {
      await Invoice.findByIdAndUpdate(payment.invoiceId, {
        status: 'unpaid',
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Payment deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to delete payment', details: message },
      { status: 500 }
    );
  }
}
