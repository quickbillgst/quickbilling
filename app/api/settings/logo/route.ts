import { connectDB, Tenant } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-utils';

// Max file size: 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;

export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Validate tenantId exists and is not empty
        if (!auth.tenantId || auth.tenantId.trim() === '') {
            return NextResponse.json(
                { error: 'No tenant associated with this account. Please contact support.' },
                { status: 400 }
            );
        }

        await connectDB();

        const formData = await request.formData();
        const file = formData.get('logo') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Please upload JPG, PNG, GIF or WebP' },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 2MB' },
                { status: 400 }
            );
        }

        // Convert to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

        // Update tenant with logo
        const tenant = await Tenant.findByIdAndUpdate(
            auth.tenantId,
            { logo: base64 },
            { new: true }
        );

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Logo uploaded successfully',
            data: { logo: base64 }
        });

    } catch (error) {
        console.error('Logo upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload logo' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Validate tenantId exists and is not empty
        if (!auth.tenantId || auth.tenantId.trim() === '') {
            return NextResponse.json(
                { error: 'No tenant associated with this account. Please contact support.' },
                { status: 400 }
            );
        }

        await connectDB();

        const tenant = await Tenant.findByIdAndUpdate(
            auth.tenantId,
            { $unset: { logo: '' } },
            { new: true }
        );

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Logo removed successfully'
        });

    } catch (error) {
        console.error('Logo delete error:', error);
        return NextResponse.json(
            { error: 'Failed to remove logo' },
            { status: 500 }
        );
    }
}
