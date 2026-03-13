import { API_BASE_URL } from "@/config/env";
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

class BranchreportPermissionsService {
    private getAuthHeaders() {
        return {
            "Content-Type": "application/json",
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
        const response = await apiFetch(`/api/branchreport/permissions`, {
            headers: this.getAuthHeaders(),
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
            .map(([id, permissions]) => ({
                id,
                name: id,
                description: `${id} permissions for branch report service`,
                menuNumber: permissions[0]?.menuNumber || "0",
                permissions,
            }));
    }

    // Roles
    async getRoles(): Promise<Role[]> {
        const response = await apiFetch(`/api/branchreport/permissions/roles`, {
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse<Role[]>(response);
    }

    async createRole(request: CreateRoleRequest): Promise<Role> {
        const response = await apiFetch(`/api/branchreport/permissions/roles`, {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(request),
        });
        return this.handleResponse<Role>(response);
    }

    async updateRole(roleId: number, request: UpdateRoleRequest): Promise<Role> {
        const response = await apiFetch(`/api/branchreport/permissions/roles/${roleId}`, {
            method: "PUT",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(request),
        });
        return this.handleResponse<Role>(response);
    }

    async deleteRole(roleId: number): Promise<void> {
        const response = await apiFetch(`/api/branchreport/permissions/roles/${roleId}`, {
            method: "DELETE",
            headers: this.getAuthHeaders(),
        });
        if (!response.ok) {
            throw new Error(`Failed to delete role: ${response.status}`);
        }
    }

    // User assignments
    async getUsersInRole(roleId: number): Promise<User[]> {
        const response = await apiFetch(`/api/branchreport/permissions/roles/${roleId}/users`, {
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse<User[]>(response);
    }

    async assignUsersToRole(roleId: number, userIds: number[]): Promise<void> {
        const response = await apiFetch(`/api/branchreport/permissions/roles/${roleId}/users`, {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ userIds }),
        });
        if (!response.ok) {
            throw new Error(`Failed to assign users to role: ${response.status}`);
        }
    }

    async removeUsersFromRole(roleId: number, userIds: number[]): Promise<void> {
        const response = await apiFetch(`/api/branchreport/permissions/roles/${roleId}/users`, {
            method: "DELETE",
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ userIds }),
        });
        if (!response.ok) {
            throw new Error(`Failed to remove users from role: ${response.status}`);
        }
    }

    // User permissions for current user
    async getUserPermissions(userId: number): Promise<{ permissionCode: string }[]> {
        const response = await apiFetch(`/api/branchreport/permissions/user/${userId}`, {
            headers: this.getAuthHeaders(),
        });
        return this.handleResponse<{ permissionCode: string }[]>(response);
    }
}

export const branchreportPermissionsService = new BranchreportPermissionsService();
