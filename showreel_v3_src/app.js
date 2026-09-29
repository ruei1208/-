import { SYNC, B, CUT } from './music.js';
import { loadDevice, setPose, render, project, partCenter, D3 } from './device3d.js';

export const W = 1920, H = 1080, FPS = 60, DUR = 60;
const TAU = Math.PI * 2, PI = Math.PI;
const C = { bg: '#0A0A0A', ink: '#F2F2F2', ink2: '#C8C8C8', mute: '#8A8A8A', dim: '#4A4A4A', line: '#262626', acc: '#FF8A00', acc2: '#FFB45C', red: '#FF3B2F' };
const fS = (w, s) => `${w} ${s}px "Noto Serif TC",serif`;
const fM = (w, s) => `${w} ${s}px "IBM Plex Mono","Noto Sans TC",monospace`;
// ------------------------------------------------------------ motion kit
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const P = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  lin: t => t, outC: t => 1 - (1 - t) ** 3, inC: t => t ** 3, ioC: t => t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2,
  outQuint: t => 1 - (1 - t) ** 5, ioQuint: t => t < .5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2,
  outExpo: t => t >= 1 ? 1 : 1 - 2 ** (-10 * t), inExpo: t => t <= 0 ? 0 : 2 ** (10 * t - 10),
  outBack: t => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; },
};
const tw = (t, a, b, e = E.outQuint) => e(P(t, a, b));
const spring = (t, f = 2.2, z = 0.45) => t <= 0 ? 0 : 1 - Math.exp(-z * TAU * f * t) * Math.cos(TAU * f * Math.sqrt(1 - z * z) * t);
const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const lastBefore = (arr, t) => { let l = -1; for (const x of arr) { if (x <= t + 1e-9) l = x; else break; } return l; };
const pulse = (arr, t, k = 7) => { const l = lastBefore(arr, t); return l < 0 ? 0 : Math.exp(-(t - l) * k); };
function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
function rr(ctx, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

// partial stroke of a polyline (p = 0..1 of total length)
function poly(ctx, pts, p = 1, closed = false) {
  if (p <= 0) return; const Q = closed ? [...pts, pts[0]] : pts; const L = []; let tot = 0;
  for (let i = 1; i < Q.length; i++) { const l = Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1]); L.push(l); tot += l; }
  let rem = tot * clamp(p); ctx.beginPath(); ctx.moveTo(Q[0][0], Q[0][1]);
  for (let i = 1; i < Q.length && rem > 0; i++) { const f = Math.min(1, rem / (L[i - 1] || 1)); ctx.lineTo(lerp(Q[i - 1][0], Q[i][0], f), lerp(Q[i - 1][1], Q[i][1], f)); rem -= L[i - 1]; }
  ctx.stroke();
}
const seg = (ctx, x1, y1, x2, y2, p = 1) => poly(ctx, [[x1, y1], [x2, y2]], p);
function arc(ctx, x, y, r, a0, a1, p = 1) { if (p <= 0) return; ctx.beginPath(); ctx.arc(x, y, r, a0, a0 + (a1 - a0) * clamp(p), a1 < a0); ctx.stroke(); }
const rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
function hatch(ctx, x, y, w, h, gap, color, p = 1, lw = 1) {
  if (p <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(x, y, w * p, h); ctx.clip(); ctx.strokeStyle = color; ctx.lineWidth = lw;
  ctx.beginPath(); for (let k = -h; k < w; k += gap) { ctx.moveTo(x + k, y + h); ctx.lineTo(x + k + h, y); } ctx.stroke(); ctx.restore();
}
function arrowHead(ctx, x, y, ang, s = 10) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s * Math.cos(ang - 0.4), y - s * Math.sin(ang - 0.4)); ctx.moveTo(x, y); ctx.lineTo(x - s * Math.cos(ang + 0.4), y - s * Math.sin(ang + 0.4)); ctx.stroke(); }
// engineering dimension line with arrowheads and label
function dim(ctx, x1, y1, x2, y2, label, p, color = C.ink, off = 26, font = fM(500, 20)) {
  if (p <= 0) return; const a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a), ny = Math.cos(a);
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.5;
  const q = E.ioC(clamp(p * 1.4)); const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  seg(ctx, mx, my, lerp(mx, x1, 1) , lerp(my, y1, 1), q); seg(ctx, mx, my, x2, y2, q);
  if (q > 0.98) { arrowHead(ctx, x1, y1, a + PI, 11); arrowHead(ctx, x2, y2, a, 11); }
  ctx.globalAlpha = 0.6; seg(ctx, x1 - nx * 14, y1 - ny * 14, x1 + nx * 14, y1 + ny * 14, q); seg(ctx, x2 - nx * 14, y2 - ny * 14, x2 + nx * 14, y2 + ny * 14, q);
  ctx.globalAlpha = clamp((p - 0.5) * 3); ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.save(); ctx.translate(mx + nx * off, my + ny * off); let ra = a; if (ra > PI / 2 || ra < -PI / 2) ra += PI; ctx.rotate(ra);
  const w = ctx.measureText(label).width; ctx.fillStyle = C.bg; ctx.fillRect(-w / 2 - 8, -14, w + 16, 28); ctx.fillStyle = color; ctx.fillText(label, 0, 1); ctx.restore();
  ctx.restore();
}
function brackets(ctx, x, y, w, h, s, p, color = C.ink, lw = 2) {
  if (p <= 0) return; ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; const k = s * E.outQuint(p);
  for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x + w, y + h, -1, -1], [x, y + h, 1, -1]]) poly(ctx, [[cx + dx * k, cy], [cx, cy], [cx, cy + dy * k]], 1);
  ctx.restore();
}
// masked per-glyph rise
function reveal(ctx, str, x, y, o) {
  const { t, t0 } = o; ctx.save(); ctx.font = o.font; if (o.ls) ctx.letterSpacing = o.ls + 'px';
  const chars = [...str], ws = chars.map(c => ctx.measureText(c).width), total = ws.reduce((a, b) => a + b, 0), size = o.size;
  let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
  ctx.beginPath(); ctx.rect(cx - 40, y - size * 1.1, total + 80, size * 1.45); ctx.clip();
  chars.forEach((ch, i) => { const s = t0 + i * (o.stagger ?? 0.02); const p = E.outQuint(P(t, s, s + (o.dur ?? 0.7)));
    if (p > 0.001) { ctx.globalAlpha = (o.alpha ?? 1) * clamp(p * 1.5); ctx.fillStyle = o.color || C.ink; ctx.fillText(ch, cx, y + (1 - p) * size * 0.9); } cx += ws[i]; });
  ctx.restore(); return total;
}
function type(ctx, str, x, y, t, t0, font, color, cps = 40, cursor = true) {
  const chars = [...str], n = Math.floor(clamp((t - t0) * cps, 0, chars.length)); if (t < t0) return;
  ctx.save(); ctx.font = font; ctx.fillStyle = color; const s = chars.slice(0, n).join(''); ctx.fillText(s, x, y);
  if (cursor && (n < chars.length || (t * 2.5) % 1 < 0.5)) { const w = ctx.measureText(s).width; ctx.fillRect(x + w + 3, y - 18, 10, 22); }
  ctx.restore();
}
function txt(ctx, s, x, y, font, color, align = 'left', alpha = 1, ls = 0) { if (alpha <= 0) return; ctx.save(); ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.globalAlpha = alpha; if (ls) ctx.letterSpacing = ls + 'px'; ctx.fillText(s, x, y); ctx.restore(); }
function digits(ctx, s, x, y, font, color) { ctx.save(); ctx.font = font; ctx.fillStyle = color; const cw = ctx.measureText('0').width; let cx = x;
  for (const ch of s) { const w = /[0-9]/.test(ch) ? cw : ctx.measureText(ch).width; ctx.fillText(ch, cx, y); cx += w; } ctx.restore(); return cx - x; }
function kicker(ctx, x, y, s, t, t0) {
  const p = tw(t, t0, t0 + 0.5); ctx.save(); ctx.fillStyle = C.acc; ctx.fillRect(x, y - 15, 14 * p, 14); ctx.restore();
  reveal(ctx, s, x + 28, y, { t, t0: t0 + 0.06, font: fM(500, 20), size: 20, color: C.acc, ls: 3, stagger: 0.014 });
}
function counter(ctx, v, dec, x, y, size, color, unit, unitColor, unitScale = 0.45) {
  const w = digits(ctx, v.toFixed(dec), x, y, fM(600, size), color); if (unit) txt(ctx, unit, x + w + size * 0.06, y, fM(500, size * unitScale), unitColor); return w;
}


