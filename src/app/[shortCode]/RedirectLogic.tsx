'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectLogic({ shortCode, originalUrl }: { shortCode: string, originalUrl: string }) {
    const router = useRouter();
    const [status, setStatus] = useState('Initializing...');

    useEffect(() => {
        const trackAndRedirect = async () => {
            setStatus('Requesting location access for better analytics...');

            let locationData = {};

            try {
                if ('geolocation' in navigator) {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            timeout: 5000,
                            maximumAge: 0
                        });
                    }).catch((err) => {
                        console.log("Geolocation denied or timed out:", err.message);
                        return null;
                    });

                    if (position) {
                        locationData = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        };
                    }
                }
            } catch (e) {
                console.error("Error with geolocation:", e);
            }

            setStatus('Redirecting...');

            // Send tracking data
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
                });
            } catch (e) {
                console.error("Tracking failed", e);
            }

            // Redirect
            window.location.href = originalUrl;
        };

        trackAndRedirect();
    }, [shortCode, originalUrl, router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <h2 className="text-xl font-semibold mb-2">You are being redirected</h2>
                <p className="text-gray-400">{status}</p>
                <p className="text-sm text-gray-500 mt-4">Heading to: {originalUrl}</p>
            </div>
        </div>
    );
}
