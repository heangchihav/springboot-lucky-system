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

class UserService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  }

  async getActiveUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/active`, {
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
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

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
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

  async activateUser(id: number): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${id}/activate`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error activating user:', error)
      throw error
    }
  }

  async deactivateUser(id: number): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${id}/deactivate`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error deactivating user:', error)
      throw error
    }
  }

  async deleteUser(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
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
        headers: this.getAuthHeaders()
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

  async searchUsers(query: string, type?: string): Promise<User[]> {
    try {
      const url = new URL(`${API_BASE_URL}/api/users/search`)
      url.searchParams.append('query', query)
      if (type) {
        url.searchParams.append('type', type)
      }

      const response = await fetch(url.toString(), {
        headers: this.getAuthHeaders()
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
}

export const userService = new UserService()
