// Simple addition utilities

export function tambah(a: number, b: number): number {
  return a + b;
}

export function jumlahkan(...values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}