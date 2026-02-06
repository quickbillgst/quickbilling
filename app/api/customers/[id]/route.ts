import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Customer } from '@/lib/models';
import { verifyAuth } from '@/lib/auth-utils';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();
        const customer = await Customer.findOne({
            _id: params.id,
            tenantId: auth.tenantId
        });

        if (!customer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: customer }, { status: 200 });
    } catch (error) {
        console.error('Fetch customer error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch customer' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();
        const body = await request.json();

        const customer = await Customer.findOneAndUpdate(
            { _id: params.id, tenantId: auth.tenantId },
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!customer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: customer }, { status: 200 });
    } catch (error) {
        console.error('Update customer error:', error);
        return NextResponse.json(
            { error: 'Failed to update customer' },
            { status: 500 }
        );
    }
}
