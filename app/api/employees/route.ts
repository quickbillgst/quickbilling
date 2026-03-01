import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Employee } from '@/lib/models';
import { verifyAuth } from '@/lib/auth-utils';

// GET - List employees
export async function GET(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const all = searchParams.get('all'); // If 'true', return all for dropdown

        const query: any = { tenantId: auth.tenantId };

        if (search) {
            query.$or = [
                { employeeName: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } },
                { designation: { $regex: search, $options: 'i' } },
            ];
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        // Return all employees for dropdown selectors
        if (all === 'true') {
            const employees = await Employee.find(query)
                .sort({ employeeName: 1 })
                .lean();
            return NextResponse.json({ employees });
        }

        const skip = (page - 1) * limit;

        const [employees, total] = await Promise.all([
            Employee.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Employee.countDocuments(query),
        ]);

        return NextResponse.json({
            employees,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
    }
}

// POST - Create employee
export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const body = await request.json();

        if (!body.employeeName) {
            return NextResponse.json(
                { error: 'Employee name is required' },
                { status: 400 }
            );
        }

        // Strip empty strings to avoid Mongoose CastError on Date/enum fields
        const cleanBody: any = {};
        for (const [key, value] of Object.entries(body)) {
            if (value !== '' && value !== null && value !== undefined) {
                cleanBody[key] = value;
            }
        }

        const employee = new Employee({
            ...cleanBody,
            tenantId: auth.tenantId,
            createdByUserId: auth.userId,
        });

        await employee.save();

        return NextResponse.json({ success: true, employee }, { status: 201 });
    } catch (error) {
        console.error('Error creating employee:', error);
        return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
    }
}
