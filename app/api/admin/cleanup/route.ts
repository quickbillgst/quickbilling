import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/models';
import mongoose from 'mongoose';

// This endpoint should only be accessible with the correct admin key
const ADMIN_KEY = process.env.ADMIN_CLEANUP_KEY || 'admin-cleanup-key-change-me';

export async function POST(request: NextRequest) {
  try {
    // Get admin key from request headers
    const adminKey = request.headers.get('x-admin-key');

    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid admin key' },
        { status: 401 }
      );
    }

    const body = await request.json() as { targetTenantId?: string };

    await connectDB();

    if (body.targetTenantId) {
      // Delete only data for a specific tenant
      console.log(`[v0] Cleaning up data for tenant: ${body.targetTenantId}`);

      const collectionsToClean = [
        'Invoice',
        'Payment',
        'Customer',
        'Product',
        'StockLedger',
        'Batch',
        'AuditLog',
      ];

      let deletedCount = 0;

      for (const modelName of collectionsToClean) {
        try {
          const model = mongoose.model(modelName);
          const result = await model.deleteMany({ tenantId: body.targetTenantId });
          console.log(
            `[v0] Deleted ${result.deletedCount} documents from ${modelName}`
          );
          deletedCount += result.deletedCount;
        } catch (error) {
          console.log(
            `[v0] Could not clean ${modelName}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      return NextResponse.json(
        {
          success: true,
          message: `Cleaned up ${deletedCount} documents for tenant`,
          deletedCount,
        },
        { status: 200 }
      );
    } else {
      // Drop entire database (DANGEROUS)
      console.log('[v0] Dropping entire database!');

      const collections = await mongoose.connection.db?.listCollections().toArray();

      if (!collections) {
        return NextResponse.json(
          { error: 'No collections found' },
          { status: 400 }
        );
      }

      let droppedCount = 0;

      for (const collection of collections) {
        try {
          await mongoose.connection.db?.dropCollection(collection.name);
          console.log(`[v0] Dropped collection: ${collection.name}`);
          droppedCount++;
        } catch (error) {
          console.log(
            `[v0] Failed to drop ${collection.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Database cleanup completed',
          droppedCollections: droppedCount,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[v0] Cleanup error:', message);
    return NextResponse.json(
      { error: 'Cleanup failed', details: message },
      { status: 500 }
    );
  }
}
