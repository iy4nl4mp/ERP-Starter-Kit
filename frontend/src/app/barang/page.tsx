"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";

export default function BarangPage() {
  return (
    <ProtectedRoute>
      <main className="max-w-2xl mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Master Data {'>'} Barang</h1>
        <p className="text-gray-700">
          Halaman ini untuk pengelolaan data Barang. Implementasi CRUD akan
          ditambahkan kemudian.
        </p>
        <div className="flex gap-3">
          <Link href="/menus" className="text-blue-600 hover:underline">
            &larr; Kembali ke Menus
          </Link>
          <Link href="/stok" className="text-blue-600 hover:underline">
            Lihat Stok
          </Link>
        </div>
        <section className="rounded border p-4">
          <h2 className="text-xl font-medium mb-2">Daftar Barang</h2>
          <p className="text-gray-600">Belum ada data. Coming soon.</p>
        </section>
      </main>
    </ProtectedRoute>
  );
}