import { connectDB, Product } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

function verifyAuth(request: NextRequest): { userId: string; tenantId: string } | null {
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

// Create Product
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Check if SKU already exists
    const existing = await Product.findOne({
      tenantId: auth.tenantId,
      sku: body.sku
    });

    if (existing) {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 409 }
      );
    }

    const product = new Product({
      tenantId: auth.tenantId,
      sku: body.sku,
      name: body.name,
      description: body.description,
      hsnCode: body.hsnCode,
      sacCode: body.sacCode,
      gstRate: body.taxRate || 18,
      gstType: body.gstType || 'cgst_sgst',
      costPrice: body.costPrice,
      sellingPrice: body.sellingPrice,
      trackInventory: body.trackInventory !== false,
      reorderPoint: body.reorderPoint || 10,
      barcodeValue: body.barcodeValue,
      barcodeType: body.barcodeType,
      isService: body.isService || false,
      isActive: true
    });

    await product.save();

    return NextResponse.json(
      {
        success: true,
        data: {
          id: product._id,
          sku: product.sku,
          name: product.name,
          sellingPrice: product.sellingPrice,
          taxRate: product.gstRate
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// Get Products
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    const query: any = { tenantId: auth.tenantId, isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcodeValue: { $regex: search, $options: 'i' } }
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean(),
      Product.countDocuments(query)
    ]);

    return NextResponse.json(
      {
        success: true,
        data: products,
        pagination: { total, limit, offset, hasMore: offset + limit < total }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
