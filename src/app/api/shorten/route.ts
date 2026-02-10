import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import ogs from 'open-graph-scraper';
import { dbService } from '@/lib/db/service';

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
        }

        // Rate Limiting
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
            req.headers.get('x-real-ip') ||
            '127.0.0.1';

        // Check links created in the last 30 seconds
        const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
        const recentCount = await dbService.countLinksByIp(ip, thirtySecondsAgo);

        if (recentCount >= 8) {
            return NextResponse.json({
                error: 'Rate limit exceeded. You can only create 8 links every 30 seconds.'
            }, { status: 429 });
        }

        // Scrape Open Graph data
        let ogData = {
            title: '',
            description: '',
            image: '',
            siteName: '',
        };

        try {
            const { result } = await ogs({
                url,
                fetchOptions: {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                    }
                }
            });
            if (result.success) {
                ogData = {
                    title: result.ogTitle || '',
                    description: result.ogDescription || '',
                    image: (result.ogImage && result.ogImage.length > 0) ? result.ogImage[0].url : '',
                    siteName: result.ogSiteName || '',
                };
            }
        } catch (error) {
            console.error('Error scraping OG data:', error);
            // Continue even if scraping fails
        }

        // Generate unique short code
        const shortCode = nanoid(8);

        const newUrl = {
            originalUrl: url,
            shortCode,
            creatorIp: ip,
            ogData,
            createdAt: new Date(),
            clicks: 0
        };

        await dbService.saveUrl(newUrl);

        return NextResponse.json({
            shortCode: newUrl.shortCode,
            originalUrl: newUrl.originalUrl,
            ogData: newUrl.ogData,
        }, { status: 201 });

    } catch (error) {
        console.error('Error in /api/shorten:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
