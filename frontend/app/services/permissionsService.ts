const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

import { User } from './userService'

export interface Permission {
  id: number
  code: string
  name: string
  description: string
  active: boolean
  menuGroup?: string
  menuNumber?: string
  createdAt?: string
  updatedAt?: string
}

export interface PermissionGroup {
  id: string
  name: string
  description: string
  menuNumber: string
  permissions: Permission[]
}

export interface Role {
  id: number
  name: string
  description: string
  permissions: Permission[]
  userCount: number
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateRoleRequest {
  name: string
  description: string
  permissionCodes: string[]
}

export interface UpdateRoleRequest {
  name: string
  description: string
  permissionCodes: string[]
}

export interface AssignUsersRequest {
  userIds: number[]
}

class PermissionsService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }
    
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    }
    throw new Error('Invalid response format')
  }

  // Permissions
  async getPermissions(): Promise<Permission[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/calls/permissions`, {
        headers: {
          'Content-Type': 'application/json'
        },
      })
      return this.handleResponse<Permission[]>(response)
    } catch (error) {
      console.log('Backend permissions endpoint not available, using mock data')
      // Return structured mock data with menu grouping and numbering aligned with menuConfig
      return [
        // 1. Dashboard Permissions (Menu 1)
        { id: 1, code: 'menu.1.view', name: 'View Dashboard', description: 'Can view call service dashboard', active: true, menuGroup: 'Dashboard', menuNumber: '1.1' },
        { id: 2, code: 'menu.1.analytics', name: 'View Analytics', description: 'Can view dashboard analytics and metrics', active: true, menuGroup: 'Dashboard', menuNumber: '1.2' },
        
        // 2. Area & Branch Permissions (Menu 2)
        { id: 3, code: 'menu.2.view', name: 'View Areas & Branches', description: 'Can view area and branch information', active: true, menuGroup: 'Area & Branch', menuNumber: '2.1' },
        { id: 4, code: 'menu.2.area.create', name: 'Create Areas', description: 'Can create new areas', active: true, menuGroup: 'Area & Branch', menuNumber: '2.2' },
        { id: 5, code: 'menu.2.area.edit', name: 'Edit Areas', description: 'Can edit existing areas', active: true, menuGroup: 'Area & Branch', menuNumber: '2.3' },
        { id: 6, code: 'menu.2.area.delete', name: 'Delete Areas', description: 'Can delete areas', active: true, menuGroup: 'Area & Branch', menuNumber: '2.4' },
        { id: 7, code: 'menu.2.branch.create', name: 'Create Branches', description: 'Can create new branches', active: true, menuGroup: 'Area & Branch', menuNumber: '2.5' },
        { id: 8, code: 'menu.2.branch.edit', name: 'Edit Branches', description: 'Can edit existing branches', active: true, menuGroup: 'Area & Branch', menuNumber: '2.6' },
        { id: 9, code: 'menu.2.branch.delete', name: 'Delete Branches', description: 'Can delete branches', active: true, menuGroup: 'Area & Branch', menuNumber: '2.7' },
        
        // 3. Reports Permissions (Menu 3)
        { id: 10, code: 'menu.3.view', name: 'View Reports', description: 'Can view call reports', active: true, menuGroup: 'Reports', menuNumber: '3.1' },
        { id: 11, code: 'menu.3.export', name: 'Export Reports', description: 'Can export call reports', active: true, menuGroup: 'Reports', menuNumber: '3.2' },
        { id: 12, code: 'menu.3.analytics', name: 'Advanced Analytics', description: 'Can access advanced analytics', active: true, menuGroup: 'Reports', menuNumber: '3.3' },
        
        // 4. Manage Users Permissions (Menu 4)
        { id: 13, code: 'menu.4.view', name: 'View Users', description: 'Can view user information', active: true, menuGroup: 'User Management', menuNumber: '4.1' },
        { id: 14, code: 'menu.4.create', name: 'Create Users', description: 'Can create new users', active: true, menuGroup: 'User Management', menuNumber: '4.2' },
        { id: 15, code: 'menu.4.edit', name: 'Edit Users', description: 'Can edit user information', active: true, menuGroup: 'User Management', menuNumber: '4.3' },
        { id: 16, code: 'menu.4.delete', name: 'Delete Users', description: 'Can delete users', active: true, menuGroup: 'User Management', menuNumber: '4.4' },
        { id: 17, code: 'menu.4.assign', name: 'Assign Users', description: 'Can assign users to branches/roles', active: true, menuGroup: 'User Management', menuNumber: '4.5' },
        
        // 5. Permissions Management Permissions (Menu 5)
        { id: 18, code: 'menu.5.view', name: 'View Permissions', description: 'Can view permission settings', active: true, menuGroup: 'Permissions Management', menuNumber: '5.1' },
        { id: 19, code: 'menu.5.manage', name: 'Manage Permissions', description: 'Can manage roles and permissions', active: true, menuGroup: 'Permissions Management', menuNumber: '5.2' },
        { id: 20, code: 'menu.5.assign', name: 'Assign Permissions', description: 'Can assign permissions to roles', active: true, menuGroup: 'Permissions Management', menuNumber: '5.3' }
      ]
    }
  }

  async getPermissionGroups(): Promise<PermissionGroup[]> {
    const permissions = await this.getPermissions()
    
    // Group permissions by menu number (extract from code like "menu.1.view", "menu.2.view", etc.)
    const grouped = permissions.reduce((acc, permission) => {
      // Extract menu number from permission code (e.g., "menu.1.view" -> "1")
      const menuNumberMatch = permission.code.match(/^menu\.(\d+)\./)
      if (menuNumberMatch) {
        const menuNumber = menuNumberMatch[1]
        if (!acc[menuNumber]) {
          acc[menuNumber] = []
        }
        acc[menuNumber].push(permission)
      }
      return acc
    }, {} as Record<string, Permission[]>)

    // Convert to PermissionGroup array with proper menu numbering
    return Object.entries(grouped)
      .sort(([a], [b]) => parseInt(a) - parseInt(b)) // Sort by menu number
      .map(([menuNumber, groupPermissions]) => {
        // Get group name from first permission in the group
        const groupName = groupPermissions[0]?.menuGroup || 'Menu ' + menuNumber
        return {
          id: `menu-${menuNumber}`,
          name: groupName,
          description: this.getGroupDescription(groupName),
          menuNumber: menuNumber,
          permissions: groupPermissions.sort((a, b) => (a.menuNumber || '').localeCompare(b.menuNumber || ''))
        }
      })
  }

  private getGroupDescription(groupName: string): string {
    const descriptions: Record<string, string> = {
      'Dashboard': 'Menu 1 - Access to dashboard and analytics features',
      'Area & Branch': 'Menu 2 - Management of geographical areas and service branches',
      'Reports': 'Menu 3 - Access to reports and data analytics',
      'User Management': 'Menu 4 - User account and access management',
      'Permissions Management': 'Menu 5 - Role and permission administration',
      'Other': 'Miscellaneous permissions'
    }
    return descriptions[groupName] || 'Permission group'
  }

  // Roles
  async getRoles(): Promise<Role[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/calls/roles`, {
        headers: {
          'Content-Type': 'application/json'
        },
      })
      return this.handleResponse<Role[]>(response)
    } catch (error) {
      console.log('Backend roles endpoint not available, using mock data')
      // Return mock data for now
      const permissions = await this.getPermissions()
      return [
        {
          id: 1,
          name: 'Normal Staff',
          description: 'Basic staff with limited permissions',
          permissions: await this.getPermissions().then(p => p.filter(perm => 
            ['menu.1.view', 'menu.2.view', 'menu.3.view', 'menu.4.view'].includes(perm.code)
          )),
          userCount: 5,
          active: true
        },
        {
          id: 2,
          name: 'Branch Manager',
          description: 'Can manage branches and view reports',
          permissions: await this.getPermissions().then(p => p.filter(perm => 
            perm.code.startsWith('menu.2') || ['menu.1.view', 'menu.3.view', 'menu.4.view'].includes(perm.code)
          )),
          userCount: 3,
          active: true
        },
        {
          id: 3,
          name: 'Call Center Admin',
          description: 'Full access to call operations and user management',
          permissions: await this.getPermissions().then(p => p.filter(perm => 
            !perm.code.includes('delete') || perm.code.startsWith('menu.')
          )),
          userCount: 2,
          active: true
        }
      ]
    }
  }

  async createRole(role: CreateRoleRequest): Promise<Role> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/calls/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(role),
      })
      return this.handleResponse<Role>(response)
    } catch (error) {
      console.log('Backend create role endpoint not available, using mock response')
      // Return mock response
      const permissions = await this.getPermissions()
      return {
        id: Date.now(),
        name: role.name,
        description: role.description,
        permissions: permissions.filter(p => role.permissionCodes.includes(p.code)),
        userCount: 0,
        active: true
      }
    }
  }

  async updateRole(id: number, role: UpdateRoleRequest): Promise<Role> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/calls/roles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(role),
      })
      return this.handleResponse<Role>(response)
    } catch (error) {
      console.log('Backend update role endpoint not available, using mock response')
      // Return mock response
      const permissions = await this.getPermissions()
      return {
        id,
        name: role.name,
        description: role.description,
        permissions: permissions.filter(p => role.permissionCodes.includes(p.code)),
        userCount: 0,
        active: true
      }
    }
  }

  async deleteRole(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/calls/roles/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
      })
      return this.handleResponse<void>(response)
    } catch (error) {
      console.log('Backend delete role endpoint not available, using mock response')
      // Mock successful deletion
    }
  }

  // Users
  async getUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/calls/users`, {
        headers: {
          'Content-Type': 'application/json'
        },
      })
      return this.handleResponse<User[]>(response)
    } catch (error) {
      console.log('Backend users endpoint not available, using mock data')
      // Return mock data for now
      return [
        { id: 1, username: 'john.doe', fullName: 'John Doe', phone: '123-456-7890', active: true, enabled: true, accountLocked: false, createdAt: '2025-01-01T00:00:00Z' },
        { id: 2, username: 'jane.smith', fullName: 'Jane Smith', phone: '234-567-8901', active: true, enabled: true, accountLocked: false, createdAt: '2025-01-01T00:00:00Z' },
        { id: 3, username: 'bob.wilson', fullName: 'Bob Wilson', phone: '345-678-9012', active: true, enabled: true, accountLocked: false, createdAt: '2025-01-01T00:00:00Z' },
        { id: 4, username: 'alice.brown', fullName: 'Alice Brown', phone: '456-789-0123', active: true, enabled: true, accountLocked: false, createdAt: '2025-01-01T00:00:00Z' },
        { id: 5, username: 'charlie.davis', fullName: 'Charlie Davis', phone: '567-890-1234', active: true, enabled: true, accountLocked: false, createdAt: '2025-01-01T00:00:00Z' },
      ]
    }
  }

  async assignUsersToRole(roleId: number, userIds: number[]): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/calls/roles/${roleId}/assign-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userIds }),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      // Handle empty response (204 No Content or 200 OK with empty body)
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        await response.json() // Parse JSON if there's a response body
      }
      // Otherwise, the response is empty and that's expected
    } catch (error) {
      console.log('Backend assign users endpoint not available, using mock response')
      // Mock successful assignment
    }
  }

  async removeUsersFromRole(roleId: number, userIds: number[]): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/calls/roles/${roleId}/remove-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userIds }),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      // Handle empty response (204 No Content or 200 OK with empty body)
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        await response.json() // Parse JSON if there's a response body
      }
      // Otherwise, the response is empty and that's expected
    } catch (error) {
      console.error('Error removing users from role:', error)
      throw error
    }
  }

  async getUsersInRole(roleId: number): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/calls/roles/${roleId}/users`, {
        headers: {
          'Content-Type': 'application/json'
        },
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      return this.handleResponse<User[]>(response)
    } catch (error) {
      console.error('Error fetching users in role:', error)
      return []
    }
  }

  // Permission checking
  async checkUserPermission(userId: number, permissionCode: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/calls/permissions/check?userId=${userId}&permission=${permissionCode}`, {
        headers: this.getAuthHeaders(),
      })
      const result = await this.handleResponse<{ hasPermission: boolean }>(response)
      return result.hasPermission
    } catch (error) {
      console.error('Error checking permission:', error)
      return false
    }
  }

  async getUserMenuPermissions(userId: number): Promise<Record<string, boolean>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/calls/permissions/frontend-menu`, {
        headers: { ...this.getAuthHeaders(), 'X-User-Id': userId.toString() },
      })
      return this.handleResponse<Record<string, boolean>>(response)
    } catch (error) {
      console.error('Error fetching menu permissions:', error)
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
      }
    }
  }
}

export const permissionsService = new PermissionsService()
