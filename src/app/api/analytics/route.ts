import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Analytics from '@/models/Analytics';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();

        // Fetch latest 100 records, sorted by newest first
        const logs = await Analytics.find({})
            .sort({ timestamp: -1 })
            .limit(100)
            .lean();

        return NextResponse.json(logs);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
