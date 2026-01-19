// Utility to get version from service worker
export const getServiceWorkerVersion = async (): Promise<string> => {
    try {
        const response = await fetch('/sw.js', { cache: 'no-cache' });
        const swText = await response.text();
        const versionMatch = swText.match(/const CACHE_VERSION = '([^']+)'/);
        return versionMatch ? versionMatch[1] : 'v1.0.2';
    } catch (error) {
        console.error('Failed to fetch service worker version:', error);
        return 'v1.0.2';
    }
};

export const getCurrentAppVersion = (): string => {
    // Get current version from localStorage or default
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('app-version');
        // For testing: if no version stored, return v1.0.1 to simulate update needed
        return stored || 'v1.0.1';
    }
    return 'v1.0.1';
};

export const setCurrentAppVersion = (version: string): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('app-version', version);
    }
};

// Check if update is available
export const checkForUpdate = async (): Promise<{ hasUpdate: boolean; currentVersion: string; newVersion: string }> => {
    const currentVersion = getCurrentAppVersion();
    const newVersion = await getServiceWorkerVersion();

    console.log('Version check:', { currentVersion, newVersion });

    return {
        hasUpdate: currentVersion !== newVersion,
        currentVersion,
        newVersion
    };
};
