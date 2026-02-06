import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { connectDB } from '@/lib/models';
import {
  getCurrentStock,
  recordSale,
  recordReturn,
  recordCancellation,
  recordAdjustment,
} from '@/lib/services/inventory-service';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

// GET: Fetch current stock
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = verify(token, JWT_SECRET) as {
      tenantId: string;
      userId: string;
    };
    const tenantId = decoded.tenantId;
    
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const warehouseId = searchParams.get('warehouseId');
    const batchId = searchParams.get('batchId');
    
    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 });
    }
    
    const stock = await getCurrentStock(tenantId, productId, warehouseId || undefined, batchId || undefined);
    
    return NextResponse.json({
      success: true,
      stock,
    });
  } catch (error) {
    console.error('[Stock GET Error]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Record stock movements
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = verify(token, JWT_SECRET) as any;
    const tenantId = decoded.tenantId;
    const userId = decoded.userId;
    
    const body = await request.json();
    const { action, productId, quantity, unitCost, reason, warehouseId, batchId } = body;
    
    switch (action) {
      case 'adjustment':
        await recordAdjustment(
          tenantId,
          productId,
          warehouseId,
          quantity,
          reason,
          userId,
          unitCost
        );
        break;
        
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
    
    const stock = await getCurrentStock(tenantId, productId, warehouseId, batchId);
    
    return NextResponse.json({
      success: true,
      message: `Stock adjustment recorded`,
      stock,
    });
  } catch (error) {
    console.error('[Stock POST Error]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
