import { apiFetch } from "@/services/httpClient";

/**
 * User utility functions for managing user ID and authentication
 */

export const getStoredUserId = (): number | null => {
    if (typeof window === "undefined") {
        return null;
    }
    const userId = localStorage.getItem("currentUserId");
    return userId ? parseInt(userId, 10) : null;
};

export const fetchAndCacheUserId = async (): Promise<number | null> => {
    try {
        const response = await apiFetch("/api/auth/me", { method: "GET" });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        const userId = data.id;

        if (typeof window !== "undefined" && userId) {
            localStorage.setItem("currentUserId", userId.toString());
        }

        return userId;
    } catch (error) {
        console.error("Error fetching user ID:", error);
        return null;
    }
};
