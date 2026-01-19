"use client";

import { useEffect, useCallback } from "react";

export default function ServiceWorkerRegistration() {
    const handleServiceWorkerUpdate = useCallback(() => {
        // Show update notification to user
        if (confirm("A new version is available! Would you like to update?")) {
            navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
        }
    }, []);

    const handleControllerChange = useCallback(() => {
        // When the service worker controller changes, reload the page
        window.location.reload();
    }, []);

    useEffect(() => {
        // Register service worker
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    console.log("✅ Service Worker registered:", registration.scope);

                    // Check for updates periodically
                    setInterval(() => {
                        registration.update();
                    }, 60 * 60 * 1000); // Check every hour

                    // Listen for new service worker
                    registration.addEventListener("updatefound", () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener("statechange", () => {
                                if (
                                    newWorker.state === "installed" &&
                                    navigator.serviceWorker.controller
                                ) {
                                    handleServiceWorkerUpdate();
                                }
                            });
                        }
                    });
                })
                .catch((error) => {
                    console.error("❌ Service Worker registration failed:", error);
                });

            // Listen for controlling service worker changes
            navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
        }
    }, [handleServiceWorkerUpdate, handleControllerChange]);

    return null;
}
