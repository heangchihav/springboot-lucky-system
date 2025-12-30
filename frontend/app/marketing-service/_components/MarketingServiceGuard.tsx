'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/src/contexts/AuthContext'

type MarketingServiceGuardProps = {
  children: ReactNode
  fallback?: ReactNode
}

export function MarketingServiceGuard({ children, fallback = null }: MarketingServiceGuardProps) {
  const { isAuthenticated, hasServiceAccess } = useAuth()

  if (!isAuthenticated || !hasServiceAccess('marketing')) {
    return (
      fallback ?? (
        <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-white/10 bg-red-500/5 p-10 text-center text-slate-200">
          <div>
            <p className="text-2xl font-semibold text-white">Access restricted</p>
            <p className="mt-3 text-sm text-slate-300">
              You need marketing-service access to view this dashboard.&nbsp;Contact an administrator if you believe this is a mistake.
            </p>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}
