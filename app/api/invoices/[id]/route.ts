import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Invoice, Customer } from '@/lib/models';
import { verifyAuth } from '@/lib/auth-utils';

// GET - Fetch single invoice
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!auth.tenantId || auth.tenantId.trim() === '') {
            return NextResponse.json(
                { error: 'No tenant associated with this account.' },
                { status: 400 }
            );
        }

        await connectDB();

        const { id } = await params;

        const invoice = await Invoice.findOne({
            _id: id,
            tenantId: auth.tenantId,
        }).populate('customerId').lean();

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: invoice,
        });
    } catch (error) {
        console.error('Error fetching invoice:', error);
        return NextResponse.json(
            { error: 'Failed to fetch invoice' },
            { status: 500 }
        );
    }
}

// PUT - Update invoice
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!auth.tenantId || auth.tenantId.trim() === '') {
            return NextResponse.json(
                { error: 'No tenant associated with this account.' },
                { status: 400 }
            );
        }

        await connectDB();

        const { id } = await params;
        const body = await request.json();

        // Find existing invoice
        const existingInvoice = await Invoice.findOne({
            _id: id,
            tenantId: auth.tenantId,
        });

        if (!existingInvoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Don't allow editing paid invoices
        if (existingInvoice.status === 'paid') {
            return NextResponse.json(
                { error: 'Cannot edit a paid invoice' },
                { status: 400 }
            );
        }

        const {
            customerId,
            invoiceDate,
            dueDate,
            lineItems,
            notes,
            status,
            signatureIndex,
        } = body;

        // Recalculate totals if line items changed
        let subtotalAmount = 0;
        let taxableAmount = 0;
        let cgstAmount = 0;
        let sgstAmount = 0;
        let igstAmount = 0;
        let totalTaxAmount = 0;
        let discountAmount = 0;

        // Get customer for state comparison
        const customer = await Customer.findById(customerId || existingInvoice.customerId);
        const isIntrastate = customer?.billingAddress?.state === auth.tenantId; // Simplified - in real app compare tenant state

        if (lineItems && Array.isArray(lineItems)) {
            for (const item of lineItems) {
                const lineAmount = (item.quantity || 0) * (item.unitPrice || 0);
                const discount = item.discount || 0;
                const taxable = lineAmount - discount;
                const taxRate = item.taxRate || 0;
                const lineTax = taxable * (taxRate / 100);

                subtotalAmount += lineAmount;
                discountAmount += discount;
                taxableAmount += taxable;
                totalTaxAmount += lineTax;

                // For simplicity, assume all IGST or split CGST/SGST
                if (taxRate > 0) {
                    // Default to IGST calculation
                    igstAmount += lineTax;
                }

                // Update line item with calculated values
                item.lineAmount = lineAmount;
                item.lineTax = lineTax;
            }
        }

        const totalAmount = taxableAmount + totalTaxAmount;

        // Update invoice
        const updatedInvoice = await Invoice.findByIdAndUpdate(
            id,
            {
                ...(customerId && { customerId }),
                ...(invoiceDate && { invoiceDate: new Date(invoiceDate) }),
                ...(dueDate && { dueDate: new Date(dueDate) }),
                ...(lineItems && { lineItems }),
                ...(notes !== undefined && { notes }),
                ...(status && { status }),
                ...(signatureIndex !== undefined && { signatureIndex }),
                subtotalAmount,
                discountAmount,
                taxableAmount,
                cgstAmount,
                sgstAmount,
                igstAmount,
                totalTaxAmount,
                totalAmount,
            },
            { new: true }
        ).populate('customerId');

        return NextResponse.json({
            success: true,
            message: 'Invoice updated successfully',
            data: updatedInvoice,
        });
    } catch (error) {
        console.error('Error updating invoice:', error);
        return NextResponse.json(
            { error: 'Failed to update invoice' },
            { status: 500 }
        );
    }
}

// DELETE - Delete invoice
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!auth.tenantId || auth.tenantId.trim() === '') {
            return NextResponse.json(
                { error: 'No tenant associated with this account.' },
                { status: 400 }
            );
        }

        await connectDB();

        const { id } = await params;

        const invoice = await Invoice.findOne({
            _id: id,
            tenantId: auth.tenantId,
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Don't allow deleting paid invoices
        if (invoice.status === 'paid') {
            return NextResponse.json(
                { error: 'Cannot delete a paid invoice' },
                { status: 400 }
            );
        }

        await Invoice.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: 'Invoice deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting invoice:', error);
        return NextResponse.json(
            { error: 'Failed to delete invoice' },
            { status: 500 }
        );
    }
}
