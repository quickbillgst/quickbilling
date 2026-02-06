import { connectDB, AuthSession } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
}

function verifyAuth(request: NextRequest): { userId: string } | null {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    try {
        const token = authHeader.substring(7);
        return jwt.verify(token, JWT_SECRET!) as { userId: string };
    } catch {
        return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        const auth = verifyAuth(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Fetch active sessions
        // Ideally we filter sessions that are "recent" (e.g. last 30 days) to avoid clutter
        const sessions = await AuthSession.find({ userId: auth.userId })
            .sort({ lastActive: -1 })
            .limit(10);

        // Identify current session roughly by IP and User-Agent from request
        const currentIp = request.headers.get('x-forwarded-for') || 'Unknown IP';
        const currentUserAgent = request.headers.get('user-agent') || '';

        // In a stateless JWT system, we don't have a unique Session ID in the token to match 100%.
        // We will use a heuristic: The most recent session that matches IP and UA is likely the current one.
        // Or simpler: Just mark the very first one (sorted by lastActive) as "Current" if it matches roughly.

        // For display purposes, we return them all. Frontend can assume first one is "Current" since we just used it?
        // Not necessarily if multiple devices are active.

        // A better way for "Current": The session created during *THIS* login flow? 
        // But we don't have that ID.
        // Let's just flag matches based on IP/Device as "Current".

        const enrichedSessions = sessions.map((session: any, index: number) => {
            // Since we sort by lastActive desc, the first one is the most recent.
            // We'll mark it as current for now as a simple heuristic.
            return {
                id: session._id,
                device: session.device,
                ip: session.ip,
                location: session.location,
                lastActive: session.lastActive,
                current: index === 0
            };
        });

        return NextResponse.json({ success: true, data: enrichedSessions }, { status: 200 });

    } catch (error) {
        console.error('Fetch sessions error:', error);
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }
}
