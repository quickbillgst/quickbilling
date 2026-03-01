import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ExperienceLetter, Tenant } from '@/lib/models';
import { verifyAuth } from '@/lib/auth-utils';

// GET - List experience letters
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
            ExperienceLetter.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ExperienceLetter.countDocuments(query),
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
        console.error('Error fetching experience letters:', error);
        return NextResponse.json({ error: 'Failed to fetch experience letters' }, { status: 500 });
    }
}

// POST - Create experience letter
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
            letterDate,
            jobDescription,
            conductRating,
            signatoryName,
            signatoryDesignation,
        } = body;

        // Validate required fields
        if (!employeeName || !dateOfJoining || !lastWorkingDate || !letterDate) {
            return NextResponse.json(
                { error: 'Employee name, date of joining, last working date, and letter date are required' },
                { status: 400 }
            );
        }

        // Generate letter number: EL-YYYYMM-NNNN
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        const existingCount = await ExperienceLetter.countDocuments({
            tenantId: auth.tenantId,
            createdAt: {
                $gte: new Date(currentYear, currentMonth - 1, 1),
                $lt: new Date(currentYear, currentMonth, 1),
            },
        });

        const letterNumber = `EL-${currentYear}${String(currentMonth).padStart(2, '0')}-${String(existingCount + 1).padStart(4, '0')}`;

        const letter = new ExperienceLetter({
            tenantId: auth.tenantId,
            letterNumber,
            employeeName,
            employeeId,
            designation,
            department,
            dateOfJoining: new Date(dateOfJoining),
            lastWorkingDate: new Date(lastWorkingDate),
            letterDate: new Date(letterDate),
            jobDescription,
            conductRating: conductRating || 'Good',
            signatoryName,
            signatoryDesignation,
            status: 'generated',
            createdByUserId: auth.userId,
        });

        await letter.save();

        return NextResponse.json({ success: true, letter }, { status: 201 });
    } catch (error) {
        console.error('Error creating experience letter:', error);
        return NextResponse.json({ error: 'Failed to create experience letter' }, { status: 500 });
    }
}
