"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface FormData {
  username: string;
  password: string;
  rememberMe: boolean;
}

interface FieldErrors {
  [key: string]: string;
}

export default function LoginPage() {
  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const router = useRouter();
  const { login, error, clearError } = useAuth();

  const validateForm = () => {
    const errors: FieldErrors = {};

    if (!formData.username.trim()) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await login({
        username: formData.username,
        password: formData.password,
        deviceId: `web-${Date.now()}`,
      });

      // Redirect to dashboard or intended page
      const returnUrl =
        new URLSearchParams(window.location.search).get("returnUrl") || "/";
      router.push(returnUrl);
    } catch (err) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
        <div className="absolute inset-0 bg-linear-to-br from-blue-950/20 via-slate-950 to-slate-950"></div>
      </div>

      {/* Main Container */}
      <div className="relative max-w-7xl w-full z-10 px-4 sm:px-6 lg:px-8">
        <div className="relative bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-800/50 overflow-hidden">
          <div className="flex flex-col lg:flex-row">

            {/* Left Side - Brand/Promo Panel */}
            <div className="lg:w-[70%] relative min-h-[300px] lg:min-h-[700px]">
              {/* Background Image with Gradient Overlay */}
              <div className="absolute inset-0">
                <img
                  src="/background.jpg"
                  alt="Security Background"
                  className="w-full h-full object-cover"
                />
                {/* Dark gradient overlay - lighter at top, darker at bottom */}
                <div className="absolute inset-0 bg-linear-to-b from-slate-900/30 via-slate-900/50 to-slate-950/95"></div>
              </div>

              {/* Content Overlay */}
              <div className="relative h-full flex flex-col justify-between p-8 lg:p-12">
                {/* Top Section - Logo & Branding */}
                <div className="space-y-6">
                  <div className="inline-flex items-center space-x-3">
                    <img
                      src="/Logo.png"
                      alt="VET System Logo"
                      className="w-15 h-15 object-contain"
                    />
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">VET Report System</h2>
                      <div className="h-0.5 w-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mt-1"></div>
                    </div>
                  </div>
                </div>

                {/* Bottom Section - Platform Description & Announcement Area */}
                <div className="space-y-6"></div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Enterprise Security Platform</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Advanced authentication and access management designed for mission-critical operations.
                  </p>
                </div>


              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="lg:w-[55%] flex items-center justify-center p-8 lg:p-12 bg-slate-900/30">
              <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-white mb-2">Sign In</h1>
                  <p className="text-slate-400 text-sm">Access your secure dashboard</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Username Field */}
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        className={`w-full pl-10 pr-4 py-3 bg-slate-800/50 border ${fieldErrors.username ? "border-red-500/50" : "border-slate-700/50"
                          } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all`}
                        placeholder="Enter your username"
                        value={formData.username}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                    </div>
                    {fieldErrors.username && (
                      <p className="mt-1.5 text-xs text-red-400 flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {fieldErrors.username}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        className={`w-full pl-10 pr-10 py-3 bg-slate-800/50 border ${fieldErrors.password ? "border-red-500/50" : "border-slate-700/50"
                          } rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all`}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="mt-1.5 text-xs text-red-400 flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center cursor-pointer group">
                      <input
                        id="rememberMe"
                        name="rememberMe"
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-0 cursor-pointer"
                        checked={formData.rememberMe}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                      <span className="ml-2 text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                        Remember me
                      </span>
                    </label>

                    <Link href="/forgot-password" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
                      Forgot password?
                    </Link>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
                      <div className="flex items-start">
                        <svg className="h-5 w-5 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">{error}</span>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full flex justify-center items-center py-3 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <svg className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-700/50"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-3 bg-slate-900/30 text-slate-500">Need assistance?</span>
                    </div>
                  </div>

                  {/* Contact Admin */}
                  <div className="text-center">
                    <p className="text-sm text-slate-400">
                      Don't have an account?{" "}
                      <a href="https://t.me/heangchihav" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
                        Contact Administrator
                      </a>
                    </p>
                  </div>
                </form>

                {/* Security Notice */}
                <div className="mt-8 text-center">
                  <p className="text-xs text-slate-500">
                    Protected by enterprise-grade encryption
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}