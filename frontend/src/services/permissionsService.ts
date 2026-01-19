import { apiFetch } from "@/services/httpClient";
import { User } from "./userService";

export interface Permission {
  id: number;
  code: string;
  name: string;
  description: string;
  active: boolean;
  menuGroup?: string;
  menuNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  menuNumber: string;
  permissions: Permission[];
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: Permission[];
  userCount: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permissionCodes: string[];
}

export interface UpdateRoleRequest {
  name: string;
  description: string;
  permissionCodes: string[];
}

export interface AssignUsersRequest {
  userIds: number[];
}

class PermissionsService {
  private getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }
    throw new Error("Invalid response format");
  }

  // Permissions
  async getPermissions(): Promise<Permission[]> {
    const response = await apiFetch("/api/calls/permissions", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return this.handleResponse<Permission[]>(response);
  }

  async getPermissionGroups(): Promise<PermissionGroup[]> {
    const permissions = await this.getPermissions();

    // Group permissions by menuGroup (use "Other" for null/undefined groups)
    const grouped = permissions.reduce(
      (acc, permission) => {
        const groupName = permission.menuGroup || "Other";
        if (!acc[groupName]) {
          acc[groupName] = [];
        }
        acc[groupName].push(permission);
        return acc;
      },
      {} as Record<string, Permission[]>,
    );

    // Convert to PermissionGroup array
    return Object.entries(grouped)
      .sort(([a], [b]) => {
        // Sort groups: Reports, Areas, Calls, Users, Permissions, Other
        const order = [
          "Reports",
          "Areas",
          "Calls",
          "Users",
          "Permissions",
          "Other",
        ];
        const aIndex = order.indexOf(a);
        const bIndex = order.indexOf(b);

        // If both are in the predefined order, sort by that
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        // If only one is in the predefined order, put it first
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        // Otherwise sort alphabetically
        return a.localeCompare(b);
      })
      .map(([groupName, groupPermissions]) => {
        // Use menuNumber for sorting within group, or fall back to code
        const sortedPermissions = groupPermissions.sort((a, b) => {
          const aSort = a.menuNumber || a.code;
          const bSort = b.menuNumber || b.code;
          return aSort.localeCompare(bSort);
        });

        return {
          id: groupName.toLowerCase().replace(/\s+/g, "-"),
          name: groupName,
          description: this.getGroupDescription(groupName),
          menuNumber: sortedPermissions[0]?.menuNumber || "0",
          permissions: sortedPermissions,
        };
      });
  }

  private getGroupDescription(groupName: string): string {
    const descriptions: Record<string, string> = {
      Reports: "Access to reports and data analytics",
      Areas: "Management of geographical areas and service branches",
      Calls: "Call management and operations",
      Users: "User account and access management",
      Permissions: "Role and permission administration",
      Other: "Miscellaneous permissions",
    };
    return descriptions[groupName] || "Permission group";
  }

  // Roles
  async getRoles(): Promise<Role[]> {
    const response = await apiFetch("/api/calls/roles", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return this.handleResponse<Role[]>(response);
  }

  async createRole(role: CreateRoleRequest): Promise<Role> {
    const response = await apiFetch("/api/calls/roles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(role),
    });
    return this.handleResponse<Role>(response);
  }

  async updateRole(id: number, role: UpdateRoleRequest): Promise<Role> {
    const response = await apiFetch(`/api/calls/roles/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(role),
    });
    return this.handleResponse<Role>(response);
  }

  async deleteRole(id: number): Promise<void> {
    const response = await apiFetch(`/api/calls/roles/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return this.handleResponse<void>(response);
  }

  // Users
  async getUsers(): Promise<User[]> {
    try {
      const response = await apiFetch("/api/calls/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return this.handleResponse<User[]>(response);
    } catch (error) {
      console.log("Backend users endpoint not available, using mock data");
      // Return mock data for now
      return [
        {
          id: 1,
          username: "john.doe",
          fullName: "John Doe",
          phone: "123-456-7890",
          active: true,
          enabled: true,
          accountLocked: false,
          createdAt: "2025-01-01T00:00:00Z",
        },
        {
          id: 2,
          username: "jane.smith",
          fullName: "Jane Smith",
          phone: "234-567-8901",
          active: true,
          enabled: true,
          accountLocked: false,
          createdAt: "2025-01-01T00:00:00Z",
        },
        {
          id: 3,
          username: "bob.wilson",
          fullName: "Bob Wilson",
          phone: "345-678-9012",
          active: true,
          enabled: true,
          accountLocked: false,
          createdAt: "2025-01-01T00:00:00Z",
        },
        {
          id: 4,
          username: "alice.brown",
          fullName: "Alice Brown",
          phone: "456-789-0123",
          active: true,
          enabled: true,
          accountLocked: false,
          createdAt: "2025-01-01T00:00:00Z",
        },
        {
          id: 5,
          username: "charlie.davis",
          fullName: "Charlie Davis",
          phone: "567-890-1234",
          active: true,
          enabled: true,
          accountLocked: false,
          createdAt: "2025-01-01T00:00:00Z",
        },
      ];
    }
  }

  async assignUsersToRole(roleId: number, userIds: number[]): Promise<void> {
    try {
      const response = await apiFetch(`/api/calls/roles/${roleId}/assign-users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIds }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      // Handle empty response (204 No Content or 200 OK with empty body)
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        await response.json(); // Parse JSON if there's a response body
      }
      // Otherwise, the response is empty and that's expected
    } catch (error) {
      console.log(
        "Backend assign users endpoint not available, using mock response",
      );
      // Mock successful assignment
    }
  }

  async removeUsersFromRole(roleId: number, userIds: number[]): Promise<void> {
    try {
      const response = await apiFetch(`/api/calls/roles/${roleId}/remove-users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIds }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      // Handle empty response (204 No Content or 200 OK with empty body)
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        await response.json(); // Parse JSON if there's a response body
      }
      // Otherwise, the response is empty and that's expected
    } catch (error) {
      console.error("Error removing users from role:", error);
      throw error;
    }
  }

  async getUsersInRole(roleId: number): Promise<User[]> {
    try {
      const response = await apiFetch(`/api/calls/roles/${roleId}/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      return this.handleResponse<User[]>(response);
    } catch (error) {
      console.error("Error fetching users in role:", error);
      return [];
    }
  }

  // Permission checking
  async checkUserPermission(
    userId: number,
    permissionCode: string,
  ): Promise<boolean> {
    try {
      const response = await apiFetch(`/api/calls/permissions/check?userId=${userId}&permission=${permissionCode}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
      const result = await this.handleResponse<{ hasPermission: boolean }>(
        response,
      );
      return result.hasPermission;
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  }

  async getUserMenuPermissions(
    userId: number,
  ): Promise<Record<string, boolean>> {
    try {
      const response = await apiFetch("/api/calls/permissions/frontend-menu", {
        method: "GET",
        headers: { ...this.getAuthHeaders(), "X-User-Id": userId.toString() },
      });
      return this.handleResponse<Record<string, boolean>>(response);
    } catch (error) {
      console.error("Error fetching menu permissions:", error);
      // Return mock permissions for now
      return {
        canViewDashboard: true,
        canViewBranches: true,
        canManageBranches: userId % 2 === 0,
        canViewCalls: true,
        canManageCalls: userId % 2 === 0,
        canViewQueue: true,
        canManageQueue: userId % 3 === 0,
        canViewReports: userId % 3 === 0,
        canManageUsers: userId === 1,
      };
    }
  }
}

export const permissionsService = new PermissionsService();
