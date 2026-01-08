"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const MENU_PERMISSION_MAP: Record<string, string> = {
  canViewDashboard: "menu.1.view",
  canViewBranches: "menu.2.view",
  canManageBranches: "menu.2.branch.create",
  canViewCalls: "menu.1.view",
  canManageCalls: "menu.1.edit",
  canViewQueue: "menu.3.view",
  canManageQueue: "menu.3.analytics",
  canViewReports: "menu.3.view",
  canManageUsers: "menu.4.view",
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
        setAllowed(false);
        return;
      }

      const result = await hasPermission(permission, serviceContext);
      if (!cancelled) {
        setAllowed(result);
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [user, permission, serviceContext, hasPermission]);

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
        setAllowed(false);
        return;
      }

      const permissionCode = resolvePermissionCode(menuKey);
      const result = await hasPermission(permissionCode);
      if (!cancelled) {
        setAllowed(result);
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [user, menuKey, hasPermission]);

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
        setAllowed(false);
        return;
      }

      const result = await hasPermission(permission);
      if (!cancelled) {
        setAllowed(result);
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [user, permission, hasPermission]);

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
        setMenuPermissions({});
        setLoading(false);
        return;
      }

      setLoading(true);
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
    };

    checkPermissions();

    return () => {
      cancelled = true;
    };
  }, [keys, user, hasPermission]);

  const hasMenuAccess = (menuKey: string): boolean => {
    return menuPermissions[menuKey] || false;
  };

  return { menuPermissions, loading, hasMenuAccess };
}
