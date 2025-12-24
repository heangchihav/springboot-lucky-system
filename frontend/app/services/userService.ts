const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Import Service interface from serviceService
export interface Service {
  id: number
  code: string
  name: string
  description: string
  active: boolean
  createdAt: string
  updatedAt?: string
}

export interface User {
  id: number
  username: string
  fullName: string
  phone?: string
  active: boolean
  enabled: boolean
  accountLocked: boolean
  createdAt: string
  updatedAt?: string
}

export interface CreateUserRequest {
  username: string
  fullName: string
  password: string
  phone?: string
  serviceIds?: number[]
}

export interface UpdateUserRequest {
  fullName: string
  phone?: string
  serviceIds?: number[]
}

class UserService {
  private getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
    }
  }

  private mapUser(user: any): User {
    return {
      ...user,
      active: user.enabled,
    }
  }

  private mapUsers(users: any[]): User[] {
    return users.map((user) => this.mapUser(user))
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: this.getAuthHeaders(),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const users = await response.json()
      return this.mapUsers(users)
    } catch (error) {
      console.error('Error fetching all users:', error)
      throw error
    }
  }

  async getActiveUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/active`, {
        headers: this.getAuthHeaders(),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const users = await response.json()
      return this.mapUsers(users)
    } catch (error) {
      console.error('Error fetching active users:', error)
      throw error
    }
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(userData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  async updateUserWithServices(id: number, userData: UpdateUserRequest): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(userData)
      })

      if (!response.ok) {
        // Try to get error details, but handle cases where response might be empty
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorText = await response.text()
          if (errorText) {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.message || errorData.error || errorMessage
          }
        } catch (e) {
          console.warn('Could not parse error response:', e)
        }
        throw new Error(errorMessage)
      }

      // Handle successful response
      const responseText = await response.text()
      if (!responseText) {
        throw new Error('Empty response from server')
      }
      
      return JSON.parse(responseText)
    } catch (error) {
      console.error('Error updating user with services:', error)
      throw error
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(userData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  async deleteUser(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  async getUserServices(userId: number): Promise<Service[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/services`, {
        headers: this.getAuthHeaders(),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching user services:', error)
      throw error
    }
  }

  async getUsersByService(serviceId: number): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/services/${serviceId}/users`, {
        headers: this.getAuthHeaders(),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching users by service:', error)
      throw error
    }
  }

  async searchUsers(query: string, type?: string): Promise<User[]> {
    try {
      const url = new URL(`${API_BASE_URL}/api/users/search`)
      url.searchParams.append('query', query)
      if (type) {
        url.searchParams.append('type', type)
      }

      const response = await fetch(url.toString(), {
        headers: this.getAuthHeaders(),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error searching users:', error)
      throw error
    }
  }

  async assignServicesToUser(userId: number, serviceIds: number[]): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/services`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ serviceIds })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error assigning services to user:', error)
      throw error
    }
  }

  async replaceServicesForUser(userId: number, serviceIds: number[]): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/services/replace`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ serviceIds })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error replacing services for user:', error)
      throw error
    }
  }

  async activateUser(userId: number): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/activate`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const user = await response.json()
      // Map backend 'enabled' field to frontend 'active' field
      return {
        ...user,
        active: user.enabled
      }
    } catch (error) {
      console.error('Error activating user:', error)
      throw error
    }
  }

  async deactivateUser(userId: number): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/deactivate`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const user = await response.json()
      // Map backend 'enabled' field to frontend 'active' field
      return {
        ...user,
        active: user.enabled
      }
    } catch (error) {
      console.error('Error deactivating user:', error)
      throw error
    }
  }
}

export const userService = new UserService()
