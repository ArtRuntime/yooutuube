'use client';

import { useEffect, useState } from 'react';
import { Loader2, MapPin, Globe, Clock, ExternalLink } from 'lucide-react';

interface Log {
    _id: string;
    shortCode: string;
    ip: string;
    city: string;
    country: string;
    userAgent: string;
    timestamp: string;
    latitude?: number;
    longitude?: number;
}

export default function AnalyticsPage() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch('/api/analytics');
                const data = await res.json();
                setLogs(data);
            } catch (error) {
                console.error('Failed to fetch analytics', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
        // Auto-refresh every 5 seconds
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <main className="min-h-screen p-6 sm:p-12 max-w-7xl mx-auto">
            <div className="mb-12">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
                    Live Analytics
                </h1>
                <p className="text-gray-400">Real-time click tracking and location data.</p>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {logs.map((log) => (
                            <div key={log._id} className="glass p-6 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs font-mono">
                                        /{log.shortCode}
                                    </span>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(log.timestamp).toLocaleString()}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <Globe className="w-4 h-4 text-purple-400" />
                                        <span>{log.city}, {log.country}</span>
                                    </div>

                                    {log.latitude && log.longitude ? (
                                        <a
                                            href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm text-green-400 hover:underline"
                                        >
                                            <MapPin className="w-4 h-4" />
                                            <span>Precise Location Found</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <MapPin className="w-4 h-4" />
                                            <span>IP-based Location</span>
                                        </div>
                                    )}

                                    <div className="pt-3 border-t border-white/5 text-xs text-gray-500 truncate" title={log.userAgent}>
                                        {log.userAgent}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {logs.length === 0 && (
                        <div className="text-center text-gray-500 p-12">
                            No clicks recorded yet.
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
