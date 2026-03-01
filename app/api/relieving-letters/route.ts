import { NextRequest, NextResponse } from 'next/server';
import { connectDB, RelievingLetter, Tenant } from '@/lib/models';
import { verifyAuth } from '@/lib/auth-utils';

// GET - List relieving letters
export async function GET(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';

        const query: any = { tenantId: auth.tenantId };

        if (search) {
            query.$or = [
                { employeeName: { $regex: search, $options: 'i' } },
                { letterNumber: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } },
            ];
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const [letters, total] = await Promise.all([
            RelievingLetter.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            RelievingLetter.countDocuments(query),
        ]);

        return NextResponse.json({
            letters,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching relieving letters:', error);
        return NextResponse.json({ error: 'Failed to fetch relieving letters' }, { status: 500 });
    }
}

// POST - Create relieving letter
export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();
        const {
            employeeName,
            employeeId,
            designation,
            department,
            dateOfJoining,
            lastWorkingDate,
            relievingDate,
            signatoryName,
            signatoryDesignation,
            remarks,
        } = body;

        // Validate required fields
        if (!employeeName || !dateOfJoining || !lastWorkingDate || !relievingDate) {
            return NextResponse.json(
                { error: 'Employee name, date of joining, last working date, and relieving date are required' },
                { status: 400 }
            );
        }

        // Generate letter number: RL-YYYYMM-NNNN
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        const existingCount = await RelievingLetter.countDocuments({
            tenantId: auth.tenantId,
            createdAt: {
                $gte: new Date(currentYear, currentMonth - 1, 1),
                $lt: new Date(currentYear, currentMonth, 1),
            },
        });

        const letterNumber = `RL-${currentYear}${String(currentMonth).padStart(2, '0')}-${String(existingCount + 1).padStart(4, '0')}`;

        const letter = new RelievingLetter({
            tenantId: auth.tenantId,
            letterNumber,
            employeeName,
            employeeId,
            designation,
            department,
            dateOfJoining: new Date(dateOfJoining),
            lastWorkingDate: new Date(lastWorkingDate),
            relievingDate: new Date(relievingDate),
            signatoryName,
            signatoryDesignation,
            remarks,
            status: 'generated',
            createdByUserId: auth.userId,
        });

        await letter.save();

        return NextResponse.json({ success: true, letter }, { status: 201 });
    } catch (error) {
        console.error('Error creating relieving letter:', error);
        return NextResponse.json({ error: 'Failed to create relieving letter' }, { status: 500 });
    }
}
