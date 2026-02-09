'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectLogic({ shortCode, originalUrl }: { shortCode: string, originalUrl: string }) {
    const router = useRouter();

    useEffect(() => {
        const trackAndRedirect = async () => {
            let locationData = {};

            // Attempt geolocation efficiently with a shorter timeout
            try {
                if ('geolocation' in navigator) {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            timeout: 4000, // Increased timeout (4s) to allow time for permission prompt
                            maximumAge: 0
                        });
                    }).catch(() => null);

                    if (position) {
                        locationData = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        };
                    }
                }
            } catch (e) {
                // Ignore errors
            }

            // Send tracking data using keepalive so it survives redirection
            try {
                fetch('/api/track', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        shortCode,
                        ...locationData,
                    }),
                    keepalive: true,
                }).catch(() => { });
            } catch (e) {
                // Ignore
            }

            // Immediate Redirect
            window.location.href = originalUrl;
        };

        trackAndRedirect();
    }, [shortCode, originalUrl, router]);

    // Return invisible black screen to prevent white flash
    return (
        <div className="min-h-screen bg-[#0f1014]" />
    );
}
