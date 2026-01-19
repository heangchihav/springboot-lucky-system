"use client";

import { useEffect, useCallback, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { getServiceWorkerVersion, getCurrentAppVersion, setCurrentAppVersion, checkForUpdate } from "@/utils/version";

export default function ServiceWorkerRegistration() {
    const [updateInfo, setUpdateInfo] = useState<{ available: boolean; currentVersion: string; newVersion: string } | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Check if running as PWA
    const isPWA = () => {
        if (typeof window === 'undefined') return false;

        const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
        const isIOSStandalone = (window.navigator as any).standalone === true;
        const isAndroidApp = document.referrer.includes("android-app://");

        const result = isStandalone || isIOSStandalone || isAndroidApp;
        console.log('PWA Detection:', { isStandalone, isIOSStandalone, isAndroidApp, result });

        return result;
    };
    const handleServiceWorkerUpdate = useCallback(async () => {
        console.log('Service worker update detected');
        const updateInfo = await checkForUpdate();

        if (updateInfo.hasUpdate) {
            console.log('Update available:', updateInfo);

            // For web users: update automatically
            if (!isPWA()) {
                console.log('Web user - updating automatically');
                setCurrentAppVersion(updateInfo.newVersion);
                navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
                return;
            }

            // For PWA users: show notification
            console.log('PWA user - showing update notification');
            setUpdateInfo({ available: true, ...updateInfo });
        } else {
            console.log('No update available');
        }
    }, []);

    const handleUpdateConfirm = useCallback(async () => {
        setIsUpdating(true);

        // Update localStorage immediately
        if (updateInfo) {
            setCurrentAppVersion(updateInfo.newVersion);
        }

        // Trigger service worker update
        navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });

        // Hide notification immediately
        setUpdateInfo(null);

        // The page will reload automatically when controller changes
    }, [updateInfo]);

    const handleUpdateDismiss = useCallback(() => {
        setUpdateInfo(null);
    }, []);

    const handleControllerChange = useCallback(() => {
        // When the service worker controller changes, reload the page
        window.location.reload();
    }, []);

    // Initialize current version on mount and check for updates
    useEffect(() => {
        const initializeVersion = async () => {
            const currentVersion = getCurrentAppVersion();
            console.log('Current app version:', currentVersion, 'Is PWA:', isPWA());

            if (currentVersion === 'v1.0.0') {
                // First time user, set to current service worker version
                const swVersion = await getServiceWorkerVersion();
                console.log('Setting first-time version to:', swVersion);
                setCurrentAppVersion(swVersion);
            } else {
                // Check for updates on load
                const updateCheck = await checkForUpdate();
                if (updateCheck.hasUpdate) {
                    if (isPWA()) {
                        // PWA users: show notification
                        console.log('PWA update available on load:', updateCheck);
                        setUpdateInfo({ available: true, ...updateCheck });
                    } else {
                        // Web users: update automatically
                        console.log('Web update available on load - updating automatically:', updateCheck);
                        setCurrentAppVersion(updateCheck.newVersion);
                        navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
                    }
                }
            }
        };
        initializeVersion();
    }, []);

    // Add periodic update check
    useEffect(() => {
        const interval = setInterval(async () => {
            const updateCheck = await checkForUpdate();
            if (updateCheck.hasUpdate && !updateInfo?.available) {
                if (isPWA()) {
                    // PWA users: show notification
                    console.log('Periodic PWA update found:', updateCheck);
                    setUpdateInfo({ available: true, ...updateCheck });
                } else {
                    // Web users: update automatically
                    console.log('Periodic web update found - updating automatically:', updateCheck);
                    setCurrentAppVersion(updateCheck.newVersion);
                    navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
                }
            }
        }, 5 * 60 * 1000); // Check every 5 minutes

        return () => clearInterval(interval);
    }, [updateInfo]);

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

    return (
        <>
            {updateInfo?.available && (
                <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-start gap-3">
                            <div className="shrink-0 w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <RefreshCw className={`w-6 h-6 text-white ${isUpdating ? 'animate-spin' : ''}`} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                    App Update Available
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                    Update from {updateInfo.currentVersion} to {updateInfo.newVersion}. Get the latest features and improvements.
                                </p>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleUpdateConfirm}
                                        disabled={isUpdating}
                                        className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                                    >
                                        {isUpdating ? 'Updating...' : 'Update Now'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleUpdateDismiss}
                                        disabled={isUpdating}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:bg-gray-50 dark:disabled:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:text-gray-400 text-sm font-medium rounded-lg transition-colors duration-200"
                                    >
                                        Not now
                                    </button>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleUpdateDismiss}
                                disabled={isUpdating}
                                className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:text-gray-300 transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
