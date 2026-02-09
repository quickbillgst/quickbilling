import { connectDB, Invoice } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
}

function verifyAuth(request: NextRequest): { userId: string; tenantId: string } | null {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string; tenantId: string };
        return decoded;
    } catch {
        return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const auth = verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenantId = new mongoose.Types.ObjectId(auth.tenantId);
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        // 1. Stats and Monthly Data Aggregation
        // We'll run parallel aggregations for different metrics

        // A. Monthly Trend (Revenue, Tax, Invoices count) - Last 6 months
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const monthlyTrendData = await Invoice.aggregate([
            {
                $match: {
                    tenantId: tenantId,
                    invoiceDate: { $gte: sixMonthsAgo },
                    status: { $in: ['issued', 'paid', 'partially_paid'] }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$invoiceDate" },
                        year: { $year: "$invoiceDate" }
                    },
                    amount: { $sum: "$totalAmount" },
                    tax: { $sum: "$totalTaxAmount" },
                    invoices: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Format monthly data for chart
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedMonthlyData = monthlyTrendData.map(item => ({
            name: months[item._id.month - 1],
            amount: item.amount,
            tax: item.tax,
            invoices: item.invoices,
            year: item._id.year,
            monthIndex: item._id.month
        }));

        // Fill in missing months? Optional, but good for charts. 
        // For now, we'll send what we have.

        // B. Stats Calculation
        // Current Month Metrics
        const currentMonthStats = await Invoice.aggregate([
            {
                $match: {
                    tenantId: tenantId,
                    invoiceDate: { $gte: currentMonthStart },
                    status: { $in: ['issued', 'paid', 'partially_paid'] }
                }
            },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: "$totalAmount" },
                    tax: { $sum: "$totalTaxAmount" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Last Month Metrics (for comparison)
        const lastMonthStats = await Invoice.aggregate([
            {
                $match: {
                    tenantId: tenantId,
                    invoiceDate: { $gte: lastMonthStart, $lte: lastMonthEnd },
                    status: { $in: ['issued', 'paid', 'partially_paid'] }
                }
            },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: "$totalAmount" },
                    tax: { $sum: "$totalTaxAmount" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Total Invoices (All time, excluding draft/cancelled maybe? Or just count created)
        const totalInvoicesCount = await Invoice.countDocuments({
            tenantId: tenantId,
            status: { $ne: 'cancelled' } // Count everything except cancelled
        });

        const pendingPayments = await Invoice.aggregate([
            {
                $match: {
                    tenantId: tenantId,
                    status: 'issued' // Simple proxy: issued but not paid
                }
            },
            {
                $group: {
                    _id: null,
                    amount: { $sum: "$totalAmount" }
                }
            }
        ]);

        const cm = currentMonthStats[0] || { revenue: 0, tax: 0, count: 0 };
        const lm = lastMonthStats[0] || { revenue: 0, tax: 0, count: 0 };

        const calculateChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? '+100%' : '0%';
            const change = ((current - previous) / previous) * 100;
            return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
        };

        const stats = [
            {
                label: 'Total Invoices',
                value: totalInvoicesCount.toString(),
                change: '+0%', // Hard to calc total growth without historic snapshots, maybe just leave as is or calc vs last month new
                color: 'blue'
            },
            {
                label: 'Monthly Revenue',
                value: `₹${cm.revenue.toLocaleString('en-IN')}`,
                change: calculateChange(cm.revenue, lm.revenue),
                color: 'green'
            },
            {
                label: 'Tax Collected',
                value: `₹${cm.tax.toLocaleString('en-IN')}`,
                change: calculateChange(cm.tax, lm.tax),
                color: 'orange'
            },
            {
                label: 'Pending Payments',
                value: `₹${(pendingPayments[0]?.amount || 0).toLocaleString('en-IN')}`,
                change: '0%', // Snapshot
                color: 'red'
            }
        ];

        // C. Tax Breakdown (All time or Current Month? Charts usually show current context. Let's do current year/all time)
        // Let's do All Time for distribution
        const taxBreakdownData = await Invoice.aggregate([
            {
                $match: {
                    tenantId: tenantId,
                    status: { $in: ['issued', 'paid', 'partially_paid'] }
                }
            },
            {
                $group: {
                    _id: null,
                    cgst: { $sum: "$cgstAmount" },
                    sgst: { $sum: "$sgstAmount" },
                    igst: { $sum: "$igstAmount" }
                }
            }
        ]);

        const tb = taxBreakdownData[0] || { cgst: 0, sgst: 0, igst: 0 };
        const taxBreakdown = [
            { name: 'CGST', value: tb.cgst, color: '#3b82f6' },
            { name: 'SGST', value: tb.sgst, color: '#10b981' },
            { name: 'IGST', value: tb.igst, color: '#f59e0b' }
        ].filter(item => item.value > 0);

        // D. Recent Invoices
        const recentInvoicesRaw = await Invoice.find({ tenantId: tenantId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customerId', 'name')
            .lean();

        const recentInvoices = recentInvoicesRaw.map((inv: any) => ({
            id: inv._id,
            number: inv.invoiceNumber,
            customer: inv.customerId?.name || 'Unknown',
            amount: inv.totalAmount,
            status: inv.status
        }));

        return NextResponse.json({
            success: true,
            data: {
                stats,
                monthlyData: formattedMonthlyData,
                taxBreakdown,
                recentInvoices
            }
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
    }
}
