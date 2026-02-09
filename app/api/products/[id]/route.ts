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
        const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string; tenantId: string };
        return decoded;
    } catch {
        return null;
    }
}

// GET Single Product
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const auth = verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const product = await Product.findOne({
            _id: id,
            tenantId: auth.tenantId
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: product }, { status: 200 });
    } catch (error) {
        console.error('Get product error:', error);
        return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
    }
}

// PUT Update Product
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const auth = verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        const product = await Product.findOne({
            _id: id,
            tenantId: auth.tenantId
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Check SKU uniqueness if changed
        if (body.sku && body.sku !== product.sku) {
            const existing = await Product.findOne({
                tenantId: auth.tenantId,
                sku: body.sku
            });
            if (existing) {
                return NextResponse.json({ error: 'SKU already exists' }, { status: 409 });
            }
        }

        // Update fields
        product.sku = body.sku || product.sku;
        product.name = body.name || product.name;
        product.description = body.description || product.description;
        product.hsnCode = body.hsnCode || '';   // Allow clearing
        product.sacCode = body.sacCode || '';   // Allow clearing
        product.gstRate = body.taxRate !== undefined ? body.taxRate : product.gstRate;
        product.gstType = body.gstType || product.gstType;
        product.costPrice = body.costPrice !== undefined ? body.costPrice : product.costPrice;
        product.sellingPrice = body.sellingPrice !== undefined ? body.sellingPrice : product.sellingPrice;
        product.trackInventory = body.trackInventory !== undefined ? body.trackInventory : product.trackInventory;
        product.reorderPoint = body.reorderPoint !== undefined ? body.reorderPoint : product.reorderPoint;
        product.barcodeValue = body.barcodeValue || '';
        product.barcodeType = body.barcodeType || product.barcodeType;
        product.isService = body.isService !== undefined ? body.isService : product.isService;
        product.isActive = body.isActive !== undefined ? body.isActive : product.isActive;

        await product.save();

        return NextResponse.json(
            { success: true, data: product, message: 'Product updated successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Update product error:', error);
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
}
