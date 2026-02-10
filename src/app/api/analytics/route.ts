import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/db/service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json([]);
        }

        // Fetch latest 100 records for the specific short code
        // This now aggregates from ALL connected databases (Mongo + Turso)
        const logs = await dbService.getAnalytics(code);

        return NextResponse.json(logs);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
