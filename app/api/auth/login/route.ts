import { connectDB, User, Tenant } from '@/lib/models';
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

    const body = await request.json() as { email?: string; password?: string };
    const { email: rawEmail, password } = body;
    const email = rawEmail?.toLowerCase().trim();
    console.log('[v0] Login attempt for:', email);

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email }).lean();

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const passwordMatch = await bcryptjs.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Fetch tenant info
    const tenant = await Tenant.findById(user.tenantId).lean();

    // Verify tenant exists if linked
    let tenantIdStr = '';
    if (user.tenantId) {
      tenantIdStr = user.tenantId.toString();
    } else {
      // Fallback or error if tenant is strictly required? 
      // For now, let's log it and maybe allow login if your app supports tenant-less users 
      // (though your schema says it is required).
      console.warn(`[v0] User ${user._id} has no tenantId!`);
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        tenantId: tenantIdStr,
        role: user.role,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Record Session
    try {
      const { AuthSession } = await import('@/lib/models');
      const userAgent = request.headers.get('user-agent') || 'Unknown Device';
      // Simple parsing to be friendlier
      let deviceName = 'Unknown Device';
      if (userAgent.includes('Windows')) deviceName = 'Windows PC';
      else if (userAgent.includes('Macintosh')) deviceName = 'Mac';
      else if (userAgent.includes('Linux')) deviceName = 'Linux PC';
      else if (userAgent.includes('Android')) deviceName = 'Android Device';
      else if (userAgent.includes('iPhone')) deviceName = 'iPhone';

      if (userAgent.includes('Chrome')) deviceName += ' (Chrome)';
      else if (userAgent.includes('Firefox')) deviceName += ' (Firefox)';
      else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) deviceName += ' (Safari)';

      await AuthSession.create({
        userId: user._id,
        device: deviceName,
        ip: request.headers.get('x-forwarded-for') || 'Unknown IP',
        location: 'Unknown', // IP Geolocation would go here in a real app
        lastActive: new Date(),
        isValid: true
      });
    } catch (e) {
      console.error('Failed to record session:', e);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            tenantId: user.tenantId ? user.tenantId.toString() : undefined
          },
          tenant: tenant ? {
            id: tenant._id,
            businessName: tenant.businessName,
            gstin: tenant.gstin
          } : undefined
        }
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[v0] Login error:', message);
    return NextResponse.json(
      {
        error: 'Login failed',
        details: message,
      },
      { status: 500 }
    );
  }
}
