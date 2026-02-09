import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Invoice, Customer, Tenant } from '@/lib/models';
import { calculateInvoiceTax, calculateLineItemTax } from '@/lib/services/gst-service';
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
      terms,
      bankAccountId,
      enableRoundOff,
      signatureIndex = 0,
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
    const requestedPrefix = body.prefix;

    let prefix = requestedPrefix;
    let nextNum = 1;

    // Helper to find and increment in series
    let seriesUpdated = false;

    if (isGstBill) {
      if (tenant.gstInvoiceSeries && tenant.gstInvoiceSeries.length > 0 && requestedPrefix) {
        const idx = tenant.gstInvoiceSeries.findIndex((s: any) => s.prefix === requestedPrefix);
        if (idx >= 0) {
          prefix = tenant.gstInvoiceSeries[idx].prefix;
          nextNum = tenant.gstInvoiceSeries[idx].nextNumber;
          tenant.gstInvoiceSeries[idx].nextNumber += 1;
          seriesUpdated = true;
        }
      }

      if (!seriesUpdated) {
        // Fallback or legacy default
        prefix = tenant.invoicePrefix || 'INV-';
        nextNum = tenant.nextInvoiceNumber || 1;
        tenant.nextInvoiceNumber += 1;
      }
    } else {
      // Non-GST
      if (tenant.nonGstInvoiceSeries && tenant.nonGstInvoiceSeries.length > 0 && requestedPrefix) {
        const idx = tenant.nonGstInvoiceSeries.findIndex((s: any) => s.prefix === requestedPrefix);
        if (idx >= 0) {
          prefix = tenant.nonGstInvoiceSeries[idx].prefix;
          nextNum = tenant.nonGstInvoiceSeries[idx].nextNumber;
          tenant.nonGstInvoiceSeries[idx].nextNumber += 1;
          seriesUpdated = true;
        }
      }

      if (!seriesUpdated) {
        prefix = tenant.nonGstInvoicePrefix || 'BILL-';
        nextNum = tenant.nextNonGstInvoiceNumber || 1;
        tenant.nextNonGstInvoiceNumber += 1;
      }
    }

    const invoiceNumber = `${prefix}${nextNum}`;

    await tenant.save();

    // Process line items with tax calculations
    const processedLineItems = lineItems.map((item: any) => {
      const calc = calculateLineItemTax(
        {
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          hsn: item.hsn,
          taxRate: item.taxRate ?? 18,
          discountValue: item.discountValue,
          discountType: item.discountType,
        },
        taxContext,
        false,
        isExport
      );

      return {
        description: item.description,
        hsnCode: item.hsn,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: calc.discountAmount,
        discountValue: item.discountValue,
        discountType: item.discountType,
        taxRate: item.taxRate ?? 18,
        lineAmount: calc.lineAmount,
        lineTax: calc.taxAmount,
      };
    });

    // Calculate final total with round off
    let finalTotalAmount = taxSummary.totalAmount;
    let roundOffAmount = 0;

    if (enableRoundOff) {
      const rounded = Math.round(finalTotalAmount);
      roundOffAmount = rounded - finalTotalAmount;
      finalTotalAmount = rounded;
    }

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
      totalAmount: finalTotalAmount,
      roundOff: roundOffAmount,
      enableRoundOff,
      isExport,
      placeOfSupply: buyerState,
      status: 'draft',
      notes,
      terms,
      bankAccountId,
      createdByUserId: auth.userId,
      signatureIndex,
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
