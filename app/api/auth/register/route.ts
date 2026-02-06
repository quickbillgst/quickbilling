import { connectDB, Tenant, User } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return NextResponse.json(
        { error: 'Server configuration error', details: 'JWT_SECRET not configured' },
        { status: 500 }
      );
    }

    await connectDB();

    const requestBody = await request.json();
    const { businessName, gstin, email: rawEmail, password, firstName, lastName } = requestBody;
    const email = rawEmail?.toLowerCase().trim();
    console.log('[v0] Registration attempt:', { businessName, email, firstName, lastName });

    // Validate inputs
    if (!businessName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Create tenant
    const tenant = new Tenant({
      businessName,
      gstin: gstin || undefined,
      status: 'trial'
    });
    await tenant.save();

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10);

    // Create user
    const user = new User({
      tenantId: tenant._id,
      email,
      passwordHash,
      firstName,
      lastName,
      role: 'owner',
      isVerified: true
    });
    await user.save();

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        tenantId: tenant._id.toString(),
        role: user.role,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful',
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            role: user.role,
            firstName: user.firstName
          },
          tenant: {
            id: tenant._id,
            businessName: tenant.businessName,
            gstin: tenant.gstin
          }
        }
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[v0] Registration error:', message);
    return NextResponse.json(
      {
        error: 'Registration failed',
        details: message,
      },
      { status: 500 }
    );
  }
}
