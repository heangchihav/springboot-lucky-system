'use client'

import React from 'react'
import { PermissionGuard, MenuGuard, usePermission, useMenuPermissions } from '../components/PermissionGuard'
import { Plus, Edit2, Trash2, Eye, Settings } from 'lucide-react'

// Example 1: Basic Permission Guard Usage
export function BranchManagementComponent() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Branch Management</h2>
      
      {/* Only show view button if user has branch.view permission */}
      <PermissionGuard permission="branch.view">
        <button className="bg-blue-500 text-white px-4 py-2 rounded mr-2 flex items-center gap-2">
          <Eye className="h-4 w-4" />
          View Branches
        </button>
      </PermissionGuard>

      {/* Only show create button if user has branch.create permission */}
      <PermissionGuard permission="branch.create" fallback={<span className="text-gray-400">No create access</span>}>
        <button className="bg-green-500 text-white px-4 py-2 rounded mr-2 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Branch
        </button>
      </PermissionGuard>

      {/* Only show edit button if user has branch.edit permission */}
      <PermissionGuard permission="branch.edit">
        <button className="bg-yellow-500 text-white px-4 py-2 rounded mr-2 flex items-center gap-2">
          <Edit2 className="h-4 w-4" />
          Edit Branch
        </button>
      </PermissionGuard>

      {/* Only show delete button if user has branch.delete permission */}
      <PermissionGuard permission="branch.delete">
        <button className="bg-red-500 text-white px-4 py-2 rounded flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          Delete Branch
        </button>
      </PermissionGuard>
    </div>
  )
}

// Example 2: Menu Access Control
export function NavigationMenu() {
  const { menuPermissions, loading, hasMenuAccess } = useMenuPermissions()

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-8 w-64 rounded"></div>
  }

  return (
    <nav className="flex space-x-4 p-4 bg-gray-100 rounded">
      {/* Dashboard - always visible if user can view anything */}
      {hasMenuAccess('canViewDashboard') && (
        <a href="/dashboard" className="px-3 py-2 bg-blue-500 text-white rounded">
          Dashboard
        </a>
      )}

      {/* Branches menu */}
      {hasMenuAccess('canViewBranches') && (
        <a href="/branches" className="px-3 py-2 bg-green-500 text-white rounded">
          Branches
        </a>
      )}

      {/* Call Management */}
      {hasMenuAccess('canViewCalls') && (
        <a href="/calls" className="px-3 py-2 bg-purple-500 text-white rounded">
          Calls
        </a>
      )}

      {/* Queue Management */}
      {hasMenuAccess('canViewQueue') && (
        <a href="/queue" className="px-3 py-2 bg-orange-500 text-white rounded">
          Queue
        </a>
      )}

      {/* Reports */}
      {hasMenuAccess('canViewReports') && (
        <a href="/reports" className="px-3 py-2 bg-indigo-500 text-white rounded">
          Reports
        </a>
      )}

      {/* User Management - only for admins */}
      {hasMenuAccess('canManageUsers') && (
        <a href="/users" className="px-3 py-2 bg-red-500 text-white rounded">
          Users
        </a>
      )}
    </nav>
  )
}

// Example 3: Using Permission Hook
export function CallManagementComponent() {
  const { hasPermission: canViewCalls } = usePermission('call.view')
  const { hasPermission: canCreateCalls } = usePermission('call.create')
  const { hasPermission: canEditCalls } = usePermission('call.edit')

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Call Management</h2>
      
      {canViewCalls === null && (
        <div className="animate-pulse bg-gray-200 h-4 w-32 rounded mb-4"></div>
      )}

      {canViewCalls && (
        <div className="space-y-4">
          <div className="bg-white p-4 border rounded">
            <h3 className="font-semibold mb-2">Call List</h3>
            <p>Call records would be displayed here...</p>
          </div>

          {canCreateCalls && (
            <button className="bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Call
            </button>
          )}

          {canEditCalls && (
            <button className="bg-yellow-500 text-white px-4 py-2 rounded flex items-center gap-2">
              <Edit2 className="h-4 w-4" />
              Edit Call
            </button>
          )}
        </div>
      )}

      {!canViewCalls && (
        <div className="bg-red-100 p-4 border border-red-300 rounded">
          <p className="text-red-700">You don't have permission to view calls.</p>
        </div>
      )}
    </div>
  )
}

// Example 4: Complete Dashboard with Permission Controls
export function CallServiceDashboard() {
  const { hasPermission: canManageBranches } = usePermission('branch.create')
  const { hasPermission: canManageCalls } = usePermission('call.create')
  const { hasPermission: canManageQueue } = usePermission('queue.manage')

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Call Service Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Branch Management Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Branch Management
          </h3>
          <MenuGuard menuKey="canViewBranches">
            <div className="space-y-2">
              <p className="text-gray-600">Manage your call center branches</p>
              <div className="flex gap-2">
                <PermissionGuard permission="branch.view">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                </PermissionGuard>
                {canManageBranches && (
                  <button className="text-green-600 hover:text-green-800 text-sm">Manage</button>
                )}
              </div>
            </div>
          </MenuGuard>
        </div>

        {/* Call Management Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Call Operations</h3>
          <MenuGuard menuKey="canViewCalls">
            <div className="space-y-2">
              <p className="text-gray-600">Handle incoming and outgoing calls</p>
              <div className="flex gap-2">
                <PermissionGuard permission="call.view">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                </PermissionGuard>
                {canManageCalls && (
                  <button className="text-green-600 hover:text-green-800 text-sm">Manage</button>
                )}
              </div>
            </div>
          </MenuGuard>
        </div>

        {/* Queue Management Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Queue Management</h3>
          <MenuGuard menuKey="canViewQueue">
            <div className="space-y-2">
              <p className="text-gray-600">Monitor and manage call queues</p>
              <div className="flex gap-2">
                <PermissionGuard permission="queue.view">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                </PermissionGuard>
                {canManageQueue && (
                  <button className="text-green-600 hover:text-green-800 text-sm">Manage</button>
                )}
              </div>
            </div>
          </MenuGuard>
        </div>
      </div>
    </div>
  )
}

// Example 5: Conditional Component Rendering
export function AdminPanel() {
  return (
    <PermissionGuard 
      permission="user.manage" 
      fallback={
        <div className="bg-yellow-100 p-4 border border-yellow-300 rounded">
          <p className="text-yellow-700">Admin access required. You don't have permission to manage users.</p>
        </div>
      }
    >
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
        <div className="space-y-4">
          <button className="bg-blue-500 text-white px-4 py-2 rounded">Manage Users</button>
          <button className="bg-green-500 text-white px-4 py-2 rounded">System Settings</button>
          <button className="bg-purple-500 text-white px-4 py-2 rounded">Audit Logs</button>
        </div>
      </div>
    </PermissionGuard>
  )
}
