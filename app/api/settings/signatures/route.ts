import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Tenant } from '@/lib/models';
import { verifyAuth } from '@/lib/auth-utils';

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB for signatures

// GET - Get signatures and UPI details
export async function GET(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!auth.tenantId || auth.tenantId.trim() === '') {
            return NextResponse.json(
                { error: 'No tenant associated with this account.' },
                { status: 400 }
            );
        }

        await connectDB();

        const tenant = await Tenant.findById(auth.tenantId).select('signatures upiId').lean();

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                signatures: tenant.signatures || [],
                upiId: tenant.upiId || '',
            },
        });
    } catch (error) {
        console.error('Error fetching signatures:', error);
        return NextResponse.json(
            { error: 'Failed to fetch signatures' },
            { status: 500 }
        );
    }
}

// POST - Add/Update signature
export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!auth.tenantId || auth.tenantId.trim() === '') {
            return NextResponse.json(
                { error: 'No tenant associated with this account.' },
                { status: 400 }
            );
        }

        await connectDB();

        const formData = await request.formData();
        const signature = formData.get('signature') as File;
        const name = formData.get('name') as string;
        const designation = formData.get('designation') as string;
        const index = parseInt(formData.get('index') as string) || 0;

        if (!signature) {
            return NextResponse.json({ error: 'No signature file provided' }, { status: 400 });
        }

        if (!name) {
            return NextResponse.json({ error: 'Signatory name is required' }, { status: 400 });
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(signature.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Please upload JPG, PNG, GIF or WebP' },
                { status: 400 }
            );
        }

        // Validate file size
        if (signature.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 1MB' },
                { status: 400 }
            );
        }

        // Validate index (max 2 signatures, index 0 or 1)
        if (index < 0 || index > 1) {
            return NextResponse.json(
                { error: 'Invalid signature index. Only 2 signatures allowed.' },
                { status: 400 }
            );
        }

        // Convert to base64
        const bytes = await signature.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = `data:${signature.type};base64,${buffer.toString('base64')}`;

        // Get current tenant
        const tenant = await Tenant.findById(auth.tenantId);
        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        // Initialize signatures array if needed
        if (!tenant.signatures) {
            tenant.signatures = [];
        }

        // Ensure array has enough slots (pad with empty objects if needed)
        while (tenant.signatures.length <= index) {
            tenant.signatures.push({ name: '', designation: '', image: '' });
        }

        // Update signature at the specified index
        const signatureData = { name, designation, image: base64 };
        tenant.signatures[index] = signatureData;

        // Mark as modified to ensure Mongoose saves the mixed/array type update
        tenant.markModified('signatures');

        const savedTenant = await tenant.save();

        return NextResponse.json({
            success: true,
            message: 'Signature saved successfully',
            data: { signatures: tenant.signatures },
        });
    } catch (error) {
        console.error('Signature upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload signature' },
            { status: 500 }
        );
    }
}

// PUT - Update UPI ID
export async function PUT(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!auth.tenantId || auth.tenantId.trim() === '') {
            return NextResponse.json(
                { error: 'No tenant associated with this account.' },
                { status: 400 }
            );
        }

        await connectDB();

        const body = await request.json();
        const { upiId } = body;

        const tenant = await Tenant.findByIdAndUpdate(
            auth.tenantId,
            { upiId },
            { new: true }
        );

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'UPI ID saved successfully',
            data: { upiId: tenant.upiId },
        });
    } catch (error) {
        console.error('UPI update error:', error);
        return NextResponse.json(
            { error: 'Failed to update UPI ID' },
            { status: 500 }
        );
    }
}

// DELETE - Delete signature
export async function DELETE(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!auth.tenantId || auth.tenantId.trim() === '') {
            return NextResponse.json(
                { error: 'No tenant associated with this account.' },
                { status: 400 }
            );
        }

        await connectDB();

        const url = new URL(request.url);
        const index = parseInt(url.searchParams.get('index') || '0');

        const tenant = await Tenant.findById(auth.tenantId);
        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        if (tenant.signatures && tenant.signatures.length > index) {
            // Instead of removing the item (which shifts indices), we clear it (preserve slot)
            // unless it's the last item, in which case we can pop it to keep array clean-ish
            if (index === tenant.signatures.length - 1) {
                tenant.signatures.splice(index, 1);
            } else {
                // Replace with empty placeholder to maintain index 1's position
                tenant.signatures[index] = { name: '', designation: '', image: '' };
            }

            tenant.markModified('signatures');
            await tenant.save();
        }

        return NextResponse.json({
            success: true,
            message: 'Signature deleted successfully',
            data: { signatures: tenant.signatures },
        });
    } catch (error) {
        console.error('Signature delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete signature' },
            { status: 500 }
        );
    }
}
