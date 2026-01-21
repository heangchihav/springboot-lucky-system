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

    async toggleUserStatus(userId: number): Promise<CallUser> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/calls/users/${userId}/toggle-status`, {
                method: "PATCH",
                headers: this.getAuthHeaders(),
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const updatedUser = await response.json();

            // Map enabled to active for consistency
            return {
                ...updatedUser,
                active: updatedUser.enabled,
            };
        } catch (error) {
            console.error("Error toggling user status:", error);
            throw error;
        }
    }

    async updateUser(id: number, userData: Partial<CallUser>): Promise<CallUser> {
        try {
            console.log("=== Call Service Update User Debug ===");
            console.log("Updating user ID:", id);
            console.log("User data being sent:", userData);
            console.log("Request URL:", `${API_BASE_URL}/api/calls/users/${id}`);

            const response = await fetch(`${API_BASE_URL}/api/calls/users/${id}`, {
                method: "PUT",
                headers: this.getAuthHeaders(),
                credentials: "include",
                body: JSON.stringify(userData),
            });

            console.log("Response status:", response.status);
            console.log("Response ok:", response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.log("Error response text:", errorText);
                const errorData = this.safeJsonParse?.(errorText) || {};
                throw new Error(
                    errorData?.message || `HTTP error! status: ${response.status}`,
                );
            }

            const responseText = await response.text();
            const parsed = this.safeJsonParse?.(responseText) || JSON.parse(responseText);

            console.log("Updated user response:", parsed);

            // Handle the new success response format
            if (parsed.success) {
                // Return a mock user object with the updated data
                return {
                    ...userData,
                    id: id,
                    active: userData.enabled !== false, // Default to true if not specified
                } as CallUser;
            }

            // Fallback to the original response parsing
            // Map enabled to active for consistency
            return {
                ...parsed,
                active: parsed.enabled,
            };
        } catch (error) {
            console.error("Error updating call user:", error);
            throw error;
        }
    }

    private safeJsonParse(text: string): any {
        try {
            return JSON.parse(text);
        } catch {
            return null;
        }
    }
}

export const callUserService = new CallUserService();
