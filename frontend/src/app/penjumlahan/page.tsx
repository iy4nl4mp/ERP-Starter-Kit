"use client";

import React, { useMemo, useState } from 'react';
import { tambah, jumlahkan } from '../../lib/math';

function toNumber(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export default function PenjumlahanPage() {
  const [a, setA] = useState<string>('');
  const [b, setB] = useState<string>('');
  const aNum = toNumber(a);
  const bNum = toNumber(b);
  const hasil = tambah(aNum, bNum);

  const [values, setValues] = useState<string[]>(['']);
  const total = useMemo(() => jumlahkan(...values.map(toNumber)), [values]);

  const updateValue = (index: number, val: string) => {
    setValues(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const addValue = () => setValues(prev => [...prev, '']);
  const removeValue = (index: number) =>
    setValues(prev => prev.filter((_, i) => i !== index));

  return (
    <div style={{ maxWidth: 640, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
        Penjumlahan
      </h1>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Tambah dua angka</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
          <input
            type="number"
            value={a}
            onChange={e => setA(e.target.value)}
            placeholder="Angka pertama"
            style={{ padding: 8, width: 140 }}
          />
          <span style={{ fontSize: 18, fontWeight: 600 }}>+</span>
          <input
            type="number"
            value={b}
            onChange={e => setB(e.target.value)}
            placeholder="Angka kedua"
            style={{ padding: 8, width: 140 }}
          />
          <span style={{ fontSize: 18, fontWeight: 600 }}>=</span>
          <output aria-live="polite" style={{ minWidth: 80, padding: 8, border: '1px solid #ddd', borderRadius: 6 }}>
            {isFinite(hasil) ? hasil : 0}
          </output>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Jumlahkan banyak angka</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {values.map((v, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                value={v}
                onChange={e => updateValue(i, e.target.value)}
                placeholder={`Angka #${i + 1}`}
                style={{ padding: 8, width: 180 }}
              />
              {values.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeValue(i)}
                  style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, background: '#f9f9f9' }}
                >
                  Hapus
                </button>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
          <button
            type="button"
            onClick={addValue}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, background: '#f9f9f9' }}
          >
            Tambah baris
          </button>
          <strong>Total:</strong>
          <output aria-live="polite" style={{ minWidth: 80, padding: 8, border: '1px solid #ddd', borderRadius: 6 }}>
            {isFinite(total) ? total : 0}
          </output>
        </div>
      </section>
    </div>
  );
}