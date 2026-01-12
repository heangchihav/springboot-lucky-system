import { API_BASE_URL } from "@/config/env";
import { apiFetch } from "@/services/httpClient";

export interface MarketingUser {
    id: number;
    username: string;
    fullName: string;
    phone?: string;
    active: boolean;
    enabled: boolean;
    accountLocked: boolean;
    createdAt: string;
    updatedAt?: string;
}

class MarketingUserService {
    private getAuthHeaders() {
        return {
            "Content-Type": "application/json",
        };
    }

    async getMarketingUsers(): Promise<MarketingUser[]> {
        try {
            const response = await apiFetch(`/api/marketing/users`, {
                headers: this.getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const users = await response.json();

            // Map enabled to active for consistency
            return users.map((user: any) => ({
                ...user,
                active: user.enabled,
            }));
        } catch (error) {
            console.error("Error fetching marketing users:", error);
            throw error;
        }
    }
}

export const marketingUserService = new MarketingUserService();
