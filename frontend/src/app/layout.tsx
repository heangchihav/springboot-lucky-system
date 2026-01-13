import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { AppShellWrapper } from "@/components/layout/AppShellWrapper";
import { ToastProvider } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VET Report System",
  description: "Reporting & Analytics - Comprehensive practice management and reporting system",
  openGraph: {
    title: "VET Report System",
    description: "Reporting & Analytics - Comprehensive practice management and reporting system",
    images: [
      {
        url: "/Logo.png",
        width: 512,
        height: 512,
        alt: "VET Report System Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VET Report System",
    description: "Reporting & Analytics - Comprehensive practice management and reporting system",
    images: ["/Logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-slate-950 text-slate-100 antialiased`}
      >
        <PreferencesProvider>
          <AuthProvider>
            <ToastProvider>
              <AppShellWrapper>{children}</AppShellWrapper>
            </ToastProvider>
          </AuthProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
