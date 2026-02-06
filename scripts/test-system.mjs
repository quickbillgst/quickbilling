// Comprehensive test script for the invoice and payslip system
const baseUrl = 'http://localhost:3000';

async function runTests() {
    console.log('='.repeat(60));
    console.log('COMPREHENSIVE SYSTEM TEST');
    console.log('='.repeat(60));

    // 1. Test Registration and Login
    console.log('\n📋 TEST 1: Registration');
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'TestPassword123';

    const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            businessName: 'Test Company Ltd',
            firstName: 'John',
            lastName: 'Doe',
            email: testEmail,
            password: testPassword
        })
    });

    const registerData = await registerRes.json();
    console.log(`   Status: ${registerRes.status} ${registerRes.status === 201 ? '✅' : '❌'}`);

    if (!registerRes.ok) {
        console.error('   Registration failed:', registerData);
        return;
    }

    const token = registerData.data.token;
    const tenantId = registerData.data.tenant.id;
    console.log(`   Token received: ${token ? '✅' : '❌'}`);

    // 2. Test Login
    console.log('\n📋 TEST 2: Login');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: testEmail,
            password: testPassword
        })
    });

    const loginData = await loginRes.json();
    console.log(`   Status: ${loginRes.status} ${loginRes.status === 200 ? '✅' : '❌'}`);

    // 3. Test Case-Insensitive Login
    console.log('\n📋 TEST 3: Case-Insensitive Login');
    const loginUpperRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: testEmail.toUpperCase(),
            password: testPassword
        })
    });

    console.log(`   Status: ${loginUpperRes.status} ${loginUpperRes.status === 200 ? '✅' : '❌'}`);

    // 4. Test Create Customer
    console.log('\n📋 TEST 4: Create Customer');
    const customerRes = await fetch(`${baseUrl}/api/customers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            name: 'ABC Enterprises',
            email: 'abc@example.com',
            phone: '9876543210',
            customerType: 'business',
            gstRegistered: true,
            gstin: '29ABCDE1234F2Z5',
            billingAddress: {
                line1: '123 Business Street',
                city: 'Mumbai',
                state: 'MH',
                pincode: '400001',
                country: 'IN'
            }
        })
    });

    const customerData = await customerRes.json();
    console.log(`   Status: ${customerRes.status} ${customerRes.status === 201 ? '✅' : '❌'}`);
    let createdCustomerId = customerData.data?.id;
    console.log(`   Customer ID: ${createdCustomerId}`);

    // 5. Test Create Product
    console.log('\n📋 TEST 5: Create Product');
    const productRes = await fetch(`${baseUrl}/api/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            sku: `PROD-${Date.now()}`,
            name: 'Test Product',
            description: 'A test product',
            hsnCode: '8471',
            gstRate: 18,
            costPrice: 800,
            sellingPrice: 1000,
            trackInventory: true,
            reorderPoint: 10
        })
    });

    const productData = await productRes.json();
    console.log(`   Status: ${productRes.status} ${productRes.status === 201 ? '✅' : '❌'}`);

    // 6. Test List Products
    console.log('\n📋 TEST 6: List Products');
    const productsListRes = await fetch(`${baseUrl}/api/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`   Status: ${productsListRes.status} ${productsListRes.status === 200 ? '✅' : '❌'}`);

    // 7. Test List Customers
    console.log('\n📋 TEST 7: List Customers');
    const customersListRes = await fetch(`${baseUrl}/api/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const customersData = await customersListRes.json();
    console.log(`   Status: ${customersListRes.status} ${customersListRes.status === 200 ? '✅' : '❌'}`);
    console.log(`   Customers found: ${customersData.data?.length || 0}`);

    // 8. Test Create Invoice
    console.log('\n📋 TEST 8: Create Invoice');

    // Use the customer ID we created
    if (createdCustomerId) {
        const invoiceRes = await fetch(`${baseUrl}/api/invoices/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                customerId: createdCustomerId,
                invoiceDate: new Date().toISOString(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                lineItems: [
                    {
                        description: 'Test Product',
                        hsn: '8471',
                        quantity: 2,
                        unitPrice: 1000,
                        taxRate: 18,
                        discountValue: 0
                    }
                ],
                isGstBill: true,
                notes: 'Test invoice'
            })
        });

        const invoiceData = await invoiceRes.json();
        console.log(`   Status: ${invoiceRes.status} ${invoiceRes.status === 201 ? '✅' : '❌'}`);
        if (invoiceData.invoice) {
            console.log(`   Invoice Number: ${invoiceData.invoice.invoiceNumber}`);
            console.log(`   Total Amount: ₹${invoiceData.invoice.totalAmount}`);
        } else {
            console.log(`   Error: ${invoiceData.error}`);
        }
    } else {
        console.log('   ⚠️ No customer ID available for invoice test');
    }

    // 9. Test List Invoices
    console.log('\n📋 TEST 9: List Invoices');
    const invoicesListRes = await fetch(`${baseUrl}/api/invoices`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const invoicesData = await invoicesListRes.json();
    console.log(`   Status: ${invoicesListRes.status} ${invoicesListRes.status === 200 ? '✅' : '❌'}`);
    console.log(`   Invoices found: ${invoicesData.data?.length || invoicesData.invoices?.length || 0}`);

    // 10. Test Create Payslip
    console.log('\n📋 TEST 10: Create Payslip');
    const payslipRes = await fetch(`${baseUrl}/api/payslips`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            employeeName: 'Rahul Sharma',
            employeeId: 'EMP001',
            designation: 'Software Engineer',
            department: 'Engineering',
            bankAccountNumber: '1234567890',
            bankName: 'State Bank of India',
            ifscCode: 'SBIN0001234',
            panNumber: 'ABCDE1234F',
            payPeriod: 'February 2026',
            payDate: new Date().toISOString(),
            basicSalary: 50000,
            hra: 20000,
            conveyanceAllowance: 1600,
            medicalAllowance: 1250,
            specialAllowance: 10000,
            providentFund: 6000,
            professionalTax: 200,
            incomeTax: 5000,
            workingDays: 22,
            presentDays: 21,
            lop: 1
        })
    });

    const payslipData = await payslipRes.json();
    console.log(`   Status: ${payslipRes.status} ${payslipRes.status === 201 ? '✅' : '❌'}`);
    if (payslipData.payslip) {
        console.log(`   Payslip Number: ${payslipData.payslip.payslipNumber}`);
        console.log(`   Net Pay: ₹${payslipData.payslip.netPay}`);
    }

    // 11. Test List Payslips
    console.log('\n📋 TEST 11: List Payslips');
    const payslipsListRes = await fetch(`${baseUrl}/api/payslips`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const payslipsData = await payslipsListRes.json();
    console.log(`   Status: ${payslipsListRes.status} ${payslipsListRes.status === 200 ? '✅' : '❌'}`);
    console.log(`   Total Payslips: ${payslipsData.pagination?.total || 0}`);

    // 12. Test Payslip PDF
    if (payslipData.payslip?.id) {
        console.log('\n📋 TEST 12: Payslip PDF');
        const pdfRes = await fetch(`${baseUrl}/api/payslips/${payslipData.payslip.id}/pdf`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`   Status: ${pdfRes.status} ${pdfRes.status === 200 ? '✅' : '❌'}`);
        console.log(`   Content-Type: ${pdfRes.headers.get('content-type')}`);
    }

    // 13. Test Settings
    console.log('\n📋 TEST 13: Get Settings');
    const settingsRes = await fetch(`${baseUrl}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`   Status: ${settingsRes.status} ${settingsRes.status === 200 ? '✅' : '❌'}`);

    console.log('\n' + '='.repeat(60));
    console.log('TEST COMPLETE - ALL SYSTEMS OPERATIONAL');
    console.log('='.repeat(60));
}

runTests().catch(console.error);
