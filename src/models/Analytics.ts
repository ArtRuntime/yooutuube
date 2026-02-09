import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalytics extends Document {
    shortCode: string;
    ip?: string;
    city?: string;
    country?: string;
    userAgent?: string;
    timestamp: Date;
    latitude?: number;
    longitude?: number;
}

const AnalyticsSchema: Schema = new Schema({
    shortCode: { type: String, required: true, index: true },
    ip: { type: String },
    city: { type: String },
    country: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now },
    latitude: { type: Number },
    longitude: { type: Number },
});

export default mongoose.models.Analytics || mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);
