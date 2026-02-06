import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Tenant } from '@/lib/models';
import { verifyAuth } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
    try {
        const auth = await verifyAuth(req);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, gender, institute, domain, startDate, duration, internshipPeriod } = await req.json();

        if (!name || !gender || !institute || !domain || !startDate || !duration || !internshipPeriod) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();
        const tenant = await Tenant.findById(auth.tenantId).lean();

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        const html = generateCertificateHTML({
            name,
            gender,
            institute,
            domain,
            startDate,
            duration,
            internshipPeriod
        }, tenant);

        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html',
            },
        });

    } catch (error) {
        console.error('Error generating certificate:', error);
        return NextResponse.json(
            { error: 'Failed to generate certificate' },
            { status: 500 }
        );
    }
}

function generateCertificateHTML(data: any, tenant: any): string {
    const isFemale = data.gender.toLowerCase() === 'female';
    const pronouns = {
        heShe: isFemale ? 'she' : 'he',
        hisHer: isFemale ? 'her' : 'his',
        himHer: isFemale ? 'her' : 'him',
        HeShe: isFemale ? 'She' : 'He',
        HisHer: isFemale ? 'Her' : 'His',
    };

    const companyName = tenant.businessName || 'Company Name';
    const companyEmail = tenant.email || 'contact@company.com';

    // Format Date
    const startDate = new Date(data.startDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const companyAddressParts = [
        tenant.address?.line1,
        tenant.address?.city,
        tenant.address?.state,
        tenant.address?.pincode
    ].filter(Boolean).join(', ');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Internship Certificate - ${data.name}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Playfair+Display:wght@700&display=swap');

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Open Sans', sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
            -webkit-print-color-adjust: exact;
        }

        .certificate-container {
            width: 210mm;
            min-height: 297mm;
            margin: 20px auto;
            background: white;
            padding: 60px;
            position: relative;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }

        /* Decorative Header/Footer Bars for modern look */
        .top-bar {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 15px;
            background: linear-gradient(90deg, #2563eb 0%, #3b82f6 100%);
        }

        .bottom-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 15px;
            background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
        }
        
        /* Corner Triangle decoration */
        .corner-decoration {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 0; 
            height: 0; 
            border-left: 100px solid transparent;
            border-bottom: 100px solid #eff6ff;
            z-index: 0;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 60px;
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
        }

        .logo-container {
            width: 120px;
            height: auto;
        }

        .logo-container img {
            max-width: 100%;
            max-height: 100px;
            object-fit: contain;
        }

        .company-details {
            text-align: right;
            font-size: 12px;
            color: #666;
        }

        .title {
            text-align: center;
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 50px;
            color: #1e293b;
        }

        .content {
            font-size: 14px;
            text-align: justify;
            margin-bottom: 40px;
            position: relative;
            z-index: 1;
        }

        .content p {
            margin-bottom: 20px;
        }

        .highlight {
            font-weight: 700;
            color: #1e293b;
        }

        .internship-details {
            margin: 30px 0;
            padding: 20px;
            background: #f8fafc;
            border-left: 4px solid #3b82f6;
            border-radius: 4px;
        }

        .internship-details h3 {
            font-size: 16px;
            margin-bottom: 15px;
            color: #1e293b;
        }

        .details-list {
            list-style: none;
        }

        .details-list li {
            margin-bottom: 8px;
            display: flex;
        }

        .details-list li strong {
            width: 150px;
            color: #475569;
        }

        .footer {
            margin-top: 80px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }

        .signature-block {
            text-align: left;
        }

        .signature-image {
            height: 60px;
            margin-bottom: 10px;
        }
        
        .signature-image img {
            max-height: 100%;
            object-fit: contain;
        }

        .signatory-name {
            font-weight: 700;
            font-size: 16px;
            color: #1e293b;
            font-family: 'Playfair Display', serif;
        }

        .signatory-title {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        @media print {
            body {
                background: white;
            }
            .certificate-container {
                margin: 0;
                box-shadow: none;
                width: 100%;
                height: 100vh;
                padding: 40px;
            }
            .print-btn {
                display: none;
            }
            @page {
                size: A4 portrait;
                margin: 0;
            }
        }

        .print-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #2563eb;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 50px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 100;
        }

        .print-btn:hover {
            background: #1d4ed8;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <div class="top-bar"></div>
        
        <div class="header">
            <div class="logo-container">
                ${tenant.logo ? `<img src="${tenant.logo}" alt="Company Logo">` : `<h2 style="color: #2563eb; font-weight: 800;">${companyName}</h2>`}
            </div>
            <div class="company-details">
                <strong>${companyName}</strong><br>
                ${companyAddressParts}<br>
                ${tenant.email ? `Email: ${tenant.email}` : ''}<br>
                ${tenant.phone ? `Phone: ${tenant.phone}` : ''}
            </div>
        </div>

        <div class="title">To Whom It May Concern</div>

        <div class="content">
            <p>
                This is to certify that <span class="highlight">${data.name}</span> served as an <span class="highlight">${data.domain} Intern</span> at <span class="highlight">${companyName}</span>. ${pronouns.HisHer} internship period lasted from <span class="highlight">${data.internshipPeriod}</span>.
            </p>

            <p>
                During ${pronouns.hisHer} tenure, ${pronouns.heShe} demonstrated strong organizational skills, problem-solving abilities, and a proactive attitude towards learning new technologies and processes. ${pronouns.HisHer} performance was consistently impressive, and ${pronouns.heShe} made valuable contributions while working alongside the team.
            </p>

            <div class="internship-details">
                <h3>Internship Details (Academic Internship)</h3>
                <ul class="details-list">
                    <li><strong>Start Date:</strong> ${startDate}</li>
                    <li><strong>Duration:</strong> ${data.duration}</li>
                    <li><strong>Domain:</strong> ${data.domain}</li>
                    <li><strong>Institute:</strong> ${data.institute}</li>
                </ul>
            </div>

            <p>
                We wish ${pronouns.himHer} great success in all ${pronouns.hisHer} future endeavours. Please feel free to contact us at <span class="highlight">${companyEmail}</span> for any further information.
            </p>
        </div>

        <div class="footer">
            <div class="signature-block">
                ${tenant.signatures && tenant.signatures.length > 0 ? `
                    <div class="signature-image">
                       ${tenant.signatures[0].image ? `<img src="${tenant.signatures[0].image}" alt="Signature">` : ''}
                    </div>
                    <div class="signatory-name">${tenant.signatures[0].name}</div>
                    <div class="signatory-title">${tenant.signatures[0].designation || 'Authorized Signatory'}</div>
                    <div class="signatory-title" style="margin-top: 5px;">${companyName}</div>
                ` : `
                    <div style="height: 60px;"></div>
                    <div class="signatory-name">Authorized Signatory</div>
                    <div class="signatory-title">${companyName}</div>
                `}
            </div>
        </div>

        <div class="corner-decoration"></div>
        <div class="bottom-bar"></div>
    </div>

    <button class="print-btn" onclick="window.print()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        Download / Print Certificate
    </button>
</body>
</html>
  `;
}
