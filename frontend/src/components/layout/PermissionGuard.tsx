"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

// Updated permission map to match the new semantic database structure
const MENU_PERMISSION_MAP: Record<string, string> = {
  // Dashboard permissions
  canViewDashboard: "dashboard.view",
  canViewOverview: "dashboard.overview",
  canViewEscalations: "dashboard.escalations",
  canViewQueueHealth: "dashboard.queue-health",

  // Area Management permissions
  canViewAreas: "area.view",
  canCreateAreas: "area.create",
  canEditAreas: "area.edit",
  canDeleteAreas: "area.delete",

  // Subarea Management permissions
  canViewSubareas: "subarea.view",
  canCreateSubareas: "subarea.create",
  canEditSubareas: "subarea.edit",
  canDeleteSubareas: "subarea.delete",

  // Branch Management permissions
  canViewBranches: "branch.view",
  canCreateBranches: "branch.create",
  canEditBranches: "branch.edit",
  canUpdateBranches: "branch.update",
  canDeleteBranches: "branch.delete",

  // User Branch Assignment permissions
  canAssignUserBranch: "user.branch.assign",
  canRemoveUserBranch: "user.branch.remove",
  canViewUserBranchAssignments: "user.branch.view",

  // Call Reports permissions
  canViewCallReports: "call-report.view",
  canCreateCallReports: "call-report.create",
  canEditCallReports: "call-report.edit",
  canDeleteCallReports: "call-report.delete",

  // Call Status permissions
  canViewCallStatus: "call-status.view",
  canCreateCallStatus: "call-status.create",
  canEditCallStatus: "call-status.edit",
  canDeleteCallStatus: "call-status.delete",

  // Role Management permissions
  canViewRoles: "role.view",
  canManageRoles: "role.manage",
  canAssignRoles: "role.assign",

  // Permission Management permissions
  canViewPermissions: "permission.view",
  canManagePermissions: "permission.manage",

  // User Management permissions
  canViewUsers: "user.view",
  canCreateUsers: "user.create",
  canEditUsers: "user.edit",
  canDeleteUsers: "user.delete",
  canAssignUsers: "user.assign",
};

const resolvePermissionCode = (key: string) => MENU_PERMISSION_MAP[key] ?? key;

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  serviceContext?: string;
}

export function PermissionGuard({
  permission,
  children,
  fallback = null,
  serviceContext,
}: PermissionGuardProps) {
  const { user, hasPermission } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (!user) {
        if (!cancelled) setAllowed(false);
        return;
      }

      try {
        const result = await hasPermission(permission, serviceContext);
        if (!cancelled) setAllowed(result);
      } catch (error) {
        console.error('Permission check failed:', error);
        if (!cancelled) setAllowed(false);
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [user?.id, permission, serviceContext]);

  if (allowed === null) {
    return <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>;
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}

interface MenuGuardProps {
  menuKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function MenuGuard({
  menuKey,
  children,
  fallback = null,
}: MenuGuardProps) {
  const { user, hasPermission } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (!user) {
        if (!cancelled) setAllowed(false);
        return;
      }

      try {
        const permissionCode = resolvePermissionCode(menuKey);
        const result = await hasPermission(permissionCode);
        if (!cancelled) setAllowed(result);
      } catch (error) {
        console.error('Menu permission check failed:', error);
        if (!cancelled) setAllowed(false);
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [user?.id, menuKey]);

  if (allowed === null) {
    return <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>;
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}

export function usePermission(permission: string) {
  const { user, hasPermission } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (!user) {
        if (!cancelled) setAllowed(false);
        return;
      }

      try {
        const result = await hasPermission(permission);
        if (!cancelled) setAllowed(result);
      } catch (error) {
        console.error('Permission check failed:', error);
        if (!cancelled) setAllowed(false);
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [user?.id, permission]);

  return {
    hasPermission: allowed,
    loading: allowed === null,
  };
}

const DEFAULT_MENU_KEYS = Object.keys(MENU_PERMISSION_MAP);

export function useMenuPermissions(keys: string[] = DEFAULT_MENU_KEYS) {
  const { user, hasPermission } = useAuth();
  const [menuPermissions, setMenuPermissions] = useState<
    Record<string, boolean>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkPermissions = async () => {
      if (!user) {
        if (!cancelled) {
          setMenuPermissions({});
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const results = await Promise.all(
          keys.map(async (key) => {
            const code = resolvePermissionCode(key);
            const allowed = await hasPermission(code);
            return [key, allowed] as const;
          }),
        );

        if (!cancelled) {
          setMenuPermissions(Object.fromEntries(results));
          setLoading(false);
        }
      } catch (error) {
        console.error('Menu permissions check failed:', error);
        if (!cancelled) {
          setMenuPermissions({});
          setLoading(false);
        }
      }
    };

    checkPermissions();

    return () => {
      cancelled = true;
    };
  }, [keys.join(','), user?.id]);

  const hasMenuAccess = (menuKey: string): boolean => {
    return menuPermissions[menuKey] || false;
  };

  return { menuPermissions, loading, hasMenuAccess };
}
