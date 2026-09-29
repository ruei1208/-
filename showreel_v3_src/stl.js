// Minimal binary STL -> connected parts (by shared vertices)
export function parseParts(buf) {
  const dv = new DataView(buf), n = dv.getUint32(80, true);
  const key = new Map(), V = [], T = new Int32Array(n * 3);
  for (let i = 0; i < n; i++) { const o = 84 + i * 50 + 12;
    for (let k = 0; k < 3; k++) { const x = dv.getFloat32(o + k * 12, true), y = dv.getFloat32(o + k * 12 + 4, true), z = dv.getFloat32(o + k * 12 + 8, true);
      const s = x.toFixed(3) + ',' + y.toFixed(3) + ',' + z.toFixed(3); let id = key.get(s); if (id === undefined) { id = V.length; key.set(s, id); V.push([x, y, z]); } T[i * 3 + k] = id; } }
  const par = V.map((_, i) => i); const find = x => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  for (let i = 0; i < n; i++) { const a = find(T[i * 3]); par[find(T[i * 3 + 1])] = a; par[find(T[i * 3 + 2])] = a; }
  const groups = new Map(); for (let i = 0; i < n; i++) { const r = find(T[i * 3]); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(i); }
  return [...groups.values()].map(tris => { const pos = new Float32Array(tris.length * 9); const vs = new Set(); let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    tris.forEach((t, j) => { for (let k = 0; k < 3; k++) { const v = V[T[t * 3 + k]]; vs.add(T[t * 3 + k]); pos.set(v, j * 9 + k * 3); for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], v[a]); mx[a] = Math.max(mx[a], v[a]); } } });
    return { pos, verts: [...vs].map(i => V[i]), min: mn, max: mx, size: mx.map((m, a) => m - mn[a]), tris: tris.length }; }).sort((a, b) => b.tris - a.tris);
}
// find translation that maps part A's vertices onto a subset of vertex list B
export function matchTranslation(A, B) {
  const keyB = new Set(B.map(v => v.map(c => Math.round(c * 20)).join(',')));
  let best = null, bestN = 0; const a0 = A[0];
  for (const b of B) { const t = [b[0] - a0[0], b[1] - a0[1], b[2] - a0[2]]; let n = 0;
    for (let i = 0; i < A.length; i += Math.max(1, Math.floor(A.length / 60))) { const v = A[i]; if (keyB.has([v[0] + t[0], v[1] + t[1], v[2] + t[2]].map(c => Math.round(c * 20)).join(','))) n++; }
    if (n > bestN) { bestN = n; best = t; } }
  return { t: best, score: bestN / Math.ceil(A.length / Math.max(1, Math.floor(A.length / 60))) };
}
