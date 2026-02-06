import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Invoice, Customer, Tenant } from '@/lib/models';
import { calculateInvoiceTax } from '@/lib/services/gst-service';
import { verifyAuth } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      customerId,
      invoiceDate,
      dueDate,
      lineItems,
      isExport = false,
      isSez = false,
      notes,
    } = body;

    // Validate required fields
    if (!customerId || !invoiceDate || !lineItems || lineItems.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch customer and tenant
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const tenant = await Tenant.findById(auth.tenantId);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Determine if intra-state or inter-state
    const supplierState = tenant.address?.state || 'MH';
    const buyerState = customer.billingAddress?.state || 'MH';
    const isIntrastate = supplierState === buyerState;

    // Calculate taxes
    const taxableItems = lineItems.map((item: any) => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      hsn: item.hsn,
      taxRate: item.taxRate ?? 18,
      discountValue: item.discountValue,
      discountType: item.discountType,
    }));

    const taxContext = {
      state: buyerState,
      isIntrastate,
      isIntegrated: isIntrastate,
    };

    const taxSummary = calculateInvoiceTax(
      taxableItems,
      taxContext,
      false,
      isExport
    );

    // Generate invoice number from tenant settings
    const isGstBill = body.isGstBill !== false; // Default to true if not specified
    const prefix = isGstBill
      ? (tenant.invoicePrefix || 'INV-')
      : (tenant.nonGstInvoicePrefix || 'BILL-');

    let nextNum = isGstBill
      ? (tenant.nextInvoiceNumber || 1)
      : (tenant.nextNonGstInvoiceNumber || 1);

    let invoiceNumber = '';

    while (true) {
      invoiceNumber = `${prefix}${String(nextNum).padStart(5, '0')}`;
      const existing = await Invoice.findOne({
        tenantId: auth.tenantId,
        invoiceNumber
      });

      if (!existing) {
        break;
      }
      nextNum++;
    }

    // Increment next invoice number for next time
    if (isGstBill) {
      tenant.nextInvoiceNumber = nextNum + 1;
    } else {
      tenant.nextNonGstInvoiceNumber = nextNum + 1;
    }
    await tenant.save();

    // Process line items with tax calculations
    const processedLineItems = lineItems.map((item: any) => {
      const amount = item.quantity * item.unitPrice;
      const discount = item.discountValue || 0;
      const taxableAmount = amount - discount;
      const taxAmount = (taxableAmount * (item.taxRate || 18)) / 100;

      return {
        description: item.description,
        hsnCode: item.hsn,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: discount,
        taxRate: item.taxRate ?? 18,
        lineAmount: amount,
        lineTax: taxAmount,
      };
    });

    // Create invoice
    const invoice = new Invoice({
      tenantId: auth.tenantId,
      invoiceNumber,
      customerId,
      invoiceDate: new Date(invoiceDate),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      lineItems: processedLineItems,
      subtotalAmount: taxSummary.lineAmount,
      discountAmount: taxSummary.discountAmount,
      taxableAmount: taxSummary.taxableAmount,
      cgstAmount: taxSummary.cgstAmount,
      sgstAmount: taxSummary.sgstAmount,
      igstAmount: taxSummary.igstAmount,
      totalTaxAmount: taxSummary.taxAmount,
      totalAmount: taxSummary.totalAmount,
      isExport,
      placeOfSupply: buyerState,
      status: 'draft',
      notes,
      createdByUserId: auth.userId,
    });

    await invoice.save();

    return NextResponse.json(
      {
        success: true,
        invoice: {
          id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: invoice.totalAmount,
          status: invoice.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Invoice creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
