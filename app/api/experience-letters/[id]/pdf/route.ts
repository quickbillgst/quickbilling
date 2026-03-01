import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ExperienceLetter, Tenant } from '@/lib/models';
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

    const letter = await ExperienceLetter.findOne({
      _id: id,
      tenantId: auth.tenantId,
    }).lean();

    if (!letter) {
      return NextResponse.json({ error: 'Experience letter not found' }, { status: 404 });
    }

    const tenant = await Tenant.findById(auth.tenantId).lean();

    const html = generateExperienceLetterHTML(letter, tenant);

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Error generating experience letter PDF:', error);
    return NextResponse.json({ error: 'Failed to generate experience letter' }, { status: 500 });
  }
}

function generateExperienceLetterHTML(letter: any, tenant: any): string {
  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const companyName = tenant?.businessName || 'Company Name';
  const companyAddress = tenant?.address
    ? `${tenant.address.line1 || ''}${tenant.address.line2 ? ', ' + tenant.address.line2 : ''}`
    : '';
  const companyCity = tenant?.address
    ? `${tenant.address.city || ''}${tenant.address.state ? ', ' + tenant.address.state : ''}${tenant.address.pincode ? ' - ' + tenant.address.pincode : ''}`
    : '';
  const companyPhone = tenant?.phone || '';
  const companyEmail = tenant?.email || '';
  const companyGstin = tenant?.gstin || '';

  const signatoryName = letter.signatoryName || 'Authorized Signatory';
  const signatoryDesignation = letter.signatoryDesignation || 'HR Department';
  const conductRating = letter.conductRating || 'Good';

  // Calculate tenure
  const joinDate = new Date(letter.dateOfJoining);
  const lastDate = new Date(letter.lastWorkingDate);
  const diffMs = lastDate.getTime() - joinDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  const tenureText = years > 0
    ? `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` and ${months} month${months > 1 ? 's' : ''}` : ''}`
    : `${months} month${months > 1 ? 's' : ''}`;

  // Performance description mapping
  const performanceMap: Record<string, string> = {
    'Excellent': 'demonstrated exceptional performance, outstanding dedication, and exemplary professional conduct',
    'Good': 'demonstrated commendable performance, consistent dedication, and professional conduct',
    'Satisfactory': 'demonstrated satisfactory performance and professional conduct',
  };
  const performanceText = performanceMap[conductRating] || performanceMap['Good'];

  // Rating badge colour
  const ratingColour: Record<string, string> = {
    'Excellent': '#16a34a',
    'Good': '#2563eb',
    'Satisfactory': '#d97706',
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Experience Letter - ${letter.employeeName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 0; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background: #f1f5f9;
      color: #1e293b;
      line-height: 1.7;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 20px auto;
      background: #fff;
      padding: 0;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
      position: relative;
    }
    .header {
      background: linear-gradient(135deg, #0f4c3a 0%, #1a7a5e 100%);
      color: #fff;
      padding: 36px 48px 28px;
      position: relative;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: -20px;
      left: 0;
      right: 0;
      height: 20px;
      background: linear-gradient(135deg, #c8a656 0%, #e8cc7a 50%, #c8a656 100%);
    }
    .header-row {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .company-logo {
      width: 70px;
      height: 70px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
      background: rgba(255,255,255,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .company-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .company-name {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .company-details {
      font-size: 11px;
      opacity: 0.85;
      line-height: 1.5;
    }
    .content {
      padding: 56px 56px 36px;
    }
    .letter-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 32px;
      font-size: 13px;
      color: #64748b;
    }
    .letter-title {
      text-align: center;
      font-size: 22px;
      font-weight: 700;
      color: #0f4c3a;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 3px;
    }
    .title-underline {
      width: 80px;
      height: 3px;
      background: linear-gradient(90deg, #c8a656, #e8cc7a);
      margin: 0 auto 12px;
      border-radius: 2px;
    }
    .subtitle {
      text-align: center;
      font-size: 13px;
      color: #64748b;
      margin-bottom: 32px;
      font-style: italic;
    }
    .salutation {
      font-size: 15px;
      margin-bottom: 20px;
    }
    .body-text {
      font-size: 14px;
      text-align: justify;
      margin-bottom: 16px;
    }
    .highlight {
      font-weight: 700;
      color: #0f4c3a;
    }
    .details-table {
      width: 100%;
      margin: 24px 0;
      border-collapse: collapse;
    }
    .details-table td {
      padding: 10px 16px;
      font-size: 13px;
      border-bottom: 1px solid #e2e8f0;
    }
    .details-table td:first-child {
      font-weight: 600;
      color: #475569;
      width: 200px;
      background: #f8fafc;
    }
    .rating-badge {
      display: inline-block;
      background: ${ratingColour[conductRating] || '#2563eb'};
      color: #fff;
      padding: 3px 14px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .job-desc {
      background: #f8fafc;
      border-left: 4px solid #0f4c3a;
      padding: 16px 20px;
      margin: 20px 0;
      font-size: 13px;
      color: #475569;
      border-radius: 0 8px 8px 0;
    }
    .wishes {
      font-size: 14px;
      margin: 28px 0;
      font-style: italic;
      color: #475569;
    }
    .signature-block {
      margin-top: 60px;
    }
    .signature-image {
      height: 60px;
      margin-bottom: 8px;
    }
    .signature-image img {
      max-height: 60px;
      max-width: 180px;
      object-fit: contain;
    }
    .signature-line {
      width: 200px;
      border-top: 2px solid #0f4c3a;
      margin-bottom: 8px;
    }
    .signatory-name {
      font-size: 15px;
      font-weight: 700;
      color: #0f4c3a;
    }
    .signatory-title {
      font-size: 12px;
      color: #64748b;
    }
    .signatory-company {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
    .footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 12px 48px;
      font-size: 10px;
      color: #94a3b8;
      text-align: center;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 90px;
      font-weight: 700;
      color: rgba(15, 76, 58, 0.03);
      text-transform: uppercase;
      letter-spacing: 20px;
      white-space: nowrap;
      pointer-events: none;
    }
    .print-btn {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #0f4c3a;
      color: #fff;
      border: none;
      padding: 12px 28px;
      font-size: 14px;
      border-radius: 8px;
      cursor: pointer;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .print-btn:hover { background: #1a7a5e; }
    @media print {
      body { background: #fff; }
      .page { margin: 0; box-shadow: none; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>

  <div class="page">
    <div class="watermark">EXPERIENCE</div>

    <div class="header">
      <div class="header-row">
        ${tenant?.logo ? `<div class="company-logo"><img src="${tenant.logo}" alt="Logo" /></div>` : ''}
        <div>
          <div class="company-name">${companyName}</div>
          <div class="company-details">
        ${companyAddress ? companyAddress + '<br>' : ''}
        ${companyCity ? companyCity + '<br>' : ''}
        ${companyPhone ? 'Phone: ' + companyPhone : ''}${companyEmail ? ' | Email: ' + companyEmail : ''}
        ${companyGstin ? '<br>GSTIN: ' + companyGstin : ''}
          </div>
        </div>
      </div>
    </div>

    <div class="content">
      <div class="letter-meta">
        <div>
          <strong>Ref:</strong> ${letter.letterNumber}
        </div>
        <div>
          <strong>Date:</strong> ${formatDate(letter.letterDate)}
        </div>
      </div>

      <div class="letter-title">Experience Certificate</div>
      <div class="title-underline"></div>
      <div class="subtitle">To Whom It May Concern</div>

      <p class="body-text">
        This is to certify that <span class="highlight">${letter.employeeName}</span>${letter.employeeId ? ' (Employee ID: <span class="highlight">' + letter.employeeId + '</span>)' : ''}
        was employed with <span class="highlight">${companyName}</span>${letter.designation ? ' as <span class="highlight">' + letter.designation + '</span>' : ''}${letter.department ? ' in the <span class="highlight">' + letter.department + '</span> department' : ''}
        from <span class="highlight">${formatDate(letter.dateOfJoining)}</span> to <span class="highlight">${formatDate(letter.lastWorkingDate)}</span>,
        a tenure of approximately <span class="highlight">${tenureText}</span>.
      </p>

      <table class="details-table">
        <tr>
          <td>Employee Name</td>
          <td>${letter.employeeName}</td>
        </tr>
        ${letter.employeeId ? '<tr><td>Employee ID</td><td>' + letter.employeeId + '</td></tr>' : ''}
        ${letter.designation ? '<tr><td>Designation</td><td>' + letter.designation + '</td></tr>' : ''}
        ${letter.department ? '<tr><td>Department</td><td>' + letter.department + '</td></tr>' : ''}
        <tr>
          <td>Date of Joining</td>
          <td>${formatDate(letter.dateOfJoining)}</td>
        </tr>
        <tr>
          <td>Last Working Date</td>
          <td>${formatDate(letter.lastWorkingDate)}</td>
        </tr>
        <tr>
          <td>Total Tenure</td>
          <td>${tenureText}</td>
        </tr>
        <tr>
          <td>Conduct & Performance</td>
          <td><span class="rating-badge">${conductRating}</span></td>
        </tr>
      </table>

      ${letter.jobDescription ? `
      <p class="body-text" style="margin-bottom:8px;"><strong>Key Responsibilities:</strong></p>
      <div class="job-desc">${letter.jobDescription}</div>
      ` : ''}

      <p class="body-text">
        During the period of employment, ${letter.employeeName} ${performanceText}.
        We found ${letter.employeeName} to be sincere, hardworking, and a valuable member of our team.
      </p>

      <p class="wishes">
        We wish ${letter.employeeName} all the best for future professional endeavours and personal growth.
      </p>

      <p class="body-text">
        This experience certificate is being issued at the request of ${letter.employeeName} for the purpose of
        records and future employment.
      </p>

      <div class="signature-block">
        ${(() => {
          const sig = tenant?.signatures?.[0];
          if (sig?.image) {
            return `<div class="signature-image"><img src="${sig.image}" alt="Signature" /></div>`;
          }
          return '';
        })()}
        <div class="signature-line"></div>
        <div class="signatory-name">${signatoryName}</div>
        <div class="signatory-title">${signatoryDesignation}</div>
        <div class="signatory-company">${companyName}</div>
      </div>
    </div>

    <div class="footer">
      This is a computer-generated document. | ${companyName}${companyPhone ? ' | ' + companyPhone : ''}${companyEmail ? ' | ' + companyEmail : ''}
    </div>
  </div>
</body>
</html>`;
}
