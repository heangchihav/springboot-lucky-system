'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { userService, User, CreateUserRequest } from '../../services/userService'
import { serviceService } from '../../services/serviceService'
import { areaBranchService, Branch } from '../services/areaBranchService'
import { PermissionGuard } from '../../components/PermissionGuard'
import { API_BASE_URL } from '@/config/env'

const getStoredUserId = (): number | null => {
  if (typeof window === 'undefined') {
    return null
  }

  const userStr = window.localStorage.getItem('user')
  if (!userStr) {
    return null
  }

  try {
    const parsed = JSON.parse(userStr)
    return parsed?.id ?? null
  } catch {
    return null
  }
}

const fetchAndCacheUserId = async (): Promise<number | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      credentials: 'include',
    })

    if (!response.ok) {
      return null
    }

    const user = await response.json()
    if (user?.id && typeof window !== 'undefined') {
      window.localStorage.setItem('user', JSON.stringify(user))
      return user.id
    }
    return user?.id ?? null
  } catch (error) {
    console.error('Failed to fetch current user info', error)
    return null
  }
}

export default function ManageUserPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [callServiceId, setCallServiceId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    phone: ''
  })
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [hasBranchAssignment, setHasBranchAssignment] = useState(false)
  
  // Edit user state
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    username: '',
    phone: ''
  })
  const [editBranchId, setEditBranchId] = useState<number | null>(null)
  const [editingUserBranchCurrentId, setEditingUserBranchCurrentId] = useState<number | null>(null)

  const normalizedSearch = searchTerm.toLowerCase()
  const filteredUsers = users.filter(user => {
    const fullName = (user.fullName ?? '').toLowerCase()
    const username = (user.username ?? '').toLowerCase()
    return fullName.includes(normalizedSearch) || username.includes(normalizedSearch)
  })

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers()
    fetchCallServiceId()
    loadBranches()
  }, [])

  // Refetch users when callServiceId is available
  useEffect(() => {
    if (callServiceId) {
      fetchUsers()
    }
  }, [callServiceId])

  const fetchCallServiceId = async () => {
    try {
      const callService = await serviceService.getServiceByCode('call-service')
      setCallServiceId(callService.id)
    } catch (error) {
      console.error('Error fetching call service:', error)
      // Continue without service assignment if service not found
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      let usersData: User[]
      
      if (callServiceId) {
        // Fetch all users and filter by service assignment
        const allUsers = await userService.getActiveUsers()
        usersData = []
        
        // Check each user's service assignments
        for (const user of allUsers) {
          try {
            const userServices = await userService.getUserServices(user.id)
            const hasCallService = userServices.some(service => service.id === callServiceId)
            if (hasCallService) {
              usersData.push(user)
            }
          } catch (serviceError) {
            // If we can't fetch services for a user, skip them
            console.warn(`Could not fetch services for user ${user.id}:`, serviceError)
          }
        }
      } else {
        // Fallback to all users if service ID not available yet
        usersData = await userService.getActiveUsers()
      }
      
      setUsers(usersData)
    } catch (err) {
      setError('Failed to fetch users. Please try again.')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const userData: CreateUserRequest = {
        fullName: formData.fullName,
        username: formData.username,
        password: formData.password,
        phone: formData.phone || undefined,
        serviceIds: callServiceId ? [callServiceId] : undefined // Auto-assign call-service
      }

      const newUser = await userService.createUser(userData)
      setUsers(prev => [...prev, newUser])
      setFormData({
        fullName: '',
        username: '',
        password: '',
        phone: ''
      })
      if (!hasBranchAssignment) {
        setSelectedBranchId(null)
      }
      
      if (selectedBranchId) {
        await areaBranchService.assignUserToBranch(newUser.id, selectedBranchId)
      }

      alert('User created successfully and assigned to Call Service!')
    } catch (error) {
      console.error('Error creating user:', error)
      alert(`Error creating user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleUserStatus = async (userId: number) => {
    try {
      // Use updateUser to toggle the active status
      const user = users.find(u => u.id === userId)
      if (user) {
        await userService.updateUser(userId, { active: !user.active })
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, active: !u.active } : u
        ))
        alert('User status updated successfully')
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      alert(`Error updating user status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const loadBranches = async () => {
    try {
      setHasBranchAssignment(false)

      const fetchedUserId = await fetchAndCacheUserId()
      const currentUserId = fetchedUserId ?? getStoredUserId()

      const activeBranches = await areaBranchService.getActiveBranches()
      const branchMap = new Map(activeBranches.map((branch) => [branch.id, branch]))

      if (currentUserId) {
        try {
          const assignments = await areaBranchService.getUserBranchesByUser(currentUserId)
          const activeAssignments = assignments.filter((assignment) => assignment.active)

          if (activeAssignments.length > 0) {
            const lockedBranches = activeAssignments.map((assignment) => {
              const branch = branchMap.get(assignment.branchId)
              if (branch) {
                return branch
              }
              const fallbackBranch: Branch = {
                id: assignment.branchId,
                name: assignment.branchName,
                description: '',
                code: '',
                address: '',
                phone: '',
                email: '',
                active: true,
                areaId: 0,
                areaName: 'Assigned branch',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
              return fallbackBranch
            })

            setHasBranchAssignment(true)
            setBranches(lockedBranches)
            setSelectedBranchId(lockedBranches[0]?.id ?? null)
            return
          }
        } catch (assignmentError) {
          console.error('Error loading current user branch assignments:', assignmentError)
        }
      }

      setBranches(activeBranches)
    } catch (err) {
      console.error('Error loading branches:', err)
      setBranches([])
    }
  }

  const loadUserBranchAssignment = async (userId: number) => {
    try {
      const assignments = await areaBranchService.getUserBranchesByUser(userId)
      const activeAssignment = assignments.find((assignment) => assignment.active)
      const branchId = activeAssignment?.branchId ?? null
      setEditBranchId(branchId)
      setEditingUserBranchCurrentId(branchId)
    } catch (error) {
      console.error('Error loading user branch assignment:', error)
      setEditBranchId(null)
      setEditingUserBranchCurrentId(null)
    }
  }

  const toggleUserStatus = async (userId: number) => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return

      const updatedUser = user.active 
        ? await userService.deactivateUser(userId)
        : await userService.activateUser(userId)

      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u))
    } catch (error) {
      console.error('Error toggling user status:', error)
      alert(`Error updating user status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const deleteUser = async (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(userId)
        setUsers(prev => prev.filter(user => user.id !== userId))
        alert('User deleted successfully!')
      } catch (error) {
        console.error('Error deleting user:', error)
        alert(`Error deleting user: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  // Edit user handlers
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const startEditUser = (user: User) => {
    setEditingUser(user)
    setEditFormData({
      fullName: user.fullName,
      username: user.username,
      phone: user.phone || ''
    })
    loadUserBranchAssignment(user.id)
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setEditFormData({
      fullName: '',
      username: '',
      phone: ''
    })
    setEditBranchId(null)
    setEditingUserBranchCurrentId(null)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      const updatedUser = await userService.updateUser(editingUser.id, {
        fullName: editFormData.fullName,
        phone: editFormData.phone || undefined
        // Note: Not updating serviceIds to keep user in current service
      })

      const branchChanged = editBranchId !== editingUserBranchCurrentId
      if (branchChanged) {
        if (editingUserBranchCurrentId) {
          await areaBranchService.removeUserFromBranch(editingUser.id, editingUserBranchCurrentId)
        }
        if (editBranchId) {
          await areaBranchService.assignUserToBranch(editingUser.id, editBranchId)
        }
      }

      setUsers(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u))
      await fetchUsers()
      cancelEdit()
      setEditingUserBranchCurrentId(editBranchId)
      alert('User updated successfully!')
    } catch (error) {
      console.error('Error updating user:', error)
      alert(`Error updating user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Call Service · Manage Users</h2>
        <p className="text-slate-300">
          Manage call center user accounts and permissions.
        </p>
      </div>

      {/* Create User Form */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-medium text-white mb-4">Create New User</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter full name"
              />
            </div>
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter username"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-1">
                Phone (Optional)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter phone number"
              />
            </div>
            
            <div>
              <label htmlFor="branch" className="block text-sm font-medium text-slate-300 mb-1">
                Assigned Branch
              </label>
              <select
                id="branch"
                name="branch"
                value={selectedBranchId ?? ''}
                onChange={(e) => {
                  const nextBranchId = e.target.value ? Number(e.target.value) : null
                  setSelectedBranchId(nextBranchId)
                }}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select branch (optional)</option>
                {branches.filter(branch => branch.active).map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.areaName})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <PermissionGuard permission="menu.4.create" fallback={
              <button
                type="button"
                disabled
                className="px-6 py-2 bg-gray-600 text-gray-400 rounded-md cursor-not-allowed"
                title="You don't have permission to create users"
              >
                Create User (No Permission)
              </button>
            }>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create User'}
              </button>
            </PermissionGuard>
          </div>
        </form>
      </div>

      {/* Edit User Form */}
      {editingUser && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-medium text-white mb-4">Edit User</h3>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="editFullName" className="block text-sm font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="editFullName"
                  name="fullName"
                  value={editFormData.fullName}
                  onChange={handleEditInputChange}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <label htmlFor="editUsername" className="block text-sm font-medium text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  id="editUsername"
                  name="username"
                  value={editFormData.username}
                  disabled
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-slate-400 placeholder-slate-500 cursor-not-allowed"
                  placeholder="Username cannot be changed"
                />
                <p className="text-xs text-slate-400 mt-1">Username cannot be changed</p>
              </div>
              
              <div>
                <label htmlFor="editPhone" className="block text-sm font-medium text-slate-300 mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  id="editPhone"
                  name="phone"
                  value={editFormData.phone}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <label htmlFor="editBranch" className="block text-sm font-medium text-slate-300 mb-1">
                  Assigned Branch
                </label>
                <select
                  id="editBranch"
                  name="editBranch"
                  value={editBranchId ?? ''}
                  onChange={(e) => {
                    const branchId = e.target.value ? Number(e.target.value) : null
                    setEditBranchId(branchId)
                  }}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select branch (optional)</option>
                  {branches.filter(branch => branch.active).map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.areaName})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Updating...' : 'Update User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and User List */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Users</h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-slate-400">Loading users...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-md mb-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
              <button
                onClick={fetchUsers}
                className="ml-auto text-red-300 hover:text-red-200 underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-slate-400">
                      {searchTerm ? 'No users found matching your search.' : 'No users available.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {user.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {user.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <PermissionGuard permission="menu.4.edit" fallback={
                            <button
                              disabled
                              className="px-3 py-1 bg-gray-100 text-gray-400 rounded text-xs font-medium cursor-not-allowed"
                              title="You don't have permission to edit users"
                            >
                              Edit
                            </button>
                          }>
                            <button
                              onClick={() => startEditUser(user)}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                            >
                              Edit
                            </button>
                          </PermissionGuard>
                          <PermissionGuard permission="menu.4.edit" fallback={
                            <button
                              disabled
                              className="px-3 py-1 bg-gray-100 text-gray-400 rounded text-xs font-medium cursor-not-allowed"
                              title="You don't have permission to change user status"
                            >
                              {user.active ? 'Deactivate' : 'Activate'}
                            </button>
                          }>
                            <button
                              onClick={() => handleToggleUserStatus(user.id)}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                user.active
                                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                            >
                              {user.active ? 'Deactivate' : 'Activate'}
                            </button>
                          </PermissionGuard>
                          <PermissionGuard permission="menu.4.delete" fallback={
                            <button
                              disabled
                              className="px-3 py-1 bg-gray-100 text-gray-400 rounded text-xs font-medium cursor-not-allowed"
                              title="You don't have permission to delete users"
                            >
                              Delete
                            </button>
                          }>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                            >
                              Delete
                            </button>
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}