// ------------------------------------------------------------ assets
export const A = {};
function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
export async function loadAssets() {
  const g = cv(W, H), x = g.getContext('2d');
  x.strokeStyle = 'rgba(242,242,242,0.035)'; x.lineWidth = 1; x.beginPath();
  for (let i = 0; i <= W; i += 40) { x.moveTo(i + 0.5, 0); x.lineTo(i + 0.5, H); } for (let j = 0; j <= H; j += 40) { x.moveTo(0, j + 0.5); x.lineTo(W, j + 0.5); } x.stroke();
  x.strokeStyle = 'rgba(242,242,242,0.07)'; x.beginPath(); for (let i = 0; i <= W; i += 200) { x.moveTo(i + 0.5, 0); x.lineTo(i + 0.5, H); } for (let j = 0; j <= H; j += 200) { x.moveTo(0, j + 0.5); x.lineTo(W, j + 0.5); } x.stroke();
  x.fillStyle = 'rgba(242,242,242,0.18)'; for (let i = 0; i <= W; i += 200) for (let j = 0; j <= H; j += 200) { x.fillRect(i - 4, j, 9, 1); x.fillRect(i, j - 4, 1, 9); }
  A.grid = g;
  A.grain = [0, 1, 2, 3].map(s => { const c = cv(256, 256), cx = c.getContext('2d'), id = cx.createImageData(256, 256);
    for (let i = 0; i < id.data.length; i += 4) { const v = hash(s * 7919 + i) * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } cx.putImageData(id, 0, 0); return c; });
  await loadDevice(W, H);
}
function background(ctx, t) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  const gp = tw(t, 0, 1.8, E.ioC); const kp = t > s(8) && t < s(76) ? pulse(SYNC.kicks, t, 5) : 0;
  ctx.save(); ctx.globalAlpha = 0.85 + kp * 0.35; ctx.beginPath(); ctx.rect(0, 0, W * gp, H); ctx.clip(); ctx.drawImage(A.grid, 0, 0); ctx.restore();
  if (gp < 1) { ctx.fillStyle = rgba(C.acc, 0.6); ctx.fillRect(W * gp - 1, 0, 2, H); }
  const g = ctx.createRadialGradient(W * 0.62, H * 0.4, 0, W * 0.62, H * 0.4, W * 0.7); g.addColorStop(0, 'rgba(255,138,0,0.02)'); g.addColorStop(1, 'rgba(255,138,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
const s = n => B(n);
const R43 = (base, from) => x => B(base + (x - from) * 4 / 3);   // stretch a 3-beat v2 layout over 4 beats

// ================================================================ 0 intro (beats 0-8)
function tireLine(ctx, cx, cy, R, ang, t, t0, k = 1) {
  const q = (a, b) => tw(t, t0 + a * k, t0 + b * k, E.ioC);
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = C.dim; ctx.lineWidth = 1; ctx.setLineDash([22, 6, 3, 6]);
  seg(ctx, cx - R - 50, cy, cx + R + 50, cy, q(0.2, 0.9)); seg(ctx, cx, cy - R - 50, cx, cy + R + 50, q(0.25, 0.95)); ctx.setLineDash([]);
  ctx.strokeStyle = C.ink; ctx.lineWidth = 2.5; arc(ctx, cx, cy, R, -PI / 2, -PI / 2 + TAU, q(0, 0.9));
  ctx.lineWidth = 1.2; ctx.strokeStyle = C.mute; arc(ctx, cx, cy, R - 30, PI / 2, PI / 2 + TAU, q(0.2, 1.0));
  ctx.translate(cx, cy); ctx.rotate(ang);
  const tp = q(0.4, 1.2); ctx.strokeStyle = C.ink2; ctx.lineWidth = 2;
  for (let i = 0; i < 72; i++) { if (i / 72 > tp) break; const a = i / 72 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * (R - 28), Math.sin(a) * (R - 28)); ctx.lineTo(Math.cos(a + 0.03) * (R - 6), Math.sin(a + 0.03) * (R - 6)); ctx.stroke(); }
  ctx.strokeStyle = C.ink; ctx.lineWidth = 2; arc(ctx, 0, 0, R * 0.72, 0, TAU, q(0.5, 1.1)); ctx.strokeStyle = C.dim; ctx.lineWidth = 1; arc(ctx, 0, 0, R * 0.68, 0, TAU, q(0.55, 1.15));
  const sp = q(0.7, 1.3); ctx.strokeStyle = rgba(C.ink, 0.35); ctx.lineWidth = 1.2;
  for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, sk = i % 2 ? 0.28 : -0.28; seg(ctx, Math.cos(a) * 62, Math.sin(a) * 62, Math.cos(a + sk) * R * 0.68, Math.sin(a + sk) * R * 0.68, sp); }
  ctx.strokeStyle = C.ink; ctx.lineWidth = 2; arc(ctx, 0, 0, 108, 0, TAU, q(0.8, 1.35));
  ctx.strokeStyle = C.acc; ctx.lineWidth = 3; arc(ctx, 0, 0, 82, 0, TAU, q(0.9, 1.45));
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; arc(ctx, 0, 0, 28, 0, TAU, q(1.0, 1.5));
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; arc(ctx, Math.cos(a) * 58, Math.sin(a) * 58, 5, 0, TAU, q(1.0 + i * 0.03, 1.3 + i * 0.03)); }
  ctx.restore();
}
function sIntro(ctx, t) {
  const cx = 560, cy = 500, R = 300, gy = cy + R, drift = tw(t, 0, 6, E.ioC);
  ctx.save(); ctx.translate(-24 * drift, 0);
  ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.5; seg(ctx, 80, gy, 1000, gy, tw(t, 0.3, 1.8, E.ioC));
  ctx.save(); ctx.beginPath(); ctx.rect(80, gy, 920 * tw(t, 0.5, 2, E.ioC), 30); ctx.clip(); ctx.strokeStyle = C.dim; ctx.lineWidth = 1; ctx.beginPath();
  const off = (t * 150) % 24; for (let x = 80 - off; x < 1000; x += 24) { ctx.moveTo(x, gy + 22); ctx.lineTo(x + 18, gy + 2); } ctx.stroke(); ctx.restore();
  for (let i = 0; i < 420; i++) {
    const ts = 1.8 + i * 0.0105; if (ts > t) break; const a = t - ts, life = 1.6 + hash(i * 2.3) * 1.1; if (a > life) continue;
    const vx = -(160 + hash(i * 1.3) * 460), vy = -(60 + hash(i * 4.1) * 260), k = 1.3;
    const x = cx - 30 + vx * (1 - Math.exp(-k * a)) / k, y = Math.min(gy - 4, gy - 6 + vy * (1 - Math.exp(-k * a)) / k + 170 * a * a);
    const al = (1 - a / life) * 0.9, cond = hash(i * 5.5) < 0.65, r = cond ? 1.6 + hash(i * 3.9) * 2 : 3 + hash(i * 3.9) * 3;
    if (cond) { ctx.fillStyle = rgba(C.acc, al); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
    else { ctx.strokeStyle = rgba(C.ink, al * 0.6); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }
  }
  tireLine(ctx, cx, cy, R, t * 0.9 + t * t * 0.12, t, 0.1, 1.5);
  dim(ctx, cx - R, cy - R - 56, cx + R, cy - R - 56, 'Ø 500 mm', tw(t, s(2), s(3.5), E.lin), C.mute, 0, fM(500, 22));
  ctx.save(); const hl = tw(t, s(3), s(4)); ctx.strokeStyle = C.acc; ctx.lineWidth = 1.2; seg(ctx, cx + 60, cy + 60, cx + 120, cy + 140, hl); ctx.restore();
  txt(ctx, 'HUB MOTOR · 48 V', cx + 128, cy + 160, fM(500, 20), C.acc, 'left', hl, 2);
  ctx.restore();
  const tx = 1060;
  kicker(ctx, tx, 290, 'TRWP · 主動式靜電捕捉裝置', t, 0.3);
  reveal(ctx, '廢氣排放正在減少。', tx, 380, { t, t0: s(1), font: fS(700, 54), size: 54, color: C.mute, stagger: 0.04, dur: 0.9 });
  reveal(ctx, '但電動車更重、扭力更大——', tx, 446, { t, t0: s(2.5), font: fS(700, 34), size: 34, color: C.mute, stagger: 0.03, dur: 0.9 });
  reveal(ctx, '輪胎，', tx, 600, { t, t0: s(4), font: fS(900, 118), size: 118, stagger: 0.08, dur: 1.0 });
  reveal(ctx, '仍在一路磨損。', tx, 740, { t, t0: s(5), font: fS(900, 118), size: 118, color: C.acc, stagger: 0.07, dur: 1.0 });
  ctx.strokeStyle = C.acc; ctx.lineWidth = 2; seg(ctx, tx, 780, tx + 800, 780, tw(t, s(6.2), s(7.2), E.ioC));
  txt(ctx, 'NON-EXHAUST EMISSIONS', tx + 800, 820, fM(500, 20), C.mute, 'right', tw(t, s(6.5), s(7.2)), 3);
}

// ================================================================ 1 problem
function sProblemA(ctx, t) {                     // beats 8-12
  kicker(ctx, 140, 170, '01 — THE PROBLEM', t, s(8));
  counter(ctx, 28 * tw(t, s(8), s(9.8), E.outExpo), 0, 140, 560, 300, C.acc, '%', C.ink, 0.4);
  reveal(ctx, '全球初級微塑膠的', 146, 680, { t, t0: s(8.6), font: fS(700, 52), size: 52, dur: 0.9 });
  reveal(ctx, '第二大來源', 146, 752, { t, t0: s(9.2), font: fS(900, 52), size: 52, color: C.acc, dur: 0.9 });
  txt(ctx, '資料來源：Boucher & Friot, 2017', 148, 820, fS(700, 22), C.mute, 'left', tw(t, s(9.8), s(10.5)));
  const dx = 1370, dy = 520, Rr = 220;
  ctx.save(); ctx.strokeStyle = C.dim; ctx.lineWidth = 1; arc(ctx, dx, dy, Rr, -PI / 2, -PI / 2 + TAU, tw(t, s(8), s(9.2), E.ioC));
  ctx.setLineDash([2, 10]); ctx.lineDashOffset = -t * 8; ctx.strokeStyle = C.mute; arc(ctx, dx, dy, Rr + 46, 0, TAU, tw(t, s(8.2), s(9.6), E.ioC)); ctx.setLineDash([]); ctx.restore();
  const segs = [[35, '#6A6A6A', 10, '人造纖維'], [28, C.acc, 34, '輪胎磨損'], [24, '#4A4A4A', 10, '城市粉塵'], [13, '#333333', 10, '其他']];
  let a0 = -PI / 2;
  segs.forEach(([v2, col, lw, lab], i) => {
    const span = v2 / 100 * TAU, t0 = s(8.5 + i * 0.5), p = tw(t, t0, t0 + 0.7, E.ioC);
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'butt'; arc(ctx, dx, dy, Rr, a0 + 0.015, a0 + span - 0.015, p);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; if (p > 0) seg(ctx, dx + Math.cos(a0) * (Rr - 26), dy + Math.sin(a0) * (Rr - 26), dx + Math.cos(a0) * (Rr + 26), dy + Math.sin(a0) * (Rr + 26), 1);
    ctx.restore();
    const mid = a0 + span / 2, lp = tw(t, s(10.4) + i * 0.15, s(10.4) + i * 0.15 + 0.6, E.ioC);
    if (lp > 0) { const r1 = Rr + (i === 1 ? 22 : 10), r2 = Rr + 66, ex = dx + Math.cos(mid) * r2, ey = dy + Math.sin(mid) * r2, right = Math.cos(mid) >= 0;
      ctx.save(); ctx.strokeStyle = i === 1 ? C.acc : C.mute; ctx.lineWidth = 1.2; poly(ctx, [[dx + Math.cos(mid) * r1, dy + Math.sin(mid) * r1], [ex, ey], [ex + (right ? 50 : -50), ey]], lp); ctx.restore();
      const lx = ex + (right ? 60 : -60), al = right ? 'left' : 'right';
      txt(ctx, v2 + '%', lx, ey - 4, fM(600, i === 1 ? 36 : 28), i === 1 ? C.acc : C.ink2, al, lp); txt(ctx, lab, lx, ey + 30, fS(700, 22), C.mute, al, lp); }
    a0 += span;
  });
  txt(ctx, '初級微塑膠', dx, dy - 2, fS(700, 30), C.ink, 'center', tw(t, s(9), s(9.8)));
  txt(ctx, '排放來源', dx, dy + 36, fS(700, 22), C.mute, 'center', tw(t, s(9.2), s(10)));
}
function sProblemB(ctx, t) {                     // beats 12-15
  kicker(ctx, 140, 170, '01 — 非廢氣排放 · OECD', t, s(12));
  txt(ctx, '+', 140, 500, fM(500, 150), C.acc, 'left', tw(t, s(12), s(12.5)));
  counter(ctx, 53.5 * tw(t, s(12), s(13.5), E.outExpo), 1, 240, 500, 230, C.acc, '%', C.ink, 0.4);
  reveal(ctx, '2030 年全球乘用車非廢氣微粒', 146, 610, { t, t0: s(12.4), font: fS(700, 44), size: 44, dur: 0.9 });
  reveal(ctx, '排放預估增幅', 146, 672, { t, t0: s(12.9), font: fS(700, 44), size: 44, dur: 0.9 });
  { const p = tw(t, s(13.4), s(14.2), E.ioC); if (p > 0) { ctx.save(); ctx.strokeStyle = C.red; ctx.lineWidth = 1.5; poly(ctx, rectPts(146, 716, 600, 60), p, true); ctx.restore();
    txt(ctx, '重型電動車 PM2.5 較燃油車高 3–8%', 172, 756, fS(700, 26), C.red, 'left', clamp(p * 2 - 1)); } }
  const gx = 1060, gy = 230, gw = 720, gh = 420;
  ctx.save(); ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.5; poly(ctx, [[gx, gy], [gx, gy + gh], [gx + gw, gy + gh]], tw(t, s(12), s(12.8), E.ioC));
  ctx.strokeStyle = C.line; ctx.setLineDash([2, 6]); for (let i = 0; i < 4; i++) seg(ctx, gx, gy + gh * i / 4, gx + gw, gy + gh * i / 4, tw(t, s(12.2) + i * 0.05, s(13) + i * 0.05)); ctx.setLineDash([]);
  ctx.strokeStyle = C.mute; for (let i = 0; i <= 10; i++) seg(ctx, gx + gw * i / 10, gy + gh, gx + gw * i / 10, gy + gh + (i % 5 ? 6 : 12), tw(t, s(12.4), s(12.9)));
  ctx.restore();
  txt(ctx, '2020', gx, gy + gh + 44, fM(500, 22), C.mute, 'left', tw(t, s(12.6), s(13))); txt(ctx, '2030', gx + gw, gy + gh + 44, fM(500, 22), C.mute, 'right', tw(t, s(12.6), s(13)));
  const pr = tw(t, s(12.4), s(14), E.ioC), pts = []; for (let i = 0; i <= 60; i++) { const u = i / 60; pts.push([gx + u * gw, gy + gh - (0.08 + 0.78 * u ** 1.7 + 0.02 * Math.sin(u * 19)) * gh]); }
  ctx.save(); ctx.strokeStyle = C.acc; ctx.lineWidth = 3; poly(ctx, pts, pr); ctx.restore();
  if (pr > 0) { const [ex, ey] = pts[Math.round(pr * 60)]; ctx.save(); ctx.fillStyle = C.bg; ctx.strokeStyle = C.acc; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ex, ey, 8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
  txt(ctx, '+53.5%', gx + gw - 14, gy + 26, fM(600, 28), C.acc, 'right', tw(t, s(14), s(14.5)));
}
function sPPD(ctx, t) {                          // beats 15-18
  kicker(ctx, 140, 170, '01 — 6PPD', t, s(15));
  const t0 = s(15), ox = 250, oy = 600, L = 60;
  const hex = (cx, cy) => [0, 1, 2, 3, 4, 5].map(k => [cx + L * Math.cos(k * PI / 3 + PI), cy + L * Math.sin(k * PI / 3 + PI)]);
  const rA = hex(ox, oy), rB = hex(ox + 4 * L, oy), N1 = [ox + 2 * L, oy], N2 = [ox + 6 * L, oy];
  const c1 = [N2[0] + 52, oy - 30], m1 = [c1[0], c1[1] - 60], c2 = [c1[0] + 52, oy], c3 = [c2[0] + 52, oy - 30], m3 = [c3[0], c3[1] - 60], c4 = [c3[0] + 52, oy];
  const bonds = []; for (let k = 0; k < 6; k++) bonds.push([rA[k], rA[(k + 1) % 6], k % 2 === 0 ? ox : null]);
  bonds.push([rA[3], N1], [N1, rB[0]]); for (let k = 0; k < 6; k++) bonds.push([rB[k], rB[(k + 1) % 6], k % 2 === 0 ? ox + 4 * L : null]);
  bonds.push([rB[3], N2], [N2, c1], [c1, m1], [c1, c2], [c2, c3], [c3, m3], [c3, c4]);
  ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = C.ink; ctx.lineWidth = 2.6;
  bonds.forEach(([a, b, cxr], i) => { const p = tw(t, t0 + i * 0.04, t0 + i * 0.04 + 0.45, E.ioC); seg(ctx, a[0], a[1], b[0], b[1], p);
    if (cxr != null) { const k = 0.76, a2 = [lerp(cxr, a[0], k), lerp(oy, a[1], k)], b2 = [lerp(cxr, b[0], k), lerp(oy, b[1], k)]; ctx.save(); ctx.strokeStyle = C.mute; ctx.lineWidth = 1.8; seg(ctx, a2[0], a2[1], b2[0], b2[1], p); ctx.restore(); } });
  [N1, N2].forEach((n, i) => { const p = spring(t - t0 - 0.6 - i * 0.15, 2.2, 0.5); if (p <= 0) return; ctx.save(); ctx.translate(n[0], n[1]); ctx.scale(p, p);
    ctx.fillStyle = C.bg; ctx.strokeStyle = C.acc; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, 0, 24, 0, TAU); ctx.fill(); ctx.stroke(); txt(ctx, 'N', 0, 10, fM(600, 28), C.acc, 'center'); txt(ctx, 'H', 0, -34, fM(500, 22), C.mute, 'center'); ctx.restore(); });
  ctx.restore();
  dim(ctx, rA[0][0], oy + 120, c4[0], oy + 120, 'N-(1,3-二甲基丁基)-N′-苯基對苯二胺', tw(t, s(16), s(17), E.lin), C.mute, 0, fS(700, 20));
  reveal(ctx, '6PPD', 1100, 420, { t, t0: s(15.3), font: fS(900, 110), size: 110, stagger: 0.06, dur: 1 });
  txt(ctx, 'C₁₈H₂₄N₂ · 輪胎防老劑', 1106, 480, fM(500, 26), C.ink2, 'left', tw(t, s(15.6), s(16.2)));
  reveal(ctx, '氧化成 6PPD-Q', 1100, 610, { t, t0: s(16), font: fS(900, 48), size: 48, color: C.red, dur: 0.9 });
  reveal(ctx, '對水生生物具急性毒性，', 1100, 680, { t, t0: s(16.5), font: fS(700, 34), size: 34, color: C.ink2, stagger: 0.03 });
  reveal(ctx, '已於人體尿液中檢出。', 1100, 732, { t, t0: s(17), font: fS(700, 34), size: 34, color: C.ink2, stagger: 0.03 });
}

// ================================================================ 2 current solutions (beats 18-26)
function sLimits(ctx, t) {
  kicker(ctx, 140, 170, '02 — CURRENT SOLUTIONS', t, s(18));
  reveal(ctx, '現有方案，卡在哪裡？', 140, 256, { t, t0: s(18.2), font: fS(900, 64), size: 64, stagger: 0.05, dur: 0.9 });
  const card = (x, y, w, h, t0) => { ctx.save(); ctx.strokeStyle = C.dim; ctx.lineWidth = 1.5; poly(ctx, rectPts(x, y, w, h), tw(t, t0, t0 + 0.9, E.ioC), true); ctx.restore(); };
  // --- card 1: physical filter
  card(140, 320, 780, 540, s(19));
  reveal(ctx, '傳統物理濾網', 180, 392, { t, t0: s(19.4), font: fS(900, 40), size: 40 });
  const mx = 640, my0 = 440, my1 = 700, fp = tw(t, s(19.6), s(20.4), E.ioC);
  ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2; poly(ctx, rectPts(mx, my0, 24, my1 - my0), fp, true);
  ctx.strokeStyle = C.mute; ctx.lineWidth = 1; for (let y = my0 + 10; y < my1; y += 12) seg(ctx, mx, y, mx + 24, y, fp); for (const xx of [mx + 8, mx + 16]) seg(ctx, xx, my0, xx, my1, fp); ctx.restore();
  const clog = tw(t, s(20), s(24), E.outC);
  ctx.save(); ctx.lineWidth = 1.5; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -t * lerp(120, 25, clog);
  for (let k = 0; k < 5; k++) { const y = my0 + 30 + k * 50; ctx.strokeStyle = rgba(lerpHex(C.ink, C.red, clog), 0.5); seg(ctx, 190, y, mx - 8, y, tw(t, s(19.8), s(20.5))); } ctx.setLineDash([]); ctx.restore();
  for (let i = 0; i < 130; i++) { const ts = s(19.8) + i * 0.035; if (ts > t) break; const y = my0 + 12 + hash(i * 3.7) * (my1 - my0 - 24), stopX = mx - 5 - Math.floor(i / 22) * 8 - hash(i) * 4;
    const x = Math.min(stopX, 190 + 300 * (t - ts)); ctx.fillStyle = x >= stopX ? C.acc2 : C.acc; ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill(); }
  { const p = tw(t, s(20.6), s(21.2)); txt(ctx, '風阻 ↑', mx + 44, my0 + 30, fS(900, 30), C.red, 'left', p); txt(ctx, '堵塞', mx + 44, my0 + 76, fS(900, 30), C.red, 'left', tw(t, s(21.2), s(21.8))); }
  reveal(ctx, '× 增加風阻、容易堵塞', 180, 780, { t, t0: s(21), font: fS(700, 30), size: 30, color: C.ink2, stagger: 0.03 });
  reveal(ctx, '× 影響電動車續航里程', 180, 830, { t, t0: s(21.5), font: fS(700, 30), size: 30, color: C.ink2, stagger: 0.03 });
  // --- card 2: passive aerodynamic deflector
  card(1000, 320, 780, 540, s(21));
  reveal(ctx, '被動式導流', 1040, 392, { t, t0: s(21.4), font: fS(900, 40), size: 40 });
  const dcx = 1430, dcy = 470, dr = 190, dp = tw(t, s(21.6), s(22.4), E.ioC);
  ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 3; arc(ctx, dcx, dcy + dr, dr, -PI / 2, 0, dp); ctx.restore();
  for (let i = 0; i < 70; i++) { const ts = s(21.8) + i * 0.055; if (ts > t) break; const big = hash(i * 5.1) < 0.5, y0 = 460 + hash(i * 2.3) * 200, a = t - ts; let x = 1040 + 330 * a, y = y0;
    if (big && x > 1400) { const u = x - 1400; y = y0 + u * u / 160; x = 1400 + u * 0.8; }
    if (x > 1760 || y > 840) continue;
    if (big) { ctx.strokeStyle = rgba(C.ink, 0.7); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.stroke(); }
    else { ctx.fillStyle = C.acc; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, TAU); ctx.fill(); } }
  txt(ctx, 'PM2.5 穿過', 1740, 450, fS(900, 28), C.acc, 'right', tw(t, s(22.8), s(23.4)));
  reveal(ctx, '× 只靠慣性分離', 1040, 780, { t, t0: s(23), font: fS(700, 30), size: 30, color: C.ink2, stagger: 0.03 });
  reveal(ctx, '× 細懸浮微粒 PM2.5 抓不住', 1040, 830, { t, t0: s(23.5), font: fS(700, 30), size: 30, color: C.ink2, stagger: 0.03 });
  // bridge
  ctx.save(); ctx.fillStyle = C.acc; ctx.fillRect(140, 918, 18 * tw(t, s(24.2), s(24.7)), 18); ctx.restore();
  reveal(ctx, '本專題 → 無濾網的主動式靜電捕捉', 176, 936, { t, t0: s(24.3), font: fS(900, 34), size: 34, color: C.acc, stagger: 0.03 });
}
function lerpHex(a, b, t) { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16); const r = lerp(pa >> 16, pb >> 16, t), g = lerp(pa >> 8 & 255, pb >> 8 & 255, t), bb = lerp(pa & 255, pb & 255, t); return '#' + [r, g, bb].map(v => Math.round(v).toString(16).padStart(2, '0')).join(''); }

