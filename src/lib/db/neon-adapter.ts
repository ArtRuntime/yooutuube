import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { IDatabaseAdapter, IUrl, IAnalytics } from './types';

export class NeonAdapter implements IDatabaseAdapter {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private sql: NeonQueryFunction<any, any>;

    constructor(connectionString: string) {
        this.sql = neon(connectionString);
    }

    async connect(): Promise<void> {
        // Neon serverless driver connects on query, so we just verify tables
        await this.sql`
            CREATE TABLE IF NOT EXISTS urls (
                id SERIAL PRIMARY KEY,
                originalUrl TEXT NOT NULL,
                shortCode TEXT NOT NULL UNIQUE,
                creatorIp TEXT,
                ogData TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                clicks INTEGER DEFAULT 0
            );
        `;

        // Lazy migration for creatorIp
        try {
            await this.sql`ALTER TABLE urls ADD COLUMN IF NOT EXISTS creatorIp TEXT`;
        } catch {
            // Ignore
        }

        await this.sql`
            CREATE TABLE IF NOT EXISTS analytics (
                id SERIAL PRIMARY KEY,
                shortCode TEXT NOT NULL,
                ip TEXT,
                city TEXT,
                country TEXT,
                userAgent TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                latitude REAL,
                longitude REAL
            );
        `;
        console.log('Connected to Neon (Postgres) and ensured tables exist.');
    }

    async saveUrl(urlData: IUrl): Promise<void> {
        const ogDataJson = JSON.stringify(urlData.ogData || {});
        // Postgres uses $1, $2 placeholders
        await this.sql`
            INSERT INTO urls (originalUrl, shortCode, creatorIp, ogData, createdAt, clicks)
            VALUES (${urlData.originalUrl}, ${urlData.shortCode}, ${urlData.creatorIp || null}, ${ogDataJson}, ${new Date().toISOString()}, 0)
        `;
    }

    async getUrl(shortCode: string): Promise<IUrl | null> {
        const result = await this.sql`
            SELECT * FROM urls WHERE shortCode = ${shortCode}
        ` as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

        if (result.length === 0) return null;

        const row = result[0];
        return {
            originalUrl: row.originalurl, // Postgres returns lowercase usually
            shortCode: row.shortcode,
            creatorIp: row.creatorip,
            ogData: JSON.parse(row.ogdata),
            createdAt: new Date(row.createdat),
            clicks: row.clicks
        };
    }

    async incrementClicks(shortCode: string): Promise<void> {
        await this.sql`
            UPDATE urls SET clicks = clicks + 1 WHERE shortCode = ${shortCode}
        `;
    }

    async logAnalytics(analyticsData: IAnalytics): Promise<void> {
        await this.sql`
            INSERT INTO analytics (shortCode, ip, city, country, userAgent, timestamp, latitude, longitude)
            VALUES (
                ${analyticsData.shortCode},
                ${analyticsData.ip || null},
                ${analyticsData.city || null},
                ${analyticsData.country || null},
                ${analyticsData.userAgent || null},
                ${new Date().toISOString()},
                ${analyticsData.latitude || null},
                ${analyticsData.longitude || null}
            )
        `;
    }

    async getAnalytics(shortCode: string): Promise<IAnalytics[]> {
        const result = await this.sql`
            SELECT * FROM analytics WHERE shortCode = ${shortCode} ORDER BY timestamp DESC LIMIT 100
        ` as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

        return result.map(row => ({
            shortCode: row.shortcode,
            ip: row.ip,
            city: row.city,
            country: row.country,
            userAgent: row.useragent,
            timestamp: new Date(row.timestamp),
            latitude: row.latitude,
            longitude: row.longitude
        }));
    }

    async countLinksByIp(ip: string, since: Date): Promise<number> {
        const result = await this.sql`
            SELECT COUNT(*) as count FROM urls WHERE creatorIp = ${ip} AND createdAt >= ${since.toISOString()}
        ` as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

        if (result.length === 0) return 0;
        return parseInt(result[0].count);
    }
}
