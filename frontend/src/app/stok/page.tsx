"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";

export default function StokPage() {
  return (
    <ProtectedRoute>
      <main className="max-w-2xl mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Master Data {'>'} Stok</h1>
        <p className="text-gray-700">
          Halaman ini untuk pengelolaan data Stok. Implementasi CRUD akan
          ditambahkan kemudian.
        </p>
        <div className="flex gap-3">
          <Link href="/menus" className="text-blue-600 hover:underline">
            &larr; Kembali ke Menus
          </Link>
          <Link href="/barang" className="text-blue-600 hover:underline">
            Lihat Barang
          </Link>
        </div>
        <section className="rounded border p-4">
          <h2 className="text-xl font-medium mb-2">Daftar Stok</h2>
          <p className="text-gray-600">Belum ada data. Coming soon.</p>
        </section>
      </main>
    </ProtectedRoute>
  );
}