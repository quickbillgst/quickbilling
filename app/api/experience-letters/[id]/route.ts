import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ExperienceLetter } from '@/lib/models';
import { verifyAuth } from '@/lib/auth-utils';

// GET - Get single experience letter
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

        const letter = await ExperienceLetter.findOne({
            _id: id,
            tenantId: auth.tenantId,
        }).lean();

        if (!letter) {
            return NextResponse.json({ error: 'Experience letter not found' }, { status: 404 });
        }

        return NextResponse.json({ letter });
    } catch (error) {
        console.error('Error fetching experience letter:', error);
        return NextResponse.json({ error: 'Failed to fetch experience letter' }, { status: 500 });
    }
}

// PUT - Update experience letter
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

        const letter = await ExperienceLetter.findOneAndUpdate(
            { _id: id, tenantId: auth.tenantId },
            { $set: body },
            { new: true }
        ).lean();

        if (!letter) {
            return NextResponse.json({ error: 'Experience letter not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, letter });
    } catch (error) {
        console.error('Error updating experience letter:', error);
        return NextResponse.json({ error: 'Failed to update experience letter' }, { status: 500 });
    }
}

// DELETE - Delete experience letter
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

        const letter = await ExperienceLetter.findOneAndDelete({
            _id: id,
            tenantId: auth.tenantId,
        });

        if (!letter) {
            return NextResponse.json({ error: 'Experience letter not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Experience letter deleted' });
    } catch (error) {
        console.error('Error deleting experience letter:', error);
        return NextResponse.json({ error: 'Failed to delete experience letter' }, { status: 500 });
    }
}
