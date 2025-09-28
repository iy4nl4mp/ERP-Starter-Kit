"use client";

import React from "react";

/**
 * Dashboard route-specific layout
 * With global AppShell now applied in RootLayout, this layout simply passes through.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}