import { API_BASE_URL } from "@/config/env";

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
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            credentials: "include",
        });

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
