import { NextRequest, NextResponse } from 'next/server';
import { connectDB, User, PasswordReset } from '@/lib/models';
import bcryptjs from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const { token, password } = body;

        if (!token || !password) {
            return NextResponse.json(
                { error: 'Token and password are required' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        // Find the reset token
        console.log('Finding reset token...');
        const resetToken = await PasswordReset.findOne({
            token,
            used: false,
            expiresAt: { $gt: new Date() },
        });

        if (!resetToken) {
            return NextResponse.json(
                { error: 'Invalid or expired reset token' },
                { status: 400 }
            );
        }

        // Find the user
        console.log('Finding user:', resetToken.userId);
        const user = await User.findById(resetToken.userId);

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Hash the new password
        console.log('Hashing password...');
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Update user's password
        console.log('Updating user password...');
        // Use updateOne to bypass full document validation (handles legacy data issues)
        await User.updateOne(
            { _id: user._id },
            { $set: { passwordHash: hashedPassword } }
        );

        // Mark the reset token as used
        console.log('Marking token as used...');
        resetToken.used = true;
        await resetToken.save();

        // Delete all other reset tokens for this user
        console.log('Deleting other tokens...');
        await PasswordReset.deleteMany({
            userId: user._id,
            _id: { $ne: resetToken._id },
        });

        console.log(`[v0] Password reset successful for user: ${user.email}`);

        return NextResponse.json({
            success: true,
            message: 'Password has been reset successfully',
        });
    } catch (error: any) {
        console.error('Reset password error details:', error);
        return NextResponse.json(
            {
                error: `Failed to reset password: ${error.message || 'Unknown error'}`,
                details: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}
