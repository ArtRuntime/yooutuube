import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import ogs from 'open-graph-scraper';
import dbConnect from '@/lib/db';
import Url from '@/models/Url';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
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

        // Scrape Open Graph data
        let ogData = {
            title: '',
            description: '',
            image: '',
            siteName: '',
        };

        try {
            const { result } = await ogs({ url });
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
        // Collision check loop could be added here for absolute safety, 
        // but nanoid(8) has a very low collision probability.
        const shortCode = nanoid(8);

        const newUrl = await Url.create({
            originalUrl: url,
            shortCode,
            ogData,
        });

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
