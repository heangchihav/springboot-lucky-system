import { API_BASE_URL } from "@/config/env";

export interface CallUser {
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

class CallUserService {
    private getAuthHeaders() {
        return {
            "Content-Type": "application/json",
        };
    }

    async getCallUsers(): Promise<CallUser[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/calls/users`, {
                headers: this.getAuthHeaders(),
                credentials: "include",
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
            console.error("Error fetching call users:", error);
            throw error;
        }
    }
}

export const callUserService = new CallUserService();
