'use client'

import { useAuth } from '../src/contexts/AuthContext'
import Link from 'next/link'

export default function Home() {
  const { user, isLoading, isAuthenticated, logout } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <main className="flex flex-col items-center gap-8 text-center p-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-zinc-50">
            Welcome to Lucky System
          </h1>
          <p className="text-lg text-gray-600 dark:text-zinc-400 max-w-md">
            Please sign in to access your dashboard.
          </p>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 text-white transition-colors hover:bg-indigo-700"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="flex h-12 items-center justify-center rounded-full border border-gray-300 px-8 transition-colors hover:bg-gray-50"
            >
              Create Account
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Lucky System</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {user?.fullName || user?.username}</span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
              <p className="text-gray-600 mb-2">Welcome to your dashboard!</p>
              <p className="text-sm text-gray-500">
                Last login: {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
