"use client";

import React, { useEffect, useMemo, useState, FormEvent } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";
import axios from "axios";
import Link from "next/link";

type MenuItem = {
  id: number;
  menu_name: string;
  parent_id: number;
  url: string;
  icon?: string | null;
  menu_order: number;
};

type MenuPayload = {
  menu_name: string;
  parent_id: number | string;
  url: string;
  icon?: string | null;
  menu_order: number | string;
};

// Helper types & error extractor to avoid using `any` in catch blocks
type ApiErrorPayload = {
  messages?: { error?: string };
  error?: string;
  message?: string;
};

const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const payload = err.response?.data as ApiErrorPayload | undefined;
    return (
      payload?.messages?.error ??
      payload?.error ??
      payload?.message ??
      err.message ??
      "Request failed"
    );
  }
  if (err instanceof Error) {
    return err.message;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
};

export default function MenusPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [newMenu, setNewMenu] = useState<MenuPayload>({
    menu_name: "",
    parent_id: 0,
    url: "",
    icon: "",
    menu_order: 0,
  });
  // Add modal state + parent search query for "select2-like" behavior
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [parentQuery, setParentQuery] = useState<string>("");

  // Edit modal + select2-like query
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editParentQuery, setEditParentQuery] = useState<string>("");

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editMenu, setEditMenu] = useState<MenuPayload>({
    menu_name: "",
    parent_id: 0,
    url: "",
    icon: "",
    menu_order: 0,
  });

  const loadMenus = async () => {
    setLoading(true);
    try {
      const res = await api.get("/menus");
      setMenus(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to load menus");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      await loadMenus();
    })();
    return () => {
      active = false; // kept for pattern consistency
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
    for (const [key, arr] of map.entries()) {
      arr.sort((a, b) => a.menu_order - b.menu_order);
      map.set(key, arr);
    }
    return map;
  }, [menus]);

  // Search + flat sorted list for table rendering
  const [search, setSearch] = useState<string>("");
  const filteredMenus = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return menus;
    return menus.filter((m) => {
      const name = m.menu_name.toLowerCase();
      const url = (m.url ?? "").toLowerCase();
      return name.includes(q) || url.includes(q);
    });
  }, [menus, search]);

  const sortedMenus = useMemo(
    () => filteredMenus.slice().sort((a, b) => a.menu_order - b.menu_order),
    [filteredMenus]
  );

  // Paging state and helpers
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageCount = Math.max(1, Math.ceil(sortedMenus.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;

  const pagedMenus = useMemo(
    () => sortedMenus.slice(startIndex, startIndex + pageSize),
    [sortedMenus, startIndex, pageSize]
  );

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };
  const goPrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNextPage = () => setCurrentPage((p) => Math.min(pageCount, p + 1));

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [pageCount, currentPage]);

  const parentName = (pid: number) =>
    pid === 0 ? "Root" : menus.find((m) => m.id === pid)?.menu_name ?? `ID ${pid}`;

  // Select2-like filtered parent options (Add modal)
  const filteredParents = useMemo(() => {
    const q = parentQuery.trim().toLowerCase();
    const arr = menus.slice().sort((a, b) => a.menu_order - b.menu_order);
    if (!q) return arr;
    return arr.filter((m) => {
      const name = m.menu_name.toLowerCase();
      const url = (m.url ?? "").toLowerCase();
      return name.includes(q) || url.includes(q);
    });
  }, [menus, parentQuery]);

  const closeAddModal = () => setShowAddModal(false);
  const handleSelectParent = (pid: number) => {
    setNewMenu((s) => ({ ...s, parent_id: pid }));
  };

  // Select2-like filtered parent options (Edit modal)
  const editFilteredParents = useMemo(() => {
    const q = editParentQuery.trim().toLowerCase();
    const arr = menus.slice().sort((a, b) => a.menu_order - b.menu_order);
    if (!q) return arr;
    return arr.filter((m) => {
      const name = m.menu_name.toLowerCase();
      const url = (m.url ?? "").toLowerCase();
      return name.includes(q) || url.includes(q);
    });
  }, [menus, editParentQuery]);

  const closeEditModal = () => setShowEditModal(false);
  const handleSelectParentEdit = (pid: number) => {
    setEditMenu((s) => ({ ...s, parent_id: pid }));
  };
  
  // Handlers: Create
  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/menus", {
        menu_name: newMenu.menu_name.trim(),
        parent_id: Number(newMenu.parent_id) || 0,
        url: newMenu.url.trim(),
        icon:
          newMenu.icon !== undefined && newMenu.icon !== null
            ? String(newMenu.icon).trim() || null
            : null,
        menu_order: Number(newMenu.menu_order) || 0,
      });
      setNewMenu({ menu_name: "", parent_id: 0, url: "", icon: "", menu_order: 0 });
      setShowAddModal(false);
      await loadMenus();
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to create menu");
    }
  };

  // Handlers: Edit
  const startEdit = (m: MenuItem) => {
    setEditingId(m.id);
    setEditMenu({
      menu_name: m.menu_name,
      parent_id: m.parent_id,
      url: m.url,
      icon: m.icon ?? "",
      menu_order: m.menu_order,
    });
    setEditParentQuery("");
    setShowEditModal(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editingId == null) return;
    try {
      await api.put(`/menus/${editingId}`, {
        menu_name: String(editMenu.menu_name).trim(),
        parent_id: Number(editMenu.parent_id) || 0,
        url: String(editMenu.url).trim(),
        icon:
          editMenu.icon !== undefined && editMenu.icon !== null
            ? String(editMenu.icon).trim() || null
            : null,
        menu_order: Number(editMenu.menu_order) || 0,
      });
      setEditingId(null);
      setShowEditModal(false);
      await loadMenus();
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to update menu");
    }
  };

  // Handler: Delete
  const handleDelete = async (id: number) => {
    const yes = typeof window !== "undefined" ? window.confirm("Delete this menu?") : true;
    if (!yes) return;
    try {
      await api.delete(`/menus/${id}`);
      await loadMenus();
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to delete menu");
    }
  };

  // Render edit form (reusable for root and child)
  const renderEditForm = (label: string) => (
    <form onSubmit={handleUpdateSubmit} className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-sm text-gray-600">Menu Name ({label})</label>
        <input
          type="text"
          required
          value={String(editMenu.menu_name)}
          onChange={(e) => setEditMenu((s) => ({ ...s, menu_name: e.target.value }))}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600">Parent ID</label>
        <input
          type="number"
          value={Number(editMenu.parent_id)}
          onChange={(e) =>
            setEditMenu((s) => ({ ...s, parent_id: Number(e.target.value) }))
          }
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600">URL</label>
        <input
          type="text"
          required
          value={String(editMenu.url)}
          onChange={(e) => setEditMenu((s) => ({ ...s, url: e.target.value }))}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600">Icon</label>
        <input
          type="text"
          value={String(editMenu.icon ?? "")}
          onChange={(e) => setEditMenu((s) => ({ ...s, icon: e.target.value }))}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600">Menu Order</label>
        <input
          type="number"
          value={Number(editMenu.menu_order)}
          onChange={(e) =>
            setEditMenu((s) => ({ ...s, menu_order: Number(e.target.value) }))
          }
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="flex items-end gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={cancelEdit}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );

  return (
    <ProtectedRoute>
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Menus</h1>

        {/* Header + controls */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Daftar Menus</h2>
          <button
            type="button"
            className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => {
              setNewMenu({ menu_name: "", parent_id: 0, url: "", icon: "", menu_order: 0 });
              setParentQuery("");
              setShowAddModal(true);
            }}
          >
            Tambah
          </button>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="text-sm text-gray-600">Total: {sortedMenus.length}</div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="border rounded px-3 py-2"
              placeholder="Cari nama atau URL..."
            />
            <label className="flex items-center gap-2 text-sm">
              <span>Page size</span>
              <select
                className="border rounded px-2 py-1"
                value={pageSize}
                onChange={handlePageSizeChange}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </label>
          </div>
        </div>

        {/* List and edit/delete */}
        <section className="mt-4">
          {loading && <p>Loading...</p>}
          {error && <p className="text-red-600">{error}</p>}

          {!loading && !error && (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                  <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left border-b">Menu Name</th>
                    <th className="px-3 py-2 text-left border-b">Parent</th>
                    <th className="px-3 py-2 text-left border-b">URL</th>
                    <th className="px-3 py-2 text-left border-b">Icon</th>
                    <th className="px-3 py-2 text-left border-b">Order</th>
                    <th className="px-3 py-2 text-left border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedMenus.map((m) => (
                    <tr key={m.id} className="border-b">
                      <td className="px-3 py-2 font-medium">{m.menu_name}</td>
                      <td className="px-3 py-2">{parentName(m.parent_id)}</td>
                      <td className="px-3 py-2">
                        {m.url && m.url !== "#" ? (
                          <Link href={m.url} className="text-blue-600 hover:underline">
                            {m.url}
                          </Link>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2">{m.icon ?? "-"}</td>
                      <td className="px-3 py-2">{m.menu_order}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(m)}
                            className="px-2 py-1 rounded bg-yellow-600 text-white hover:bg-yellow-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sortedMenus.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-center text-gray-600" colSpan={6}>
                        Tidak ada data menu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-between mt-3">
              <div className="text-sm text-gray-600">Halaman {currentPage} dari {pageCount}</div>
              <div className="flex gap-2">
                <button
                  className="px-2 py-1 rounded border hover:bg-gray-50"
                  onClick={goPrevPage}
                  disabled={currentPage <= 1}
                >
                  Prev
                </button>
                <button
                  className="px-2 py-1 rounded border hover:bg-gray-50"
                  onClick={goNextPage}
                  disabled={currentPage >= pageCount}
                >
                  Next
                </button>
              </div>
            </div>
          </>
          )}
        </section>

        {/* Edit Menu Modal */}
        {showEditModal && editingId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-lg rounded bg-white shadow-lg">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Edit Menu</h2>
                <button
                  className="text-gray-600 hover:text-black"
                  onClick={closeEditModal}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleUpdateSubmit} className="px-4 py-4 space-y-4">
                {error && <div className="text-red-600">{error}</div>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-gray-600">Menu Name</label>
                    <input
                      type="text"
                      required
                      value={String(editMenu.menu_name)}
                      onChange={(e) => setEditMenu((s) => ({ ...s, menu_name: e.target.value }))}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Parent (Select2-like)</label>
                    <div className="flex items-center gap-2 mb-2 text-sm">
                      <span className="text-gray-700">Dipilih:</span>
                      <span className="px-2 py-1 rounded bg-gray-100">
                        {parentName(Number(editMenu.parent_id))}
                      </span>
                      <button
                        type="button"
                        className="px-2 py-1 rounded border hover:bg-gray-50"
                        onClick={() => handleSelectParentEdit(0)}
                      >
                        Reset ke Root
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editParentQuery}
                      onChange={(e) => setEditParentQuery(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="Cari parent menu (ketik nama atau URL)..."
                    />
                    <div className="mt-2 max-h-48 overflow-auto border rounded">
                      <button
                        type="button"
                        onClick={() => handleSelectParentEdit(0)}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${Number(editMenu.parent_id) === 0 ? "bg-blue-50" : ""}`}
                      >
                        Root (0)
                      </button>
                      {editFilteredParents.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleSelectParentEdit(Number(m.id))}
                          className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${Number(editMenu.parent_id) === Number(m.id) ? "bg-blue-50" : ""}`}
                          title={m.url}
                        >
                          <div className="flex items-center justify-between">
                            <span>{m.menu_name}</span>
                            <span className="text-xs text-gray-500">{m.url || "-"}</span>
                          </div>
                        </button>
                      ))}
                      {editFilteredParents.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500">Tidak ada hasil.</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600">URL</label>
                    <input
                      type="text"
                      required
                      value={String(editMenu.url)}
                      onChange={(e) => setEditMenu((s) => ({ ...s, url: e.target.value }))}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Icon</label>
                    <input
                      type="text"
                      value={String(editMenu.icon ?? "")}
                      onChange={(e) => setEditMenu((s) => ({ ...s, icon: e.target.value }))}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Menu Order</label>
                    <input
                      type="number"
                      value={Number(editMenu.menu_order)}
                      onChange={(e) => setEditMenu((s) => ({ ...s, menu_order: Number(e.target.value) }))}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="px-3 py-2 rounded border hover:bg-gray-50"
                    onClick={closeEditModal}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Menu Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-lg rounded bg-white shadow-lg">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Tambah Menu</h2>
                <button
                  className="text-gray-600 hover:text-black"
                  onClick={closeAddModal}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleCreateSubmit} className="px-4 py-4 space-y-4">
                {error && <div className="text-red-600">{error}</div>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-gray-600">Menu Name</label>
                    <input
                      type="text"
                      required
                      value={newMenu.menu_name}
                      onChange={(e) => setNewMenu((s) => ({ ...s, menu_name: e.target.value }))}
                      className="w-full border rounded px-3 py-2"
                      placeholder="e.g. Reports"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Parent (Select2-like)</label>
                    <div className="flex items-center gap-2 mb-2 text-sm">
                      <span className="text-gray-700">Dipilih:</span>
                      <span className="px-2 py-1 rounded bg-gray-100">
                        {parentName(Number(newMenu.parent_id))}
                      </span>
                      <button
                        type="button"
                        className="px-2 py-1 rounded border hover:bg-gray-50"
                        onClick={() => handleSelectParent(0)}
                      >
                        Reset ke Root
                      </button>
                    </div>
                    <input
                      type="text"
                      value={parentQuery}
                      onChange={(e) => setParentQuery(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="Cari parent menu (ketik nama atau URL)..."
                    />
                    <div className="mt-2 max-h-48 overflow-auto border rounded">
                      <button
                        type="button"
                        onClick={() => handleSelectParent(0)}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${Number(newMenu.parent_id) === 0 ? "bg-blue-50" : ""}`}
                      >
                        Root (0)
                      </button>
                      {filteredParents.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleSelectParent(Number(m.id))}
                          className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${Number(newMenu.parent_id) === Number(m.id) ? "bg-blue-50" : ""}`}
                          title={m.url}
                        >
                          <div className="flex items-center justify-between">
                            <span>{m.menu_name}</span>
                            <span className="text-xs text-gray-500">{m.url || "-"}</span>
                          </div>
                        </button>
                      ))}
                      {filteredParents.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500">Tidak ada hasil.</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600">URL</label>
                    <input
                      type="text"
                      required
                      value={newMenu.url}
                      onChange={(e) => setNewMenu((s) => ({ ...s, url: e.target.value }))}
                      className="w-full border rounded px-3 py-2"
                      placeholder="/reports"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Icon</label>
                    <input
                      type="text"
                      value={String(newMenu.icon ?? "")}
                      onChange={(e) => setNewMenu((s) => ({ ...s, icon: e.target.value }))}
                      className="w-full border rounded px-3 py-2"
                      placeholder="optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Menu Order</label>
                    <input
                      type="number"
                      value={Number(newMenu.menu_order)}
                      onChange={(e) => setNewMenu((s) => ({ ...s, menu_order: Number(e.target.value) }))}
                      className="w-full border rounded px-3 py-2"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="px-3 py-2 rounded border hover:bg-gray-50"
                    onClick={closeAddModal}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
