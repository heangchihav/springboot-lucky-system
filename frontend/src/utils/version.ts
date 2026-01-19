// Utility to get version from service worker
export const getServiceWorkerVersion = async (): Promise<string> => {
    try {
        const response = await fetch('/sw.js');
        const swText = await response.text();
        const versionMatch = swText.match(/const CACHE_VERSION = '([^']+)'/);
        return versionMatch ? versionMatch[1] : 'v1.0.1';
    } catch (error) {
        console.error('Failed to fetch service worker version:', error);
        return 'v1.0.1';
    }
};

export const getCurrentAppVersion = (): string => {
    // Get current version from localStorage or default
    if (typeof window !== 'undefined') {
        return localStorage.getItem('app-version') || 'v1.0.0';
    }
    return 'v1.0.0';
};

export const setCurrentAppVersion = (version: string): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('app-version', version);
    }
};
