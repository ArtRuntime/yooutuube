export interface IUrl {
    originalUrl: string;
    shortCode: string;
    creatorIp?: string; // For rate limiting
    ogData?: {
        title?: string;
        description?: string;
        image?: string;
    };
    createdAt: Date;
    clicks: number;
}

export interface IAnalytics {
    shortCode: string;
    ip?: string;
    city?: string;
    country?: string;
    userAgent?: string;
    timestamp: Date;
    latitude?: number;
    longitude?: number;
}

export interface IDatabaseAdapter {
    saveUrl(urlData: IUrl): Promise<void>;
    getUrl(shortCode: string): Promise<IUrl | null>;
    incrementClicks(shortCode: string): Promise<void>;
    logAnalytics(analyticsData: IAnalytics): Promise<void>;
    getAnalytics(shortCode: string): Promise<IAnalytics[]>;
    countLinksByIp(ip: string, since: Date): Promise<number>;
    connect(): Promise<void>;
}
