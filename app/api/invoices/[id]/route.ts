import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Invoice, Customer, Tenant } from '@/lib/models';
import { verifyAuth } from '@/lib/auth-utils';
import { calculateInvoiceTax, calculateLineItemTax } from '@/lib/services/gst-service';

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
            terms,
            bankAccountId,
            enableRoundOff,
            status,
            signatureIndex,
        } = body;

        // Recalculate totals if line items changed
        const tenant = await Tenant.findById(auth.tenantId);
        const customer = await Customer.findById(customerId || existingInvoice.customerId);

        const supplierState = tenant?.address?.state || 'MH';
        const buyerState = customer?.billingAddress?.state || supplierState;
        const isIntrastate = supplierState === buyerState;

        const taxContext = {
            state: buyerState,
            isIntrastate,
            isIntegrated: isIntrastate,
        };

        const processedLineItems = (lineItems || []).map((item: any) => {
            const calc = calculateLineItemTax(
                {
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    hsn: item.hsnCode,
                    taxRate: item.taxRate,
                    discountValue: item.discountValue,
                    discountType: item.discountType,
                },
                taxContext
            );

            return {
                ...item,
                lineAmount: calc.lineAmount,
                lineTax: calc.taxAmount,
                discount: calc.discountAmount, // This is the calculated absolute discount
            };
        });

        const taxSummary = calculateInvoiceTax(
            processedLineItems.map(item => ({
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxRate: item.taxRate,
                discountValue: item.discountValue,
                discountType: item.discountType,
            })),
            taxContext
        );

        let finalTotalAmount = taxSummary.totalAmount;
        let roundOff = 0;

        if (enableRoundOff) {
            finalTotalAmount = Math.round(finalTotalAmount);
            roundOff = finalTotalAmount - taxSummary.totalAmount;
        }

        const {
            lineAmount: subtotalAmount,
            discountAmount,
            taxableAmount,
            cgstAmount,
            sgstAmount,
            igstAmount,
            taxAmount: totalTaxAmount,
        } = taxSummary;

        const totalAmount = finalTotalAmount;

        // Update invoice
        const updatedInvoice = await Invoice.findByIdAndUpdate(
            id,
            {
                ...(customerId && { customerId }),
                ...(invoiceDate && { invoiceDate: new Date(invoiceDate) }),
                ...(dueDate && { dueDate: new Date(dueDate) }),
                lineItems: processedLineItems,
                ...(notes !== undefined && { notes }),
                ...(terms !== undefined && { terms }),
                ...(bankAccountId !== undefined && { bankAccountId }),
                ...(enableRoundOff !== undefined && { enableRoundOff }),
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
                roundOff,
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

        // Check if this is the last generated invoice to reset sequence
        const invoiceNumberParts = invoice.invoiceNumber.split('-');
        const sequenceNumber = parseInt(invoiceNumberParts[invoiceNumberParts.length - 1]);

        const tenant = await Tenant.findById(auth.tenantId);

        // If this invoice matches the last generated number, we can reset the counter
        if (tenant && !isNaN(sequenceNumber) && sequenceNumber === (tenant.nextInvoiceNumber - 1)) {
            await Tenant.findByIdAndUpdate(auth.tenantId, { $inc: { nextInvoiceNumber: -1 } });
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
