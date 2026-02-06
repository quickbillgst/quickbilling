import { connectDB, User } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-utils';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
        }

        await connectDB();
        const user = await User.findById(auth.userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
            return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.passwordHash = hashedPassword;
        await user.save();

        return NextResponse.json({ success: true, message: 'Password updated successfully' }, { status: 200 });
    } catch (error) {
        console.error('Update password error:', error);
        return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }
}
