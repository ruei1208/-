// Drawn figures (inline SVG). Every number here comes from the written report (v29); content.js picks a figure with `draw: '<name>'`.
window.FIGS = (() => {
  const C = { bg: '#171B21', card: '#1F242C', edge: '#2C333D', grid: '#262C35', ink: '#E6E9EE', sub: '#9AA3AF', dim: '#5B6573', volt: '#3B82F6', voltl: '#60A5FA', silver: '#C9D1DB', amber: '#F59E0B', cu: '#C77B4A', cul: '#E0A27A', red: '#EF4444', green: '#34D399' };
  const svg = (w, h, body, label) => `<svg class="dfig" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.s || 13}" fill="${o.f || C.sub}" text-anchor="${o.a || 'start'}" font-weight="${o.w || 400}"${o.mono ? ' font-family="JetBrains Mono, monospace"' : ''}${o.it ? ' font-style="italic"' : ''}>${s}</text>`;
  const L = (x1, y1, x2, y2, c = C.dim, w = 1, d = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}"${d ? ` stroke-dasharray="${d}"` : ''}/>`;
  const R = (x, y, w, h, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r ?? 4}" fill="${o.f || 'none'}" stroke="${o.s || 'none'}" stroke-width="${o.w || 1}"${o.d ? ` stroke-dasharray="${o.d}"` : ''}/>`;
  const arrowDef = `<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${C.dim}"/></marker><marker id="ahb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${C.voltl}"/></marker></defs>`;
  const A = (x1, y1, x2, y2, c = C.dim, m = 'ah') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="1.4" marker-end="url(#${m})"/>`;
  // axes for a chart: returns body plus scale fns
  function axes(o) {
    const { x0, y0, x1, y1, xmin, xmax, ymin, ymax } = o, sx = v => x0 + (v - xmin) / (xmax - xmin) * (x1 - x0), sy = v => y0 - (v - ymin) / (ymax - ymin) * (y0 - y1);
    let b = '';
    (o.yt || []).forEach(v => { b += L(x0, sy(v), x1, sy(v), C.grid) + T(x0 - 8, sy(v) + 4, o.yf ? o.yf(v) : v, { a: 'end', s: 11, mono: 1 }); });
    (o.xt || []).forEach(v => { b += L(sx(v), y0, sx(v), y0 + 5, C.dim) + T(sx(v), y0 + 19, o.xf ? o.xf(v) : v, { a: 'middle', s: 11, mono: 1 }); });
    b += L(x0, y0, x1, y0, C.dim);
    if (o.xl) b += T((x0 + x1) / 2, y0 + 38, o.xl, { a: 'middle', s: 12 });
    if (o.yl) b += T(x0 - 44, (y0 + y1) / 2, o.yl, { a: 'middle', s: 12 }).replace('<text', `<text transform="rotate(-90 ${x0 - 44} ${(y0 + y1) / 2})"`);
    return { b, sx, sy };
  }

  const F = {};

  // ---------- motivation: global primary microplastic sources (Boucher & Friot, via the report's figure 1)
  F.pie = () => {
    const d = [['人造纖維', 35, '#3A4A6B'], ['輪胎磨損', 28, C.amber], ['日常耗損', 24, '#5A6B86'], ['其他', 13, '#3A4250']];
    const cx = 170, cy = 165, r = 120; let a = -Math.PI / 2, b = '';
    d.forEach(([k, v, col], i) => {
      const a1 = a + v / 100 * Math.PI * 2, big = v > 50 ? 1 : 0, off = i === 1 ? 10 : 0, mid = (a + a1) / 2, ox = Math.cos(mid) * off, oy = Math.sin(mid) * off;
      b += `<path d="M${cx + ox},${cy + oy} L${cx + ox + r * Math.cos(a)},${cy + oy + r * Math.sin(a)} A${r},${r} 0 ${big} 1 ${cx + ox + r * Math.cos(a1)},${cy + oy + r * Math.sin(a1)} Z" fill="${col}" stroke="${C.bg}" stroke-width="2"/>`;
      b += T(cx + ox + r * 0.62 * Math.cos(mid), cy + oy + r * 0.62 * Math.sin(mid) + 6, v + '%', { a: 'middle', s: i === 1 ? 20 : 16, f: i === 1 ? '#1a1206' : C.ink, w: 700, mono: 1 });
      a = a1;
    });
    let ly = 80; d.forEach(([k, v, col], i) => { b += R(330, ly - 12, 14, 14, { f: col, r: 3 }) + T(352, ly, k, { s: 14, f: i === 1 ? C.amber : C.ink, w: i === 1 ? 700 : 400 }) + T(470, ly, v + '%', { s: 14, a: 'end', mono: 1, f: i === 1 ? C.amber : C.sub }); ly += 34; });
    b += T(330, ly + 6, '其他含洗面乳等 2%', { s: 11 }) + T(330, ly + 24, '資料：Boucher & Friot, 2017', { s: 11 });
    return svg(490, 330, b, '全球初級微塑膠來源比例圓餅圖');
  };

  // ---------- system cards
  F.hubMotor = () => {
    let b = R(0, 0, 430, 300, { f: C.bg, r: 0 });
    const cx = 170, cy = 140, R1 = 105;
    b += `<circle cx="${cx}" cy="${cy}" r="${R1}" fill="none" stroke="${C.silver}" stroke-width="14"/><circle cx="${cx}" cy="${cy}" r="${R1 - 12}" fill="none" stroke="${C.dim}" stroke-width="2"/>`;
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; b += L(cx + 30 * Math.cos(a), cy + 30 * Math.sin(a), cx + (R1 - 14) * Math.cos(a + 0.3), cy + (R1 - 14) * Math.sin(a + 0.3), C.dim, 1); }
    b += `<circle cx="${cx}" cy="${cy}" r="32" fill="${C.card}" stroke="${C.voltl}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="8" fill="${C.voltl}"/>`;
    b += `<path d="M${cx + 124} ${cy - 92} a 140 140 0 0 1 0 184" fill="none" stroke="${C.amber}" stroke-width="2" marker-end="url(#ah)"/>`;
    b += R(40, 252, 270, 10, { f: '#3a3227', r: 2 }) + T(175, 285, '#60 砂紙', { a: 'middle', s: 12 });
    b += T(cx, cy + 56, '48 V 輪轂馬達', { a: 'middle', s: 13, f: C.ink, w: 700 }).replace(`y="${cy + 56}"`, `y="${cy + 60}"`);
    b += T(338, 120, 'Ø ≈ 50 cm', { s: 13, f: C.ink, mono: 1 }) + T(338, 144, '≤ 350 RPM', { s: 13, f: C.amber, mono: 1 }) + T(338, 166, '≈ 33 km/h', { s: 12, mono: 1 });
    return svg(430, 300, arrowDef + b, '輪轂馬達平台示意');
  };
  F.power = () => {
    let b = R(0, 0, 400, 300, { f: C.bg, r: 0 });
    b += R(30, 80, 120, 120, { s: C.silver, w: 1.5, r: 6, f: C.card });
    for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) b += `<circle cx="${52 + i * 15}" cy="${102 + j * 15}" r="3" fill="${C.dim}"/>`;
    b += T(90, 225, '變壓器', { a: 'middle', s: 13, f: C.ink, w: 700 }) + T(90, 244, '110 V → 12 V', { a: 'middle', s: 12, mono: 1 });
    b += L(150, 140, 190, 140, C.amber, 2) + R(190, 128, 50, 24, { s: C.amber, w: 1.5, f: C.card }) + L(196, 140, 234, 140, C.amber, 1.2) + T(215, 175, '保險絲 2 A', { a: 'middle', s: 12, f: C.ink });
    b += L(240, 140, 275, 140, C.amber, 2) + `<circle cx="278" cy="140" r="4" fill="${C.amber}"/>` + L(278, 140, 312, 122, C.amber, 2) + `<circle cx="318" cy="140" r="4" fill="${C.amber}"/>` + T(298, 175, '手動開關', { a: 'middle', s: 12, f: C.ink });
    b += L(322, 140, 370, 140, C.amber, 2) + T(372, 120, '至繼電器', { a: 'end', s: 11 });
    b += T(30, 50, '12 V 輸出端依序串接保險絲與手動開關', { s: 12 });
    return svg(400, 300, b, '高壓電源鏈路前段示意');
  };
  F.coil = () => {
    let b = R(0, 0, 400, 300, { f: C.bg, r: 0 });
    b += R(110, 90, 180, 110, { s: C.silver, w: 1.5, r: 8, f: C.card });
    for (let i = 0; i < 9; i++) b += `<ellipse cx="${140 + i * 15}" cy="145" rx="7" ry="34" fill="none" stroke="${C.cul}" stroke-width="2"/>`;
    b += L(40, 130, 110, 130, C.silver, 2) + L(40, 160, 110, 160, C.silver, 2) + T(40, 118, '12 V DC', { s: 13, f: C.ink, mono: 1 });
    b += L(290, 145, 360, 145, C.amber, 3) + T(360, 128, '15 kV', { s: 15, f: C.amber, a: 'end', w: 700, mono: 1 });
    b += T(200, 232, '直流升壓線圈', { a: 'middle', s: 13, f: C.ink, w: 700 }) + T(200, 252, '輸出依模組規格標示', { a: 'middle', s: 11 });
    return svg(400, 300, b, '升壓線圈示意');
  };
  F.plates = () => {
    let b = R(0, 0, 400, 300, { f: C.bg, r: 0 });
    b += R(60, 50, 280, 190, { s: C.silver, w: 2, r: 10, f: '#1b2027' }) + T(200, 268, 'PLA 3D 列印外殼', { a: 'middle', s: 12 });
    const xs = [100, 167, 234, 301];
    xs.forEach((x, i) => { b += R(x - 5, 68, 10, 154, { f: C.cu, r: 2 }) + T(x, 62, i % 2 ? '−' : '+', { a: 'middle', s: 14, f: i % 2 ? C.voltl : C.amber, w: 700 }); });
    [95, 195].forEach(y => { b += R(95, y, 212, 10, { f: '#E8E6DF', r: 5 }); });
    b += T(200, 128, '尼龍柱定距', { a: 'middle', s: 11, f: C.sub });
    b += L(xs[1], 150, xs[2], 150, C.ink, 1, '') + L(xs[1], 143, xs[1], 157, C.ink) + L(xs[2], 143, xs[2], 157, C.ink) + T((xs[1] + xs[2]) / 2, 143, '17 mm', { a: 'middle', s: 13, f: C.ink, mono: 1, w: 700 });
    b += T(26, 160, '氣流', { s: 12, f: C.voltl }) + A(20, 172, 58, 172, C.voltl, 'ahb');
    return svg(400, 300, arrowDef + b, '平行銅板電極與外殼示意');
  };
  F.rainSensor = () => {
    let b = R(0, 0, 400, 300, { f: C.bg, r: 0 });
    b += R(30, 120, 140, 110, { s: C.silver, w: 1.5, r: 4, f: '#14263f' });
    for (let i = 0; i < 6; i++) b += L(42, 134 + i * 16, 158, 134 + i * 16, C.silver, 2);
    [[60, 60], [100, 40], [140, 70], [80, 95], [125, 100]].forEach(([x, y]) => { b += `<path d="M${x} ${y} q -7 12 0 16 q 7 -4 0 -16z" fill="${C.voltl}"/>`; });
    b += T(100, 252, '雨滴感測板', { a: 'middle', s: 12, f: C.ink });
    b += A(175, 175, 225, 175) + R(230, 120, 140, 110, { s: C.voltl, w: 1.5, r: 6, f: C.card }) + T(300, 170, 'Arduino', { a: 'middle', s: 15, f: C.ink, w: 700 }) + T(300, 192, 'Uno', { a: 'middle', s: 13, f: C.sub });
    b += T(300, 252, '判讀 → 控制繼電器', { a: 'middle', s: 12, f: C.ink });
    b += T(200, 290, '偵測到降雨即切斷高壓', { a: 'middle', s: 12, f: C.amber });
    return svg(400, 300, arrowDef + b, '雨滴感測器與 Arduino 示意');
  };
  F.arduino = () => {
    let b = R(0, 0, 400, 300, { f: C.bg, r: 0 });
    b += R(70, 60, 260, 170, { s: C.voltl, w: 2, r: 10, f: '#13243d' });
    for (let i = 0; i < 14; i++) b += R(92 + i * 16, 68, 9, 14, { f: '#0b0d10', r: 1 });
    for (let i = 0; i < 12; i++) b += R(108 + i * 16, 208, 9, 14, { f: '#0b0d10', r: 1 });
    b += R(160, 115, 90, 60, { f: '#0b0d10', s: C.dim, r: 3 }) + T(205, 150, 'Arduino Uno', { a: 'middle', s: 12, f: C.ink, w: 700 });
    b += T(92, 100, 'D2 ← 雨滴感測 D0', { s: 11, f: C.voltl, mono: 1 }) + T(92, 196, 'D7 → 繼電器 IN', { s: 11, f: C.amber, mono: 1 });
    b += T(200, 268, '故障時繼電器釋放 → 高壓自動關閉', { a: 'middle', s: 12, f: C.ink });
    return svg(400, 300, b, 'Arduino Uno 控制板示意');
  };

  // ---------- safety: program flow and relay contact choice
  F.flow = () => {
    const box = (x, y, w, h, s, col = C.edge) => R(x - w / 2, y - h / 2, w, h, { s: col, w: 1.4, f: C.card, r: 8 }) + T(x, y + 5, s, { a: 'middle', s: 13, f: C.ink });
    const dia = (x, y, w, h, s) => `<path d="M${x} ${y - h / 2} L${x + w / 2} ${y} L${x} ${y + h / 2} L${x - w / 2} ${y}Z" fill="${C.card}" stroke="${C.voltl}" stroke-width="1.4"/>` + T(x, y + 5, s, { a: 'middle', s: 12.5, f: C.ink });
    let b = arrowDef;
    b += box(250, 30, 240, 36, '開機：繼電器預設斷電') + A(250, 48, 250, 70);
    b += box(250, 88, 240, 36, '讀取雨滴感測器狀態') + A(250, 106, 250 , 124);
    b += dia(250, 160, 220, 72, '偵測到水？') + A(360, 160, 400, 160) + T(372, 152, '是', { s: 12, f: C.amber });
    b += box(445, 160, 100, 52, '').replace('</text>', '</text>') + T(445, 156, '記錄時間', { a: 'middle', s: 12, f: C.ink }) + T(445, 174, '立即斷電', { a: 'middle', s: 12, f: C.red, w: 700 });
    b += A(250, 196, 250, 222) + T(258, 214, '否', { s: 12, f: C.sub });
    b += dia(250, 262, 240, 76, '乾燥已超過延遲時間？');
    b += A(130, 262, 95, 262) + T(110, 254, '是', { s: 12, f: C.sub }) + box(50, 262, 84, 52, '') + T(50, 258, '繼電器', { a: 'middle', s: 12, f: C.ink }) + T(50, 276, '通電', { a: 'middle', s: 12, f: C.green, w: 700 });
    b += A(370, 262, 400, 262) + T(380, 254, '否', { s: 12, f: C.sub }) + box(445, 262, 100, 52, '') + T(445, 258, '維持斷電', { a: 'middle', s: 12, f: C.ink }) + T(445, 276, '等待中', { a: 'middle', s: 12, f: C.sub });
    b += `<path d="M50 288 V330 H495 V88 H372" fill="none" stroke="${C.dim}" stroke-width="1.2" stroke-dasharray="4 4" marker-end="url(#ah)"/>`;
    b += `<path d="M445 186 V200 H495 M445 288 V330" fill="none" stroke="${C.dim}" stroke-width="1.2" stroke-dasharray="4 4"/>`;
    b += T(505, 210, '重複讀取', { s: 11, f: C.dim }).replace('<text', '<text transform="rotate(90 505 210)"');
    return svg(520, 345, b, '雨滴感測安全模組程式判斷流程');
  };
  F.relay = () => {
    let b = '';
    const col = (x, title, ok, desc1, desc2) => {
      let s = R(x, 10, 230, 230, { s: ok ? C.voltl : C.edge, w: 1.4, f: C.card, r: 10 }) + T(x + 115, 40, title, { a: 'middle', s: 15, f: C.ink, w: 700 });
      s += `<circle cx="${x + 60}" cy="120" r="5" fill="${C.silver}"/>` + T(x + 60, 145, 'COM', { a: 'middle', s: 11, mono: 1 });
      s += `<circle cx="${x + 170}" cy="${ok ? 90 : 150}" r="5" fill="${C.silver}"/>` + T(x + 170, ok ? 78 : 172, ok ? 'NO' : 'NC', { a: 'middle', s: 11, mono: 1 });
      s += L(x + 60, 120, x + 165, ok ? 112 : 150, ok ? C.dim : C.red, 3);
      s += T(x + 115, 200, desc1, { a: 'middle', s: 12, f: ok ? C.green : C.red, w: 700 }) + T(x + 115, 220, desc2, { a: 'middle', s: 11.5 });
      return s;
    };
    b += T(10, 0, '', {});
    b += col(0, 'NO 常開（本設計）', true, '控制電路故障 → 斷開', '高壓自動關閉 (fail-safe)');
    b += col(250, 'NC 常閉', false, '控制電路故障 → 導通', '高壓持續開啟，無法保護');
    b += T(240, 268, '圖示為繼電器線圈未通電（Arduino 當機、斷電或訊號線鬆脫）時之接點狀態', { a: 'middle', s: 11.5 });
    return svg(480, 280, b, '繼電器 NO 與 NC 接點選用比較');
  };

  // ---------- data plots
  F.dynamicMass = () => {
    const d = [['10 s', 0.008, 0.001, 0.002, 0.001, '29.0%'], ['20 s', 0.011, 0.001, 0.003, 0.001, '26.9%'], ['30 s', 0.017, 0.001, 0.005, 0.001, '27.4%']];
    const ax = axes({ x0: 70, y0: 250, x1: 470, y1: 40, xmin: 0, xmax: 3, ymin: 0, ymax: 0.02, yt: [0, 0.005, 0.01, 0.015, 0.02], yf: v => v.toFixed(3), yl: '質量 (g)' });
    let b = ax.b;
    d.forEach(([k, m, ms, c, cs, eff], i) => {
      const x = ax.sx(i + 0.5);
      [[m, ms, -34, '#5A6B86'], [c, cs, 6, C.amber]].forEach(([v, s, dx, col]) => {
        b += R(x + dx, ax.sy(v), 28, ax.sy(0) - ax.sy(v), { f: col, r: 2 });
        b += L(x + dx + 14, ax.sy(v + s), x + dx + 14, ax.sy(Math.max(0, v - s)), C.ink, 1.2) + L(x + dx + 8, ax.sy(v + s), x + dx + 20, ax.sy(v + s), C.ink, 1.2) + L(x + dx + 8, ax.sy(Math.max(0, v - s)), x + dx + 20, ax.sy(Math.max(0, v - s)), C.ink, 1.2);
      });
      b += T(x, 270, k, { a: 'middle', s: 12, f: C.ink, mono: 1 }) + T(x, 290, 'η ' + eff, { a: 'middle', s: 12, f: C.amber, mono: 1 });
    });
    b += R(80, 14, 12, 12, { f: '#5A6B86', r: 2 }) + T(98, 25, '粉塵質量', { s: 12 }) + R(170, 14, 12, 12, { f: C.amber, r: 2 }) + T(188, 25, '裝置吸附質量', { s: 12 }) + T(470, 25, '誤差棒：±1 標準差（n = 3）', { s: 11, a: 'end' });
    return svg(490, 300, b, '350 RPM 下各運轉時間之粉塵質量與吸附質量');
  };
  F.coreArea = () => {
    const panel = (x, title, pts, xmax, xt, xl, ymin, ymax, yt) => {
      const ax = axes({ x0: x + 52, y0: 230, x1: x + 225, y1: 50, xmin: 0, xmax, ymin, ymax, xt, yt, xl, yl: x === 0 ? '核心面積 (cm²)' : '' });
      let b = ax.b + T(x + 52, 28, title, { s: 13, f: C.ink, w: 700 });
      b += `<polyline points="${pts.map(([a, v]) => `${ax.sx(a)},${ax.sy(v)}`).join(' ')}" fill="none" stroke="${C.voltl}" stroke-width="2"/>`;
      pts.forEach(([a, v], i) => { const below = x > 0 && i === 0; b += `<circle cx="${ax.sx(a)}" cy="${ax.sy(v)}" r="4" fill="${C.voltl}"/>` + T(ax.sx(a) + (i === pts.length - 1 ? -6 : 6), ax.sy(v) + (below ? 18 : -8), v.toFixed(2), { s: 10.5, f: C.ink, mono: 1, a: i === pts.length - 1 ? 'end' : 'start' }); });
      return b;
    };
    let b = panel(0, '(a) 懸停高度', [[1, 144.27], [3, 83.30], [5, 46.00]], 6, [1, 3, 5], '懸停高度 (cm)', 0, 160, [0, 40, 80, 120, 160]);
    b += panel(255, '(b) 懸停時間', [[1, 53.80], [5, 63.88], [10, 85.77], [30, 100.55]], 32, [1, 5, 10, 30], '懸停時間 (s)', 0, 120, [0, 40, 80, 120]);
    return svg(500, 275, b, '核心面積隨懸停高度與懸停時間之變化');
  };
  F.envelope = () => {
    const pts = [[30, 14], [35, 10], [40, 8], [45, 6], [50, 5], [55, 4.5], [60, 4], [65, 2], [70, 0]];
    const ax = axes({ x0: 60, y0: 230, x1: 480, y1: 40, xmin: 0, xmax: 75, ymin: 0, ymax: 16, xt: [0, 10, 20, 30, 40, 50, 60, 73], yt: [0, 4, 8, 12, 16], xl: '水平距離 (cm)', yl: '最大飛散高度 (cm)' });
    let b = ax.b;
    b += `<path d="M${ax.sx(0)},${ax.sy(0)} C${ax.sx(14)},${ax.sy(1)} ${ax.sx(24)},${ax.sy(7)} ${ax.sx(30)},${ax.sy(14)}" fill="none" stroke="${C.amber}" stroke-width="2" stroke-dasharray="5 5" opacity=".7"/>`;
    b += `<polyline points="${pts.map(([a, v]) => `${ax.sx(a)},${ax.sy(v)}`).join(' ')} ${ax.sx(73)},${ax.sy(0)}" fill="none" stroke="${C.amber}" stroke-width="2.2"/>`;
    pts.forEach(([a, v]) => { b += `<circle cx="${ax.sx(a)}" cy="${ax.sy(v)}" r="3.5" fill="${C.amber}"/>`; });
    b += T(ax.sx(31), ax.sy(14) - 6, '最大 14 cm（30 cm 處）', { s: 12, f: C.amber, w: 700 });
    b += R(ax.sx(25), ax.sy(0) - 6, ax.sx(29) - ax.sx(25), 6, { f: C.voltl, r: 1 }) + T(ax.sx(25), ax.sy(0) - 12, '裝置 25 cm', { s: 11.5, f: C.voltl, a: 'end' });
    b += T(ax.sx(15), ax.sy(9), '30 cm 以內為示意', { s: 11, f: C.dim, a: 'middle' });
    return svg(500, 275, b, '粉塵雲上緣擴散包絡線');
  };
  F.spread = () => {
    const sx = v => 50 + v * 5.6, cy = 120;
    let b = '';
    b += R(sx(0) - 26, cy - 34, 26, 68, { f: C.card, s: C.silver, r: 6 }) + T(sx(0) - 13, cy + 54, '輪胎', { a: 'middle', s: 12 });
    b += `<path d="M${sx(0)},${cy - 14} L${sx(73)},${cy - 74} L${sx(73)},${cy + 74} L${sx(0)},${cy + 14}Z" fill="${C.amber}" fill-opacity=".10" stroke="${C.amber}" stroke-opacity=".5"/>`;
    b += `<ellipse cx="${sx(27)}" cy="${cy}" rx="34" ry="${21 * 2.6}" fill="${C.amber}" fill-opacity=".28"/>`;
    b += L(sx(27) + 46, cy - 21 * 2.6, sx(27) + 46, cy + 21 * 2.6, C.ink) + T(sx(27) + 52, cy + 4, '寬約 21 cm', { s: 12, f: C.ink });
    b += T(sx(27), cy - 64, '沉積最多 27 cm', { a: 'middle', s: 12, f: C.amber, w: 700 });
    b += L(sx(0), 228, sx(73), 228, C.dim);
    [0, 27, 73].forEach(v => { b += L(sx(v), 228, sx(v), 233, C.dim) + T(sx(v), 248, v, { a: 'middle', s: 11, mono: 1 }); });
    b += T(sx(73), 266, '水平距離 (cm)；俯視示意', { a: 'end', s: 11 });
    return svg(500, 275, b, '粉塵擴散範圍俯視示意');
  };
  F.staticEff = () => {
    const off = [1.00, 0.67, 0.50], on = [9.00, 17.00, 18.67, 21.00, 15.80];
    const ax = axes({ x0: 60, y0: 230, x1: 480, y1: 40, xmin: 0, xmax: 8.6, ymin: 0, ymax: 24, yt: [0, 6, 12, 18, 24], yl: '捕捉效率 η (%)' });
    let b = ax.b;
    off.forEach((v, i) => { const x = ax.sx(i + 0.6); b += R(x - 13, ax.sy(v), 26, ax.sy(0) - ax.sy(v), { f: '#5A6B86', r: 2 }) + T(x, ax.sy(v) - 6, v.toFixed(2), { a: 'middle', s: 10.5, mono: 1 }); });
    on.forEach((v, i) => { const x = ax.sx(i + 3.8); b += R(x - 13, ax.sy(v), 26, ax.sy(0) - ax.sy(v), { f: C.amber, r: 2 }) + T(x, ax.sy(v) - 6, v.toFixed(2), { a: 'middle', s: 10.5, mono: 1, f: C.ink }); });
    b += L(ax.sx(0.2), ax.sy(0.72), ax.sx(3), ax.sy(0.72), C.ink, 1, '4 3') + L(ax.sx(3.3), ax.sy(16.29), ax.sx(8.4), ax.sy(16.29), C.ink, 1, '4 3') + T(ax.sx(3.3), ax.sy(16.29) - 26, '平均 16.29%', { s: 12, f: C.ink, w: 700 });
    b += T(ax.sx(1.6), 252, '電場關閉 (n=3)', { a: 'middle', s: 12 }) + T(ax.sx(5.8), 252, '15 kV 開啟 (n=5)', { a: 'middle', s: 12, f: C.amber, w: 700 }) + T(ax.sx(1.6), ax.sy(0.72) - 22, '平均 0.72%', { a: 'middle', s: 12, f: C.ink });
    return svg(500, 270, b, '靜態捕捉效率各次量測');
  };

  // ---------- ImageJ workflow (schematic)
  F.imagej = () => {
    const blob = (x, y, bin) => { let s = ''; for (let i = 0; i < 70; i++) { const a = i * 2.39996, r = 5 + 38 * Math.sqrt(i / 70); s += `<circle cx="${(x + r * Math.cos(a) * 1.15).toFixed(1)}" cy="${(y + r * Math.sin(a) * 0.85).toFixed(1)}" r="${bin ? 7 : 2 + (1 - i / 70) * 5}" fill="${bin ? C.ink : '#2a2f36'}" opacity="${bin ? 1 : 0.55 + 0.45 * (1 - i / 70)}"/>`; } return s; };
    let b = arrowDef;
    b += R(10, 30, 150, 140, { f: '#E8E6DF', r: 6 }) + blob(85, 100, false) + T(85, 194, '① 原始沉積影像', { a: 'middle', s: 12, f: C.ink });
    b += A(168, 100, 196, 100) + R(204, 30, 150, 140, { f: '#0b0d10', s: C.edge, r: 6 }) + blob(279, 100, true) + T(279, 194, '② 灰階閾值分割', { a: 'middle', s: 12, f: C.ink });
    b += A(362, 100, 390, 100) + R(398, 30, 150, 140, { f: C.card, s: C.voltl, r: 6 });
    b += T(412, 62, 'Area', { s: 12, mono: 1 }) + T(536, 62, '45.999 cm²', { s: 12, f: C.ink, a: 'end', mono: 1 });
    b += T(412, 92, 'Feret', { s: 12, mono: 1 }) + T(536, 92, '8.109 cm', { s: 12, f: C.ink, a: 'end', mono: 1 });
    b += T(412, 122, '擴散半徑', { s: 12 }) + T(536, 122, 'Feret ÷ 2', { s: 12, f: C.ink, a: 'end', mono: 1 });
    b += T(412, 152, '質心偏移量', { s: 12 });
    b += T(473, 194, '③ 量測指標', { a: 'middle', s: 12, f: C.ink });
    b += T(279, 222, '示意圖；數值為懸停高度 5 cm 之量測結果', { a: 'middle', s: 11 });
    return svg(560, 232, b, 'ImageJ 影像分析流程示意');
  };

  // ---------- mass spectra near m/z 268: theoretical vs measured stick heights (from the report text)
  const ms = (label, mM, m1, r1, ppm) => () => {
    const ax = axes({ x0: 60, y0: 220, x1: 460, y1: 40, xmin: 267.6, xmax: 270.0, ymin: 0, ymax: 1.1, xt: [268, 269], xf: v => v.toFixed(0), yt: [0, 0.5, 1], yf: v => v.toFixed(1), xl: 'm/z', yl: '相對強度' });
    let b = ax.b;
    const stick = (x, h, col, dx, dash) => `<line x1="${ax.sx(x) + dx}" y1="${ax.sy(0)}" x2="${ax.sx(x) + dx}" y2="${ax.sy(h)}" stroke="${col}" stroke-width="${dash ? 2 : 7}"${dash ? ' stroke-dasharray="4 3"' : ''}/>`;
    b += stick(268.1934, 1, C.silver, -8, 1) + stick(269.1967, 0.2, C.silver, -8, 1);
    b += stick(mM, 1, C.amber, 6) + stick(m1, r1, C.amber, 6);
    b += T(ax.sx(mM) + 14, ax.sy(1) + 14, `${mM.toFixed(4)}`, { s: 11.5, f: C.amber, mono: 1 }) + T(ax.sx(mM) + 14, ax.sy(1) + 30, `誤差 ${ppm} ppm`, { s: 11.5, f: C.ink });
    b += T(ax.sx(m1) + 14, ax.sy(r1) + 14, `M+1 ≈ ${r1}`, { s: 11.5, f: C.amber, mono: 1 }) + T(ax.sx(269.1967) - 14, ax.sy(0.2) - 6, '理論 ≈ 0.2', { s: 11, a: 'end' });
    b += `<line x1="70" y1="20" x2="90" y2="20" stroke="${C.silver}" stroke-width="2" stroke-dasharray="4 3"/>` + T(96, 24, '6PPD 理論值 268.1934', { s: 11.5 }) + R(270, 14, 10, 12, { f: C.amber, r: 1 }) + T(286, 24, label, { s: 11.5 });
    return svg(480, 270, b, label + ' 質譜 m/z 268 附近比對');
  };
  F.ms1 = ms('樣品 1 實測', 268.1926, 269.1967, 0.6, '2.98');   // the report gives only the M+1/M ratio for sample 1, so its stick sits at the theoretical M+1
  F.ms2 = ms('樣品 2 實測', 268.1930, 269.1996, 1, '1.49');

  return F;
})();
