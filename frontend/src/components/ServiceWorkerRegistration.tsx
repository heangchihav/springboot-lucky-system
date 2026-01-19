"use client";

import { useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getServiceWorkerVersion, getCurrentAppVersion, setCurrentAppVersion } from "@/utils/version";

export default function ServiceWorkerRegistration() {
    const [updateInfo, setUpdateInfo] = useState<{ available: boolean; currentVersion: string; newVersion: string } | null>(null);
    const handleServiceWorkerUpdate = useCallback(async () => {
        // Get current and new versions
        const currentVersion = getCurrentAppVersion();
        const newVersion = await getServiceWorkerVersion();

        // Only show update if versions are different
        if (currentVersion !== newVersion) {
            setUpdateInfo({ available: true, currentVersion, newVersion });
        }
    }, []);

    const handleUpdateConfirm = useCallback(() => {
        navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
        if (updateInfo) {
            setCurrentAppVersion(updateInfo.newVersion);
        }
        setUpdateInfo(null);
    }, [updateInfo]);

    const handleUpdateDismiss = useCallback(() => {
        setUpdateInfo(null);
    }, []);

    const handleControllerChange = useCallback(() => {
        // When the service worker controller changes, reload the page
        window.location.reload();
    }, []);

    // Initialize current version on mount
    useEffect(() => {
        const initializeVersion = async () => {
            const currentVersion = getCurrentAppVersion();
            if (currentVersion === 'v1.0.0') {
                // First time user, set to current service worker version
                const swVersion = await getServiceWorkerVersion();
                setCurrentAppVersion(swVersion);
            }
        };
        initializeVersion();
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

    return (
        <AnimatePresence>
            {updateInfo?.available && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed top-4 right-4 z-50 max-w-sm"
                >
                    <div className="bg-linear-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="shrink-0">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-white font-semibold text-sm mb-1">
                                    App Update Available
                                </h3>
                                <p className="text-white/80 text-xs mb-3">
                                    Update from {updateInfo.currentVersion} to {updateInfo.newVersion}. Get the latest features and improvements.
                                </p>
                                <div className="flex gap-2">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleUpdateConfirm}
                                        className="flex-1 bg-white/20 hover:bg-white/30 text-white text-xs font-medium py-2 px-3 rounded-xl transition-colors duration-200"
                                    >
                                        Update Now
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleUpdateDismiss}
                                        className="flex-1 bg-white/10 hover:bg-white/20 text-white/80 text-xs font-medium py-2 px-3 rounded-xl transition-colors duration-200"
                                    >
                                        Later
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
