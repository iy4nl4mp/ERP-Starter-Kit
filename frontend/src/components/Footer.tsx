"use client";

import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-6 border-t bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-[1400px] px-4 py-3 text-xs text-gray-600 text-center">
        Version 1.0.1 — dibuat {year}
      </div>
    </footer>
  );
}