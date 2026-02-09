import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Analytics from '@/models/Analytics';
import Url from '@/models/Url';

import { UAParser } from 'ua-parser-js';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const { shortCode, latitude, longitude } = await req.json();

        if (!shortCode) {
            return NextResponse.json({ error: 'Short code is required' }, { status: 400 });
        }

        // Get IP address
        let ip = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
        if (ip.includes(',')) {
            ip = ip.split(',')[0].trim();
        }

        // Get User Agent
        const userAgentString = req.headers.get('user-agent') || '';
        const parser = new UAParser(userAgentString);
        const userAgentBuffer = parser.getResult();
        const userAgent = `${userAgentBuffer.browser.name || ''} ${userAgentBuffer.browser.version || ''} on ${userAgentBuffer.os.name || ''} ${userAgentBuffer.os.version || ''}`.trim();

        // IP-based location fallback
        let city = 'Unknown';
        let country = 'Unknown';

        // Lazy load geoip-lite to avoid build-time errors with database loading
        const geoip = (await import('geoip-lite')).default;
        const geo = geoip.lookup(ip);

        if (geo) {
            city = geo.city || 'Unknown';
            country = geo.country || 'Unknown';
        }

        // Capture precise location if provided
        let analyticsData: any = {
            shortCode,
            ip,
            userAgent: userAgent || userAgentString,
            city,
            country,
            timestamp: new Date(),
        };

        if (latitude && longitude) {
            analyticsData.latitude = latitude;
            analyticsData.longitude = longitude;

            console.log(`📍 Precise Location Captured: https://www.google.com/maps?q=${latitude},${longitude}`);
        }

        // Save analytics
        await Analytics.create(analyticsData);

        // Update click count on Url model
        await Url.updateOne({ shortCode }, { $inc: { clicks: 1 } });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in /api/track:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