// ================================================================ 3 physics (beats 26-36)
const PL = { x0: 140, x1: 1060, top: 390, bot: 740, th: 24 };
function sPhysics(ctx, t) {
  kicker(ctx, 140, 170, '03 — HOW IT WORKS', t, s(26));
  const tx = reveal(ctx, '不靠濾網，', 140, 262, { t, t0: s(26), font: fS(900, 62), size: 62, dur: 0.9 });
  reveal(ctx, '用電場把微粒拉下來。', 140 + tx, 262, { t, t0: s(26.6), font: fS(900, 62), size: 62, color: C.acc, dur: 0.9 });
  const pd = tw(t, s(26), s(27.5), E.ioC), fOn = s(27.3), on = t >= fOn, onP = tw(t, fOn, fOn + 0.8);
  ctx.save(); ctx.lineWidth = 2;
  for (const y of [PL.top, PL.bot]) { ctx.strokeStyle = on ? C.acc : C.ink; poly(ctx, rectPts(PL.x0, y, PL.x1 - PL.x0, PL.th), pd, true); hatch(ctx, PL.x0, y, PL.x1 - PL.x0, PL.th, 10, on ? rgba(C.acc, 0.6) : rgba(C.ink, 0.4), tw(t, s(26.8), s(27.8), E.ioC)); }
  ctx.restore();
  txt(ctx, '+15 kV', PL.x0, PL.top - 18, fM(600, 28), C.acc, 'left', onP); txt(ctx, '接地 GND', PL.x0, PL.bot + PL.th + 40, fM(500, 22), C.mute, 'left', tw(t, fOn, fOn + 0.6));
  dim(ctx, PL.x1 + 56, PL.top + PL.th, PL.x1 + 56, PL.bot, 'd = 17 mm', tw(t, s(27.8), s(29), E.lin), C.ink, 0, fM(500, 24));
  if (on) { ctx.save(); ctx.strokeStyle = rgba(C.ink, 0.28 * onP); ctx.lineWidth = 1.2; ctx.setLineDash([6, 10]); ctx.lineDashOffset = -t * 70;
    for (let x = 180; x < PL.x1 - 20; x += 60) { const p = tw(t, fOn + (x - 180) / 880 * 0.5, fOn + 0.5 + (x - 180) / 880 * 0.5); seg(ctx, x, PL.top + PL.th + 6, x, lerp(PL.top + PL.th + 6, PL.bot - 6, p), 1); }
    ctx.setLineDash([]); ctx.strokeStyle = rgba(C.ink, 0.5 * onP); for (let x = 180; x < PL.x1 - 20; x += 120) arrowHead(ctx, x, PL.bot - 8, PI / 2, 8); ctx.restore();
    txt(ctx, 'E', PL.x1 - 36, 590, fM(500, 30), C.ink2, 'left', onP); }
  const deps = [];
  for (let i = 0; i < 260; i++) {
    const ts = s(26.8) + i * 0.022; if (ts > t) break;
    const cond = hash(i * 3.1) < 0.7, vx = cond ? 430 + hash(i * 1.7) * 170 : 360 + hash(i * 1.9) * 120;
    const y0 = PL.top + PL.th + 36 + hash(i * 5.3) * (PL.bot - PL.top - PL.th - 72), r = cond ? 2.8 + hash(i * 2.9) * 1.8 : 5.5 + hash(i * 2.2) * 3;
    let x = -30 + vx * (t - ts), y = y0, stuck = false, tc = 0;
    const tE = ts + (PL.x0 + 30) / vx, tf = Math.max(tE, fOn);
    if (t > tf) { const tau = t - tf, dir = y0 < (PL.top + PL.bot + PL.th) / 2 ? -1 : 1, acc = cond ? 800 + hash(i * 8.1) * 800 : 40;
      const edge = dir < 0 ? PL.top + PL.th + r + 1 : PL.bot - r - 1, tcap = Math.sqrt(2 * Math.abs(edge - y0) / acc), xc = -30 + vx * (tf - ts + tcap);
      if (cond && xc < PL.x1 - 10 && tau >= tcap) { stuck = true; x = xc; y = edge; tc = tf + tcap; } else y = y0 + dir * 0.5 * acc * tau * tau; }
    if (x > W + 40) continue;
    if (stuck) { deps.push([x, y, r, tc]); continue; }
    if (cond) { ctx.fillStyle = C.acc; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
    else { ctx.strokeStyle = rgba(C.ink, 0.7); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }
  }
  for (const [x, y, r, tc] of deps) { ctx.fillStyle = C.acc2; ctx.fillRect(x - r, y - 1.5, r * 2, 3); const a = t - tc; if (a < 0.4) { ctx.strokeStyle = rgba(C.acc, 1 - a / 0.4); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 4 + a * 45, 0, TAU); ctx.stroke(); } }
  ctx.save(); ctx.globalAlpha = tw(t, s(29), s(29.8));
  ctx.fillStyle = C.acc; ctx.beginPath(); ctx.arc(152, 858, 7, 0, TAU); ctx.fill(); txt(ctx, '導電性微粒（含碳黑）→ 被吸附', 174, 868, fS(700, 26), C.ink2);
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(652, 858, 8, 0, TAU); ctx.stroke(); txt(ctx, '礦物顆粒 → 多半穿越', 674, 868, fS(700, 26), C.mute); ctx.restore();
  const ex = 1290;
  reveal(ctx, 'F = qE', ex, 440, { t, t0: s(29.5), font: fM(500, 64), size: 64, stagger: 0.05 }); txt(ctx, '(1) 庫侖力', ex + 280, 432, fS(700, 22), C.mute, 'left', tw(t, s(29.9), s(30.5)));
  reveal(ctx, 'E = V / d', ex, 552, { t, t0: s(30.5), font: fM(500, 64), size: 64, stagger: 0.05 }); txt(ctx, '(2) 平行板電場', ex + 330, 544, fS(700, 22), C.mute, 'left', tw(t, s(30.9), s(31.5)));
  ctx.save(); ctx.strokeStyle = C.dim; ctx.lineWidth = 1; seg(ctx, ex, 604, ex + 470, 604, tw(t, s(31.3), s(32), E.ioC)); ctx.restore();
  brackets(ctx, ex - 28, 630, 510, 136, 26, tw(t, s(32.3), s(33.2)), C.acc, 2);
  reveal(ctx, 'F = qV / d', ex, 728, { t, t0: s(31.8), font: fM(600, 88), size: 88, color: C.acc, stagger: 0.06, dur: 0.9 });
  reveal(ctx, '受力與電壓成正比、', ex, 830, { t, t0: s(33.3), font: fS(700, 30), size: 30, color: C.ink2, stagger: 0.03 });
  reveal(ctx, '與極板間距成反比', ex, 876, { t, t0: s(33.9), font: fS(700, 30), size: 30, color: C.ink2, stagger: 0.03 });
}

