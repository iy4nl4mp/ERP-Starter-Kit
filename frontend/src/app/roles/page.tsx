'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import api from '../../lib/api';
import ProtectedRoute from '../../components/ProtectedRoute';

type Role = {
  id: number;
  role_name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

type RolePermission = {
  id?: number;
  role_id: number;
  menu_id: number;
};

type Menu = {
  id: number;
  menu_name: string;
  parent_id: number;
  url: string;
  icon?: string | null;
  menu_order?: number;
};

interface ApiErrorPayload {
  status?: number;
  error?: string | Record<string, string>;
  message?: string;
  messages?: { [key: string]: string } | { error?: string };
}

/**
 * Safely extract array of menu_ids from various API response shapes.
 * Accepts either:
 * - RolePermission[] (each item has menu_id), or
 * - { data: RolePermission[] } (wrapped), or nested similarly.
 */
const extractMenuIds = (data: unknown): number[] => {
  const collect = (arr: unknown): number[] => {
    if (!Array.isArray(arr)) return [];
    const out: number[] = [];
    for (const item of arr) {
      if (item && typeof item === 'object' && 'menu_id' in (item as Record<string, unknown>)) {
        const id = Number((item as { menu_id: unknown }).menu_id);
        if (!Number.isNaN(id)) out.push(id);
      }
    }
    return out;
  };

  // Case 0: sometimes API returns a JSON string, parse it first
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return extractMenuIds(parsed);
    } catch {
      // ignore parse errors
    }
  }

  // Case 1: direct array of role_permissions
  if (Array.isArray(data)) return collect(data);

  // Case 2/3: wrapped or associative object
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;

    // Wrapped as { data: [...] }
    if ('data' in obj) {
      return extractMenuIds((obj as { data?: unknown }).data);
    }

    // Some backends wrap payload differently (e.g., { result: [...] } or { payload: [...] })
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      // Try to collect directly if it's an array
      const direct = collect(val as unknown);
      if (direct.length > 0) return direct;
      // Try nested one level deeper
      if (val && typeof val === 'object') {
        const nested = extractMenuIds(val as unknown);
        if (nested.length > 0) return nested;
      }
    }

    // Fallback: CI may return associative object { "0": {...}, "1": {...}, ... }
    const values = Object.values(obj);
    if (values.length > 0) {
      const viaValues = collect(values);
      if (viaValues.length > 0) return viaValues;
    }
  }

  return [];
};

const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const payload = err.response?.data as ApiErrorPayload;

    let msg: unknown;

    const messages = payload?.messages;
    if (messages && typeof messages === 'object' && 'error' in messages) {
      msg = (messages as { error?: string }).error;
    }

    msg = msg || payload?.error || payload?.message || err.message;

    if (typeof msg === 'string') return msg;
    if (msg && typeof msg === 'object') return Object.values(msg as Record<string, string>).join(', ');
    return 'Request failed';
  }
  if (err instanceof Error) return err.message;
  return 'Unknown error';
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newRoleName, setNewRoleName] = useState<string>('');
  const [newRoleDesc, setNewRoleDesc] = useState<string>('');
  const [savingAdd, setSavingAdd] = useState<boolean>(false);
  const [addError, setAddError] = useState<string | null>(null);
type PermState = { open: boolean; loading: boolean; error?: string | null; items?: RolePermission[] };
const [permByRole, setPermByRole] = useState<Record<number, PermState>>({});

// Edit Role modal state
const [showEditModal, setShowEditModal] = useState<boolean>(false);
const [editRoleId, setEditRoleId] = useState<number | null>(null);
const [editRoleName, setEditRoleName] = useState<string>('');
const [editRoleDesc, setEditRoleDesc] = useState<string>('');
const [editError, setEditError] = useState<string | null>(null);
const [savingEdit, setSavingEdit] = useState<boolean>(false);

// Permissions modal state
const [showPermModal, setShowPermModal] = useState<boolean>(false);
const [permRoleId, setPermRoleId] = useState<number | null>(null);
const [permLoading, setPermLoading] = useState<boolean>(false);
const [permErrorModal, setPermErrorModal] = useState<string | null>(null);
const [menus, setMenus] = useState<Menu[]>([]);
const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);
const [savingPerm, setSavingPerm] = useState<boolean>(false);

// List UI controls: search, paging
const [search, setSearch] = useState<string>('');
const [pageSize, setPageSize] = useState<number>(10);
const [currentPage, setCurrentPage] = useState<number>(1);

const filteredRoles = roles.filter((r) => {
  const s = search.trim().toLowerCase();
  if (!s) return true;
  const name = r.role_name.toLowerCase();
  const desc = (r.description ?? '').toLowerCase();
  return name.includes(s) || desc.includes(s);
});

const pageCount = Math.max(1, Math.ceil(filteredRoles.length / pageSize));
const startIndex = (currentPage - 1) * pageSize;
const pagedRoles = filteredRoles.slice(startIndex, startIndex + pageSize);

const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const val = Number(e.target.value);
  setPageSize(val);
  setCurrentPage(1);
};

const goPrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
const goNextPage = () => setCurrentPage((p) => Math.min(pageCount, p + 1));

