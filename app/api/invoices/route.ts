import { connectDB, Invoice, Customer, Tenant, AuditLog } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { calculateInvoiceTax } from '@/lib/gst-engine';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

// Middleware: Verify JWT
function verifyAuth(request: NextRequest): { userId: string; tenantId: string } | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; tenantId: string };
    return decoded;
  } catch {
    return null;
  }
}

// Create Invoice
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      customerId,
      invoiceDate,
      dueDate,
      lineItems,
      notes,
      discountAmount = 0
    } = await request.json();

    if (!customerId || !invoiceDate || !lineItems || lineItems.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch customer and tenant
    const [customer, tenant] = await Promise.all([
      Customer.findById(customerId),
      Tenant.findById(auth.tenantId)
    ]);

    if (!customer || !tenant) {
      return NextResponse.json(
        { error: 'Customer or tenant not found' },
        { status: 404 }
      );
    }

    // Calculate tax
    const taxSummary = calculateInvoiceTax(
      lineItems.map((item: any) => ({
        amount: item.quantity * item.unitPrice,
        taxRate: item.taxRate,
        hsnCode: item.hsnCode
      })),
      {
        supplierState: tenant.address?.state || 'MH',
        supplierGstin: tenant.gstin,
        supplierRegistered: tenant.registrationType !== 'unregistered',
        buyerState: customer.billingAddress?.state || 'MH',
        buyerGstin: customer.gstin,
        buyerRegistered: customer.gstRegistered,
        isExport: false
      },
      discountAmount
    );

    // Generate invoice number from Tenant sequence
    const currentSeq = tenant.nextInvoiceNumber;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${currentSeq}`;

    // Create invoice
    const invoice = new Invoice({
      tenantId: auth.tenantId,
      invoiceNumber,
      invoiceSeries: `INV-${new Date().getFullYear()}`,
      customerId,
      invoiceDate: new Date(invoiceDate),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      lineItems,
      subtotalAmount: taxSummary.subtotal,
      discountAmount,
      taxableAmount: taxSummary.taxableAmount,
      cgstAmount: taxSummary.cgstTotal,
      sgstAmount: taxSummary.sgstTotal,
      igstAmount: taxSummary.igstTotal,
      totalTaxAmount: taxSummary.totalTax,
      totalAmount: taxSummary.grandTotal,
      status: 'draft',
      notes,
      createdByUserId: auth.userId,
      placeOfSupply: customer.billingAddress?.state || 'MH'
    });

    await invoice.save();

    // Increment invoice sequence
    await Tenant.findByIdAndUpdate(auth.tenantId, { $inc: { nextInvoiceNumber: 1 } });

    // Log to audit trail
    await AuditLog.create({
      tenantId: auth.tenantId,
      userId: auth.userId,
      actionType: 'create',
      entityType: 'invoice',
      entityId: invoice._id,
      newValues: invoice.toObject()
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          totalAmount: invoice.totalAmount,
          tax: {
            cgst: invoice.cgstAmount,
            sgst: invoice.sgstAmount,
            igst: invoice.igstAmount,
            total: invoice.totalTaxAmount
          }
        }
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

// Get Invoices
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const query: any = { tenantId: auth.tenantId };

    if (status) query.status = status;
    if (customerId) query.customerId = customerId;

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('customerId', 'name email phone gstin')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean(),
      Invoice.countDocuments(query)
    ]);

    return NextResponse.json(
      {
        success: true,
        data: invoices,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get invoices error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
