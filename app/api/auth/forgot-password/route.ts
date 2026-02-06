import { NextRequest, NextResponse } from 'next/server';
import { connectDB, User, PasswordReset } from '@/lib/models';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();

        // Find user by email
        const user = await User.findOne({ email: normalizedEmail });

        // Always return success to prevent email enumeration
        // (Don't reveal if email exists or not)
        if (!user) {
            console.log(`[v0] Password reset requested for non-existent email: ${normalizedEmail}`);
            return NextResponse.json({
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent.',
            });
        }

        // Generate secure random token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Token expires in 1 hour
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        // Delete any existing reset tokens for this user
        await PasswordReset.deleteMany({ userId: user._id });

        // Create new password reset token
        await PasswordReset.create({
            userId: user._id,
            token: resetToken,
            expiresAt,
            used: false,
        });

        // In a real application, you would send an email here
        // For now, we'll log the reset link
        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        console.log('\n' + '='.repeat(80));
        console.log('PASSWORD RESET REQUEST');
        console.log('='.repeat(80));
        console.log(`Email: ${normalizedEmail}`);
        console.log(`User: ${user.firstName} ${user.lastName}`);
        console.log(`Reset Link: ${resetUrl}`);
        console.log(`Expires: ${expiresAt.toLocaleString()}`);
        console.log('='.repeat(80) + '\n');

        // Send email with reset link
        await sendPasswordResetEmail(user.email, resetUrl);

        return NextResponse.json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.',
            // In development, include the reset link
            ...(process.env.NODE_ENV === 'development' && { resetUrl }),
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { error: 'Failed to process password reset request' },
            { status: 500 }
        );
    }
}
