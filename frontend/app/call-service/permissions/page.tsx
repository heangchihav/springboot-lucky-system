'use client'

import React, { useState, useEffect } from 'react'
import { Shield, Users, Plus, Edit2, Trash2, Check, X, UserPlus, Settings, ChevronDown, ChevronRight } from 'lucide-react'
import { permissionsService, Permission, Role, PermissionGroup, CreateRoleRequest, UpdateRoleRequest } from '../../services/permissionsService'
import { userService, User } from '../../services/userService'

export default function PermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  
  // Form states
  const [showRoleForm, setShowRoleForm] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [roleForm, setRoleForm] = useState({ name: '', description: '' })
  
  // User assignment states
  const [showUserAssignment, setShowUserAssignment] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [roleUsers, setRoleUsers] = useState<Map<number, User[]>>(new Map())

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch data using real services
      const [permissionsData, groupsData, rolesData] = await Promise.all([
        permissionsService.getPermissions(),
        permissionsService.getPermissionGroups(),
        permissionsService.getRoles()
      ])

      setPermissions(permissionsData)
      setPermissionGroups(groupsData)
      setRoles(rolesData)
      
      // Fetch users assigned to each role
      const roleUsersMap = new Map<number, User[]>()
      for (const role of rolesData) {
        try {
          const assignedUsers = await permissionsService.getUsersInRole(role.id)
          roleUsersMap.set(role.id, assignedUsers)
        } catch (error) {
          console.warn(`Failed to fetch users for role ${role.id}:`, error)
          roleUsersMap.set(role.id, [])
        }
      }
      setRoleUsers(roleUsersMap)
      
      // Auto-expand all groups initially
      const allGroupIds = new Set(groupsData.map(group => group.id))
      setExpandedGroups(allGroupIds)
      
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRole = async () => {
    if (!roleForm.name.trim()) return

    try {
      const createRoleRequest: CreateRoleRequest = {
        name: roleForm.name,
        description: roleForm.description,
        permissionCodes: selectedPermissions
      }

      const newRole = await permissionsService.createRole(createRoleRequest)
      setRoles([...roles, newRole])
      resetRoleForm()
      console.log('Role created successfully:', newRole)
    } catch (error) {
      console.error('Failed to create role:', error)
      // Show error message to user
      alert('Failed to create role. Please try again.')
    }
  }

  const handleUpdateRole = async () => {
    if (!editingRole || !roleForm.name.trim()) return

    try {
      const updateRoleRequest: UpdateRoleRequest = {
        name: roleForm.name,
        description: roleForm.description,
        permissionCodes: selectedPermissions
      }

      const updatedRole = await permissionsService.updateRole(editingRole.id, updateRoleRequest)
      const updatedRoles = roles.map(role =>
        role.id === editingRole.id ? updatedRole : role
      )

      setRoles(updatedRoles)
      resetRoleForm()
      console.log('Role updated successfully:', updatedRole)
    } catch (error) {
      console.error('Failed to update role:', error)
      alert('Failed to update role. Please try again.')
    }
  }

  const handleDeleteRole = async (roleId: number) => {
    try {
      await permissionsService.deleteRole(roleId)
      setRoles(roles.filter(role => role.id !== roleId))
      console.log('Role deleted successfully:', roleId)
    } catch (error) {
      console.error('Failed to delete role:', error)
      alert('Failed to delete role. Please try again.')
    }
  }

  const resetRoleForm = () => {
    setRoleForm({ name: '', description: '' })
    setSelectedPermissions([])
    setShowRoleForm(false)
    setEditingRole(null)
  }

  const openRoleForm = (role?: Role) => {
    if (role) {
      setEditingRole(role)
      setRoleForm({ name: role.name, description: role.description })
      setSelectedPermissions(role.permissions.map(p => p.code))
    } else {
      setRoleForm({ name: '', description: '' })
      setSelectedPermissions([])
    }
    setShowRoleForm(true)
  }

  const togglePermission = (permissionCode: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionCode)
        ? prev.filter(p => p !== permissionCode)
        : [...prev, permissionCode]
    )
  }

  const openUserAssignment = async (role: Role) => {
    setSelectedRole(role)
    setShowUserAssignment(true)
    
    try {
      // Fetch fresh user data from real user-service
      const freshUsers = await userService.getActiveUsers()
      setAvailableUsers(freshUsers)
      
      // Get users already assigned to this role
      const assignedUsers = roleUsers.get(role.id) || []
      const assignedUserIds = assignedUsers.map(user => user.id)
      
      // Auto-select users who are already assigned
      setSelectedUsers(assignedUserIds)
      
    } catch (error) {
      console.error('Failed to fetch users for assignment:', error)
      setAvailableUsers([])
      setSelectedUsers([])
    }
  }

  const handleAssignUsers = async () => {
    if (!selectedRole) return

    try {
      // Get currently assigned users
      const currentlyAssigned = roleUsers.get(selectedRole.id) || []
      const currentlyAssignedIds = currentlyAssigned.map(user => user.id)
      
      // Calculate users to add and remove
      const usersToAdd = selectedUsers.filter(id => !currentlyAssignedIds.includes(id))
      const usersToRemove = currentlyAssignedIds.filter(id => !selectedUsers.includes(id))
      
      // Add new users
      if (usersToAdd.length > 0) {
        await permissionsService.assignUsersToRole(selectedRole.id, usersToAdd)
      }
      
      // Remove users
      if (usersToRemove.length > 0) {
        await permissionsService.removeUsersFromRole(selectedRole.id, usersToRemove)
      }
      
      // Update role user count in local state
      const updatedRoles = roles.map(role =>
        role.id === selectedRole.id
          ? { ...role, userCount: selectedUsers.length }
          : role
      )
      setRoles(updatedRoles)
      
      // Refresh users for this role
      try {
        const assignedUsers = await permissionsService.getUsersInRole(selectedRole.id)
        setRoleUsers(prev => new Map(prev).set(selectedRole.id, assignedUsers))
      } catch (error) {
        console.warn('Failed to refresh role users:', error)
      }
      
      setShowUserAssignment(false)
      setSelectedUsers([])
      console.log('Successfully updated user assignments for role:', selectedRole.id, { added: usersToAdd, removed: usersToRemove })
    } catch (error) {
      console.error('Failed to update user assignments:', error)
      alert('Failed to update user assignments. Please try again.')
    }
  }

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          Permissions Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage roles, permissions, and user access control for the call service
        </p>
      </div>

      {/* Roles & Permissions Content */}
      <div>
          {/* Role List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Roles</h2>
              <button
                onClick={() => openRoleForm()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Role
              </button>
            </div>
            <div className="divide-y divide-gray-200">
              {roles.map((role) => (
                <div key={role.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{role.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                      
                      {/* Display assigned users */}
                      <div className="mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">
                            Assigned Users ({roleUsers.get(role.id)?.length || 0})
                          </span>
                        </div>
                        {roleUsers.get(role.id) && roleUsers.get(role.id)!.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {roleUsers.get(role.id)!.map((user) => (
                              <span
                                key={user.id}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {user.fullName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic">No users assigned to this role</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => openUserAssignment(role)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Assign Users"
                        >
                          <UserPlus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openRoleForm(role)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit Role"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Role"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      {/* Role Form Modal */}
      {showRoleForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingRole ? 'Edit Role' : 'Create New Role'}
              </h3>
              <button
                onClick={resetRoleForm}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role Name
                </label>
                <input
                  type="text"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Normal Staff"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe the role's purpose and responsibilities"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="space-y-3 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
                  {permissionGroups.map((group) => (
                    <div key={group.id} className="border border-gray-100 rounded-md">
                      <div
                        className="flex items-center space-x-2 p-2 bg-gray-50 cursor-pointer hover:bg-gray-100 rounded-t-md"
                        onClick={() => toggleGroupExpansion(group.id)}
                      >
                        {expandedGroups.has(group.id) ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm font-medium text-gray-700">
                          {group.menuNumber}. {group.name}
                        </span>
                        <span className="text-xs text-gray-500">({group.permissions.length} permissions)</span>
                      </div>
                      {expandedGroups.has(group.id) && (
                        <div className="p-2 space-y-1">
                          {group.permissions.map((permission) => (
                            <label
                              key={permission.code}
                              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(permission.code)}
                                onChange={() => togglePermission(permission.code)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {permission.menuNumber} {permission.name}
                                </div>
                                <div className="text-xs text-gray-500">{permission.description}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={resetRoleForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={editingRole ? handleUpdateRole : handleCreateRole}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                {editingRole ? 'Update Role' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Assignment Modal */}
      {showUserAssignment && selectedRole && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Assign Users to {selectedRole.name}
              </h3>
              <button
                onClick={() => setShowUserAssignment(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
              {availableUsers.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                    <div className="text-xs text-gray-500">@{user.username}{user.phone && ` • ${user.phone}`}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowUserAssignment(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignUsers}
                disabled={selectedUsers.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign {selectedUsers.length} User{selectedUsers.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}