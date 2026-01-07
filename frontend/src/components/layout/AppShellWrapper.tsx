"use client";

import { Suspense, ReactNode } from "react";
import { AppShell } from "./AppShell";

type AppShellWrapperProps = {
  children: ReactNode;
};

function AppShellContent({ children }: AppShellWrapperProps) {
  return <AppShell>{children}</AppShell>;
}

function AppShellFallback() {
  return (
    <main className="min-h-screen bg-linear-to-br from-blue-50 via-orange-50 to-blue-100 text-slate-800 flex items-center justify-center relative overflow-hidden scrollbar-hide">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="flex flex-col items-center gap-4 relative z-10">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-pulse"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-orange-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        </div>
        <span className="text-sm text-slate-600 animate-pulse font-medium">
          Loading application…
        </span>
      </div>
    </main>
  );
}

export function AppShellWrapper({ children }: AppShellWrapperProps) {
  return (
    <Suspense fallback={<AppShellFallback />}>
      <AppShellContent>{children}</AppShellContent>
    </Suspense>
  );
}
