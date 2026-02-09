'use client';

import { useEffect, useState, useRef } from 'react';
import { Loader2, MapPin, Globe, Clock, ExternalLink, Search, ArrowRight } from 'lucide-react';

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
    const [loading, setLoading] = useState(false);
    const [inputCode, setInputCode] = useState('');
    const [activeCode, setActiveCode] = useState('');
    const [error, setError] = useState('');

    const fetchLogs = async (code: string) => {
        if (!code) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/analytics?code=${code}`);
            const data = await res.json();
            setLogs(data);
            if (data.length === 0) {
                setError('No data found for this code yet.');
            }
        } catch (error) {
            console.error('Failed to fetch analytics', error);
            setError('Failed to fetch data.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputCode.trim()) return;

        // Extract code from URL if full URL is pasted
        let code = inputCode.trim();
        try {
            const url = new URL(code);
            const path = url.pathname.split('/').filter(Boolean).pop();
            if (path) code = path;
        } catch (e) {
            // Not a URL, treat as code
        }

        setActiveCode(code);
        fetchLogs(code);
    };

    useEffect(() => {
        if (!activeCode) return;

        // Auto-refresh every 5 seconds if a code is active
        const interval = setInterval(() => fetchLogs(activeCode), 5000);
        return () => clearInterval(interval);
    }, [activeCode]);

    return (
        <main className="min-h-screen p-6 sm:p-12 max-w-7xl mx-auto">
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
                    Analytics Dashboard
                </h1>
                <p className="text-gray-400 mb-8">Enter your short URL or code to view real-time statistics.</p>

                <form onSubmit={handleSearch} className="max-w-xl mx-auto relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative flex items-center bg-black/50 backdrop-blur-xl rounded-lg border border-white/10 p-1">
                        <Search className="w-5 h-5 text-gray-400 ml-3" />
                        <input
                            type="text"
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value)}
                            placeholder="Paste shortened URL (e.g., yooutuube.vercel.app/XyZ123)"
                            className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 py-3 px-4 outline-none"
                        />
                        <button
                            type="submit"
                            className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-md transition-colors mr-1"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </div>

            {loading && logs.length === 0 ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <div className="space-y-4">
                    {activeCode && !loading && logs.length === 0 && (
                        <div className="text-center text-gray-500 p-12 glass rounded-xl border border-white/5">
                            <p className="text-lg mb-2">{error || 'No clicks recorded yet.'}</p>
                            <p className="text-sm">Share your link to start tracking!</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {logs.map((log) => (
                            <div key={log._id} className="glass p-6 rounded-xl border border-white/5 hover:border-white/10 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500">
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

                                    {log.latitude && log.longitude && (
                                        <div className="text-xs font-mono text-gray-500 bg-black/20 p-1.5 rounded border border-white/5 break-all">
                                            {log.latitude}, {log.longitude}
                                        </div>
                                    )}

                                    <div className="pt-3 border-t border-white/5 text-xs text-gray-500 truncate" title={log.userAgent}>
                                        {log.userAgent}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </main>
    );
}
