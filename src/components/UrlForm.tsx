'use client';

import { useState } from 'react';
import { Copy, ArrowRight, Loader2, Check } from 'lucide-react';

export default function UrlForm() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ shortCode: string; originalUrl: string; ogData: any } | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await fetch('/api/shorten', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!result) return;
        const shortUrl = `${window.location.origin}/${result.shortCode}`;
        navigator.clipboard.writeText(shortUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-xl mx-auto space-y-8 z-20 relative">
            <form onSubmit={handleSubmit} className="relative group" autoComplete="off">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center bg-[#0a0a0a] rounded-lg p-1">
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste your link here (e.g. YouTube, Article)..."
                        required
                        autoComplete="off"
                        className="flex-1 bg-transparent text-white p-4 outline-none placeholder-gray-500"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-white text-black px-6 py-3 rounded-md font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <>
                            Shorten <ArrowRight className="w-4 h-4" />
                        </>}
                    </button>
                </div>
            </form>

            {error && (
                <div className="text-red-400 text-center bg-red-400/10 p-4 rounded-lg border border-red-400/20">
                    {error}
                </div>
            )}

            {result && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                    {/* Result Card */}
                    <div className="glass p-6 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div className="truncate text-gray-400 text-sm flex-1">
                                {result.originalUrl}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-black/40 rounded-lg border border-white/5 mb-6">
                            <span className="text-green-400 pl-3 hidden sm:inline">Short Link:</span>
                            <input
                                readOnly
                                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/${result.shortCode}`}
                                className="flex-1 bg-transparent text-white outline-none text-sm sm:text-base font-mono"
                            />
                            <button
                                onClick={copyToClipboard}
                                className="p-2 hover:bg-white/10 rounded-md transition-colors text-gray-300"
                                title="Copy to clipboard"
                            >
                                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Rich Preview Mockup */}
                        <div className="border-t border-white/10 pt-6">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Rich Preview</h4>
                            <div className="bg-[#2f3136] rounded-md overflow-hidden max-w-[400px] border-l-4 border-l-[#202225] mx-auto sm:mx-0">
                                <div className="p-4 grid gap-1">
                                    <div className="text-[10px] text-gray-400 truncate">
                                        {new URL(result.originalUrl).hostname}
                                    </div>
                                    <div className="text-blue-400 font-semibold text-sm truncate">
                                        {result.ogData.title || 'No Title Found'}
                                    </div>
                                    <div className="text-xs text-gray-300 line-clamp-2">
                                        {result.ogData.description || 'No description available for this link.'}
                                    </div>
                                </div>
                                {result.ogData.image && (
                                    <div className="relative aspect-video w-full">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={result.ogData.image} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
