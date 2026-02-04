"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

interface BranchreportServiceGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function BranchreportServiceGuard({ children, fallback }: BranchreportServiceGuardProps) {
  const { hasServiceAccess } = useAuth();

  // For now, allow all users to access branchreport service
  // You can add service-specific permission checks here later
  const hasAccess = true; // hasServiceAccess("branchreport");

  if (!hasAccess) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">You don't have permission to access the Branch Report service.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
