import mongoose, { Schema, Document } from 'mongoose';

export interface IUrl extends Document {
    originalUrl: string;
    shortCode: string;
    ogData?: {
        title?: string;
        description?: string;
        image?: string;
        siteName?: string;
    };
    createdAt: Date;
    clicks: number;
}

const UrlSchema: Schema = new Schema({
    originalUrl: { type: String, required: true },
    shortCode: { type: String, required: true, unique: true, index: true },
    ogData: {
        title: String,
        description: String,
        image: String,
        siteName: String,
    },
    createdAt: { type: Date, default: Date.now },
    clicks: { type: Number, default: 0 },
});

export default mongoose.models.Url || mongoose.model<IUrl>('Url', UrlSchema);
