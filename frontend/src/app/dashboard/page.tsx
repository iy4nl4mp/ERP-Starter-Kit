"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";

// Tipe data untuk memegang angka - angka statistik: total users, total akses, dan data pie(today, this_week, this_month, this_year).
type Stats = {
  total_users: number;
  total_dashboard_access: number;
  pie_chart_data: {
    today: number;
    this_week: number;
    this_month: number;
    this_year: number;
  };
};

// Halaman ringkasan statistik dashboard, hanya untuk user login via komponen proteksi.
export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
// Mengambil data saat mount:
  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get("/dashboard/stats")
      .then((res) => {
        if (!active) return;
        setStats(res.data as Stats);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.response?.data?.error || err?.message || "Failed to load stats");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
// Memanggil endpoint backend protected untuk statistik.Jika sukses, simpan ke state; jika gagal, simpan pesan error.Ada flag “active” untuk mencegah setState setelah unmount.
    return () => {
      active = false;
    };
  }, []);

  return (
    // Proteksi halaman
    // Mencegah akses jika belum login.Saat belum auth, dilakukan redirect ke / login dan menampilkan “Loading…”.
    <ProtectedRoute>
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded border p-4">
              <div className="text-gray-500">Total Users</div>
              <div className="text-3xl font-bold">{stats.total_users}</div>
            </div>
            <div className="rounded border p-4">
              <div className="text-gray-500">Total Dashboard Access</div>
              <div className="text-3xl font-bold">{stats.total_dashboard_access}</div>
            </div>
            <div className="rounded border p-4">
              <div className="text-gray-500">Visits Today</div>
              <div className="text-3xl font-bold">{stats.pie_chart_data.today}</div>
            </div>
            <div className="rounded border p-4">
              <div className="text-gray-500">Visits This Week</div>
              <div className="text-3xl font-bold">{stats.pie_chart_data.this_week}</div>
            </div>
            <div className="rounded border p-4">
              <div className="text-gray-500">Visits This Month</div>
              <div className="text-3xl font-bold">{stats.pie_chart_data.this_month}</div>
            </div>
            <div className="rounded border p-4">
              <div className="text-gray-500">Visits This Year</div>
              <div className="text-3xl font-bold">{stats.pie_chart_data.this_year}</div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
