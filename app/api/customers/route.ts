import { connectDB, Customer } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

function verifyAuth(request: NextRequest): { userId: string; tenantId: string } | null {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    return null;
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; tenantId: string };
    return decoded;
  } catch {
    return null;
  }
}

// Create Customer
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const customer = new Customer({
      tenantId: auth.tenantId,
      name: body.name,
      email: body.email,
      phone: body.phone,
      customerType: body.customerType || 'business',
      gstRegistered: body.gstRegistered || false,
      gstin: body.gstin,
      pan: body.pan,
      billingAddress: body.billingAddress,
      creditLimit: body.creditLimit || 0,
      tdsApplicable: body.tdsApplicable || false,
      tdsRate: body.tdsRate,
      tags: body.tags || []
    });

    await customer.save();

    return NextResponse.json(
      {
        success: true,
        data: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          gstin: customer.gstin
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}

// Get Customers
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    const query: any = { tenantId: auth.tenantId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { gstin: { $regex: search, $options: 'i' } }
      ];
    }

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean(),
      Customer.countDocuments(query)
    ]);

    return NextResponse.json(
      {
        success: true,
        data: customers,
        pagination: { total, limit, offset, hasMore: offset + limit < total }
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
