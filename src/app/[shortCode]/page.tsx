import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import Url from '@/models/Url';
import RedirectLogic from './RedirectLogic';
import { Metadata } from 'next';

// Force dynamic to ensure we get fresh data or at least don't statically bake broken links
// However, caching this is arguably better for performance if the data doesn't change.
// But we need to serve this path for *any* shortCode.
// export const dynamic = 'force-dynamic'; 

interface Props {
    params: Promise<{
        shortCode: string;
    }>;
}

async function getUrl(shortCode: string) {
    await dbConnect();
    const urlParams = await Url.findOne({ shortCode }).lean();
    if (!urlParams) return null;
    return JSON.parse(JSON.stringify(urlParams)); // Serialize for client component passing if needed
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { shortCode } = await params;
    const urlData = await getUrl(shortCode);

    if (!urlData) {
        return {
            title: 'URL Not Found',
        };
    }

    const { ogData } = urlData;

    return {
        title: ogData?.title || 'Shortened URL',
        description: ogData?.description || 'Click to visit this link.',
        openGraph: {
            title: ogData?.title || 'Shortened URL',
            description: ogData?.description || 'Click to visit this link.',
            images: ogData?.image ? [{ url: ogData.image }] : [],
            siteName: ogData?.siteName,
        },
        twitter: {
            card: 'summary_large_image',
            title: ogData?.title || 'Shortened URL',
            description: ogData?.description || 'Click to visit this link.',
            images: ogData?.image ? [ogData.image] : [],
        },
    };
}

export default async function ShortCodePage({ params }: Props) {
    const { shortCode } = await params;
    const urlData = await getUrl(shortCode);

    if (!urlData) {
        notFound();
    }

    return (
        <RedirectLogic
            shortCode={shortCode}
            originalUrl={urlData.originalUrl}
        />
    );
}