// ================================================================ 4 system — hub motor rig + capture device (beats 36-40)
// slotted angle steel, drawn in front of the wheel like the real stand
function angleBar(ctx, a, b, w, p, solid = Infinity) {
  if (p <= 0) return; const L = Math.hypot(b[0] - a[0], b[1] - a[1]) * clamp(p);
  ctx.save(); ctx.translate(a[0], a[1]); ctx.rotate(Math.atan2(b[1] - a[1], b[0] - a[0]));
  ctx.fillStyle = C.bg; ctx.fillRect(0, -w / 2, Math.min(L, solid), w); ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.8; ctx.strokeRect(0, -w / 2, L, w);
  ctx.strokeStyle = C.mute; ctx.lineWidth = 1.2;
  for (let x = 30; x < L - 12; x += 36) { ctx.beginPath(); ctx.arc(x - 3, 0, 4, PI / 2, PI * 1.5); ctx.lineTo(x + 5, -2); ctx.arc(x + 5, 0, 2, -PI / 2, PI / 2); ctx.closePath(); ctx.stroke(); }
  ctx.restore();
}
function sRig(ctx, t) {
  const cx = 1290, cy = 480, R = 210, gy = cy + R, gyB = gy + 8;
  const BE = [1660, 531], BA = 0.82, bw = 24;   // brace end, and where along it the device's top is clamped
  const zp = tw(t, s(38.9), s(39.9), E.ioC), fade = 1 - tw(t, s(38.8), s(39.4));
  // capture device, side-on between the two braces; the zoom swings the camera round to the next scene's framing
  const K = 0.3, z = lerp(1, 1 / K, zp), ks = K * z;   // zoom, and on-screen scale of the device (1 = next scene's framing)
  const pose = (az, el, lookY, dist, drawP) => { setPose({ cart: 1, dust: 1, plates: [1, 1, 1, 1], pull: 0, drawP, az, el, dist, offX: 380, lookY }); D3.camera.updateMatrixWorld(); };
  pose(58, 24, -40, 900, 1); const fbF = project([0, 0, 0]);
  pose(90, 6, 0, 900 / K, 1); const top0 = (project([0, 0, 0])[1] - project([0, D3.hSize[1] / 2, 0])[1]);   // centre-to-top, side view
  const mx = lerp(cx, BE[0], BA), my = lerp(cy, BE[1], BA), dcx = mx, dcy = my - bw / 2 + 4 + top0;   // housing top is clamped between the near and far braces; the rest hangs clear of the board
  pose(lerp(90, 58, zp), lerp(6, 24, zp), lerp(0, -40, zp), 900 / ks, tw(t, s(36.6), s(37.9), E.ioC));
  const fb = project([0, 0, 0]), img = render('wire');
  const hs = D3.hSize, cs = [-1, 1].flatMap(x => [-1, 1].flatMap(y => [-1, 1].map(zz => project([x * hs[0] / 2, y * hs[1] / 2, zz * hs[2] / 2]))));
  const toRig = ([x, y]) => [dcx + (x - fb[0]) / z, dcy + (y - fb[1]) / z];
  const [bx0, by0] = toRig([Math.min(...cs.map(c => c[0])), Math.min(...cs.map(c => c[1]))]), [bx1, by1] = toRig([Math.max(...cs.map(c => c[0])), Math.max(...cs.map(c => c[1]))]);
  const ax = lerp(dcx, fbF[0], zp), ay = lerp(dcy, fbF[1], zp);
  ctx.save(); ctx.translate(ax, ay); ctx.scale(z, z); ctx.translate(-dcx, -dcy);
  const wa = 1 - tw(zp, 0.55, 0.95);   // the rig fades as the camera closes in on the device
  ctx.globalAlpha = wa;
  // board + sandpaper
  const bp = tw(t, s(36), s(36.8), E.ioC);
  ctx.save(); ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.8; poly(ctx, rectPts(980, gyB, 900, 30), bp, true);
  ctx.strokeStyle = C.line; ctx.lineWidth = 1; for (const k of [0, 1]) seg(ctx, 1000 + k * 60, gyB + 11 + k * 9, 1860 - k * 90, gyB + 11 + k * 9, bp);
  ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.5; poly(ctx, rectPts(cx - 200, gy, 400, 8), bp, true); hatch(ctx, cx - 200, gy, 400, 8, 5, rgba(C.ink, 0.45), bp); ctx.restore();
  // wheel turns so the bottom of the tyre runs toward the device
  tireLine(ctx, cx, cy, R, -t * 8, t, s(36) - 0.3, 0.7);
  ctx.save(); ctx.lineCap = 'round'; for (let k = 0; k < 2; k++) { const p = tw(t, s(37) + k * 0.1, s(37.6) + k * 0.1); if (p <= 0) continue; ctx.strokeStyle = k === 0 ? C.acc : rgba(C.acc, 0.5); ctx.lineWidth = 3 - k; const a0 = -t * (4 + k * 2) + PI * 0.9 + k; arc(ctx, cx, cy, R + 24 + k * 18, a0, a0 - PI * (0.55 + k * 0.2) * p, 1); } ctx.restore();
  // stand: upright clamps the axle; the brace off the axle bolt carries the device (the far brace hides behind it)
  angleBar(ctx, [cx - 6, gyB], [cx - 6, cy], 26, tw(t, s(36.3), s(37), E.ioC));
  ctx.globalAlpha = 1; ctx.drawImage(img, dcx - fb[0] / z, dcy - fb[1] / z, W / z, H / z); ctx.globalAlpha = wa;
  angleBar(ctx, [cx, cy], BE, bw, tw(t, s(36.5), s(37.3), E.ioC));
  { const bp = tw(t, s(37.5), s(37.9), E.ioC); ctx.save(); ctx.strokeStyle = C.acc; ctx.lineWidth = 2; arc(ctx, cx, cy, 12, 0, TAU, tw(t, s(36.8), s(37.2)));
    for (const k of [-1, 1]) { arc(ctx, mx + k * 11, my, 4.5, 0, TAU, bp); } ctx.restore(); }   // bolts through brace, housing top, far brace
  // dust flung off the contact patch into the device
  for (let i = 0; i < 150; i++) { const ts = s(37.3) + i * 0.013; if (ts > t) break; const a = t - ts, life = 0.7 + hash(i * 2.7) * 0.3, u = a / life; if (u >= 1) continue;
    const x0 = cx + 40, y0 = gy - 4, x1 = bx0 + 4 + hash(i * 1.9) * 22, y1 = lerp(by0 + 18, by1 - 18, hash(i * 4.3)), e = E.outC(u);
    const x = lerp(x0, x1, e), y = lerp(y0, y1, e) - Math.sin(PI * e) * (20 + hash(i * 6.1) * 60);
    ctx.fillStyle = rgba(C.acc, 0.9 * (1 - u * u)); ctx.beginPath(); ctx.arc(x, y, 1.4 + hash(i * 3.1) * 1.6, 0, TAU); ctx.fill(); }
  // call-outs
  { const a = fade; dim(ctx, cx - R, cy - R - 44, cx + R, cy - R - 44, 'Ø 50 cm', tw(t, s(37.2), s(38), E.lin) * a, C.mute, 0, fM(500, 20));
    const hl = tw(t, s(37.2), s(37.8)) * a; ctx.save(); ctx.globalAlpha = hl; ctx.strokeStyle = C.acc; ctx.lineWidth = 1.2; poly(ctx, [[cx + 40, cy - 40], [1580, 318], [1620, 318]], 1); ctx.restore();
    txt(ctx, '48 V 輪轂馬達', 1630, 327, fS(900, 26), C.acc, 'left', hl);
    txt(ctx, '砂紙', cx - 214, gy + 6, fS(700, 22), C.mute, 'right', tw(t, s(37.3), s(37.8)) * a);
    txt(ctx, '捕捉裝置', bx1 + 22, (by0 + by1) / 2 + 10, fS(900, 28), C.ink, 'left', tw(t, s(37.6), s(38.2)) * a); }
  ctx.restore();
  // left column
  if (fade > 0) {
    { const p = tw(t, s(36), s(36) + 0.5); ctx.save(); ctx.globalAlpha = fade; ctx.fillStyle = C.acc; ctx.fillRect(140, 155, 14 * p, 14); ctx.restore();
      reveal(ctx, '04 — THE SYSTEM', 168, 170, { t, t0: s(36) + 0.06, font: fM(500, 20), size: 20, color: C.acc, ls: 3, stagger: 0.014, alpha: fade }); }
    reveal(ctx, '整體模組', 140, 290, { t, t0: s(36.1), font: fS(700, 36), size: 36, color: C.mute, stagger: 0.04, alpha: fade });
    reveal(ctx, '輪轂馬達 × 捕捉裝置', 140, 400, { t, t0: s(36.3), font: fS(900, 68), size: 68, color: C.acc, stagger: 0.04, dur: 0.9, alpha: fade });
    reveal(ctx, '輪胎摩擦砂紙揚起粉塵，', 140, 490, { t, t0: s(36.9), font: fS(700, 32), size: 32, color: C.ink2, stagger: 0.02, alpha: fade });
    reveal(ctx, '裝置鎖在馬達後方，就地攔截。', 140, 540, { t, t0: s(37.3), font: fS(700, 32), size: 32, color: C.ink2, stagger: 0.02, alpha: fade });
    [['48 V', '輪轂馬達'], ['350', 'RPM 最高轉速'], ['Ø 50', 'cm 輪胎外徑'], ['≈ 33', 'km/h 等效車速']].forEach(([v, l], i) => {
      const x = 140 + i * 215, t0 = s(37.1) + i * 0.1;
      ctx.save(); ctx.globalAlpha = fade; ctx.strokeStyle = i === 1 ? C.acc : C.line; ctx.lineWidth = 1.5; seg(ctx, x, 640, x + 185, 640, tw(t, t0, t0 + 0.5, E.ioC)); ctx.restore();
      reveal(ctx, v, x, 708, { t, t0: t0 + 0.05, font: fM(600, 46), size: 46, color: i === 1 ? C.acc : C.ink, stagger: 0.03, alpha: fade });
      txt(ctx, l, x, 750, fS(700, 22), C.mute, 'left', tw(t, t0 + 0.2, t0 + 0.6) * fade); });
  }
}

