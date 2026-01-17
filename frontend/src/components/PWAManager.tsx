"use client";

import { useEffect, useState } from "react";
import PWAInstallPrompt from "./PWAInstallPrompt";
import ServiceWorkerRegistration from "./ServiceWorkerRegistration";

export default function PWAManager() {
    const [isLocalhost, setIsLocalhost] = useState(true);

    useEffect(() => {
        setIsLocalhost(window.location.hostname.includes("localhost"));
    }, []);

    if (isLocalhost) {
        return null;
    }

    return (
        <>
            <ServiceWorkerRegistration />
            <PWAInstallPrompt />
        </>
    );
}
