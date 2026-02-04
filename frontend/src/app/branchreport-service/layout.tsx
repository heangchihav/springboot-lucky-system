"use client";

import { BranchreportServiceGuard } from "@/components/branchreport-service/BranchreportServiceGuard";
import Link from "next/link";

export default function BranchreportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BranchreportServiceGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/branchreport-service/area-branch" className="text-xl font-semibold text-gray-900">
                  Branch Report Service
                </Link>
              </div>
              <nav className="flex space-x-4">
                <Link
                  href="/branchreport-service/area-branch"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Area & Branch Management
                </Link>
                <Link
                  href="/"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Back to Home
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>{children}</main>
      </div>
    </BranchreportServiceGuard>
  );
}
