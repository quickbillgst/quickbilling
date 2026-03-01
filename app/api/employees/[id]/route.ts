import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Employee } from '@/lib/models';
import { verifyAuth } from '@/lib/auth-utils';

// GET - Get single employee
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

        const employee = await Employee.findOne({
            _id: id,
            tenantId: auth.tenantId,
        }).lean();

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        return NextResponse.json({ employee });
    } catch (error) {
        console.error('Error fetching employee:', error);
        return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 });
    }
}

// PUT - Update employee
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

        // Strip empty strings to avoid Mongoose CastError on Date/enum fields
        const cleanBody: any = {};
        for (const [key, value] of Object.entries(body)) {
            if (value !== '' && value !== null && value !== undefined) {
                cleanBody[key] = value;
            }
        }

        const employee = await Employee.findOneAndUpdate(
            { _id: id, tenantId: auth.tenantId },
            { $set: cleanBody },
            { new: true }
        ).lean();

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, employee });
    } catch (error) {
        console.error('Error updating employee:', error);
        return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
    }
}

// DELETE - Delete employee
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

        const employee = await Employee.findOneAndDelete({
            _id: id,
            tenantId: auth.tenantId,
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Employee deleted' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
    }
}
