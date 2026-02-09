import { connectDB, Tenant } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

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

        const tenant = await Tenant.findById(auth.tenantId);
        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: tenant }, { status: 200 });
    } catch (error) {
        console.error('Fetch settings error:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        await connectDB();
        const auth = verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const tenant = await Tenant.findById(auth.tenantId);

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        // Update fields
        if (body.businessName) tenant.businessName = body.businessName;
        if (body.email) tenant.email = body.email;
        if (body.phone) tenant.phone = body.phone;
        if (body.gstin) tenant.gstin = body.gstin;
        if (body.pan) tenant.pan = body.pan;
        if (body.invoicePrefix !== undefined) tenant.invoicePrefix = body.invoicePrefix;
        if (body.nextInvoiceNumber !== undefined) tenant.nextInvoiceNumber = parseInt(body.nextInvoiceNumber);
        if (body.nonGstInvoicePrefix !== undefined) tenant.nonGstInvoicePrefix = body.nonGstInvoicePrefix;
        if (body.nextNonGstInvoiceNumber !== undefined) tenant.nextNonGstInvoiceNumber = parseInt(body.nextNonGstInvoiceNumber);
        if (body.gstInvoiceSeries) tenant.gstInvoiceSeries = body.gstInvoiceSeries;
        if (body.nonGstInvoiceSeries) tenant.nonGstInvoiceSeries = body.nonGstInvoiceSeries;

        // Address update logic
        if (body.address) {
            tenant.address = { ...tenant.address, ...body.address };
        }

        // Bank Details update logic
        if (body.bankDetails) {
            tenant.bankDetails = { ...tenant.bankDetails, ...body.bankDetails };
        }

        if (body.bankAccounts) {
            tenant.bankAccounts = body.bankAccounts;
        }

        await tenant.save();

        return NextResponse.json({ success: true, data: tenant }, { status: 200 });
    } catch (error: any) {
        console.error('Update settings error:', error);

        // Handle duplicate key error
        if (error.code === 11000) {
            if (error.keyPattern?.gstin) {
                return NextResponse.json({ error: 'This GSTIN is already registered with another business.' }, { status: 400 });
            }
            if (error.keyPattern?.pan) {
                return NextResponse.json({ error: 'This PAN is already registered with another business.' }, { status: 400 });
            }
            return NextResponse.json({ error: 'Duplicate field value entered.' }, { status: 400 });
        }

        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
