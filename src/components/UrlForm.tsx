'use client';

import { useState, useEffect } from 'react';
import { Copy, ArrowRight, Loader2, Check, ChevronDown } from 'lucide-react';

interface UrlFormProps {
    allowedDomains: string[];
}

export default function UrlForm({ allowedDomains = [] }: UrlFormProps) {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ shortCode: string; originalUrl: string; ogData: { title?: string; description?: string; image?: string; favicon?: string } } | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Default to first allowed domain or a fallback
    const [selectedDomain, setSelectedDomain] = useState(allowedDomains[0] || 'https://yooutuube.vercel.app');

    const [domains, setDomains] = useState<string[]>(allowedDomains.length > 0 ? allowedDomains : ['https://yooutuube.vercel.app']);

    // Effect to add current domain if not in list (e.g. localhost)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const origin = window.location.origin;
            setDomains(prev => {
                const uniqueDomains = new Set([...prev]);
                // Check if origin is already covered (ignoring trailing slash)
                const isIncluded = [...uniqueDomains].some(d => d.replace(/\/$/, '') === origin.replace(/\/$/, ''));

                if (!isIncluded) {
                    uniqueDomains.add(origin);
                    // If we have no valid selected domain yet, set it to current origin
                    if (!allowedDomains.length) {
                        setSelectedDomain(origin);
                    }
                }
                return Array.from(uniqueDomains);
            });
        }
    }, [allowedDomains]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        try {
            // 1. Verify Domain Health first
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

                const healthRes = await fetch(`${selectedDomain}/api/health`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!healthRes.ok) {
                    throw new Error('Domain is unreachable');
                }
            } catch (err) {
                console.error('Domain health check failed:', err);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                throw new Error(`Selected domain (${selectedDomain.replace('https://', '')}) is not reachable. Please select another domain.`);
            }

            // 2. Proceed with Shortening
            const res = await fetch('/api/shorten', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }), // Domain selection is client-side only for now as it just changes the redirect link prefix
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            setResult(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!result) return;
        const shortUrl = `${selectedDomain}/${result.shortCode}`;
        navigator.clipboard.writeText(shortUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-xl mx-auto space-y-8 z-20 relative">
            <form onSubmit={handleSubmit} className="relative group" autoComplete="off">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex flex-col sm:flex-row items-stretch bg-[#0a0a0a] rounded-lg p-1 gap-1">
                    {/* Domain Selector */}
                    {/* Custom Domain Selector */}
                    <div className="relative group/domain min-w-[200px]">
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full h-full bg-white/5 text-white pl-4 pr-10 py-4 sm:py-0 rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none flex items-center whitespace-nowrap outline-none hover:bg-white/10 transition-colors border-b sm:border-b-0 sm:border-r border-white/10 text-sm font-medium"
                        >
                            {selectedDomain.replace(/https?:\/\//, '')}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsDropdownOpen(false)}
                                />
                                <div className="absolute top-full left-0 w-full mt-2 bg-[#1a1b1e]/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                        {domains.map((d) => (
                                            <button
                                                key={d}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedDomain(d);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-white/10 flex items-center justify-between ${selectedDomain === d ? 'text-blue-400 bg-white/5' : 'text-gray-300'
                                                    }`}
                                            >
                                                <span className="truncate">{d.replace(/https?:\/\//, '')}</span>
                                                {selectedDomain === d && <Check className="w-3.5 h-3.5" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste your link here..."
                        required
                        autoComplete="off"
                        className="flex-1 bg-transparent text-white p-4 outline-none placeholder-gray-500 min-w-0"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-white text-black px-6 py-3 rounded-md font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
                                value={`${selectedDomain}/${result.shortCode}`}
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
