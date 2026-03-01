import { NextRequest, NextResponse } from 'next/server';
import { connectDB, RelievingLetter } from '@/lib/models';
import { verifyAuth } from '@/lib/auth-utils';

// GET - Get single relieving letter
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

        const letter = await RelievingLetter.findOne({
            _id: id,
            tenantId: auth.tenantId,
        }).lean();

        if (!letter) {
            return NextResponse.json({ error: 'Relieving letter not found' }, { status: 404 });
        }

        return NextResponse.json({ letter });
    } catch (error) {
        console.error('Error fetching relieving letter:', error);
        return NextResponse.json({ error: 'Failed to fetch relieving letter' }, { status: 500 });
    }
}

// PUT - Update relieving letter
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

        const letter = await RelievingLetter.findOneAndUpdate(
            { _id: id, tenantId: auth.tenantId },
            { $set: body },
            { new: true }
        ).lean();

        if (!letter) {
            return NextResponse.json({ error: 'Relieving letter not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, letter });
    } catch (error) {
        console.error('Error updating relieving letter:', error);
        return NextResponse.json({ error: 'Failed to update relieving letter' }, { status: 500 });
    }
}

// DELETE - Delete relieving letter
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

        const letter = await RelievingLetter.findOneAndDelete({
            _id: id,
            tenantId: auth.tenantId,
        });

        if (!letter) {
            return NextResponse.json({ error: 'Relieving letter not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Relieving letter deleted' });
    } catch (error) {
        console.error('Error deleting relieving letter:', error);
        return NextResponse.json({ error: 'Failed to delete relieving letter' }, { status: 500 });
    }
}