// ================================================================ 4 device — real CAD model (beats 36-52)
function sDevice(ctx, t) {
  const land = [38.5, 39, 39.5, 40].map(b => s(b));
  const plates = land.map(tl => tw(t, tl - 0.5, tl, E.outQuint));
  const cart = tw(t, s(40.75), s(41.5), E.ioC), dust = tw(t, s(41.8), s(42.5), E.ioC);
  const scan0 = s(43.5), scanP = E.ioC(P(t, scan0, scan0 + 0.9));
  const pull = 45 * (tw(t, s(48), s(49), E.ioC) - tw(t, s(50), s(51), E.ioC));
  const asm = tw(t, s(40), s(43), E.ioC), rot = tw(t, scan0, s(51.5), E.ioC);
  const pose = { cart, dust, plates, pull, drawP: tw(t, s(36.2), s(38.6), E.ioC),
    az: lerp(lerp(58, 42, tw(t, s(36), s(43.5), E.ioC)), -38, rot), el: lerp(24, 17, rot), dist: lerp(900, 640, asm), offX: 380, lookY: lerp(-40, 0, asm) };
  setPose(pose);
  if (t < scan0 + 1) { const img = render('wire'); ctx.save(); ctx.beginPath(); ctx.rect(W * 0.62 * scanP, 0, W, H); ctx.clip(); ctx.drawImage(img, 0, 0); ctx.restore(); }
  if (t > scan0) { const img = render('solid'); ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W * 0.62 * scanP, H); ctx.clip(); ctx.drawImage(img, 0, 0); ctx.restore();
    if (scanP > 0 && scanP < 1) { const x = W * 0.62 * scanP; ctx.fillStyle = C.acc; ctx.fillRect(x - 1, 90, 2, H - 180); } }
  // right column
  const rx = 1180;
  kicker(ctx, rx, 170, '04 — THE DEVICE', t, s(36));
  reveal(ctx, '裝置結構', rx, 256, { t, t0: s(36.3), font: fS(900, 60), size: 60, stagger: 0.06, dur: 0.9 });
  txt(ctx, 'Autodesk Inventor 3D 模型', rx, 306, fS(700, 24), C.mute, 'left', tw(t, s(36.8), s(37.5)));
  // assembly call-outs
  const fade = 1 - tw(t, s(43.1), s(43.5));
  const call = (name, ly, a, b, t0) => { const p = tw(t, t0, t0 + 0.6, E.ioC) * fade; if (p <= 0) return; const c = partCenter(name);
    ctx.save(); ctx.globalAlpha = p; ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.2; poly(ctx, [c, [rx - 30, ly], [rx - 10, ly]], p); ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(c[0], c[1], 4, 0, TAU); ctx.fill();
    txt(ctx, a, rx, ly + 10, fS(900, 36), name.startsWith('plate') ? C.acc : C.ink); txt(ctx, b, rx, ly + 48, fS(700, 22), C.mute); ctx.restore(); };
  call('plate1', 430, '銅片極板 ×4', '插入極板匣 · 間距 17 mm', s(38.3));
  call('cartridge', 590, '極板匣', '整組滑入外殼', s(40.8));
  call('dust', 750, '集塵盒', '推入底部，收集粉塵', s(41.9));
  // dimensions on the solid model
  const dp = tw(t, s(44.4), s(45.4), E.lin) * (1 - tw(t, s(47.6), s(48)));
  if (dp > 0) { const hs = D3.hSize, hx = hs[0] / 2, hy = hs[1] / 2, hz = hs[2] / 2;
    const a = project([hx + 18, -hy, hz]), b = project([hx + 18, hy, hz]); dim(ctx, a[0] + 20, a[1], b[0] + 20, b[1], '172.7 mm', dp, C.ink, 0, fM(500, 22));
    const c = project([-hx, -hy - 14, hz + 10]), d = project([hx, -hy - 14, hz + 10]); dim(ctx, c[0], c[1] + 16, d[0], d[1] + 16, '100 mm', dp, C.ink, 0, fM(500, 22)); }
  // spec table
  const tw2 = 600, rows = [['HV', '直流高壓電場', '15 kV'], ['GAP', '平行極板間距', '17 mm'], ['MOTOR', '輪轂馬達', '48 V'], ['RPM', '最高轉速 ≈ 33 km/h', '350'], ['BODY', '3D 列印絕緣外殼', 'PLA'], ['FUSE', '過電流保護', '2 A'], ['SEAL', '高壓端子絕緣', '熱熔膠']];
  const th = s(44.4);
  ctx.save(); ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.5; seg(ctx, rx, 350, rx + tw2, 350, tw(t, th, th + 0.6, E.ioC)); ctx.restore();
  rows.forEach(([k, d, v], i) => { const t0 = th + B(0.5) * i, y = 350 + (i + 1) * 70;
    ctx.save(); ctx.strokeStyle = C.line; ctx.lineWidth = 1; seg(ctx, rx, y, rx + tw2, y, tw(t, t0, t0 + 0.5, E.ioC)); ctx.restore();
    type(ctx, k, rx, y - 24, t, t0, fM(500, 20), C.mute, 24, false);
    reveal(ctx, d, rx + 100, y - 22, { t, t0: t0 + 0.05, font: fS(700, 28), size: 28, color: C.ink2, stagger: 0.02 });
    reveal(ctx, v, rx + tw2, y - 20, { t, t0: t0 + 0.12, font: /[一-鿿]/.test(v) ? fS(900, 32) : fM(600, 36), size: 36, color: i < 2 ? C.acc : C.ink, align: 'right', stagger: 0.03 }); });
  // pull-out note
  { const p = tw(t, s(48.2), s(48.9)) * (1 - tw(t, s(51.4), s(51.9))); if (p > 0) { const [px, py] = partCenter('cartridge');
    ctx.save(); ctx.globalAlpha = p; ctx.strokeStyle = C.acc; ctx.lineWidth = 1.5; poly(ctx, [[px, py], [rx - 40, 892], [rx - 12, 892]], p); ctx.fillStyle = C.acc; ctx.beginPath(); ctx.arc(px, py, 5, 0, TAU); ctx.fill(); ctx.restore();
    txt(ctx, '極板匣可整組抽出', rx, 904, fS(900, 36), C.acc, 'left', p); txt(ctx, '回收粉塵免拆解，方便秤重', rx, 948, fS(700, 24), C.ink2, 'left', p); } }
}

