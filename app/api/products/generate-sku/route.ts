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

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const auth = verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Try to find the latest product with a standard PROD- prefix to increment
        // We sort by createdAt desc to get the most recently added one, which is usually the highest number
        const latestProduct = await Product.findOne({
            tenantId: auth.tenantId,
            sku: { $regex: /^PROD-\d+$/ }
        }).sort({ createdAt: -1 });

        let nextSku = 'PROD-1001';

        if (latestProduct) {
            const match = latestProduct.sku.match(/^PROD-(\d+)$/);
            if (match) {
                const currentNum = parseInt(match[1], 10);
                const nextNum = currentNum + 1;
                nextSku = `PROD-${nextNum.toString().padStart(4, '0')}`;
            }
        }

        // Double check uniqueness just in case (e.g. if we went back in numbers)
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 5) {
            const existing = await Product.findOne({
                tenantId: auth.tenantId,
                sku: nextSku
            });

            if (!existing) {
                isUnique = true;
            } else {
                // If conflict, blindly increment
                const match = nextSku.match(/^PROD-(\d+)$/);
                if (match) {
                    const num = parseInt(match[1]) + 1;
                    nextSku = `PROD-${num.toString().padStart(4, '0')}`;
                }
                attempts++;
            }
        }

        return NextResponse.json({ sku: nextSku }, { status: 200 });

    } catch (error) {
        console.error('SKU generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate SKU' },
            { status: 500 }
        );
    }
}
