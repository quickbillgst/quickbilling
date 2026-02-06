import { connectDB, User } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const user = await User.findById(auth.userId).select('-passwordHash');

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: user }, { status: 200 });
    } catch (error) {
        console.error('Fetch profile error:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const body = await request.json();

        const user = await User.findById(auth.userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Update profile fields
        if (body.firstName !== undefined) user.firstName = body.firstName;
        if (body.lastName !== undefined) user.lastName = body.lastName;
        if (body.phone !== undefined) user.phone = body.phone;
        // Note: Email update usually requires verification, skipping for strict security unless requested

        // Update Email Preferences
        if (body.emailPreferences) {
            user.emailPreferences = {
                ...user.emailPreferences,
                ...body.emailPreferences
            };
        }

        // Update Notification Preferences
        if (body.notificationPreferences) {
            user.notificationPreferences = {
                ...user.notificationPreferences,
                ...body.notificationPreferences
            };
        }

        await user.save();

        return NextResponse.json({ success: true, data: user }, { status: 200 });
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