// ================================================================ 5 fail-safe (beats 52-60)
function icon(ctx, kind, x, y, col, open = 0) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const L = (...p) => { ctx.beginPath(); ctx.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]); ctx.stroke(); };
  switch (kind) {
    case 'plug': rr(ctx, -15, -8, 30, 24, 5); ctx.stroke(); L(-7, -8, -7, -19); L(7, -8, 7, -19); L(0, 16, 0, 24); break;
    case 'xfmr': for (const sx of [-12, 12]) for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(sx, -14 + k * 9.5, 4.5, -PI / 2, PI / 2, sx > 0); ctx.stroke(); } L(-2, -20, -2, 20); L(2, -20, 2, 20); break;
    case 'fuse': rr(ctx, -20, -9, 40, 18, 9); ctx.stroke(); L(-28, 0, 28, 0); break;
    case 'switch': ctx.beginPath(); ctx.arc(-16, 6, 3.5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(16, 6, 3.5, 0, TAU); ctx.fill(); L(-16, 6, 14, -3); break;
    case 'relay': { rr(ctx, -22, -18, 44, 36, 5); ctx.stroke(); ctx.beginPath(); ctx.arc(-11, 7, 3, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(11, 7, 3, 0, TAU); ctx.fill(); const a = lerp(0, -0.8, open); L(-11, 7, -11 + 22 * Math.cos(a), 7 + 22 * Math.sin(a)); L(-13, -9, 13, -9); break; }
    case 'bolt': ctx.beginPath(); ctx.moveTo(4, -22); ctx.lineTo(-11, 3); ctx.lineTo(0, 3); ctx.lineTo(-4, 22); ctx.lineTo(11, -4); ctx.lineTo(0, -4); ctx.closePath(); ctx.stroke(); break;
    case 'plates': for (const px of [-13, 0, 13]) { rr(ctx, px - 3, -18, 6, 36, 2); ctx.stroke(); } break;
    case 'dc': L(-17, -5, 17, -5); ctx.setLineDash([5, 5]); L(-17, 6, 17, 6); ctx.setLineDash([]); break;
    case 'rain': rr(ctx, -20, -14, 40, 28, 3); ctx.stroke(); for (let k = 0; k < 4; k++) L(-12 + k * 8, -8, -12 + k * 8, 8); break;
    case 'mcu': rr(ctx, -22, -16, 44, 32, 3); ctx.stroke(); rr(ctx, -8, -7, 16, 14, 2); ctx.stroke(); for (let k = 0; k < 5; k++) { L(-16 + k * 8, -16, -16 + k * 8, -21); L(-16 + k * 8, 16, -16 + k * 8, 21); } break;
  }
  ctx.restore();
}
function sSafety(ctx, t) {
  const v = R43(52, 26), vv = x => B(52 + (x - 26) * 4 / 3);
  const cut = t >= vv(29), relayOpen = tw(t, vv(29), vv(29) + 0.22, E.outBack);
  const ra = tw(t, vv(27), vv(28), E.outC); if (ra > 0) { ctx.save(); ctx.strokeStyle = rgba(C.ink, 0.13 * ra); ctx.lineWidth = 1;
    for (let i = 0; i < 120; i++) { const sp = 900 + hash(i) * 600, x = hash(i * 3.3) * (W + 200) - 100, y = ((t * sp + hash(i * 7) * (H + 200)) % (H + 200)) - 100; seg(ctx, x, y, x - 8, y + 36, 1); } ctx.restore(); }
  kicker(ctx, 140, 170, '05 — FAIL-SAFE', t, s(52));
  const w1 = reveal(ctx, '下雨了？', 140, 256, { t, t0: s(52), font: fS(900, 62), size: 62, dur: 0.9 });
  reveal(ctx, '高壓自動斷電。', 160 + w1, 256, { t, t0: s(52.6), font: fS(900, 62), size: 62, color: C.acc, dur: 0.9 });
  reveal(ctx, 'NO 常開接點：控制失效時，高壓預設關閉', 140, 330, { t, t0: vv(30), font: fS(700, 30), size: 30, color: C.ink2, stagger: 0.02 });
  const Y = 480, xs = [210, 460, 710, 960, 1210, 1460, 1710], LY = 760, BW = 196, BH = 116;
  const main = [['plug', '110V 市電'], ['xfmr', '變壓器 12V'], ['fuse', '保險絲 2A'], ['switch', '手動開關'], ['relay', '繼電器 NO'], ['bolt', '升壓 15 kV'], ['plates', '銅片極板']];
  const low = [[830, 'dc', '降壓 5V'], [1085, 'rain', '雨滴感測器'], [1340, 'mcu', 'Arduino']];
  for (let i = 0; i < 6; i++) { const p = tw(t, vv(26.5) + i * 0.08, vv(26.5) + i * 0.08 + 0.45, E.ioC); const dead = cut && i >= 4;
    ctx.save(); ctx.strokeStyle = dead ? C.dim : C.ink2; ctx.lineWidth = 1.5; seg(ctx, xs[i] + BW / 2, Y, xs[i + 1] - BW / 2, Y, p);
    if (t > vv(27) && !dead) { ctx.strokeStyle = C.acc; ctx.lineWidth = 3; ctx.setLineDash([6, 14]); ctx.lineDashOffset = -t * 90; seg(ctx, xs[i] + BW / 2, Y, xs[i + 1] - BW / 2, Y, 1); }
    ctx.restore(); }
  ctx.save(); ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.5;
  poly(ctx, [[1085, Y], [1085, 630], [830, 630], [830, LY - BH / 2]], tw(t, vv(27), vv(27.6), E.ioC));
  seg(ctx, 830 + BW / 2, LY, 1085 - BW / 2, LY, tw(t, vv(27.2), vv(27.6))); seg(ctx, 1085 + BW / 2, LY, 1340 - BW / 2, LY, tw(t, vv(27.3), vv(27.7)));
  ctx.setLineDash([8, 6]); poly(ctx, [[1340, LY - BH / 2], [1340, 615], [1210, 615], [1210, Y + BH / 2]], tw(t, vv(27.4), vv(28), E.ioC)); ctx.restore();
  const node = (x, y, kind, label, t0, col, state = 0) => { const p = tw(t, t0, t0 + 0.55, E.ioC); if (p <= 0) return;
    ctx.save(); ctx.fillStyle = C.bg; ctx.fillRect(x - BW / 2, y - BH / 2, BW, BH); ctx.strokeStyle = col; ctx.lineWidth = col === C.dim ? 1.2 : 2; poly(ctx, rectPts(x - BW / 2, y - BH / 2, BW, BH), p, true); ctx.restore();
    ctx.save(); ctx.globalAlpha = clamp(p * 2 - 0.6); icon(ctx, kind, x, y - 16, col === C.dim ? C.mute : col, state); txt(ctx, label, x, y + 42, fS(700, 22), C.ink2, 'center'); ctx.restore(); };
  main.forEach(([k, l], i) => { let col = C.ink2; if (t > vv(27)) col = i >= 5 ? C.acc : C.ink2; if (cut && i >= 5) col = C.dim; if (i === 4 && cut) col = C.red; node(xs[i], Y, k, l, s(52) + i * 0.1, col, i === 4 ? relayOpen : 0); });
  const sens = t > vv(28) && t < vv(31.5);
  low.forEach(([x, k, l], i) => node(x, LY, k, l, vv(26.8) + i * 0.1, (i === 1 && sens) || (i === 2 && t > vv(28.5) && t < vv(31.5)) ? C.ink : C.ink2));
  if (t > vv(27.4) && t < vv(28.15)) { const p = E.inC(P(t, vv(27.4), vv(28))), y = lerp(-40, LY - BH / 2 - 26, p); ctx.save(); ctx.globalAlpha = 1 - P(t, vv(28), vv(28.15)); ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(1085, y - 30); ctx.bezierCurveTo(1098, y - 8, 1104, y, 1104, y + 8); ctx.arc(1085, y + 8, 19, 0, PI); ctx.bezierCurveTo(1066, y, 1072, y - 8, 1085, y - 30); ctx.stroke(); ctx.restore(); }
  for (const k of [0, 1]) { const a = t - vv(28) - k * 0.14; if (a > 0 && a < 0.7) { ctx.save(); ctx.strokeStyle = rgba(C.ink, 1 - a / 0.7); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(1085, LY - BH / 2, 20 + a * 180, 5 + a * 36, 0, 0, TAU); ctx.stroke(); ctx.restore(); } }
  const sig = (pts, t0, t1) => { const p = P(t, t0, t1); if (p <= 0 || p >= 1) return; let tot = 0; const L = []; for (let i = 1; i < pts.length; i++) { L.push(Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); tot += L[i - 1]; }
    let d = tot * E.ioC(p), i = 0; while (i < L.length - 1 && d > L[i]) { d -= L[i]; i++; } const f = d / L[i]; ctx.save(); ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f), 8, 0, TAU); ctx.fill(); ctx.restore(); };
  sig([[1085 + BW / 2, LY], [1340 - BW / 2, LY]], vv(28.05), vv(28.5)); sig([[1340, LY - BH / 2], [1340, 615], [1210, 615], [1210, Y + BH / 2]], vv(28.5), vv(29));
  { const a = t - vv(29); if (a > 0 && a < 0.9) { ctx.save(); ctx.strokeStyle = rgba(C.red, 1 - a / 0.9); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(1210, Y, 70 + a * 150, 0, TAU); ctx.stroke(); ctx.restore(); } }
  { const p = tw(t, vv(27), vv(27.6), E.ioC); if (p > 0) { const x = 1420, y = 205, w = 360, h = 68, off = cut, fl = off ? tw(t, vv(29), vv(29) + 0.3) : 1;
    ctx.save(); ctx.strokeStyle = off ? C.red : C.acc; ctx.lineWidth = 1.8; poly(ctx, rectPts(x, y, w, h), p, true);
    ctx.globalAlpha = clamp(p * 2 - 1) * fl; ctx.fillStyle = off ? C.red : C.acc; ctx.beginPath(); ctx.arc(x + 36, y + 34, 9, 0, TAU); ctx.fill();
    txt(ctx, off ? '15 kV · 斷電' : '15 kV · 通電', x + 66, y + 46, fS(900, 32), off ? C.red : C.ink); ctx.restore(); } }
  { const x = 140, y = 650, w = 540, h = 260, p = tw(t, vv(26.8), vv(27.6), E.ioC); if (p > 0) {
    ctx.save(); ctx.strokeStyle = C.dim; ctx.lineWidth = 1.2; poly(ctx, rectPts(x, y, w, h), p, true); ctx.restore();
    txt(ctx, '序列埠監控', x + 22, y + 40, fS(700, 22), C.mute, 'left', clamp(p * 2 - 1));
    const lines = [[vv(27), '乾燥 → 繼電器通電', C.ink2], [vv(27.6), '乾燥 → 繼電器通電', C.ink2], [vv(28.3), '偵測到水 → 繼電器斷電', C.red], [vv(29.3), '偵測到水 → 繼電器斷電', C.red], [vv(30.5), '剛停雨，等待中...', C.acc]];
    const vis = lines.filter(l => t >= l[0]).slice(-4); vis.forEach(([t0, str, col], i) => type(ctx, '> ' + str, x + 22, y + 92 + i * 44, t, t0, fM(500, 24), col, 32, i === vis.length - 1)); } }
  const checks = [['開機（乾燥）', '通過'], ['偵測降雨即斷電', '通過'], ['停雨延遲復電', '通過'], ['手動開關優先', '設計成立']];
  checks.forEach(([a, b], i) => { const t0 = vv(30) + i * 0.2, p = tw(t, t0, t0 + 0.5, E.ioC); if (p <= 0) return; const y = 720 + i * 48;
    txt(ctx, a, 1480, y, fS(700, 24), C.ink2, 'left', p); txt(ctx, b, 1780, y, fS(900, 24), i < 3 ? C.acc : C.ink2, 'right', p);
    ctx.save(); ctx.strokeStyle = C.line; ctx.lineWidth = 1; seg(ctx, 1480, y + 14, 1780, y + 14, p); ctx.restore(); });
}

