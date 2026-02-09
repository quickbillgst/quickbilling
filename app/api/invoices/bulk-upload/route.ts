import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Invoice, Customer, Product, Tenant } from '@/lib/models';
import { verifyAuth } from '@/lib/auth-utils';
import { calculateInvoiceTax } from '@/lib/services/gst-service';

export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const body = await request.json();
        const { invoices } = body;

        if (!invoices || !Array.isArray(invoices)) {
            return NextResponse.json({ error: 'Invalid data format. Expected an array of invoices.' }, { status: 400 });
        }

        const tenant = await Tenant.findById(auth.tenantId);
        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        const results = {
            success: 0,
            failed: 0,
            details: [] as any[],
        };

        for (const invData of invoices) {
            try {
                // 1. Handle Customer
                let customer = await Customer.findOne({
                    tenantId: auth.tenantId,
                    $or: [
                        { name: { $regex: new RegExp(`^${invData.customerName}$`, 'i') } },
                        ...(invData.customerGstin ? [{ gstin: invData.customerGstin }] : [])
                    ]
                });

                if (!customer) {
                    customer = new Customer({
                        tenantId: auth.tenantId,
                        name: invData.customerName,
                        email: invData.customerEmail,
                        phone: invData.customerPhone,
                        gstin: invData.customerGstin,
                        gstRegistered: !!invData.customerGstin,
                        billingAddress: invData.customerAddress || { line1: 'N/A', city: 'N/A', state: tenant.address?.state || 'MH' },
                    });
                    await customer.save();
                }

                // 2. Handle Products and Line Items
                const processedLineItems = [];
                const supplierState = tenant.address?.state || 'MH';
                const buyerState = customer.billingAddress?.state || supplierState;
                const isIntrastate = supplierState === buyerState;

                for (const item of invData.lineItems) {
                    let product = await Product.findOne({
                        tenantId: auth.tenantId,
                        $or: [
                            ...(item.productSku ? [{ sku: item.productSku }] : []),
                            { name: { $regex: new RegExp(`^${item.productName}$`, 'i') } }
                        ]
                    });

                    if (!product) {
                        product = new Product({
                            tenantId: auth.tenantId,
                            sku: item.productSku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                            name: item.productName,
                            gstRate: item.taxRate || 18,
                            sellingPrice: item.unitPrice || 0,
                            trackInventory: false,
                        });
                        await product.save();
                    }

                    const amount = item.quantity * item.unitPrice;
                    const taxableAmount = amount; // Simplified for bulk upload
                    const taxRate = item.taxRate || product.gstRate || 18;
                    const taxAmount = (taxableAmount * taxRate) / 100;

                    processedLineItems.push({
                        productId: product._id,
                        description: item.productName,
                        hsnCode: product.hsnCode || item.hsnCode,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discount: 0,
                        taxRate: taxRate,
                        lineAmount: amount,
                        lineTax: taxAmount,
                    });
                }

                // 3. Round off and Totals
                const subtotal = processedLineItems.reduce((sum, item) => sum + item.lineAmount, 0);
                const totalTax = processedLineItems.reduce((sum, item) => sum + item.lineTax, 0);
                const totalAmount = subtotal + totalTax;

                let finalTotalAmount = totalAmount;
                let roundOff = 0;
                if (invData.enableRoundOff !== false) {
                    finalTotalAmount = Math.round(totalAmount);
                    roundOff = finalTotalAmount - totalAmount;
                }

                // 4. Create Invoice
                const invoice = new Invoice({
                    tenantId: auth.tenantId,
                    invoiceNumber: invData.invoiceNumber || `OLD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    customerId: customer._id,
                    invoiceDate: new Date(invData.invoiceDate),
                    dueDate: invData.dueDate ? new Date(invData.dueDate) : undefined,
                    lineItems: processedLineItems,
                    subtotalAmount: subtotal,
                    taxableAmount: subtotal,
                    totalTaxAmount: totalTax,
                    cgstAmount: isIntrastate ? totalTax / 2 : 0,
                    sgstAmount: isIntrastate ? totalTax / 2 : 0,
                    igstAmount: isIntrastate ? 0 : totalTax,
                    totalAmount: finalTotalAmount,
                    roundOff: roundOff,
                    enableRoundOff: invData.enableRoundOff !== false,
                    status: invData.status || 'paid', // Default to paid for old invoices
                    notes: invData.notes,
                    terms: invData.terms,
                    createdByUserId: auth.userId,
                    paidAmount: invData.status === 'paid' ? finalTotalAmount : (invData.paidAmount || 0),
                });

                await invoice.save();
                results.success++;
            } catch (err: any) {
                results.failed++;
                results.details.push({
                    invoice: invData.invoiceNumber || 'Unknown',
                    error: err.message,
                });
            }
        }

        return NextResponse.json(results);
    } catch (error: any) {
        console.error('Bulk upload error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
