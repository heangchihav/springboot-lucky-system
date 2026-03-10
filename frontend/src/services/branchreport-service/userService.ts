import { apiFetch } from "@/services/httpClient";

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  fullName: string;
  active: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInfoPayload {
  username: string;
  fullName: string;
  password?: string;
  phone?: string;
  serviceIds?: number[];
}

export interface UpdateUserInfoPayload {
  username: string;
  email: string;
  fullName: string;
  phone?: string;
}

export interface BranchreportUserAssignment {
  id: number;
  userId: string;
  areaId?: string;
  areaName?: string;
  subAreaId?: string;
  subAreaName?: string;
  branchId?: string;
  branchName?: string;
  active: boolean;
  assignedAt: string;
  updatedAt: string;
  assignmentType: "AREA" | "SUB_AREA" | "BRANCH";
}

export interface AssignUserRequest {
  userId: string;
  areaId?: string;
  subAreaId?: string;
  branchId?: string;
}

export interface Branch {
  id: string;
  name: string;
  description?: string;
  areaId: string;
  subAreaId: string;
}

export const userService = {
  // User Info operations (handled by auth-service)
  async listUsers(): Promise<UserInfo[]> {
    const response = await apiFetch("/api/users");
    const result = await response.json();
    return result.data || [];
  },

  // BranchReport service specific users
  async listBranchReportUsers(): Promise<UserInfo[]> {
    const response = await apiFetch("/api/branchreport/users");
    const result = await response.json();
    return result || []; // BranchReport service returns users directly
  },

  async getUserServices(userId: string): Promise<any[]> {
    const response = await apiFetch(`/api/users/${userId}/services`);
    const result = await response.json();
    return result.data || [];
  },

  async createUser(payload: CreateUserInfoPayload & { serviceIds?: number[] }): Promise<UserInfo> {
    // Get current user ID from localStorage for auth-service
    const getUserId = (): string | null => {
      if (typeof window === "undefined") return null;
      const userStr = window.localStorage.getItem("user");
      if (!userStr) return null;
      try {
        const parsed = JSON.parse(userStr);
        return parsed?.id ?? null;
      } catch {
        return null;
      }
    };

    // Transform payload to match auth-service CreateUserRequest
    const createUserRequest = {
      username: payload.username,
      password: payload.password,
      fullName: payload.fullName,
      phone: payload.phone || null,
      serviceIds: payload.serviceIds && payload.serviceIds.length > 0 ? payload.serviceIds : undefined // Only send if provided
    };

    const currentUserId = getUserId();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add X-User-Id header if current user is available
    if (currentUserId) {
      headers["X-User-Id"] = currentUserId;
    }

    const response = await apiFetch("/api/users", {
      method: "POST",
      headers,
      body: JSON.stringify(createUserRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("User creation failed - Response:", errorText);
      throw new Error(`User creation failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Try to parse JSON with better error handling
    let result;
    try {
      const responseText = await response.text();

      if (!responseText) {
        throw new Error("Empty response from server");
      }

      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      throw new Error("Invalid JSON response from server");
    }

    return result; // Auth-service returns user directly, not wrapped in data property
  },

  async updateUser(id: string, payload: UpdateUserInfoPayload): Promise<UserInfo> {
    const response = await apiFetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    return result.data;
  },

  async deleteUser(id: string): Promise<void> {
    await apiFetch(`/api/users/${id}`, {
      method: "DELETE",
    });
  },

  // User assignment operations
  async getUserAssignments(userId: string): Promise<BranchreportUserAssignment[]> {
    const response = await apiFetch(`/api/branchreport/users/${userId}/assignments`);
    const result = await response.json();
    return result.data || [];
  },

  async assignUserToHierarchy(request: AssignUserRequest): Promise<BranchreportUserAssignment> {
    const response = await apiFetch("/api/branchreport/users/user-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    const result = await response.json();
    return result.data;
  },

  async updateUserAssignment(assignmentId: number, request: AssignUserRequest): Promise<BranchreportUserAssignment> {
    const response = await apiFetch(`/api/branchreport/users/user-assignments/${assignmentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    const result = await response.json();
    return result.data;
  },

  async deleteUserAssignment(assignmentId: number): Promise<void> {
    await apiFetch(`/api/branchreport/users/user-assignments/${assignmentId}`, {
      method: "DELETE",
    });
  },

  // User activation/deactivation methods (soft delete)
  async activateUser(id: string): Promise<UserInfo> {
    const response = await apiFetch(`/api/users/${id}/activate`, {
      method: "PUT",
    });
    const result = await response.json();
    return result.data || result;
  },

  async deactivateUser(id: string): Promise<UserInfo> {
    const response = await apiFetch(`/api/users/${id}/deactivate`, {
      method: "PUT",
    });
    const result = await response.json();
    return result.data || result;
  },
};
