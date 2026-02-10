import mongoose, { Connection, Model } from 'mongoose';
import { IDatabaseAdapter, IUrl, IAnalytics } from './types';

// Define Schemas (we can reuse existing ones or redefine them here for isolation)
const UrlSchema = new mongoose.Schema({
    originalUrl: { type: String, required: true },
    shortCode: { type: String, required: true, unique: true, index: true },
    ogData: {
        title: String,
        description: String,
        image: String,
        favicon: String,
    },
    createdAt: { type: Date, default: Date.now },
    clicks: { type: Number, default: 0 },
});

const AnalyticsSchema = new mongoose.Schema({
    shortCode: { type: String, required: true, index: true },
    ip: String,
    city: String,
    country: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now },
    latitude: Number,
    longitude: Number,
});

export class MongoAdapter implements IDatabaseAdapter {
    private uri: string;
    private connection: Connection | null = null;
    private UrlModel: Model<any> | null = null;
    private AnalyticsModel: Model<any> | null = null;

    constructor(uri: string) {
        this.uri = uri;
    }

    async connect(): Promise<void> {
        if (this.connection && this.connection.readyState === 1) return;

        try {
            console.log(`Connecting to MongoDB: ${this.uri.replace(/:([^:@]+)@/, ':****@')}`);
            this.connection = mongoose.createConnection(this.uri);

            // Wait for connection to open
            await new Promise<void>((resolve, reject) => {
                this.connection!.once('open', () => resolve());
                this.connection!.once('error', (err) => reject(err));
            });

            // Initialize models on this specific connection
            this.UrlModel = this.connection.model('Url', UrlSchema);
            this.AnalyticsModel = this.connection.model('Analytics', AnalyticsSchema);

            console.log(`Connected to MongoDB: ${this.uri.replace(/:([^:@]+)@/, ':****@')}`);
        } catch (error) {
            console.error('MongoDB Connection Error:', error);
            throw error;
        }
    }

    async saveUrl(urlData: IUrl): Promise<void> {
        if (!this.UrlModel) await this.connect();
        await this.UrlModel!.create(urlData);
    }

    async getUrl(shortCode: string): Promise<IUrl | null> {
        if (!this.UrlModel) await this.connect();
        const doc = await this.UrlModel!.findOne({ shortCode }).lean();
        return doc as IUrl | null;
    }

    async incrementClicks(shortCode: string): Promise<void> {
        if (!this.UrlModel) await this.connect();
        await this.UrlModel!.updateOne({ shortCode }, { $inc: { clicks: 1 } });
    }

    async logAnalytics(analyticsData: IAnalytics): Promise<void> {
        if (!this.AnalyticsModel) await this.connect();
        await this.AnalyticsModel!.create(analyticsData);
    }

    async getAnalytics(shortCode: string): Promise<IAnalytics[]> {
        if (!this.AnalyticsModel) await this.connect();
        const docs = await this.AnalyticsModel!.find({ shortCode }).sort({ timestamp: -1 }).limit(100).lean();
        return docs as IAnalytics[];
    }

    async countLinksByIp(ip: string, since: Date): Promise<number> {
        if (!this.UrlModel) await this.connect();
        return await this.UrlModel!.countDocuments({
            creatorIp: ip,
            createdAt: { $gte: since }
        });
    }
}
