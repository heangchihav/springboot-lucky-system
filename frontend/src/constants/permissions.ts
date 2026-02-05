// Call Service Permission Constants
// Matches backend permission structure exactly

export const CALL_SERVICE_PERMISSIONS = {
  // Dashboard permissions (Menu 6)
  DASHBOARD: {
    VIEW: "menu.6.view",
    OVERVIEW: "menu.6.overview",
    ESCALATIONS: "menu.6.escalations",
    QUEUE_HEALTH: "menu.6.queue-health",
  },

  // Area Management permissions
  AREAS: {
    VIEW: "area.view",
    CREATE: "area.create",
    EDIT: "area.edit",
    DELETE: "area.delete",
  },

  // Subarea Management permissions
  SUBAREAS: {
    VIEW: "subarea.view",
    CREATE: "subarea.create",
    EDIT: "subarea.edit",
    DELETE: "subarea.delete",
  },

  // Branch Management permissions
  BRANCHES: {
    VIEW: "branch.view",
    CREATE: "branch.create",
    EDIT: "branch.edit",
    UPDATE: "branch.update",
    DELETE: "branch.delete",
  },

  // User Branch Assignment permissions
  USER_BRANCH: {
    ASSIGN: "user.branch.assign",
    REMOVE: "user.branch.remove",
    VIEW: "user.branch.view",
  },

  // Call Reports permissions (Menu 3)
  CALL_REPORTS: {
    VIEW: "menu.3.view",
    CREATE: "menu.3.create",
    EDIT: "menu.3.edit",
    DELETE: "menu.3.delete",
  },

  // Call Status permissions (Menu 3)
  CALL_STATUS: {
    VIEW: "menu.3.status.view",
    CREATE: "menu.3.status.create",
    EDIT: "menu.3.status.edit",
    DELETE: "menu.3.status.delete",
  },

  // Role Management permissions (Menu 5)
  ROLES: {
    VIEW: "menu.5.view",
    MANAGE: "menu.5.manage",
    ASSIGN: "menu.5.assign",
  },

  // Permission Management permissions (Menu 5)
  PERMISSIONS: {
    VIEW: "menu.5.permission.view",
    MANAGE: "menu.5.permission.manage",
  },

  // User Management permissions (Menu 5)
  USERS: {
    VIEW: "menu.5.user.view",
    CREATE: "menu.5.user.create",
    EDIT: "menu.5.user.edit",
    DELETE: "menu.5.user.delete",
    ASSIGN: "menu.5.user.assign",
  },
} as const;

// Permission groups for easy checking
export const PERMISSION_GROUPS = {
  DASHBOARD: Object.values(CALL_SERVICE_PERMISSIONS.DASHBOARD),
  AREAS: Object.values(CALL_SERVICE_PERMISSIONS.AREAS),
  SUBAREAS: Object.values(CALL_SERVICE_PERMISSIONS.SUBAREAS),
  BRANCHES: Object.values(CALL_SERVICE_PERMISSIONS.BRANCHES),
  USER_BRANCH: Object.values(CALL_SERVICE_PERMISSIONS.USER_BRANCH),
  CALL_REPORTS: Object.values(CALL_SERVICE_PERMISSIONS.CALL_REPORTS),
  CALL_STATUS: Object.values(CALL_SERVICE_PERMISSIONS.CALL_STATUS),
  ROLES: Object.values(CALL_SERVICE_PERMISSIONS.ROLES),
  PERMISSIONS: Object.values(CALL_SERVICE_PERMISSIONS.PERMISSIONS),
  USERS: Object.values(CALL_SERVICE_PERMISSIONS.USERS),
} as const;

// Helper functions for permission checking
export const hasAnyPermission = (userPermissions: string[], requiredPermissions: string[]) => {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
};

export const hasAllPermissions = (userPermissions: string[], requiredPermissions: string[]) => {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
};

export const canAccessModule = (userPermissions: string[], modulePermissions: string[]) => {
  return hasAnyPermission(userPermissions, modulePermissions);
};

// Type definitions
export type CallServicePermission = string; // All permissions are strings
export type PermissionGroup = keyof typeof PERMISSION_GROUPS;
