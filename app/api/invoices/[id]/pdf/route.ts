import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Invoice, Customer, Tenant } from '@/lib/models';
import { verifyAuth } from '@/lib/auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    const invoice = await Invoice.findOne({
      _id: id,
      tenantId: auth.tenantId,
    }).lean();

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Fetch customer details
    const customer = await Customer.findById(invoice.customerId).lean();

    // Fetch company information from tenant settings
    const tenant = await Tenant.findById(auth.tenantId).lean();

    // Generate HTML for PDF
    const html = generateInvoiceHTML(invoice, customer, tenant);

    // Return HTML that can be printed/saved as PDF
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}

function generateInvoiceHTML(invoice: any, customer: any, tenant: any): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Build company address
  const companyAddressLine1 = tenant?.address?.line1 || '';
  const companyAddressLine2 = tenant?.address?.line2 || '';
  const companyCity = tenant?.address?.city || '';
  const companyState = getStateName(tenant?.address?.state) || '';
  const companyPincode = tenant?.address?.pincode || '';

  // Build customer billing address
  const customerAddressLine1 = customer?.billingAddress?.line1 || '';
  const customerAddressLine2 = customer?.billingAddress?.line2 || '';
  const customerCity = customer?.billingAddress?.city || '';
  const customerState = getStateName(customer?.billingAddress?.state) || '';
  const customerPincode = customer?.billingAddress?.pincode || '';

  // Determine state code for place of supply
  const stateCode = getStateCode(customer?.billingAddress?.state || tenant?.address?.state || 'MH');

  // Determine if IGST or CGST+SGST
  const isIGST = invoice.igstAmount > 0;

  // Calculate totals
  const taxableAmount = invoice.taxableAmount || invoice.subtotalAmount || 0;
  const grandTotal = invoice.totalAmount || 0;
  const totalQty = invoice.lineItems?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Invoice - ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      color: #333;
      background: #fff;
      padding: 20px;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
    }
    
    /* Header Row */
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
    }
    
    .invoice-title {
      color: #2563eb;
      font-size: 14px;
      font-weight: 400;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    
    .original-copy {
      color: #2563eb;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    /* Company Header */
    .company-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .company-info { flex: 1; }
    
    .company-name {
      font-size: 20px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 5px;
    }
    
    .company-details {
      font-size: 11px;
      line-height: 1.5;
      color: #4b5563;
    }
    
    .company-details .label {
      color: #2563eb;
      font-weight: 500;
    }
    
    .logo-box {
      width: 80px;
      height: 80px;
      border: 1px solid #d1d5db;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      margin-left: 20px;
    }
    
    .logo-box img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    
    /* Invoice Meta Row */
    .invoice-meta {
      display: flex;
      gap: 40px;
      margin-bottom: 15px;
      font-size: 11px;
    }
    
    .meta-item .meta-label {
      color: #6b7280;
    }
    
    .meta-item .meta-value {
      font-weight: bold;
      color: #1f2937;
    }
    
    /* Customer Section */
    .customer-row {
      display: flex;
      gap: 40px;
      margin-bottom: 15px;
      font-size: 11px;
    }
    
    .customer-col { flex: 1; }
    
    .section-label {
      color: #6b7280;
      margin-bottom: 5px;
    }
    
    .customer-name {
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 3px;
    }
    
    .customer-gstin {
      color: #4b5563;
    }
    
    .address-text {
      color: #4b5563;
      line-height: 1.5;
    }
    
    /* Place of Supply */
    .place-supply {
      margin-bottom: 15px;
      font-size: 11px;
    }
    
    .place-supply .label { color: #6b7280; }
    .place-supply .value { font-weight: bold; color: #1f2937; }
    
    /* Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 11px;
    }
    
    .items-table thead {
      border-top: 1px solid #2563eb;
      border-bottom: 1px solid #2563eb;
    }
    
    .items-table th {
      padding: 8px 6px;
      text-align: left;
      font-weight: 600;
      color: #1f2937;
      font-size: 10px;
    }
    
    .items-table th.right { text-align: right; }
    .items-table th.center { text-align: center; }
    
    .items-table td {
      padding: 10px 6px;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: top;
    }
    
    .items-table td.right { text-align: right; }
    .items-table td.center { text-align: center; }
    
    .item-desc {
      font-weight: 500;
      color: #1f2937;
    }
    
    .item-sac {
      font-size: 10px;
      color: #6b7280;
    }
    
    /* Summary Row */
    .summary-row {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 10px;
    }
    
    .totals-box {
      width: 250px;
    }
    
    .total-line {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 11px;
    }
    
    .total-line .label { color: #4b5563; }
    .total-line .value { color: #1f2937; text-align: right; }
    
    .total-line.grand {
      font-size: 16px;
      font-weight: bold;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
    }
    
    .total-line.grand .label { color: #1f2937; }
    .total-line.grand .value { color: #1f2937; }
    
    /* Items Count & Amount Words */
    .items-count-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #2563eb;
      margin-bottom: 5px;
      padding-top: 5px;
      border-top: 1px solid #e5e7eb;
    }
    
    .amount-words {
      font-size: 10px;
      color: #4b5563;
      margin-bottom: 10px;
    }
    
    /* Amount Payable */
    .amount-payable-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: bold;
      padding: 8px 0;
      border-top: 1px solid #1f2937;
      border-bottom: 1px solid #1f2937;
      margin-bottom: 20px;
    }
    
    /* Footer Section */
    .footer-section {
      display: flex;
      gap: 20px;
      padding-top: 15px;
    }
    
    .footer-col { flex: 1; }
    
    .footer-title {
      font-weight: bold;
      font-size: 11px;
      color: #1f2937;
      margin-bottom: 8px;
    }
    
    .qr-wrapper {
      display: flex;
      flex-direction: column;
    }
    
    .qr-code {
      width: 80px;
      height: 80px;
      border: 1px solid #d1d5db;
    }
    
    .qr-code img {
      width: 100%;
      height: 100%;
    }
    
    .bank-table {
      font-size: 11px;
      line-height: 1.6;
    }
    
    .bank-table .bank-label {
      color: #6b7280;
      display: inline-block;
      width: 90px;
    }
    
    .bank-table .bank-value {
      color: #1f2937;
      font-weight: 500;
    }
    
    .signature-col {
      text-align: right;
    }
    
    .for-company {
      font-size: 11px;
      color: #2563eb;
      margin-bottom: 40px;
    }
    
    .signature-image {
      height: 50px;
      margin-bottom: 5px;
    }
    
    .signature-image img {
      max-height: 50px;
      max-width: 120px;
    }
    
    .signatory-name {
      font-family: 'Brush Script MT', 'Segoe Script', cursive;
      font-size: 18px;
      color: #1e3a8a;
      margin-bottom: 5px;
    }
    
    .authorized-text {
      font-size: 10px;
      color: #6b7280;
    }
    
    /* Print */
    .print-btn {
      display: block;
      width: 180px;
      margin: 30px auto;
      padding: 10px 20px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 13px;
      cursor: pointer;
    }
    
    .print-btn:hover { background: #1d4ed8; }
    
    @media print {
      body { padding: 0; }
      .invoice-container { box-shadow: none; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header Row -->
    <div class="header-row">
      <div class="invoice-title">Tax Invoice</div>
      <div class="original-copy">Original for Recipient</div>
    </div>
    
    <!-- Company Header -->
    <div class="company-header">
      <div class="company-info">
        <div class="company-name">${tenant?.businessName || 'COMPANY NAME'}</div>
        <div class="company-details">
          ${tenant?.gstin ? `<span class="label">GSTIN</span> ${tenant.gstin}` : ''}
          ${tenant?.pan ? `&nbsp;&nbsp;<span class="label">PAN</span> ${tenant.pan}` : ''}
          <br>
          ${companyAddressLine1}${companyAddressLine2 ? ', ' + companyAddressLine2 : ''}<br>
          ${companyCity}${companyState ? ', ' + companyState : ''}${companyPincode ? ', ' + companyPincode : ''}<br>
          ${tenant?.phone ? `<span class="label">Mobile</span> +91 ${tenant.phone}` : ''}
          ${tenant?.email ? `&nbsp;&nbsp;<span class="label">Email</span> ${tenant.email}` : ''}<br>
          ${process.env.NEXT_PUBLIC_APP_URL ? `<span class="label">Website</span> ${process.env.NEXT_PUBLIC_APP_URL}` : ''}
        </div>
      </div>
      <div class="logo-box">
        ${tenant?.logo
      ? `<img src="${tenant.logo}" alt="Logo" />`
      : `<span style="font-size: 24px; font-weight: bold; color: #2563eb;">${tenant?.businessName?.substring(0, 2)?.toUpperCase() || 'CO'}</span>`
    }
      </div>
    </div>
    
    <!-- Invoice Meta -->
    <div class="invoice-meta">
      <div class="meta-item">
        <span class="meta-label">Invoice #:</span>
        <span class="meta-value">${invoice.invoiceNumber}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Invoice Date:</span>
        <span class="meta-value">${formatDate(invoice.invoiceDate)}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Due Date:</span>
        <span class="meta-value">${formatDate(invoice.dueDate) || 'On Receipt'}</span>
      </div>
    </div>
    
    <!-- Customer Row -->
    <div class="customer-row">
      <div class="customer-col">
        <div class="section-label">Customer Details:</div>
        <div class="customer-name">${customer?.name || 'N/A'}</div>
        <div class="customer-gstin">${customer?.gstin ? `GSTIN: ${customer.gstin}` : ''}</div>
      </div>
      <div class="customer-col">
        <div class="section-label">Billing Address:</div>
        <div class="address-text">
          ${customerAddressLine1}${customerAddressLine2 ? ', ' + customerAddressLine2 : ''}<br>
          ${customerCity}${customerState ? ', ' + customerState : ''}${customerPincode ? ', ' + customerPincode : ''}
        </div>
      </div>
    </div>
    
    <!-- Place of Supply -->
    <div class="place-supply">
      <span class="label">Place of Supply:</span>
      <span class="value">${stateCode}</span>
    </div>
    
    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th class="center" style="width:30px;">#</th>
          <th>Item</th>
          <th class="right">Rate / Item</th>
          <th class="center">Qty</th>
          <th class="right">Taxable Value</th>
          <th class="right">Tax Amount</th>
          <th class="right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${(invoice.lineItems || []).map((item: any, index: number) => {
      const taxableValue = (item.unitPrice * item.quantity) - (item.discount || 0);
      const taxAmount = item.lineTax || 0;
      const lineTotal = item.lineAmount || taxableValue + taxAmount;
      return `
          <tr>
            <td class="center">${index + 1}</td>
            <td>
              <div class="item-desc">${item.description || 'Item'}</div>
              ${item.hsnCode ? `<div class="item-sac">SAC: ${item.hsnCode}</div>` : ''}
            </td>
            <td class="right">${formatCurrency(item.unitPrice)}</td>
            <td class="center">${item.quantity}</td>
            <td class="right">${formatCurrency(taxableValue)}</td>
            <td class="right">${formatCurrency(taxAmount)} (${item.taxRate || 0}%)</td>
            <td class="right">${formatCurrency(lineTotal)}</td>
          </tr>
        `;
    }).join('')}
      </tbody>
    </table>
    
    <!-- Summary -->
    <div class="summary-row">
      <div class="totals-box">
        <div class="total-line">
          <span class="label">Taxable Amount</span>
          <span class="value">₹${formatCurrency(taxableAmount)}</span>
        </div>
        ${isIGST ? `
          <div class="total-line">
            <span class="label">IGST ${invoice.lineItems?.[0]?.taxRate || 18}.0%</span>
            <span class="value">₹${formatCurrency(invoice.igstAmount || 0)}</span>
          </div>
        ` : `
          <div class="total-line">
            <span class="label">CGST</span>
            <span class="value">₹${formatCurrency(invoice.cgstAmount || 0)}</span>
          </div>
          <div class="total-line">
            <span class="label">SGST</span>
            <span class="value">₹${formatCurrency(invoice.sgstAmount || 0)}</span>
          </div>
        `}
        <div class="total-line grand">
          <span class="label">Total</span>
          <span class="value">₹${formatCurrency(grandTotal)}</span>
        </div>
      </div>
    </div>
    
    <!-- Items Count & Amount Words -->
    <div class="items-count-row">
      <span>Total Items / Qty: ${invoice.lineItems?.length || 0}/${totalQty}</span>
      <span class="amount-words"><strong>Total amount (in words):</strong> INR ${convertToWords(grandTotal)}</span>
    </div>
    
    <!-- Amount Payable -->
    <div class="amount-payable-row">
      <span>Amount Payable:</span>
      <span>₹${formatCurrency(grandTotal)}</span>
    </div>
    
    <!-- Footer Section -->
    <div class="footer-section">
      <!-- UPI Section -->
      <div class="footer-col">
        <div class="footer-title">Pay using UPI:</div>
        <div class="qr-wrapper">
          ${tenant?.upiId
      ? `<div class="qr-code">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=upi://pay?pa=${encodeURIComponent(tenant.upiId)}&pn=${encodeURIComponent(tenant.businessName || 'Business')}&am=${grandTotal}&cu=INR" alt="UPI QR" />
              </div>
              <div style="font-size:10px;margin-top:5px;color:#4b5563;">${tenant.upiId}</div>`
      : `<div class="qr-code" style="display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:9px;">No UPI</div>`
    }
        </div>
      </div>
      
      <!-- Bank Details -->
      <div class="footer-col">
        <div class="footer-title">Bank Details:</div>
        <div class="bank-table">
          <span class="bank-label">Bank:</span><span class="bank-value">${tenant?.bankDetails?.bankName || 'N/A'}</span><br>
          <span class="bank-label">Account Holder:</span><span class="bank-value">${tenant?.bankDetails?.accountName || tenant?.businessName || 'N/A'}</span><br>
          <span class="bank-label">Account #:</span><span class="bank-value">${tenant?.bankDetails?.accountNumber || 'N/A'}</span><br>
          <span class="bank-label">IFSC Code:</span><span class="bank-value">${tenant?.bankDetails?.ifscCode || 'N/A'}</span><br>
          ${tenant?.bankDetails?.branchName ? `<span class="bank-label">Branch:</span><span class="bank-value">${tenant.bankDetails.branchName}</span>` : ''}
        </div>
      </div>
      
      <!-- Signature -->
      <div class="footer-col signature-col">
        <div class="for-company">For ${tenant?.businessName || 'COMPANY NAME'}</div>
        ${(() => {
      const sigIdx = invoice.signatureIndex || 0;
      const signature = tenant?.signatures?.[sigIdx];
      if (signature?.image) {
        return `
              <div class="signature-image">
                <img src="${signature.image}" alt="Signature" />
              </div>
              <div class="signatory-name">${signature.name || ''}</div>
            `;
      }
      return `<div style="height:50px;"></div>`;
    })()}
        <div class="authorized-text">Authorized Signatory</div>
      </div>
    </div>
  </div>
  
  <button class="print-btn" onclick="window.print()">Download / Print Invoice</button>
</body>
</html>
  `;
}

// Helper function to get full state name
function getStateName(code: string): string {
  const states: Record<string, string> = {
    'AP': 'Andhra Pradesh', 'AR': 'Arunachal Pradesh', 'AS': 'Assam',
    'BR': 'Bihar', 'CT': 'Chhattisgarh', 'GA': 'Goa', 'GJ': 'Gujarat',
    'HR': 'Haryana', 'HP': 'Himachal Pradesh', 'JH': 'Jharkhand',
    'KA': 'Karnataka', 'KL': 'Kerala', 'MP': 'Madhya Pradesh',
    'MH': 'Maharashtra', 'MN': 'Manipur', 'ML': 'Meghalaya',
    'MZ': 'Mizoram', 'NL': 'Nagaland', 'OR': 'Odisha', 'PB': 'Punjab',
    'RJ': 'Rajasthan', 'SK': 'Sikkim', 'TN': 'Tamil Nadu',
    'TG': 'Telangana', 'TR': 'Tripura', 'UP': 'Uttar Pradesh',
    'UK': 'Uttarakhand', 'WB': 'West Bengal', 'DL': 'Delhi',
    'JK': 'Jammu and Kashmir', 'LA': 'Ladakh', 'CH': 'Chandigarh',
    'AN': 'Andaman and Nicobar', 'DN': 'Dadra and Nagar Haveli',
    'LD': 'Lakshadweep', 'PY': 'Puducherry'
  };
  return states[code] || code || '';
}

// Helper function to get state code display
function getStateCode(code: string): string {
  const stateCodes: Record<string, string> = {
    'AP': '37-ANDHRA PRADESH', 'AR': '12-ARUNACHAL PRADESH', 'AS': '18-ASSAM',
    'BR': '10-BIHAR', 'CT': '22-CHHATTISGARH', 'GA': '30-GOA', 'GJ': '24-GUJARAT',
    'HR': '06-HARYANA', 'HP': '02-HIMACHAL PRADESH', 'JH': '20-JHARKHAND',
    'KA': '29-KARNATAKA', 'KL': '32-KERALA', 'MP': '23-MADHYA PRADESH',
    'MH': '27-MAHARASHTRA', 'MN': '14-MANIPUR', 'ML': '17-MEGHALAYA',
    'MZ': '15-MIZORAM', 'NL': '13-NAGALAND', 'OR': '21-ODISHA', 'PB': '03-PUNJAB',
    'RJ': '08-RAJASTHAN', 'SK': '11-SIKKIM', 'TN': '33-TAMIL NADU',
    'TG': '36-TELANGANA', 'TR': '16-TRIPURA', 'UP': '09-UTTAR PRADESH',
    'UK': '05-UTTARAKHAND', 'WB': '19-WEST BENGAL', 'DL': '07-DELHI',
    'JK': '01-JAMMU AND KASHMIR', 'LA': '38-LADAKH', 'CH': '04-CHANDIGARH',
    'AN': '35-ANDAMAN AND NICOBAR', 'DN': '26-DADRA AND NAGAR HAVELI',
    'LD': '31-LAKSHADWEEP', 'PY': '34-PUDUCHERRY'
  };
  return stateCodes[code] || code || '';
}

// Helper function to convert number to words
function convertToWords(amount: number): string {
  if (!amount || amount === 0) return 'Zero Only.';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const numToWords = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numToWords(n % 100) : '');
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '');
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numToWords(n % 100000) : '');
    return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numToWords(n % 10000000) : '');
  };

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let result = numToWords(rupees);
  if (paise > 0) {
    result += ' and ' + numToWords(paise) + ' Paise';
  }
  result += ' Rupees Only.';

  return result;
}
