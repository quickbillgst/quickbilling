import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Payslip } from '@/lib/models';
import { verifyAuth } from '@/lib/auth-utils';

// GET - Get single payslip
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { id } = await params;

        const payslip = await Payslip.findOne({
            _id: id,
            tenantId: auth.tenantId,
        }).lean();

        if (!payslip) {
            return NextResponse.json({ error: 'Payslip not found' }, { status: 404 });
        }

        return NextResponse.json({ payslip });
    } catch (error) {
        console.error('Error fetching payslip:', error);
        return NextResponse.json({ error: 'Failed to fetch payslip' }, { status: 500 });
    }
}

// PUT - Update payslip
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { id } = await params;
        const body = await request.json();

        const payslip = await Payslip.findOneAndUpdate(
            { _id: id, tenantId: auth.tenantId },
            { $set: body },
            { new: true }
        ).lean();

        if (!payslip) {
            return NextResponse.json({ error: 'Payslip not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, payslip });
    } catch (error) {
        console.error('Error updating payslip:', error);
        return NextResponse.json({ error: 'Failed to update payslip' }, { status: 500 });
    }
}

// DELETE - Delete payslip
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { id } = await params;

        const payslip = await Payslip.findOneAndDelete({
            _id: id,
            tenantId: auth.tenantId,
        });

        if (!payslip) {
            return NextResponse.json({ error: 'Payslip not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Payslip deleted' });
    } catch (error) {
        console.error('Error deleting payslip:', error);
        return NextResponse.json({ error: 'Failed to delete payslip' }, { status: 500 });
    }
}
