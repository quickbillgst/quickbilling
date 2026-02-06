import { jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export interface AuthPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

export async function verifyAuth(request: NextRequest): Promise<AuthPayload | null> {
  try {
    const authHeader = request.headers.get('authorization');
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Check for token in query params (for file downloads/PDF viewing)
      const url = new URL(request.url);
      const queryToken = url.searchParams.get('token');
      if (queryToken) {
        token = queryToken;
      }
    }

    if (!token) {
      return null;
    }

    const verified = await jwtVerify(token, secret);

    return verified.payload as unknown as AuthPayload;
  } catch (error) {
    console.error('Auth verification failed:', error);
    return null;
  }
}

export async function generateToken(payload: AuthPayload): Promise<string> {
  // Note: In production, use proper JWT library like jsonwebtoken
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}