// ================================================================ 6 results
function sStatic(ctx, t) {                       // beats 60-64
  const vv = x => B(60 + (x - 32) * 4 / 3);
  kicker(ctx, 140, 170, '06 — RESULTS · 靜態捕捉效率', t, s(60));
  const vals = [1.00, 0.67, 0.50, 9.00, 17.00, 18.67, 21.00, 15.80], base = 860, maxH = 540, bw = 74;
  ctx.save(); ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.5; seg(ctx, 130, base, 1010, base, tw(t, s(60), s(61), E.ioC)); ctx.restore();
  vals.forEach((v, i) => { const x = 150 + i * 102 + (i >= 3 ? 40 : 0), t0 = s(60.2) + i * B(0.3), p = spring(t - t0, 2, 0.55); if (p <= 0) return;
    const h = Math.max(4, v / 21 * maxH) * p, on = i >= 3;
    ctx.save(); ctx.strokeStyle = on ? C.acc : C.mute; ctx.lineWidth = 2; ctx.strokeRect(x, base - h, bw, h); hatch(ctx, x, base - h, bw, h, 9, on ? rgba(C.acc, 0.55) : rgba(C.ink, 0.2)); ctx.restore();
    txt(ctx, v.toFixed(1), x + bw / 2, base - h - 14, fM(500, 22), on ? C.acc2 : C.mute, 'center', clamp(p)); });
  txt(ctx, '電場關閉', 150 + 102 + bw / 2, base + 46, fS(700, 26), C.mute, 'center', tw(t, s(60.6), s(61.2)));
  txt(ctx, '開啟 15 kV', 150 + 510 + 40 + bw / 2, base + 46, fS(700, 26), C.acc, 'center', tw(t, s(60.6), s(61.2)));
  const rx = 1160;
  txt(ctx, '電場關閉', rx, 290, fS(700, 26), C.mute, 'left', tw(t, vv(32.2), vv(32.6)));
  counter(ctx, 0.72 * tw(t, vv(32.2), vv(33.2), E.outExpo), 2, rx, 380, 80, C.mute, '%', C.mute);
  txt(ctx, '開啟 15 kV', rx, 460, fS(700, 26), C.acc, 'left', tw(t, vv(32.6), vv(33)));
  if (t > vv(32.6)) counter(ctx, 16.29 * tw(t, vv(32.6), vv(33.8), E.outExpo), 2, rx, 590, 136, C.acc, '%', C.ink);
  const sp = spring(t - s(62), 2, 0.5); if (sp > 0) { ctx.save(); ctx.globalAlpha = clamp(sp * 1.5); ctx.translate(rx, 770); ctx.scale(0.85 + 0.15 * sp, 0.85 + 0.15 * sp); txt(ctx, '≈ 22 倍', 0, 0, fS(900, 110), C.ink); ctx.restore();
    brackets(ctx, rx - 24, 664, 470, 140, 22, tw(t, s(62), s(62.7)), C.ink, 1.5); }
  reveal(ctx, '兩組數值範圍完全不重疊', rx, 858, { t, t0: s(62.6), font: fS(700, 28), size: 28, color: C.ink2, stagger: 0.02 });
}
function sDynamic(ctx, t) {                      // beats 64-68
  const vv = x => B(64 + (x - 35) * 4 / 3);
  kicker(ctx, 140, 170, '06 — RESULTS · 動態輪胎摩擦', t, s(64));
  const cx = 360, cy = 500, R = 170;
  tireLine(ctx, cx, cy, R, t * 8, t, s(64) - 0.3);
  ctx.save(); ctx.lineCap = 'round'; for (let k = 0; k < 3; k++) { const p = tw(t, vv(35.3) + k * 0.1, vv(35.8) + k * 0.1); if (p <= 0) continue; ctx.strokeStyle = k === 0 ? C.acc : rgba(C.acc, 0.5); ctx.lineWidth = 3 - k; const a0 = t * (4 + k * 2) * (k % 2 ? -1 : 1) + k; arc(ctx, cx, cy, R + 24 + k * 18, a0, a0 + PI * (0.6 + k * 0.2) * p, 1); } ctx.restore();
  reveal(ctx, '350 RPM', cx, cy + R + 96, { t, t0: vv(35.5), font: fM(600, 44), size: 44, align: 'center' });
  txt(ctx, '≈ 33 km/h 等效車速', cx, cy + R + 142, fS(700, 26), C.ink2, 'center', tw(t, vv(35.7), vv(36.2)));
  txt(ctx, '動態平均捕捉效率', 640, 370, fS(700, 32), C.ink2, 'left', tw(t, vv(35.2), vv(35.7)));
  txt(ctx, '≈', 640, 560, fM(500, 100), C.acc, 'left', tw(t, vv(35), vv(35.4)));
  counter(ctx, 27.6 * tw(t, vv(35), vv(36.3), E.outExpo), 0, 710, 560, 210, C.acc, '%', C.ink);
  txt(ctx, '開放環境 · 未加導流罩', 644, 626, fS(700, 26), C.mute, 'left', tw(t, vv(35.8), vv(36.3)));
  const x0 = 1180, y0 = 780, cw = 600, ch = 380, X = c => x0 + c / 80 * cw, Yv = h => y0 - h / 16 * ch;
  ctx.save(); ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.5; poly(ctx, [[x0, y0 - ch], [x0, y0], [x0 + cw, y0]], tw(t, vv(35.2), vv(36), E.ioC));
  ctx.strokeStyle = C.mute; for (let c = 0; c <= 80; c += 10) seg(ctx, X(c), y0, X(c), y0 + (c % 20 ? 6 : 12), tw(t, vv(35.4), vv(36))); ctx.restore();
  for (const c of [0, 20, 40, 60, 80]) txt(ctx, String(c), X(c), y0 + 40, fM(500, 22), C.mute, 'center', tw(t, vv(35.6), vv(36)));
  txt(ctx, '水平距離 (cm)', x0 + cw, y0 + 80, fS(700, 22), C.mute, 'right', tw(t, vv(35.6), vv(36))); txt(ctx, '粉塵飛散高度', x0, y0 - ch - 18, fS(700, 22), C.mute, 'left', tw(t, vv(35.6), vv(36)));
  const data = [[0, 0], [12, 8.5], [30, 14], [35, 10], [40, 8], [45, 6], [50, 5], [55, 4.5], [60, 4], [65, 2], [70, 0], [73, 0]], pts = [];
  for (let i = 0; i < data.length - 1; i++) { const p0 = data[Math.max(0, i - 1)], p1 = data[i], p2 = data[i + 1], p3 = data[Math.min(data.length - 1, i + 2)];
    for (let k = 0; k < 12; k++) { const u = k / 12, u2 = u * u, u3 = u2 * u; const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3); pts.push([X(f(p0[0], p1[0], p2[0], p3[0])), Yv(Math.max(0, f(p0[1], p1[1], p2[1], p3[1])))]); } }
  pts.push([X(73), Yv(0)]);
  ctx.save(); ctx.strokeStyle = C.acc; ctx.lineWidth = 2.5; poly(ctx, pts, tw(t, vv(36), vv(37.3), E.ioC)); ctx.restore();
  data.slice(2, 11).forEach(([c, h]) => { const p = spring(t - vv(36) - (c / 73) * (vv(37.3) - vv(36)), 2.2, 0.5); if (p <= 0) return; ctx.save(); ctx.fillStyle = C.bg; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X(c), Yv(h), 5 * Math.min(1.2, p), 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); });
  { const p = tw(t, vv(37), vv(37.6), E.ioC); ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.setLineDash([5, 5]); seg(ctx, X(27), y0, X(27), Yv(16), p); ctx.restore(); reveal(ctx, '27 cm 沉積最多', X(27) + 12, Yv(16) + 22, { t, t0: vv(37.2), font: fS(700, 24), size: 24 }); }
  dim(ctx, X(0), y0 + 120, X(73), y0 + 120, '擴散範圍 0–73 cm', tw(t, vv(37.3), vv(38), E.lin), C.acc, 0, fS(700, 24));
}
function sSpec(ctx, t) {                         // beats 68-72
  const vv = x => B(68 + (x - 38) * 4 / 3);
  kicker(ctx, 140, 170, '06 — RESULTS · 高解析質譜', t, s(68));
  txt(ctx, 'Bruker micrOTOF II · 同位素分布比對', 166, 222, fS(700, 24), C.ink2, 'left', tw(t, vv(38.2), vv(38.7)));
  const x0 = 140, x1 = 1060, yc = 590, hh = 260, mz = m => x0 + (m - 267.8) / 4.6 * (x1 - x0);
  ctx.save(); ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.2; seg(ctx, x0, yc, x1, yc, tw(t, vv(38), vv(38.7), E.ioC));
  for (let m = 268; m <= 272; m++) { seg(ctx, mz(m), yc - 8, mz(m), yc + 8, tw(t, vv(38.3), vv(38.7))); txt(ctx, String(m), mz(m), yc + 38, fM(500, 20), C.mute, 'center', tw(t, vv(38.3), vv(38.7))); } ctx.restore();
  txt(ctx, '實測', x0, yc - hh - 30, fS(900, 26), C.acc, 'left', tw(t, vv(38.2), vv(38.6))); txt(ctx, '理論', x0, yc + hh + 50, fS(900, 26), C.ink2, 'left', tw(t, vv(38.2), vv(38.6)));
  const curve = (list, sig, dir, grow) => { const pts = []; for (let px = x0; px <= x1; px += 2) { const m = 267.8 + (px - x0) / (x1 - x0) * 4.6; let v = 0; list.forEach(([c, h], i) => { v += h * spring(t - grow - i * 0.12, 1.8, 0.55) * Math.exp(-((m - c) ** 2) / (2 * sig * sig)); }); pts.push([px, yc + dir * v * hh]); } return pts; };
  ctx.save(); ctx.strokeStyle = C.acc; ctx.lineWidth = 2.4; poly(ctx, curve([[268.1926, 1], [269.1976, 0.33], [270.1992, 0.03], [271.1492, 0.02]], 0.022, -1, vv(38.4)), 1); ctx.restore();
  ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.8; ctx.setLineDash([5, 4]); poly(ctx, curve([[268.1934, 1], [269.1967, 0.19], [270.2, 0.02]], 0.11, 1, vv(38.6)), 1); ctx.restore();
  txt(ctx, '268.1926', mz(268.19) + 18, yc - hh + 16, fM(600, 24), C.acc, 'left', tw(t, vv(39), vv(39.4)));
  txt(ctx, '268.1934', mz(268.19) + 64, yc + hh - 20, fM(600, 24), C.ink, 'left', tw(t, vv(39.1), vv(39.5)));
  { const p = tw(t, vv(39.3), vv(39.8), E.ioC); ctx.save(); ctx.strokeStyle = C.ink2; ctx.lineWidth = 1; ctx.setLineDash([3, 5]); seg(ctx, mz(268.193), yc - hh - 20, mz(268.193), yc + hh + 10, p); ctx.restore(); }
  const rx = 1180;
  txt(ctx, '質量誤差', rx, 350, fS(700, 28), C.ink2, 'left', tw(t, vv(38.5), vv(39)));
  counter(ctx, 2.98 * tw(t, vv(38.5), vv(39.8), E.outExpo), 2, rx, 510, 160, C.acc, 'ppm', C.ink, 0.36);
  { const p = tw(t, vv(39.5), vv(40), E.ioC); ctx.save(); ctx.strokeStyle = C.acc; ctx.lineWidth = 1.5; poly(ctx, rectPts(rx, 552, 250, 54), p, true); ctx.restore(); txt(ctx, '< 5 ppm  ✓', rx + 125, 588, fM(600, 24), C.acc, 'center', clamp(p * 2 - 1)); }
  reveal(ctx, '訊號與 6PPD 相近', rx, 700, { t, t0: vv(39.75), font: fS(900, 50), size: 50, dur: 0.9 });
  txt(ctx, 'C₁₈H₂₄N₂ · 268.1934 / 268.1926 Da', rx, 756, fM(500, 22), C.ink2, 'left', tw(t, vv(40), vv(40.4)));
  reveal(ctx, '初步跡象，仍待 6PPD 標準品比對', rx, 812, { t, t0: vv(40.25), font: fS(700, 24), size: 24, color: C.mute, stagger: 0.02 });
}

