import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Analytics from '@/models/Analytics';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json([]);
        }

        // Fetch latest 100 records for the specific short code
        const logs = await Analytics.find({ shortCode: code })
            .sort({ timestamp: -1 })
            .limit(100)
            .lean();

        return NextResponse.json(logs);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
