import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Payslip, Tenant } from '@/lib/models';
import { verifyAuth } from '@/lib/auth-utils';

// Helper to convert number to words
function numberToWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return 'Zero';

    function helper(n: number): string {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + helper(n % 100) : '');
        if (n < 100000) return helper(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + helper(n % 1000) : '');
        if (n < 10000000) return helper(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + helper(n % 100000) : '');
        return helper(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + helper(n % 10000000) : '');
    }

    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);

    let result = helper(rupees) + ' Rupees';
    if (paise > 0) {
        result += ' and ' + helper(paise) + ' Paise';
    }
    result += ' Only';

    return result;
}

// GET - List payslips
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
                { payslipNumber: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } },
            ];
        }

        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const [payslips, total] = await Promise.all([
            Payslip.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Payslip.countDocuments(query),
        ]);

        return NextResponse.json({
            payslips,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching payslips:', error);
        return NextResponse.json({ error: 'Failed to fetch payslips' }, { status: 500 });
    }
}

// POST - Create payslip
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
            bankAccountNumber,
            bankName,
            ifscCode,
            panNumber,
            payPeriod,
            payDate,
            basicSalary = 0,
            hra = 0,
            conveyanceAllowance = 0,
            medicalAllowance = 0,
            specialAllowance = 0,
            otherEarnings = 0,
            bonus = 0,
            overtime = 0,
            providentFund = 0,
            professionalTax = 0,
            incomeTax = 0,
            esi = 0,
            loanDeduction = 0,
            otherDeductions = 0,
            workingDays,
            presentDays,
            lop = 0,
            notes,
        } = body;

        // Validate required fields
        if (!employeeName || !payPeriod || !payDate) {
            return NextResponse.json(
                { error: 'Employee name, pay period, and pay date are required' },
                { status: 400 }
            );
        }

        // Calculate gross earnings
        const grossEarnings =
            basicSalary + hra + conveyanceAllowance + medicalAllowance +
            specialAllowance + otherEarnings + bonus + overtime;

        // Calculate total deductions
        const totalDeductions =
            providentFund + professionalTax + incomeTax + esi +
            loanDeduction + otherDeductions;

        // Calculate net pay
        const netPay = grossEarnings - totalDeductions;

        // Convert net pay to words
        const netPayInWords = numberToWords(netPay);

        // Generate payslip number
        const tenant = await Tenant.findById(auth.tenantId);
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        // Count existing payslips for this month
        const existingCount = await Payslip.countDocuments({
            tenantId: auth.tenantId,
            createdAt: {
                $gte: new Date(currentYear, currentMonth - 1, 1),
                $lt: new Date(currentYear, currentMonth, 1),
            },
        });

        const payslipNumber = `PS-${currentYear}${String(currentMonth).padStart(2, '0')}-${String(existingCount + 1).padStart(4, '0')}`;

        // Create payslip
        const payslip = new Payslip({
            tenantId: auth.tenantId,
            payslipNumber,
            employeeName,
            employeeId,
            designation,
            department,
            bankAccountNumber,
            bankName,
            ifscCode,
            panNumber,
            payPeriod,
            payDate: new Date(payDate),
            basicSalary,
            hra,
            conveyanceAllowance,
            medicalAllowance,
            specialAllowance,
            otherEarnings,
            bonus,
            overtime,
            providentFund,
            professionalTax,
            incomeTax,
            esi,
            loanDeduction,
            otherDeductions,
            grossEarnings,
            totalDeductions,
            netPay,
            netPayInWords,
            workingDays,
            presentDays,
            lop,
            notes,
            status: 'generated',
            createdByUserId: auth.userId,
        });

        await payslip.save();

        return NextResponse.json(
            {
                success: true,
                payslip: {
                    id: payslip._id,
                    payslipNumber: payslip.payslipNumber,
                    employeeName: payslip.employeeName,
                    netPay: payslip.netPay,
                    status: payslip.status,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Payslip creation error:', error);
        return NextResponse.json({ error: 'Failed to create payslip' }, { status: 500 });
    }
}
