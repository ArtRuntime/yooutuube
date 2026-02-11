import { NextResponse } from 'next/server';

export async function GET() {
    const domains = (process.env.BASE_URL || '')
        .split(',')
        .filter(Boolean)
        .map(d => d.trim())
        .map(d => d.startsWith('http') ? d : `https://${d}`);

    // Default fallback if no BASE_URL is set (e.g. dev)
    if (domains.length === 0) {
        domains.push('http://localhost:3000');
    }

    return NextResponse.json({
        domains
    }, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
        }
    });
}
