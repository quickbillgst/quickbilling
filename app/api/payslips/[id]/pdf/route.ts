import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Payslip, Tenant } from '@/lib/models';
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

    const payslip = await Payslip.findOne({
      _id: id,
      tenantId: auth.tenantId,
    }).lean();

    if (!payslip) {
      return NextResponse.json({ error: 'Payslip not found' }, { status: 404 });
    }

    // Fetch company information from settings
    const tenant = await Tenant.findById(auth.tenantId).lean();

    // Generate HTML for PDF
    const html = generatePayslipHTML(payslip, tenant);

    // Return HTML that can be printed/saved as PDF
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error generating payslip PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate payslip' },
      { status: 500 }
    );
  }
}

function generatePayslipHTML(payslip: any, tenant: any): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (date: Date | string | undefined | null, format: 'short' | 'long' = 'short') => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (format === 'long') {
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).toUpperCase().replace(/ /g, '-');
    }
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Build company address
  const companyAddress = tenant?.address
    ? `${tenant.address.line1 || ''}${tenant.address.line2 ? ', ' + tenant.address.line2 : ''}`
    : '';
  const companyCity = tenant?.address
    ? `${tenant.address.city || ''}, ${getStateName(tenant.address.state) || ''}, India ${tenant.address.pincode || ''}`
    : '';

  // Get month and year from pay period
  const payPeriodParts = payslip.payPeriod?.split(' ') || ['', ''];
  const payMonth = payPeriodParts[0]?.toUpperCase() || '';
  const payYear = payPeriodParts[1] || new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payslip - ${payslip.payPeriod}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      background: #f5f5f5;
      padding: 20px;
      color: #333;
    }
    
    .payslip-container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    /* Global label style - all labels should be bold */
    .label {
      font-weight: bold !important;
      background: #f5f5f5;
    }
    
    /* Header Section */
    .header {
      display: flex;
      align-items: flex-start;
      margin-bottom: 20px;
      border-bottom: 2px solid #333;
      padding-bottom: 15px;
    }
    
    .company-logo {
      width: 80px;
      height: 80px;
      background: #fff;
      border: 1px solid #ddd;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #d35400;
      font-weight: bold;
      font-size: 24px;
      margin-right: 20px;
      flex-shrink: 0;
      overflow: hidden;
    }
    
    .company-logo img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    
    .company-info {
      flex: 1;
    }
    
    .company-name {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 5px;
      text-transform: uppercase;
    }
    
    .company-address {
      font-size: 11px;
      line-height: 1.5;
      color: #555;
    }
    
    /* Title */
    .payslip-title {
      text-align: center;
      font-size: 14px;
      font-weight: bold;
      margin: 20px 0;
      padding: 10px;
      background: #f9f9f9;
      border: 1px solid #ddd;
    }
    
    /* Employee Details Table */
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    
    .info-table td {
      border: 1px solid #333;
      padding: 6px 8px;
      font-size: 11px;
    }
    
    .info-table .label {
      background: #f5f5f5;
      font-weight: bold;
      width: 12%;
    }
    
    .info-table .value {
      width: 21%;
    }
    
    /* Regime Type Row */
    .regime-row {
      margin-bottom: 15px;
    }
    
    .regime-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .regime-table td {
      border: 1px solid #333;
      padding: 6px 8px;
      font-size: 11px;
    }
    
    .regime-table .label {
      background: #f5f5f5;
      font-weight: bold;
      width: 12%;
    }
    
    /* Earnings & Deductions Table */
    .salary-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    
    .salary-table th {
      border: 1px solid #333;
      padding: 8px;
      font-size: 11px;
      font-weight: bold;
      background: #f5f5f5;
      text-align: left;
    }
    
    .salary-table td {
      border: 1px solid #333;
      padding: 6px 8px;
      font-size: 11px;
    }
    
    .salary-table .amount-col {
      text-align: right;
      width: 12%;
    }
    
    .salary-table .earnings-col {
      width: 20%;
    }
    
    .salary-table .deductions-col {
      width: 20%;
    }
    
    .salary-table .total-row {
      font-weight: bold;
      background: #f9f9f9;
    }
    
    /* Make earnings and deductions labels bold */
    .salary-table td:first-child,
    .salary-table td:nth-child(4) {
      font-weight: bold;
    }
    
    /* Net Pay Section */
    .net-pay-section {
      border: 1px solid #333;
      margin-bottom: 15px;
    }
    
    .net-pay-row {
      display: flex;
      border-bottom: 1px solid #333;
    }
    
    .net-pay-row:last-child {
      border-bottom: none;
    }
    
    .net-pay-label {
      padding: 8px 10px;
      font-weight: bold;
      width: 100px;
      background: #f5f5f5;
      border-right: 1px solid #333;
      font-size: 11px;
    }
    
    .net-pay-value {
      padding: 8px 10px;
      flex: 1;
      font-size: 11px;
      font-weight: bold;
    }
    
    /* Bank Section */
    .bank-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    
    .bank-table th,
    .bank-table td {
      border: 1px solid #333;
      padding: 8px;
      font-size: 11px;
      text-align: left;
    }
    
    .bank-table th {
      background: #f5f5f5;
      font-weight: bold;
      width: 50%;
    }
    
    /* Footer */
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 10px;
      color: #666;
      padding-top: 15px;
      border-top: 1px solid #ddd;
    }
    
    .print-btn {
      display: block;
      width: 200px;
      margin: 20px auto;
      padding: 12px 24px;
      background: #d35400;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.3s;
    }
    
    .print-btn:hover {
      background: #e67e22;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
        font-size: 10px;
      }
      
      .payslip-container {
        box-shadow: none;
        padding: 10px;
      }
      
      .print-btn {
        display: none;
      }
      
      .info-table td,
      .salary-table th,
      .salary-table td,
      .regime-table td,
      .bank-table th,
      .bank-table td {
        font-size: 9px;
        padding: 4px 6px;
      }
    }
  </style>
