"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import api from "@/lib/api";

type MenuItem = {
  id: number;
  menu_name: string;
  parent_id: number;
  url: string;
  icon?: string | null;
  menu_order: number;
};

export default function Sidebar() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<boolean>(false); // collapse entire sidebar
  const [collapsedRoots, setCollapsedRoots] = useState<Record<number, boolean>>({}); // hide/unhide per root group
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get("/menus")
      .then((res) => {
        if (!active) return;
        setMenus(Array.isArray(res.data) ? res.data : []);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err?.response?.data?.error || err?.message || "Failed to load menus"
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const roots = useMemo(
    () =>
      menus
        .filter((m) => m.parent_id === 0)
        .sort((a, b) => a.menu_order - b.menu_order),
    [menus]
  );

  const childrenMap = useMemo(() => {
    const map = new Map<number, MenuItem[]>();
    menus.forEach((m) => {
      if (m.parent_id !== 0) {
        const arr = map.get(m.parent_id) ?? [];
        arr.push(m);
        map.set(m.parent_id, arr);
      }
    });
    // sort children by menu_order
    for (const [key, arr] of map.entries()) {
      arr.sort((a, b) => a.menu_order - b.menu_order);
      map.set(key, arr);
    }
    return map;
  }, [menus]);

  const toggleRoot = (id: number) => {
    setCollapsedRoots((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isUrlActive = (url?: string | null) => {
    if (!url || url === "#") return false;
    // Consider active if current path starts with the menu url (handles sub-pages)
    // Ensure trailing slash handling
    try {
      const base = url.endsWith("/") ? url.slice(0, -1) : url;
      const current = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
      return current === base || current.startsWith(base + "/");
    } catch {
      return false;
    }
  };

  // Static doc link active state
  const docActive = isUrlActive("/doc");

  return (
    <aside
      className={`${collapsed ? "w-16" : "w-64"} shrink-0 border-r bg-white/80 backdrop-blur p-3 sm:p-4 transition-all duration-200`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className={`text-lg font-semibold ${collapsed ? "sr-only" : ""}`}>Menu</h2>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="rounded border px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
          aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
          title={collapsed ? "Show sidebar" : "Hide sidebar"}
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      {/* Doc Starter Kit link */}
      <Link
        href="/doc"
        className={[
          "block rounded px-2 py-1 text-sm",
          docActive ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-slate-100",
          collapsed ? "text-center px-0" : "",
        ].join(" ")}
        title="Doc Starter Kit"
      >
        <span className={collapsed ? "sr-only" : ""}>Doc Starter Kit</span>
        {collapsed && (
          <span aria-hidden className="inline-block w-full">
            •
          </span>
        )}
      </Link>

      {loading && <p className="text-sm text-gray-600">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <nav>
          <ul className="space-y-1">
            {roots.map((root) => {
              const children = childrenMap.get(root.id) ?? [];
              const anyChildActive = children.some((c) => isUrlActive(c.url));
              const rootActive = isUrlActive(root.url);
              const groupActive = rootActive || anyChildActive;

              const groupCollapsed = !!collapsedRoots[root.id];

              return (
                <li key={root.id}>
                  {/* Root row: link if valid url, else a toggle-only row */}
                  {root.url && root.url !== "#" ? (
                    <Link
                      href={root.url}
                      className={[
                        "block rounded px-2 py-1 text-sm",
                        groupActive
                          ? "bg-indigo-600 text-white"
                          : "text-slate-700 hover:bg-slate-100",
                        collapsed ? "text-center px-0" : "",
                      ].join(" ")}
                      title={root.menu_name}
                    >
                      <span className={collapsed ? "sr-only" : ""}>
                        {root.menu_name}
                      </span>
                      {collapsed && (
                        <span aria-hidden className="inline-block w-full">
                          •
                        </span>
                      )}
                    </Link>
                  ) : (
                    <button
                      onClick={() => toggleRoot(root.id)}
                      className={[
                        "flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm",
                        groupActive
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-slate-700 hover:bg-slate-100",
                      ].join(" ")}
                      title={root.menu_name}
                      aria-expanded={!groupCollapsed}
                      aria-controls={`menu-group-${root.id}`}
                    >
                      <span className={collapsed ? "sr-only" : ""}>
                        {root.menu_name}
                      </span>
                      {!collapsed && (
                        <span
                          className={[
                            "ml-2 inline-block text-xs transition-transform",
                            groupCollapsed ? "rotate-0" : "rotate-90",
                          ].join(" ")}
                          aria-hidden
                        >
                          ▶
                        </span>
                      )}
                    </button>
                  )}

                  {/* Children list */}
                  {children.length > 0 && !groupCollapsed && (
                    <ul
                      id={`menu-group-${root.id}`}
                      className={`${collapsed ? "pl-0" : "mt-1 pl-3"} space-y-1`}
                    >
                      {children.map((child) => {
                        const childActive = isUrlActive(child.url);
                        return (
                          <li key={child.id}>
                            {child.url && child.url !== "#" ? (
                              <Link
                                href={child.url}
                                className={[
                                  "block rounded px-2 py-1 text-sm",
                                  childActive
                                    ? "bg-indigo-600 text-white"
                                    : "text-slate-700 hover:bg-slate-100",
                                  collapsed ? "text-center px-0" : "",
                                ].join(" ")}
                                title={child.menu_name}
                              >
                                <span className={collapsed ? "sr-only" : ""}>
                                  {child.menu_name}
                                </span>
                                {collapsed && (
                                  <span aria-hidden className="inline-block w-full">
                                    •
                                  </span>
                                )}
                              </Link>
                            ) : (
                              <span
                                className={[
                                  "block rounded px-2 py-1 text-sm text-slate-400",
                                  collapsed ? "text-center px-0" : "",
                                ].join(" ")}
                                title={child.menu_name}
                              >
                                <span className={collapsed ? "sr-only" : ""}>
                                  {child.menu_name}
                                </span>
                                {collapsed && (
                                  <span aria-hidden className="inline-block w-full">
                                    •
                                  </span>
                                )}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </aside>
  );
}