"use client";

import { motion } from "framer-motion";
import { getCurrentAppVersion } from "@/utils/version";
import { useEffect, useState } from "react";

export function Footer() {
    const [currentVersion, setCurrentVersion] = useState(getCurrentAppVersion());

    // Update version when localStorage changes
    useEffect(() => {
        const checkVersion = () => {
            const newVersion = getCurrentAppVersion();
            if (newVersion !== currentVersion) {
                setCurrentVersion(newVersion);
            }
        };

        // Check immediately
        checkVersion();

        // Set up interval to check for version changes
        const interval = setInterval(checkVersion, 1000);

        // Listen for storage changes
        const handleStorageChange = () => {
            checkVersion();
        };

        // Listen for custom version change event
        const handleVersionChange = (event: CustomEvent) => {
            console.log('Version changed event:', event.detail);
            setCurrentVersion(event.detail);
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('appVersionChanged', handleVersionChange as EventListener);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('appVersionChanged', handleVersionChange as EventListener);
        };
    }, [currentVersion]);

    return (
        <footer className="my-2">
            <div className="sm:rounded-2xl border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-xl">
                <div className="mx-auto max-w-7xl py-3 px-4 sm:px-6">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                        <motion.div className="text-slate-400 text-sm">
                            {"© 2026 VET Report. All rights reserved.".split("").map((char, index) => (
                                <motion.span
                                    key={index}
                                    initial={{ opacity: 0.7 }}
                                    animate={{ opacity: [0.7, 1, 0.7] }}
                                    transition={{
                                        duration: 2,
                                        ease: "easeInOut",
                                        repeat: Infinity,
                                        repeatType: "loop",
                                        delay: index * 0.05,
                                    }}
                                    style={{ display: "inline-block" }}
                                >
                                    {char === " " ? "\u00A0" : char}
                                </motion.span>
                            ))}
                            <span className="ml-2 text-slate-500">• {currentVersion}</span>
                        </motion.div>
                        <a
                            href="https://t.me/heangchihav"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-slate-400 transition-colors duration-200 hover:text-slate-200"
                        >
                            <span className="animate-text-gradient bg-gradient-to-r from-slate-400 via-orange-400 to-slate-400 bg-clip-text text-transparent bg-[length:200%_100%]">
                                Created by
                            </span>
                            <span className="font-medium text-slate-300">@heangchihav</span>
                            <svg
                                className="h-3 w-3"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.771 6.82l-1.538 7.242c-.113.511-.416.635-.839.395l-2.322-1.708-1.12 1.078c-.124.124-.228.228-.467.228l.165-2.434 4.3-3.89c.187-.165-.043-.258-.29-.097l-5.314 3.343-2.29-.716c-.498-.156-.507-.498.104-.736l8.947-3.452c.411-.156.77.099.637.572z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
