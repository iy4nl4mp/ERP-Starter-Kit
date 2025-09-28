"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Topbar with hover-triggered user dropdown.
 * - Hover near the user avatar to show Profile & Logout.
 * - Hide when mouse leaves the avatar/menu area (small delay to prevent flicker).
 */
export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const hideTimer = useRef<number | null>(null);

  const openMenu = () => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setMenuOpen(true);
  };

  const closeMenu = () => {
    // Small delay to allow pointer to move between avatar and dropdown
    hideTimer.current = window.setTimeout(() => {
      setMenuOpen(false);
      hideTimer.current = null;
    }, 120);
  };

  const onLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 text-white shadow-md">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-white/20 flex items-center justify-center font-bold">
            E
          </div>
          <Link href="/dashboard" className="font-semibold tracking-wide">
            ERP Starter
          </Link>
          {/*<span className="ml-3 hidden text-white/80 sm:block">
            {pathname}
          </span>*/}
        </div>

        {/* Right actions: user avatar with hover dropdown */}
        <div className="flex items-center gap-3">
          <div
            className="relative ml-2 flex items-center gap-2"
            onMouseEnter={openMenu}
            onMouseLeave={closeMenu}
          >
            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              {user?.name?.slice(0, 1)?.toUpperCase() ?? "U"}
            </div>

            {/* Inline user info (optional on larger screens) */}
            <div className="leading-tight hidden sm:block">
              <div className="text-sm font-medium">
                {user?.name ?? "User"}
              </div>
            </div>

            {/* Dropdown menu */}
            {menuOpen && (
              <div
                role="menu"
                aria-label="User menu"
                className="absolute right-0 top-10 min-w-[180px] rounded-md border border-white/20 bg-white text-slate-800 shadow-lg"
                onMouseEnter={openMenu}
                onMouseLeave={closeMenu}
              >
                
                <ul className="py-1">
                  <li>
                    <Link
                      href="/profile"
                      className="block px-3 py-2 text-sm hover:bg-slate-100"
                      role="menuitem"
                    >
                      Profile
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={onLogout}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                      role="menuitem"
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}