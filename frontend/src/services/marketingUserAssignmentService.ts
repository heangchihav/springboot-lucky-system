import { API_BASE_URL } from "@/config/env";
import { apiFetch } from "@/services/httpClient";

const API_BASE = `${API_BASE_URL}/api`;

const getAuthHeaders = () => {
    return {
        "Content-Type": "application/json",
    };
};

export interface MarketingUserAssignment {
    id: number;
    userId: number;
    areaId?: number;
    areaName?: string;
    subAreaId?: number;
    subAreaName?: string;
    branchId?: number;
    branchName?: string;
    active: boolean;
    assignedAt: string;
    updatedAt: string;
    assignmentType: "AREA" | "SUB_AREA" | "BRANCH";
}

export interface AssignUserRequest {
    userId: number;
    areaId?: number;
    subAreaId?: number;
    branchId?: number;
}

class MarketingUserAssignmentService {
    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `HTTP error! status: ${response.status}, message: ${errorText}`,
            );
        }
        return response.json();
    }

    async getAllAssignments(): Promise<MarketingUserAssignment[]> {
        const response = await apiFetch(
            `/api/marketing/user-assignments`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            },
        );

        return this.handleResponse<MarketingUserAssignment[]>(response);
    }

    async getAssignmentById(id: number): Promise<MarketingUserAssignment> {
        const response = await apiFetch(
            `/api/marketing/user-assignments/${id}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            },
        );

        return this.handleResponse<MarketingUserAssignment>(response);
    }

    async getUserAssignments(userId: number): Promise<MarketingUserAssignment[]> {
        const response = await apiFetch(
            `/api/marketing/user-assignments/user/${userId}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            },
        );

        return this.handleResponse<MarketingUserAssignment[]>(response);
    }

    async getAssignmentsByArea(areaId: number): Promise<MarketingUserAssignment[]> {
        const response = await apiFetch(
            `/api/marketing/user-assignments/area/${areaId}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            },
        );

        return this.handleResponse<MarketingUserAssignment[]>(response);
    }

    async getAssignmentsBySubArea(subAreaId: number): Promise<MarketingUserAssignment[]> {
        const response = await apiFetch(
            `/api/marketing/user-assignments/sub-area/${subAreaId}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            },
        );

        return this.handleResponse<MarketingUserAssignment[]>(response);
    }

    async getAssignmentsByBranch(branchId: number): Promise<MarketingUserAssignment[]> {
        const response = await apiFetch(
            `/api/marketing/user-assignments/branch/${branchId}`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            },
        );

        return this.handleResponse<MarketingUserAssignment[]>(response);
    }

    async assignUser(request: AssignUserRequest): Promise<MarketingUserAssignment> {
        const response = await apiFetch(
            `/api/marketing/user-assignments/assign`,
            {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(request),
            },
        );

        return this.handleResponse<MarketingUserAssignment>(response);
    }

    async removeAssignment(assignmentId: number, userId: number): Promise<MarketingUserAssignment> {
        const response = await apiFetch(
            `/api/marketing/user-assignments/remove/${assignmentId}?userId=${userId}`,
            {
                method: "POST",
                headers: getAuthHeaders(),
            },
        );

        return this.handleResponse<MarketingUserAssignment>(response);
    }

    async deleteAssignment(id: number): Promise<void> {
        const response = await apiFetch(
            `/api/marketing/user-assignments/${id}`,
            {
                method: "DELETE",
                headers: getAuthHeaders(),
            },
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `HTTP error! status: ${response.status}, message: ${errorText}`,
            );
        }
    }

    async getAssignmentCountForUser(userId: number): Promise<number> {
        const response = await apiFetch(
            `/api/marketing/user-assignments/user/${userId}/count`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            },
        );

        return this.handleResponse<number>(response);
    }

    async getAssignmentCountForArea(areaId: number): Promise<number> {
        const response = await apiFetch(
            `/api/marketing/user-assignments/area/${areaId}/count`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            },
        );

        return this.handleResponse<number>(response);
    }

    async getAssignmentCountForSubArea(subAreaId: number): Promise<number> {
        const response = await apiFetch(
            `/api/marketing/user-assignments/sub-area/${subAreaId}/count`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            },
        );

        return this.handleResponse<number>(response);
    }

    async getAssignmentCountForBranch(branchId: number): Promise<number> {
        const response = await apiFetch(
            `/api/marketing/user-assignments/branch/${branchId}/count`,
            {
                method: "GET",
                headers: getAuthHeaders(),
            },
        );

        return this.handleResponse<number>(response);
    }
}

export const marketingUserAssignmentService = new MarketingUserAssignmentService();