// ================================================================ end card (beats 76-80)
function sEnd(ctx, t) {
  const cx = W / 2, cy = 350, t0 = s(76);
  for (let i = 0; i < 140; i++) { const a0 = hash(i) * TAU, r0 = 420 + hash(i * 3) * 700, st = t0 + hash(i * 5) * 0.8, p = E.inC(P(t, st, st + 1.4)); if (p <= 0 || p >= 1) continue;
    const bx = cx + [-36, 0, 36][i % 3], by = cy + (hash(i * 7) - 0.5) * 110, x = lerp(cx + Math.cos(a0) * r0, bx, p), y = lerp(cy + Math.sin(a0) * r0 * 0.6, by, p);
    ctx.fillStyle = i % 4 ? rgba(C.acc, 0.85) : rgba(C.ink, 0.6); ctx.beginPath(); ctx.arc(x, y, 1.5 + hash(i * 9) * 1.5, 0, TAU); ctx.fill(); }
  ctx.save(); ctx.setLineDash([2, 9]); ctx.strokeStyle = rgba(C.ink, 0.35); ctx.lineWidth = 1; ctx.translate(cx, cy); ctx.rotate((t - t0) * 0.25); arc(ctx, 0, 0, 190, 0, TAU, tw(t, t0, t0 + 1.2, E.ioC)); ctx.restore();
  const sq = 200; ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2; poly(ctx, [[cx - sq / 2 + 36, cy - sq / 2], [cx + sq / 2 - 36, cy - sq / 2], [cx + sq / 2, cy - sq / 2 + 36], [cx + sq / 2, cy + sq / 2 - 36], [cx + sq / 2 - 36, cy + sq / 2], [cx - sq / 2 + 36, cy + sq / 2], [cx - sq / 2, cy + sq / 2 - 36], [cx - sq / 2, cy - sq / 2 + 36]], tw(t, t0, t0 + 0.8, E.ioC), true); ctx.restore();
  [-1, 0, 1].forEach((k, i) => { const p = spring(t - t0 - 0.25 - i * 0.1, 2, 0.5); if (p <= 0) return; const bw = 15, bh = 116 * Math.min(1.05, p), bx = cx + k * 36 - bw / 2;
    ctx.save(); ctx.strokeStyle = k === 0 ? C.acc : C.ink; ctx.lineWidth = 2; ctx.strokeRect(bx, cy - bh / 2, bw, bh); if (k === 0) { ctx.fillStyle = rgba(C.acc, clamp(p)); ctx.fillRect(bx, cy - bh / 2, bw, bh); } ctx.restore(); });
  reveal(ctx, 'TRWP', cx, 610, { t, t0: t0 + 0.35, font: fM(600, 120), size: 120, align: 'center', ls: 30, stagger: 0.06 });
  reveal(ctx, '在源頭，攔下它。', cx, 700, { t, t0: t0 + 0.7, font: fS(900, 44), size: 44, align: 'center', stagger: 0.04 });
  txt(ctx, 'CAPTURE IT AT THE SOURCE.', cx, 752, fM(500, 22), C.acc, 'center', tw(t, t0 + 0.95, t0 + 1.5), 6);
  reveal(ctx, '主動式輪胎磨損微粒靜電捕捉裝置', cx, 830, { t, t0: t0 + 1.1, font: fS(700, 32), size: 32, align: 'center', color: C.ink2, stagger: 0.02 });
  txt(ctx, '中原大學機械系 · 指導教授 杜哲怡', cx, 890, fS(700, 24), C.mute, 'center', tw(t, t0 + 1.35, t0 + 1.9));
  txt(ctx, '專題生 陳睿瑀 · 李恩 · 林子鈞', cx, 932, fS(700, 24), C.mute, 'center', tw(t, t0 + 1.5, t0 + 2.05));
}

// ------------------------------------------------------------ transitions
const CUTS = Object.values(CUT).map(b => B(b));
const HW = 0.3;
const wipeX = (t, tc) => W * E.ioC(P(t, tc - HW, tc + HW));
// scenes from the device on were authored on the old beat grid (device at 36); they now run one bar later
const late = f => (ctx, t) => f(ctx, t - B(4));
// the system shot zooms into the assembled device; hold that drawing while the exploded one draws in
function sDeviceIn(ctx, t) {
  const a = 1 - tw(t, B(40.3), B(41.6), E.ioC);
  if (a > 0) { setPose({ cart: 1, dust: 1, plates: [1, 1, 1, 1], pull: 0, drawP: 1, az: 58, el: 24, dist: 900, offX: 380, lookY: -40 });
    ctx.save(); ctx.globalAlpha = a; ctx.drawImage(render('wire'), 0, 0); ctx.restore(); }
  late(sDevice)(ctx, t);
}
const SCENES = [[0, CUT.problemA, sIntro], [CUT.problemA, CUT.problemB, sProblemA], [CUT.problemB, CUT.ppd, sProblemB], [CUT.ppd, CUT.limits, sPPD], [CUT.limits, CUT.physics, sLimits], [CUT.physics, CUT.rig, sPhysics],
  [CUT.rig, CUT.device, sRig], [CUT.device, CUT.safety, sDeviceIn], [CUT.safety, CUT.stat, late(sSafety)], [CUT.stat, CUT.dyn, late(sStatic)], [CUT.dyn, CUT.spec, late(sDynamic)], [CUT.spec, CUT.end, late(sSpec)], [CUT.end, 80.4, sEnd]].map(([a, b, f]) => [B(a), B(b), f]);
function scanLine(ctx, t) {
  for (const tc of CUTS) { if (t < tc - HW || t > tc + HW) continue; const x = wipeX(t, tc);
    const g = ctx.createLinearGradient(x - 160, 0, x, 0); g.addColorStop(0, 'rgba(255,138,0,0)'); g.addColorStop(1, 'rgba(255,138,0,0.12)'); ctx.fillStyle = g; ctx.fillRect(x - 160, 0, 160, H);
    ctx.fillStyle = C.acc; ctx.fillRect(x - 1, 0, 2, H); }
}
const SEC = [[CUT.problemA, '01', 'THE PROBLEM'], [CUT.limits, '02', 'CURRENT SOLUTIONS'], [CUT.physics, '03', 'HOW IT WORKS'], [CUT.rig, '04', 'THE SYSTEM'], [CUT.device, '04', 'THE DEVICE'], [CUT.safety, '05', 'FAIL-SAFE'], [CUT.stat, '06', 'RESULTS']];
function hud(ctx, t) {
  const a = tw(t, 0.4, 1.6) * (1 - tw(t, s(76), s(76.8))); if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = C.mute; ctx.lineWidth = 1.2;
  for (const [x, y, dx, dy] of [[56, 56, 1, 1], [W - 56, 56, -1, 1], [W - 56, H - 56, -1, -1], [56, H - 56, 1, -1]]) poly(ctx, [[x + dx * 26, y], [x, y], [x, y + dy * 26]], 1);
  ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.2; rr(ctx, 140, 48, 32, 32, 7); ctx.stroke();
  for (const k of [-1, 0, 1]) { if (k === 0) { ctx.fillStyle = C.acc; ctx.fillRect(154, 55, 4, 18); } else ctx.strokeRect(154.5 + k * 8, 55.5, 3, 17); }
  txt(ctx, 'TRWP', 186, 73, fM(600, 22), C.ink, 'left', 1, 3);
  const sec = [...SEC].reverse().find(q => t >= B(q[0])); if (sec) { const sp = tw(t, B(sec[0]), B(sec[0]) + 0.6); ctx.save(); ctx.beginPath(); ctx.rect(1100, 40, 680, 46); ctx.clip();
    txt(ctx, `${sec[1]} / 06 — ${sec[2]}`, W - 140, 73 + (1 - sp) * 40, fM(500, 20), C.mute, 'right', 1, 3); ctx.restore(); }
  const rx0 = 140, rx1 = W - 140, ry = H - 64; ctx.strokeStyle = C.dim; ctx.lineWidth = 1; seg(ctx, rx0, ry, rx1, ry, 1);
  for (let b = 0; b <= 80; b++) { const x = rx0 + (rx1 - rx0) * b / 80; ctx.strokeStyle = B(b) <= t ? C.ink2 : C.dim; seg(ctx, x, ry, x, ry - (b % 4 ? 5 : 12), 1); }
  const mx = rx0 + (rx1 - rx0) * t / 60; ctx.fillStyle = C.acc; ctx.beginPath(); ctx.moveTo(mx, ry + 3); ctx.lineTo(mx - 7, ry + 15); ctx.lineTo(mx + 7, ry + 15); ctx.closePath(); ctx.fill();
  ctx.restore();
}
export function drawFrame(ctx, t) {
  background(ctx, t);
  for (const [a, b, fn] of SCENES) {
    const inStart = a === 0 ? -1 : a - HW, outEnd = b >= 60 ? 99 : b + HW; if (t < inStart || t > outEnd) continue;
    const Lx = t > b - HW && b < 60 ? wipeX(t, b) : 0, Rx = t < a + HW && a > 0 ? wipeX(t, a) : W; if (Rx - Lx < 1) continue;
    ctx.save(); ctx.beginPath(); ctx.rect(Lx, 0, Rx - Lx, H); ctx.clip(); fn(ctx, t); ctx.restore();
  }
  scanLine(ctx, t); hud(ctx, t);
  if (t < 0.3) { ctx.fillStyle = `rgba(0,0,0,${1 - t / 0.3})`; ctx.fillRect(0, 0, W, H); }
  if (t > 59.5) { ctx.fillStyle = `rgba(0,0,0,${E.inC(P(t, 59.5, 60))})`; ctx.fillRect(0, 0, W, H); }
}
const SUB = 3, SHUTTER = 0.5;
let work, wctx, bloom, bctx;
export function composite(outCtx, t) {
  if (!work) { work = cv(W, H); wctx = work.getContext('2d'); bloom = cv(W / 4, H / 4); bctx = bloom.getContext('2d'); }
  for (let i = 0; i < SUB; i++) {
    const ts = Math.max(0, t + ((i + 0.5) / SUB - 0.5) * SHUTTER / FPS);
    wctx.setTransform(1, 0, 0, 1, 0, 0); wctx.globalAlpha = 1; wctx.globalCompositeOperation = 'source-over'; drawFrame(wctx, ts);
    outCtx.globalAlpha = 1 / (i + 1); outCtx.drawImage(work, 0, 0);
  }
  outCtx.globalAlpha = 1;
  bctx.filter = 'blur(5px) brightness(0.7) contrast(2.2)'; bctx.clearRect(0, 0, bloom.width, bloom.height); bctx.drawImage(outCtx.canvas, 0, 0, bloom.width, bloom.height); bctx.filter = 'none';
  outCtx.save(); outCtx.globalCompositeOperation = 'lighter'; outCtx.globalAlpha = 0.12; outCtx.drawImage(bloom, 0, 0, W, H); outCtx.restore();
  const v = outCtx.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, H * 1.1); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)'); outCtx.fillStyle = v; outCtx.fillRect(0, 0, W, H);
  const fr = Math.floor(t * FPS); outCtx.save(); outCtx.globalCompositeOperation = 'overlay'; outCtx.globalAlpha = 0.05;
  outCtx.fillStyle = outCtx.createPattern(A.grain[fr % 4], 'repeat'); outCtx.translate((fr * 37) % 256, (fr * 71) % 256); outCtx.fillRect(-256, -256, W + 512, H + 512); outCtx.restore();
}