</head>
<body>
  <div class="payslip-container">
    <!-- Header with Company Info -->
    <div class="header">
      <div class="company-logo">
        ${tenant?.logo
      ? `<img src="${tenant.logo}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;" />`
      : tenant?.businessName?.substring(0, 3)?.toUpperCase() || 'CO'
    }
      </div>
      <div class="company-info">
        <div class="company-name">${tenant?.businessName || 'COMPANY NAME'}</div>
        <div class="company-address">
          ${companyAddress}<br>
          ${companyCity}<br>
          ${tenant?.gstin ? `<strong>GSTIN:</strong> ${tenant.gstin} | ` : ''}
          ${tenant?.pan ? `<strong>PAN:</strong> ${tenant.pan}` : ''}<br>
          ${tenant?.email ? `<strong>Email:</strong> ${tenant.email} | ` : ''}
          ${tenant?.phone ? `<strong>Ph:</strong> ${tenant.phone}` : ''}
        </div>
      </div>
    </div>
    
    <!-- Payslip Title -->
    <div class="payslip-title">
      PAYSLIP FOR THE MONTH OF ${payMonth} ${payYear}
    </div>
    
    <!-- Employee Information Table -->
    <table class="info-table">
      <tr>
        <td class="label">Emp Code</td>
        <td class="value">${payslip.employeeId || 'N/A'}</td>
        <td class="label">Emp Name</td>
        <td class="value">${payslip.employeeName || 'N/A'}</td>
        <td class="label">PF No.</td>
        <td class="value">${payslip.pfNumber || 'N/A'}</td>
      </tr>
      <tr>
        <td class="label">Department</td>
        <td class="value">${payslip.department || 'N/A'}</td>
        <td class="label">Cost Center</td>
        <td class="value">${payslip.costCenter || 'N/A'}</td>
        <td class="label">ESI No.</td>
        <td class="value">${payslip.esiNumber || 'N/A'}</td>
      </tr>
      <tr>
        <td class="label">Location</td>
        <td class="value">${payslip.location || tenant?.address?.city || 'N/A'}</td>
        <td class="label">Designation</td>
        <td class="value">${payslip.designation || 'N/A'}</td>
        <td class="label">Pan No.</td>
        <td class="value">${payslip.panNumber || 'N/A'}</td>
      </tr>
      <tr>
        <td class="label">Date of Birth</td>
        <td class="value">${formatDate(payslip.dateOfBirth, 'long')}</td>
        <td class="label">Bank A/c No</td>
        <td class="value">${payslip.bankAccountNumber || 'N/A'}</td>
        <td class="label">EPS No.</td>
        <td class="value">${payslip.epsNumber || 'N/A'}</td>
      </tr>
      <tr>
        <td class="label">Date of Joining</td>
        <td class="value">${formatDate(payslip.dateOfJoining, 'long')}</td>
        <td class="label">Gender</td>
        <td class="value">${payslip.gender || 'N/A'}</td>
        <td class="label">UAN</td>
        <td class="value">${payslip.uan || 'N/A'}</td>
      </tr>
    </table>
    
    <!-- Regime Type -->
    <table class="regime-table">
      <tr>
        <td class="label">Regime Type</td>
        <td>${payslip.regimeType === 'old' ? 'Old Regime' : 'New Regime'}</td>
      </tr>
    </table>
    
    <div style="height: 15px;"></div>
    
    <!-- Earnings & Deductions Table -->
    <table class="salary-table">
      <thead>
        <tr>
          <th class="earnings-col">Earnings</th>
          <th class="amount-col">Amount</th>
          <th class="amount-col">YTD</th>
          <th class="deductions-col">Deductions</th>
          <th class="amount-col">Amount</th>
          <th class="amount-col">YTD</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="label">Basic</td>
          <td class="amount-col">${formatCurrency(payslip.basicSalary)}</td>
          <td class="amount-col">${formatCurrency(payslip.ytdBasic)}</td>
          <td class="label">Provident Fund</td>
          <td class="amount-col">${formatCurrency(payslip.providentFund)}</td>
          <td class="amount-col">${formatCurrency(payslip.ytdPF)}</td>
        </tr>
        <tr>
          <td class="label">House Rent Allowance</td>
          <td class="amount-col">${formatCurrency(payslip.hra)}</td>
          <td class="amount-col">${formatCurrency(payslip.ytdHra)}</td>
          <td class="label">Professional Tax</td>
          <td class="amount-col">${formatCurrency(payslip.professionalTax)}</td>
          <td class="amount-col">${formatCurrency(payslip.ytdPT)}</td>
        </tr>
        <tr>
          <td class="label">Conveyance</td>
          <td class="amount-col">${formatCurrency(payslip.conveyanceAllowance)}</td>
          <td class="amount-col">${formatCurrency(payslip.ytdConveyance)}</td>
          <td class="label">Voluntary Provident Fund</td>
          <td class="amount-col">${formatCurrency(payslip.voluntaryPF)}</td>
          <td class="amount-col">${formatCurrency(payslip.ytdVPF)}</td>
        </tr>
        <tr>
          <td class="label">Medical Reimbursement</td>
          <td class="amount-col">${formatCurrency(payslip.medicalAllowance)}</td>
          <td class="amount-col">${formatCurrency(payslip.ytdMedical)}</td>
          <td class="label">Food Deduction</td>
          <td class="amount-col">${formatCurrency(payslip.foodDeduction)}</td>
          <td class="amount-col">${formatCurrency(payslip.ytdFoodDeduction)}</td>
        </tr>
        <tr>
          <td class="label">Food Reimbursement</td>
          <td class="amount-col">${formatCurrency(payslip.foodAllowance)}</td>
          <td class="amount-col">${formatCurrency(payslip.ytdFood)}</td>
          <td class="label">Income Tax</td>
          <td class="amount-col">${formatCurrency(payslip.incomeTax)}</td>
          <td class="amount-col">${formatCurrency(payslip.ytdIncomeTax)}</td>
        </tr>
        <tr>
          <td class="label">Special Allowance</td>
          <td class="amount-col">${formatCurrency(payslip.specialAllowance)}</td>
          <td class="amount-col">${formatCurrency(payslip.ytdSpecial)}</td>
          <td class="label">ESI</td>
          <td class="amount-col">${formatCurrency(payslip.esi)}</td>
          <td class="amount-col">0.00</td>
        </tr>
        <tr>
          <td class="label">Bonus</td>
          <td class="amount-col">${formatCurrency(payslip.bonus)}</td>
          <td class="amount-col">${formatCurrency(payslip.ytdBonus)}</td>
          <td class="label">Loan Deduction</td>
          <td class="amount-col">${formatCurrency(payslip.loanDeduction)}</td>
          <td class="amount-col">0.00</td>
        </tr>
        <tr>
          <td class="label">Milestone Award</td>
          <td class="amount-col">${formatCurrency(payslip.milestoneAward)}</td>
          <td class="amount-col">${formatCurrency(payslip.ytdMilestone)}</td>
          <td class="label">Other Deductions</td>
          <td class="amount-col">${formatCurrency(payslip.otherDeductions)}</td>
          <td class="amount-col">0.00</td>
        </tr>
        <tr>
          <td class="label">Internet Allowance</td>
          <td class="amount-col">${formatCurrency(payslip.internetAllowance)}</td>
          <td class="amount-col">${formatCurrency(payslip.ytdInternet)}</td>
          <td></td>
          <td class="amount-col"></td>
          <td class="amount-col"></td>
        </tr>
        <tr>
          <td class="label">Shift Allowance</td>
          <td class="amount-col">${formatCurrency(payslip.shiftAllowance)}</td>
          <td class="amount-col">${formatCurrency(payslip.ytdShift)}</td>
          <td></td>
          <td class="amount-col"></td>
          <td class="amount-col"></td>
        </tr>
        <tr>
          <td class="label">Birthday Allowance</td>
          <td class="amount-col">${formatCurrency(payslip.birthdayAllowance)}</td>
          <td class="amount-col">${formatCurrency(payslip.ytdBirthday)}</td>
          <td></td>
          <td class="amount-col"></td>
          <td class="amount-col"></td>
        </tr>
        <tr>
          <td class="label">Overtime</td>
          <td class="amount-col">${formatCurrency(payslip.overtime)}</td>
          <td class="amount-col">0.00</td>
          <td></td>
          <td class="amount-col"></td>
          <td class="amount-col"></td>
        </tr>
        <tr>
          <td class="label">Other Earnings</td>
          <td class="amount-col">${formatCurrency(payslip.otherEarnings)}</td>
          <td class="amount-col">0.00</td>
          <td></td>
          <td class="amount-col"></td>
          <td class="amount-col"></td>
        </tr>
        <tr class="total-row">
          <td class="label">Total Earnings</td>
          <td class="amount-col"><strong>${formatCurrency(payslip.grossEarnings)}</strong></td>
          <td class="amount-col"><strong>${formatCurrency(payslip.ytdGrossEarnings)}</strong></td>
          <td class="label">Total Deductions</td>
          <td class="amount-col"><strong>${formatCurrency(payslip.totalDeductions)}</strong></td>
          <td class="amount-col"><strong>${formatCurrency(payslip.ytdTotalDeductions)}</strong></td>
        </tr>
      </tbody>
    </table>
    
    <!-- Net Pay Section -->
    <div class="net-pay-section">
      <div class="net-pay-row">
        <div class="net-pay-label">Net Pay</div>
        <div class="net-pay-value">Rs. ${formatCurrency(payslip.netPay)}</div>
      </div>
      <div class="net-pay-row">
        <div class="net-pay-label">In Words</div>
        <div class="net-pay-value">${payslip.netPayInWords || convertToWords(payslip.netPay)}</div>
      </div>
    </div>
    
    <!-- Bank Details -->
    <table class="bank-table">
      <tr>
        <th>Bank Name</th>
        <th>Branch Description</th>
      </tr>
      <tr>
        <td>${payslip.bankName || tenant?.bankDetails?.bankName || ''}</td>
        <td>${payslip.branchName || tenant?.bankDetails?.branchName || ''}</td>
      </tr>
    </table>
    
    <!-- Footer -->
    <div class="footer">
      <p>This is a computer-generated payslip and does not require a signature.</p>
    </div>
  </div>
  
  <button class="print-btn" onclick="window.print()">Download / Print Payslip</button>
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

  let result = 'Rupees ' + numToWords(rupees);
  if (paise > 0) {
    result += ' and ' + numToWords(paise) + ' Paise';
  }
  result += ' Only.';

  return result;
}
