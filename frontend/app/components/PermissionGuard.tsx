'use client'

import React, { useContext, useEffect, useState } from 'react'
import { permissionsService } from '../services/permissionsService'

interface PermissionGuardProps {
  permission: string
  children: React.ReactNode
  fallback?: React.ReactNode
  userId?: number
}

export function PermissionGuard({ permission, children, fallback = null, userId }: PermissionGuardProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkPermission()
  }, [permission, userId])

  const checkPermission = async () => {
    try {
      setLoading(true)
      const currentUserId = userId || getCurrentUserId()
      
      if (!currentUserId) {
        setHasPermission(false)
        return
      }

      const permissionResult = await permissionsService.checkUserPermission(currentUserId, permission)
      setHasPermission(permissionResult)
    } catch (error) {
      console.error('Error checking permission:', error)
      setHasPermission(false)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentUserId = (): number | null => {
    // Get user ID from auth context or localStorage
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        return user.id || null
      } catch {
        return null
      }
    }
    return null
  }

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
  }

  if (hasPermission === null) {
    return fallback
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>
}

interface MenuGuardProps {
  menuKey: string
  children: React.ReactNode
  fallback?: React.ReactNode
  userId?: number
}

export function MenuGuard({ menuKey, children, fallback = null, userId }: MenuGuardProps) {
  const [hasMenuAccess, setHasMenuAccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkMenuAccess()
  }, [menuKey, userId])

  const checkMenuAccess = async () => {
    try {
      setLoading(true)
      const currentUserId = userId || getCurrentUserId()
      
      if (!currentUserId) {
        setHasMenuAccess(false)
        return
      }

      const menuPermissions = await permissionsService.getUserMenuPermissions(currentUserId)
      const hasAccess = menuPermissions[menuKey] || false
      setHasMenuAccess(hasAccess)
    } catch (error) {
      console.error('Error checking menu access:', error)
      setHasMenuAccess(false)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentUserId = (): number | null => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        return user.id || null
      } catch {
        return null
      }
    }
    return null
  }

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
  }

  if (hasMenuAccess === null) {
    return fallback
  }

  return hasMenuAccess ? <>{children}</> : <>{fallback}</>
}

// Hook for checking permissions
export function usePermission(permission: string, userId?: number) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkPermission()
  }, [permission, userId])

  const checkPermission = async () => {
    try {
      setLoading(true)
      const currentUserId = userId || getCurrentUserId()
      
      if (!currentUserId) {
        setHasPermission(false)
        return
      }

      const permissionResult = await permissionsService.checkUserPermission(currentUserId, permission)
      setHasPermission(permissionResult)
    } catch (error) {
      console.error('Error checking permission:', error)
      setHasPermission(false)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentUserId = (): number | null => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        return user.id || null
      } catch {
        return null
      }
    }
    return null
  }

  return { hasPermission, loading }
}

// Hook for checking menu permissions
export function useMenuPermissions(userId?: number) {
  const [menuPermissions, setMenuPermissions] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMenuPermissions()
  }, [userId])

  const fetchMenuPermissions = async () => {
    try {
      setLoading(true)
      const currentUserId = userId || getCurrentUserId()
      
      if (!currentUserId) {
        setMenuPermissions({})
        return
      }

      const permissions = await permissionsService.getUserMenuPermissions(currentUserId)
      setMenuPermissions(permissions)
    } catch (error) {
      console.error('Error fetching menu permissions:', error)
      setMenuPermissions({})
    } finally {
      setLoading(false)
    }
  }

  const getCurrentUserId = (): number | null => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        return user.id || null
      } catch {
        return null
      }
    }
    return null
  }

  const hasMenuAccess = (menuKey: string): boolean => {
    return menuPermissions[menuKey] || false
  }

  return { menuPermissions, loading, hasMenuAccess }
}
