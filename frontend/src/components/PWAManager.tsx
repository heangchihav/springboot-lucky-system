"use client";

import { useEffect, useState } from "react";
import PWAInstallPrompt from "./PWAInstallPrompt";
import ServiceWorkerRegistration from "./ServiceWorkerRegistration";

export default function PWAManager() {
    const [isPWAInstalled, setIsPWAInstalled] = useState(false);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
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

    // Always register service worker
    // Show install prompt only if not installed and installable
    return (
        <>
            <ServiceWorkerRegistration />
            {!isPWAInstalled && isInstallable && <PWAInstallPrompt />}
        </>
    );
}
