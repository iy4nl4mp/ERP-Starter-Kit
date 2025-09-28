"use client";

import React from "react";
import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Footer from "@/components/Footer";

/**
 * AppShell: Global app chrome containing Topbar + Sidebar.
 * - Shown on all authenticated app pages.
 * - Hidden on auth routes like /login and /register.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Routes that should NOT show the global chrome (auth/public pages)
  const noChrome = pathname === "/login" || pathname === "/register";

  if (noChrome) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 text-slate-800">
        <Topbar />
        <div className="mx-auto flex max-w-[1400px] gap-0 px-0 sm:px-4">
          <Sidebar />
          <main className="min-h-[calc(100vh-56px)] flex-1 p-4 sm:p-6">
            <div className="rounded-xl border bg-white/80 p-4 shadow-sm backdrop-blur">
              {children}
            </div>
          </main>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}