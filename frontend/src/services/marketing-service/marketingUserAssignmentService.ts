import { API_BASE_URL } from "@/config/env";
import { apiFetch } from "@/services/httpClient";

export interface MarketingUserAssignment {
    id: number;
    userId: number;
    areaId?: number;
    areaName?: string;
    subAreaId?: number;
    subAreaName?: string;
    branchId?: number;
    branchName?: string;
    assignmentType: "AREA" | "SUB_AREA" | "BRANCH";
    active: boolean;
    assignedAt: string;
    updatedAt?: string;
}

class MarketingUserAssignmentService {
    private getAuthHeaders() {
        return {
            "Content-Type": "application/json",
        };
    }

    async getUserAssignments(): Promise<MarketingUserAssignment[]> {
        try {
            const response = await apiFetch(`/api/marketing/user-assignments/my-assignments`, {
                headers: this.getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching user assignments:", error);
            throw error;
        }
    }

    async getAllAssignments(): Promise<MarketingUserAssignment[]> {
        try {
            const response = await apiFetch(`/api/marketing/user-assignments`, {
                headers: this.getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching all assignments:", error);
            throw error;
        }
    }
}

export const marketingUserAssignmentService = new MarketingUserAssignmentService();
