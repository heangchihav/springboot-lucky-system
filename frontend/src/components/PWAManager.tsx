"use client";

import { useEffect, useState } from "react";
import PWAInstallPrompt from "./PWAInstallPrompt";
import ServiceWorkerRegistration from "./ServiceWorkerRegistration";

export default function PWAManager() {
    const [isPWAInstalled, setIsPWAInstalled] = useState(false);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isLocalhost, setIsLocalhost] = useState(false);

    useEffect(() => {
        // Check if running on localhost
        const hostname = window.location.hostname;
        setIsLocalhost(hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0');

        // Check if app is running in PWA mode
        setIsPWAInstalled(window.matchMedia('(display-mode: standalone)').matches);
    }, []);

    useEffect(() => {
        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    // Disable PWA functionality for localhost
    if (isLocalhost) {
        return null;
    }

    // Always register service worker
    // Show install prompt only if not installed and installable
    return (
        <>
            <ServiceWorkerRegistration />
            {!isPWAInstalled && isInstallable && <PWAInstallPrompt />}
        </>
    );
}