useEffect(() => {
  if (currentPage > pageCount) setCurrentPage(pageCount);
}, [pageCount, currentPage]);
  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Role[]>('/roles');
      setRoles(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const openAdd = () => {
    setNewRoleName('');
    setNewRoleDesc('');
    setAddError(null);
    setShowAddModal(true);
  };
  const closeAdd = () => {
    if (savingAdd) return;
    setShowAddModal(false);
  };

  // Edit Role handlers
  const openEdit = (role: Role) => {
    setEditRoleId(role.id);
    setEditRoleName(role.role_name);
    setEditRoleDesc(role.description ?? '');
    setEditError(null);
    setShowEditModal(true);
  };

  const closeEdit = () => {
    if (savingEdit) return;
    setShowEditModal(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRoleId) return;
    setEditError(null);
    if (!editRoleName.trim()) {
      setEditError('Role name wajib diisi');
      return;
    }
    setSavingEdit(true);
    try {
      await api.put(`/roles/${editRoleId}`, {
        role_name: editRoleName.trim(),
        description: editRoleDesc.trim() || null,
      });
      setShowEditModal(false);
      await fetchRoles();
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!newRoleName.trim()) {
      setAddError('Role name wajib diisi');
      return;
    }
    setSavingAdd(true);
    try {
      await api.post('/roles', { role_name: newRoleName.trim(), description: newRoleDesc.trim() || null });
      setShowAddModal(false);
      await fetchRoles();
    } catch (err) {
      setAddError(getErrorMessage(err));
    } finally {
      setSavingAdd(false);
    }
  };
const handleDeleteRole = async (id: number) => {
  if (!confirm('Hapus role ini?')) return;
  try {
    await api.delete(`/roles/${id}`);
    await fetchRoles();
  } catch (err) {
    // eslint-disable-next-line no-alert
    alert(getErrorMessage(err));
  }
};


  // Permissions Modal handlers
  const openPermModal = async (role: Role) => {
    setPermRoleId(role.id);
    setPermErrorModal(null);
    setShowPermModal(true);
    setPermLoading(true);
    try {
      const [menusRes, permsRes] = await Promise.all([
        api.get<Menu[]>('/menus'),
        api.get<RolePermission[]>(`/roles/${role.id}/permissions`),
      ]);
      setMenus(menusRes.data);
      // Robust pre-check: normalize IDs and intersect with existing menus
      const rawIds = extractMenuIds(permsRes.data as unknown)
        .map((x) => Number(x))
        .filter((x) => !Number.isNaN(x));
      const allMenuIds = menusRes.data.map((m) => Number(m.id));
      const menuIdSet = new Set<number>(allMenuIds);
      const finalIds = rawIds.filter((id) => menuIdSet.has(id));

      // Debug payload (dev only)
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.log('[Roles] Permissions pre-check', {
          roleId: role.id,
          rawIds,
          menuIds: allMenuIds,
          finalIds,
          permsPayloadType: typeof permsRes.data,
        });
      }

      // Fallback: if permissions payload is empty but role is admin, pre-check all menus
      const initialIds = finalIds.length > 0 ? finalIds : (role.role_name === 'admin' ? allMenuIds : finalIds);
      setSelectedMenuIds(initialIds);
    } catch (err) {
      setPermErrorModal(getErrorMessage(err));
      setMenus([]);
      setSelectedMenuIds([]);
    } finally {
      setPermLoading(false);
    }
  };

  const closePermModal = () => {
    if (savingPerm) return;
    setShowPermModal(false);
  };

  const toggleMenuSelection = (menuId: number) => {
    setSelectedMenuIds((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  // Check All / Uncheck All helpers for permissions modal
  const checkAll = () => {
    setSelectedMenuIds(menus.map((m) => Number(m.id)));
  };
  const uncheckAll = () => {
    setSelectedMenuIds([]);
  };

  const handlePermSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permRoleId) return;
    setPermErrorModal(null);
    setSavingPerm(true);
    try {
      await api.post(`/roles/${permRoleId}/permissions`, { menu_ids: selectedMenuIds });
      setShowPermModal(false);
    } catch (err) {
      setPermErrorModal(getErrorMessage(err));
    } finally {
      setSavingPerm(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Roles</h1>
          <button
            className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={openAdd}
          >
            Tambah
          </button>
        </div>

        {/* Controls row: search and page size */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-600">Total: {filteredRoles.length}</div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="border rounded px-3 py-2"
              placeholder="Cari role/description..."
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

        {loading && <div>Loading roles...</div>}
        {error && <div className="text-red-600">Error: {error}</div>}

        {!loading && !error && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left border-b">Role</th>
                    <th className="px-3 py-2 text-left border-b">Description</th>
                    <th className="px-3 py-2 text-left border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRoles.map((r) => {
                    const perm = permByRole[r.id];
                    return (
                      <React.Fragment key={r.id}>
                        <tr className="border-b">
                          <td className="px-3 py-2">{r.role_name}</td>
                          <td className="px-3 py-2">{r.description || '-'}</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                className="px-2 py-1 rounded bg-yellow-600 text-white hover:bg-yellow-700"
                                onClick={() => openEdit(r)}
                              >
                                Edit
                              </button>
                              <button
                                className="px-2 py-1 rounded bg-gray-800 text-white hover:bg-gray-900"
                                onClick={() => openPermModal(r)}
                              >
                                Permissions
                              </button>
                              <button
                                className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                                onClick={() => handleDeleteRole(r.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                  {filteredRoles.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-center text-gray-600" colSpan={5}>
                        Tidak ada data roles.
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

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded bg-white shadow-lg">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Tambah Role</h2>
                <button
                  className="text-gray-600 hover:text-black"
                  onClick={closeAdd}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleAddSubmit} className="px-4 py-3 space-y-3">
                {addError && <div className="text-red-600">{addError}</div>}
                <div>
                  <label className="block text-sm font-medium mb-1">Role Name</label>
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Misal: admin"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Deskripsi (opsional)"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="px-3 py-2 rounded border hover:bg-gray-50"
                    onClick={closeAdd}
                    disabled={savingAdd}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    disabled={savingAdd}
                  >
                    {savingAdd ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {showPermModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-lg rounded bg-white shadow-lg">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Permissions Role</h2>
                <button
                  className="text-gray-600 hover:text-black"
                  onClick={closePermModal}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="px-4 py-3">
                {permErrorModal && <div className="text-red-600">{permErrorModal}</div>}
                {permLoading ? (
                  <div>Memuat data...</div>
                ) : (
                  <form onSubmit={handlePermSubmit} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Dipilih: {selectedMenuIds.length} / {menus.length}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="px-2 py-1 rounded border hover:bg-gray-50"
                          onClick={checkAll}
                        >
                          Check All
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 rounded border hover:bg-gray-50"
                          onClick={uncheckAll}
                        >
                          Uncheck All
                        </button>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-auto border rounded p-2">
                      {menus.length > 0 ? (
                        (() => {
                          const groups = new Map<number, Menu[]>();
                          menus.forEach((m) => {
                            const key = Number(m.parent_id || 0);
                            const arr = groups.get(key) ?? [];
                            arr.push(m);
                            groups.set(key, arr);
                          });
                          const getParentName = (pid: number) => {
                            if (pid === 0) return 'Ungrouped';
                            const parent = menus.find((x) => Number(x.id) === pid);
                            return parent?.menu_name ?? `Parent ${pid}`;
                          };
                          const isGroupAllSelected = (pid: number) => {
                            const arr = groups.get(pid) ?? [];
                            return arr.length > 0 && arr.every((m) => selectedMenuIds.includes(Number(m.id)));
                          };
                          const toggleGroup = (pid: number) => {
                            const arr = groups.get(pid) ?? [];
                            const ids = arr.map((m) => Number(m.id));
                            if (isGroupAllSelected(pid)) {
                              setSelectedMenuIds((prev) => prev.filter((id) => !ids.includes(id)));
                            } else {
                              setSelectedMenuIds((prev) => Array.from(new Set([...prev, ...ids])));
                            }
                          };
                          return Array.from(groups.entries()).map(([pid, arr]) => (
                            <div key={`group-${pid}`} className="mb-2">
                              <div className="flex items-center justify-between bg-gray-100 px-2 py-1 rounded">
                                <div className="font-medium text-sm">{getParentName(pid)}</div>
                                <button
                                  type="button"
                                  className="px-2 py-1 rounded border hover:bg-gray-50 text-xs"
                                  onClick={() => toggleGroup(pid)}
                                >
                                  {isGroupAllSelected(pid) ? 'Uncheck Group' : 'Check Group'}
                                </button>
                              </div>
                              <div className="pl-2">
                                {arr.map((m) => (
                                  <label key={m.id} className="flex items-center gap-2 py-1">
                                    <input
                                      type="checkbox"
                                      checked={selectedMenuIds.includes(Number(m.id))}
                                      onChange={() => toggleMenuSelection(Number(m.id))}
                                    />
                                    <span>{m.menu_name}</span>
                                    <span className="text-gray-500 text-xs">{m.url}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ));
                        })()
                      ) : (
                        <div>Tidak ada menu.</div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="px-3 py-2 rounded border hover:bg-gray-50"
                        onClick={closePermModal}
                        disabled={savingPerm}
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                        disabled={savingPerm}
                      >
                        {savingPerm ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded bg-white shadow-lg">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Edit Role</h2>
                <button
                  className="text-gray-600 hover:text-black"
                  onClick={closeEdit}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="px-4 py-3 space-y-3">
                {editError && <div className="text-red-600">{editError}</div>}
                <div>
                  <label className="block text-sm font-medium mb-1">Role Name</label>
                  <input
                    type="text"
                    value={editRoleName}
                    onChange={(e) => setEditRoleName(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    value={editRoleDesc}
                    onChange={(e) => setEditRoleDesc(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="px-3 py-2 rounded border hover:bg-gray-50"
                    onClick={closeEdit}
                    disabled={savingEdit}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    disabled={savingEdit}
                  >
                    {savingEdit ? 'Menyimpan...' : 'Simpan'}
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
