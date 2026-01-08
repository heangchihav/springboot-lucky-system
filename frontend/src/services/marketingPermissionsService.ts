import { API_BASE_URL } from "@/config/env";
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

class MarketingPermissionsService {
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
        const response = await fetch(`${API_BASE_URL}/api/marketing/permissions`, {
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
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
                // Sort groups: Dashboard, Areas, Sub-Areas, Branches, Competitors, Problems, VIP Members, Goods Shipments, Permissions, Other
                const order = [
                    "Dashboard",
                    "Areas",
                    "Sub-Areas",
                    "Branches",
                    "Competitors",
                    "Problems",
                    "VIP Members",
                    "Goods Shipments",
                    "Permissions Management",
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
            Dashboard: "Dashboard and analytics access",
            Areas: "Management of marketing areas",
            "Sub-Areas": "Management of marketing sub-areas",
            Branches: "Management of marketing branches",
            Competitors: "Competitor information management",
            Problems: "Marketing problem tracking",
            "VIP Members": "VIP member management",
            "Goods Shipments": "Goods shipment records management",
            "Permissions Management": "Role and permission administration",
            Other: "Miscellaneous permissions",
        };
        return descriptions[groupName] || "Permission group";
    }

    // Roles
    async getRoles(): Promise<Role[]> {
        const response = await fetch(`${API_BASE_URL}/api/marketing/roles`, {
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });
        return this.handleResponse<Role[]>(response);
    }

    async createRole(role: CreateRoleRequest): Promise<Role> {
        const response = await fetch(`${API_BASE_URL}/api/marketing/roles`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(role),
        });
        return this.handleResponse<Role>(response);
    }

    async updateRole(id: number, role: UpdateRoleRequest): Promise<Role> {
        const response = await fetch(`${API_BASE_URL}/api/marketing/roles/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(role),
        });
        return this.handleResponse<Role>(response);
    }

    async deleteRole(id: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/api/marketing/roles/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
    }

    // Users
    async getUsers(): Promise<User[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users`, {
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });
            return this.handleResponse<User[]>(response);
        } catch (error) {
            console.error("Error fetching users:", error);
            return [];
        }
    }

    async assignUsersToRole(roleId: number, userIds: number[]): Promise<void> {
        const response = await fetch(
            `${API_BASE_URL}/api/marketing/roles/${roleId}/assign-users`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ userIds }),
            },
        );
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        // Handle empty response (204 No Content or 200 OK with empty body)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            await response.json(); // Parse JSON if there's a response body
        }
    }

    async removeUsersFromRole(roleId: number, userIds: number[]): Promise<void> {
        const response = await fetch(
            `${API_BASE_URL}/api/marketing/roles/${roleId}/remove-users`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ userIds }),
            },
        );
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        // Handle empty response (204 No Content or 200 OK with empty body)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            await response.json(); // Parse JSON if there's a response body
        }
    }

    async getUsersInRole(roleId: number): Promise<User[]> {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/marketing/roles/${roleId}/users`,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                },
            );
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
            const response = await fetch(
                `${API_BASE_URL}/api/marketing/permissions/user/${userId}/check/${permissionCode}`,
                {
                    headers: this.getAuthHeaders(),
                    credentials: "include",
                },
            );
            const result = await this.handleResponse<{ hasPermission: boolean }>(
                response,
            );
            return result.hasPermission;
        } catch (error) {
            console.error("Error checking permission:", error);
            return false;
        }
    }
}

export const marketingPermissionsService = new MarketingPermissionsService();
