import { NextRequest, NextResponse } from 'next/server';
import { connectDB, PasswordReset } from '@/lib/models';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            );
        }

        // Find the reset token
        const resetToken = await PasswordReset.findOne({
            token,
            used: false,
            expiresAt: { $gt: new Date() },
        });

        if (!resetToken) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            valid: true,
        });
    } catch (error) {
        console.error('Verify reset token error:', error);
        return NextResponse.json(
            { error: 'Failed to verify token' },
            { status: 500 }
        );
    }
}
