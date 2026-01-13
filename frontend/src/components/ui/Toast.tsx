"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type ToastTone = "success" | "error" | "info" | "warning";

type ToastState = {
    message: string;
    tone: ToastTone;
};

type ToastContextType = {
    showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toast, setToast] = useState<ToastState | null>(null);
    const [mounted, setMounted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isPausedRef = useRef(false);

    useEffect(() => {
        setMounted(true);

        // Inject custom animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slide-in {
                0% { transform: translateX(100%); }
                100% { transform: translateX(0); }
            }
            @keyframes slide-out {
                0% { transform: translateX(0); }
                100% { transform: translateX(100%); }
            }
            @keyframes pulse-ring {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.7; }
                100% { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const showToast = (message: string, tone: ToastTone = "success") => {
        setToast({ message, tone });
        setTimeLeft(3500);
        setIsVisible(true);
        setIsPaused(false);
        isPausedRef.current = false;

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }


        intervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                // Only countdown if not paused (using ref for current value)
                if (!isPausedRef.current) {
                    if (prev <= 100) {
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = null;
                        }
                        setIsVisible(false);
                        setTimeout(() => setToast(null), 300);
                        return 0;
                    }
                    return prev - 100;
                }
                // Return unchanged time if paused
                return prev;
            });
        }, 100);
    };

    const handleMouseEnter = () => {
        setIsPaused(true);
        isPausedRef.current = true;
    };

    const handleMouseLeave = () => {
        setIsPaused(false);
        isPausedRef.current = false;
        // Resume countdown immediately when mouse leaves
        if (timeLeft > 0) {
            // Optional: reduce time slightly when hovering to prevent indefinite display
            setTimeLeft(prev => Math.max(prev - 500, 0));
        }
    };

    const getToastStyles = (tone: ToastTone) => {
        switch (tone) {
            case "success":
                return "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white border-emerald-400/50 shadow-emerald-500/50";
            case "error":
                return "bg-gradient-to-r from-rose-600 to-rose-500 text-white border-rose-400/50 shadow-rose-500/50";
            case "warning":
                return "bg-gradient-to-r from-amber-600 to-amber-500 text-white border-amber-400/50 shadow-amber-500/50";
            case "info":
                return "bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-400/50 shadow-blue-500/50";
            default:
                return "bg-gradient-to-r from-slate-600 to-slate-500 text-white border-slate-400/50 shadow-slate-500/50";
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {mounted && toast && createPortal(
                <div
                    className={`fixed bottom-6 right-6 rounded-xl px-5 py-4 text-sm font-medium backdrop-blur-sm border shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl ${getToastStyles(
                        toast.tone
                    )}`}
                    style={{
                        position: "fixed",
                        zIndex: 9999,
                        minWidth: "300px",
                        maxWidth: "500px",
                        boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1), ${toast.tone === "success" ? "0 0 30px rgba(16, 185, 129, 0.6), 0 0 60px rgba(16, 185, 129, 0.3)" :
                            toast.tone === "error" ? "0 0 30px rgba(244, 63, 94, 0.6), 0 0 60px rgba(244, 63, 94, 0.3)" :
                                toast.tone === "warning" ? "0 0 30px rgba(245, 158, 11, 0.6), 0 0 60px rgba(245, 158, 11, 0.3)" :
                                    "0 0 30px rgba(59, 130, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.3)"
                            }`,
                        animation: isVisible ? "slide-in 0.3s ease-out forwards" : "slide-out 0.3s ease-in forwards"
                    }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onPointerEnter={handleMouseEnter}
                    onPointerLeave={handleMouseLeave}
                >
                    <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                            {toast.tone === "success" && (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            )}
                            {toast.tone === "error" && (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            )}
                            {toast.tone === "warning" && (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            )}
                            {toast.tone === "info" && (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <div className="flex-1">
                            {toast.message}
                        </div>

                    </div>
                    <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-100 ${isPaused ? 'bg-yellow-400/80' : 'bg-white/80'}`}
                            style={{ width: `${(timeLeft / 3500) * 100}%` }}
                        />
                    </div>
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
}
