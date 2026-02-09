const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/yooutuube';

const UrlSchema = new mongoose.Schema({
    originalUrl: { type: String, required: true },
    shortCode: { type: String, required: true, unique: true, index: true },
    ogData: {
        title: String,
        description: String,
        image: String,
    },
    createdAt: { type: Date, default: Date.now },
    clicks: { type: Number, default: 0 },
});

const Url = mongoose.models.Url || mongoose.model('Url', UrlSchema);

async function run() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const count = await Url.countDocuments();
    console.log('Total URLs:', count);

    const urls = await Url.find({});
    console.log('URLs:', JSON.stringify(urls, null, 2));

    await mongoose.disconnect();
}

run().catch(console.error);
