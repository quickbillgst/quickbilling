// Test script to verify auth functionality
const testEmail = `test${Date.now()}@example.com`;
const testPassword = 'TestPassword123';

async function testAuth() {
    const baseUrl = 'http://localhost:3000';

    console.log('=== Testing Registration ===');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);

    try {
        // Test Registration
        const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                businessName: 'Test Business',
                firstName: 'John',
                lastName: 'Doe',
                email: testEmail,
                password: testPassword
            })
        });

        const registerData = await registerResponse.json();
        console.log('Register Status:', registerResponse.status);
        console.log('Register Response:', JSON.stringify(registerData, null, 2));

        if (!registerResponse.ok) {
            console.error('Registration failed!');
            return;
        }

        console.log('\n=== Testing Login ===');

        // Test Login
        const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword
            })
        });

        const loginData = await loginResponse.json();
        console.log('Login Status:', loginResponse.status);
        console.log('Login Response:', JSON.stringify(loginData, null, 2));

        if (!loginResponse.ok) {
            console.error('LOGIN FAILED!');
        } else {
            console.log('\n✅ AUTH TEST PASSED!');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testAuth();
