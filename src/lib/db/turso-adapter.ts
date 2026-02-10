import { createClient, Client } from '@libsql/client';
import { IDatabaseAdapter, IUrl, IAnalytics } from './types';

export class TursoAdapter implements IDatabaseAdapter {
    private client: Client;

    constructor(url: string, authToken: string) {
        this.client = createClient({
            url,
            authToken,
        });
    }

    async connect(): Promise<void> {
        // Initialize tables if they don't exist
        await this.client.execute(`
            CREATE TABLE IF NOT EXISTS urls (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                originalUrl TEXT NOT NULL,
                shortCode TEXT NOT NULL UNIQUE,
                creatorIp TEXT,
                ogData TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                clicks INTEGER DEFAULT 0
            );
        `);

        // Attempt to add creatorIp column if it doesn't exist (migrations are hard in this setup, so lazy alter)
        try {
            await this.client.execute(`ALTER TABLE urls ADD COLUMN creatorIp TEXT`);
        } catch {
            // Ignore error if column already exists
        }

        await this.client.execute(`
            CREATE TABLE IF NOT EXISTS analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                shortCode TEXT NOT NULL,
                ip TEXT,
                city TEXT,
                country TEXT,
                userAgent TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                latitude REAL,
                longitude REAL
            );
        `);
        console.log('Connected to Turso and ensured tables exist.');
    }

    async saveUrl(urlData: IUrl): Promise<void> {
        const ogDataJson = JSON.stringify(urlData.ogData || {});
        // Try insert with creatorIp
        try {
            await this.client.execute({
                sql: `INSERT INTO urls (originalUrl, shortCode, creatorIp, ogData, createdAt, clicks) VALUES (?, ?, ?, ?, ?, ?)`,
                args: [urlData.originalUrl, urlData.shortCode, urlData.creatorIp || null, ogDataJson, new Date().toISOString(), 0]
            });
        } catch {
            // Fallback for older schema if ALTER failed (unlikely but safe)
            await this.client.execute({
                sql: `INSERT INTO urls (originalUrl, shortCode, ogData, createdAt, clicks) VALUES (?, ?, ?, ?, ?)`,
                args: [urlData.originalUrl, urlData.shortCode, ogDataJson, new Date().toISOString(), 0]
            });
        }
    }

    async getUrl(shortCode: string): Promise<IUrl | null> {
        const result = await this.client.execute({
            sql: `SELECT * FROM urls WHERE shortCode = ?`,
            args: [shortCode]
        });

        if (result.rows.length === 0) return null;

        const row = result.rows[0];
        return {
            originalUrl: row.originalUrl as string,
            shortCode: row.shortCode as string,
            creatorIp: row.creatorIp as string,
            ogData: JSON.parse(row.ogData as string),
            createdAt: new Date(row.createdAt as string),
            clicks: row.clicks as number
        };
    }

    async incrementClicks(shortCode: string): Promise<void> {
        await this.client.execute({
            sql: `UPDATE urls SET clicks = clicks + 1 WHERE shortCode = ?`,
            args: [shortCode]
        });
    }

    async logAnalytics(analyticsData: IAnalytics): Promise<void> {
        await this.client.execute({
            sql: `INSERT INTO analytics (shortCode, ip, city, country, userAgent, timestamp, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                analyticsData.shortCode,
                analyticsData.ip || null,
                analyticsData.city || null,
                analyticsData.country || null,
                analyticsData.userAgent || null,
                new Date().toISOString(),
                analyticsData.latitude || null,
                analyticsData.longitude || null
            ]
        });
    }

    async getAnalytics(shortCode: string): Promise<IAnalytics[]> {
        const result = await this.client.execute({
            sql: `SELECT * FROM analytics WHERE shortCode = ? ORDER BY timestamp DESC LIMIT 100`,
            args: [shortCode]
        });

        return result.rows.map(row => ({
            shortCode: row.shortCode as string,
            ip: row.ip as string,
            city: row.city as string,
            country: row.country as string,
            userAgent: row.userAgent as string,
            timestamp: new Date(row.timestamp as string),
            latitude: row.latitude as number,
            longitude: row.longitude as number
        }));
    }

    async countLinksByIp(ip: string, since: Date): Promise<number> {
        // SQLite/LibSQL count
        const result = await this.client.execute({
            sql: `SELECT COUNT(*) as count FROM urls WHERE creatorIp = ? AND createdAt >= ?`,
            args: [ip, since.toISOString()]
        });

        if (result.rows.length === 0) return 0;
        return result.rows[0].count as number;
    }
}
