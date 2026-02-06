// Test script for forgot password functionality
const baseUrl = 'http://localhost:3000';

async function testForgotPassword() {
    console.log('='.repeat(60));
    console.log('FORGOT PASSWORD FUNCTIONALITY TEST');
    console.log('='.repeat(60));

    // 1. Register a test user
    console.log('\n📋 TEST 1: Register Test User');
    const testEmail = `resettest${Date.now()}@example.com`;
    const testPassword = 'OldPassword123';

    const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            businessName: 'Test Company',
            firstName: 'John',
            lastName: 'Doe',
            email: testEmail,
            password: testPassword
        })
    });

    const registerData = await registerRes.json();
    console.log(`   Status: ${registerRes.status} ${registerRes.status === 201 ? '✅' : '❌'}`);
    console.log(`   Email: ${testEmail}`);

    if (!registerRes.ok) {
        console.error('   Registration failed:', registerData);
        return;
    }

    // 2. Request password reset
    console.log('\n📋 TEST 2: Request Password Reset');
    const forgotRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail })
    });

    const forgotData = await forgotRes.json();
    console.log(`   Status: ${forgotRes.status} ${forgotRes.status === 200 ? '✅' : '❌'}`);
    console.log(`   Message: ${forgotData.message}`);

    if (forgotData.resetUrl) {
        console.log(`   Reset URL: ${forgotData.resetUrl}`);

        // Extract token from URL
        const url = new URL(forgotData.resetUrl);
        const token = url.searchParams.get('token');
        console.log(`   Token: ${token}`);

        // 3. Verify reset token
        console.log('\n📋 TEST 3: Verify Reset Token');
        const verifyRes = await fetch(`${baseUrl}/api/auth/verify-reset-token?token=${token}`);
        const verifyData = await verifyRes.json();
        console.log(`   Status: ${verifyRes.status} ${verifyRes.status === 200 ? '✅' : '❌'}`);
        console.log(`   Valid: ${verifyData.valid ? '✅' : '❌'}`);

        // 4. Reset password
        console.log('\n📋 TEST 4: Reset Password');
        const newPassword = 'NewPassword123';
        const resetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token,
                password: newPassword
            })
        });

        const resetData = await resetRes.json();
        console.log(`   Status: ${resetRes.status} ${resetRes.status === 200 ? '✅' : '❌'}`);
        console.log(`   Message: ${resetData.message}`);

        // 5. Try to login with old password (should fail)
        console.log('\n📋 TEST 5: Login with Old Password (Should Fail)');
        const oldLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword
            })
        });

        console.log(`   Status: ${oldLoginRes.status} ${oldLoginRes.status === 401 ? '✅' : '❌'}`);

        // 6. Login with new password (should succeed)
        console.log('\n📋 TEST 6: Login with New Password (Should Succeed)');
        const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: newPassword
            })
        });

        const newLoginData = await newLoginRes.json();
        console.log(`   Status: ${newLoginRes.status} ${newLoginRes.status === 200 ? '✅' : '❌'}`);
        console.log(`   Token received: ${newLoginData.data?.token ? '✅' : '❌'}`);

        // 7. Try to reuse the reset token (should fail)
        console.log('\n📋 TEST 7: Reuse Reset Token (Should Fail)');
        const reuseRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token,
                password: 'AnotherPassword123'
            })
        });

        console.log(`   Status: ${reuseRes.status} ${reuseRes.status === 400 ? '✅' : '❌'}`);

        // 8. Test with invalid token
        console.log('\n📋 TEST 8: Invalid Token (Should Fail)');
        const invalidRes = await fetch(`${baseUrl}/api/auth/verify-reset-token?token=invalid-token-12345`);
        console.log(`   Status: ${invalidRes.status} ${invalidRes.status === 400 ? '✅' : '❌'}`);

        // 9. Test forgot password with non-existent email
        console.log('\n📋 TEST 9: Forgot Password with Non-Existent Email');
        const nonExistentRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'nonexistent@example.com' })
        });

        const nonExistentData = await nonExistentRes.json();
        console.log(`   Status: ${nonExistentRes.status} ${nonExistentRes.status === 200 ? '✅' : '❌'}`);
        console.log(`   Message: ${nonExistentData.message}`);
        console.log(`   (Should not reveal if email exists)`);

    } else {
        console.log('   ⚠️ No reset URL in development mode');
    }

    console.log('\n' + '='.repeat(60));
    console.log('FORGOT PASSWORD TEST COMPLETE');
    console.log('='.repeat(60));
}

testForgotPassword().catch(console.error);
