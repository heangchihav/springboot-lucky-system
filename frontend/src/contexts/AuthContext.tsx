'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { apiService, UserInfo, LoginRequest, RegisterRequest, ApiError } from '../services/api'

interface AuthContextType {
  user: UserInfo | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
  refreshUser: () => Promise<void>
  error: string | null
  clearError: () => void
  hasServiceAccess: (serviceKey: string) => boolean
  getAccessibleServices: () => string[]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const clearError = () => setError(null)

  const refreshUser = async () => {
    try {
      const userInfo = await apiService.getCurrentUser()
      setUser(userInfo)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null)
      } else {
        console.error('Failed to refresh user:', err)
      }
    }
  }

  const login = async (data: LoginRequest) => {
    setIsLoading(true)
    clearError()
    
    try {
      await apiService.login(data)
      await refreshUser()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const message = err.response?.error || err.message
        setError(message)
      } else {
        setError('Login failed')
      }
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterRequest) => {
    setIsLoading(true)
    clearError()
    
    try {
      await apiService.register(data)
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const message = err.response?.error || err.message
        setError(message)
      } else {
        setError('Registration failed')
      }
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    clearError()
    
    try {
      await apiService.logout()
      setUser(null)
    } catch (err: unknown) {
      console.error('Logout failed:', err)
      // Still clear user state even if logout request fails
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const logoutAll = async () => {
    setIsLoading(true)
    clearError()
    
    try {
      await apiService.logoutAll()
      setUser(null)
    } catch (err: unknown) {
      console.error('Logout all failed:', err)
      // Still clear user state even if logout request fails
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Service access methods
  const hasServiceAccess = (serviceKey: string): boolean => {
    // Root user has access to all services
    if (user?.username === 'root') {
      return true
    }
    
    if (!user?.userRoles) return false
    
    // Map service keys to menu section IDs
    const serviceKeyToSectionMap: Record<string, string> = {
      'call-service': 'call-service',
      'delivery-service': 'delivery-service',
      'user': 'user-service'
    }
    
    const sectionId = serviceKeyToSectionMap[serviceKey]
    if (!sectionId) return false
    
    return user.userRoles.some(role => 
      role.serviceKey === serviceKey && role.active
    )
  }

  const getAccessibleServices = (): string[] => {
    // Root user has access to all services
    if (user?.username === 'root') {
      return ['call-service', 'delivery-service', 'user-service']
    }
    
    if (!user?.userRoles) return []
    
    // Map service keys to menu section IDs
    const serviceKeyToSectionMap: Record<string, string> = {
      'call-service': 'call-service',
      'delivery-service': 'delivery-service',
      'user': 'user-service'
    }
    
    return user.userRoles
      .filter(role => role.active)
      .map(role => serviceKeyToSectionMap[role.serviceKey])
      .filter(Boolean)
  }

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const isAuth = await apiService.isAuthenticated()
        if (isAuth) {
          await refreshUser()
        } else {
          setUser(null)
        }
      } catch (err: unknown) {
        console.error('Auth initialization failed:', err)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    logoutAll,
    refreshUser,
    error,
    clearError,
    hasServiceAccess,
    getAccessibleServices
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
