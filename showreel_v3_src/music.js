// TRWP showreel v3 — 60 s calm score. 80 BPM, 20 bars of 4/4 = 60.000 s exactly.
export const SR = 48000, DUR = 60, BPM = 80, BEAT = 60 / BPM, BAR = BEAT * 4;
export const B = n => n * BEAT;
// section cuts (beats) shared with the picture
export const CUT = { problemA: 8, problemB: 12, ppd: 16, limits: 20, physics: 27, rig: 36, device: 42, safety: 54, stat: 61, dyn: 66, spec: 71, end: 76 };
// Each scene is animated on its own authored beat grid. Knots map timeline beat -> authored beat (slope 1 beyond the
// outer knots): short text-heavy scenes get a longer hold, the device breakdown and a few longer scenes run a bit faster.
export const CLOCK = {
  intro: [[0, 0]], problemA: [[8, 8]], problemB: [[12, 12]], ppd: [[16, 15]],
  limits: [[20, 18], [27, 26]], physics: [[27, 26], [36, 36]],
  rig: [[36, 36], [40.8, 38.8]],                       // longer look at the rig; the zoom keeps its pace
  device: [[42, 36], [47, 44], [54, 52]],               // assembly quicker, spec table close to its old pace
  safety: [[54, 52], [61, 60]], stat: [[61, 60]], dyn: [[66, 64]], spec: [[71, 68]], end: [[76, 76]],
};
function warp(K, x) {
  if (x <= K[0][0]) return K[0][1] + x - K[0][0];
  for (let i = 0; i < K.length - 1; i++) if (x <= K[i + 1][0]) return K[i][1] + (x - K[i][0]) * (K[i + 1][1] - K[i][1]) / (K[i + 1][0] - K[i][0]);
  const L = K[K.length - 1]; return L[1] + x - L[0];
}
export const clock = (scene, beat) => warp(CLOCK[scene], beat);                               // timeline -> authored
export const at = (scene, beat) => warp(CLOCK[scene].map(([a, b]) => [b, a]), beat);       // authored -> timeline

const CH = {
  Fmaj7: { r: 41, v: [53, 57, 60, 64, 67] }, Am7: { r: 45, v: [57, 60, 64, 67, 71] },
  Dm9: { r: 38, v: [53, 57, 60, 64, 69] }, Cmaj7: { r: 36, v: [52, 55, 59, 62, 67] },
};
const CYCLE = ['Fmaj7', 'Am7', 'Dm9', 'Cmaj7'];
const barChord = b => b === 19 ? 'Fmaj7' : CYCLE[b % 4];
const mtof = m => 440 * 2 ** ((m - 69) / 12);
const inR = (b, ...ranges) => ranges.some(([a, z]) => b >= a && b < z);

function arrangement() {
  const kicks = [], rims = [], ticks = [];
  for (let b = 0; b < 80; b++) {
    if (inR(b, [8, CUT.safety], [CUT.stat, 76]) && b % 2 === 0) kicks.push(B(b));
    if (inR(b, [CUT.limits, CUT.safety], [CUT.stat, 76]) && b % 2 === 1) rims.push(B(b));
  }
  for (let e = 0; e < 160; e++) { const b = e / 2; if (inR(b, [8, CUT.safety], [CUT.stat, 76])) ticks.push(B(b)); }
  kicks.push(B(76));
  return { kicks, rims, ticks };
}
export const SYNC = arrangement();

function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export async function renderMusic() {
  const ctx = new OfflineAudioContext(2, SR * DUR, SR);
  const R = rng(80);
  const noiseBuf = ctx.createBuffer(2, SR * 5, SR);
  for (let c = 0; c < 2; c++) { const d = noiseBuf.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = R() * 2 - 1; }
  const ir = ctx.createBuffer(2, SR * 3.8, SR);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let lp = 0; for (let i = 0; i < d.length; i++) { const x = i / SR; lp = lp * 0.6 + (R() * 2 - 1) * 0.4; d[i] = lp * Math.exp(-x * 1.6) * Math.min(1, x / 0.02); } }

  const out = ctx.createGain(); out.gain.setValueAtTime(0, 0); out.gain.linearRampToValueAtTime(1, 0.3); out.gain.setValueAtTime(1, 58.8); out.gain.linearRampToValueAtTime(0, 60);
  const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -6; lim.knee.value = 2; lim.ratio.value = 12; lim.attack.value = 0.002; lim.release.value = 0.12;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -22; comp.knee.value = 12; comp.ratio.value = 1.8; comp.attack.value = 0.02; comp.release.value = 0.3;
  const master = ctx.createGain(); master.gain.value = 0.75;
  master.connect(comp); comp.connect(lim); lim.connect(out); out.connect(ctx.destination);
  const rev = ctx.createConvolver(); rev.buffer = ir; const revRet = ctx.createGain(); revRet.gain.value = 0.45; rev.connect(revRet); revRet.connect(master);
  const dIn = ctx.createGain(), dl = ctx.createDelay(2), dfb = ctx.createGain(), dlp = ctx.createBiquadFilter(), dRet = ctx.createGain();
  dl.delayTime.value = BEAT * 0.75; dfb.gain.value = 0.3; dlp.type = 'lowpass'; dlp.frequency.value = 2400; dRet.gain.value = 0.2;
  dIn.connect(dl); dl.connect(dlp); dlp.connect(dfb); dfb.connect(dl); dlp.connect(dRet); dRet.connect(master); dRet.connect(rev);

  const filt = (type, f, q = 0.7) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
  const noise = (t, dur, dest) => { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.connect(dest); s.start(t, R() * 2, dur + 0.05); };
  const send = (node, dest, amt) => { const g = ctx.createGain(); g.gain.value = amt; node.connect(g); g.connect(dest); };

  const pianoBus = ctx.createGain(); pianoBus.connect(master); send(pianoBus, rev, 0.55); send(pianoBus, dIn, 0.16);
  function piano(t, m, v = 0.7, dur = 2.6, pan = 0) {
    const f = mtof(m), g = ctx.createGain(), lp = filt('lowpass', 800);
    lp.frequency.setValueAtTime(900 + 2600 * v, t); lp.frequency.exponentialRampToValueAtTime(650, t + dur * 0.7);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12 * v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.045 * v, t + 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const p = ctx.createStereoPanner(); p.pan.value = pan;
    for (const [h, a, det] of [[1, 1, 0], [1, 0.5, 4], [2, 0.28, 0], [3, 0.08, 0], [4, 0.03, 0]]) { const o = ctx.createOscillator(); o.frequency.value = f * h; o.detune.value = det; const og = ctx.createGain(); og.gain.value = a; o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + 0.05); }
    const hb = filt('bandpass', 1800, 1.5), hg = ctx.createGain(); hg.gain.setValueAtTime(0.025 * v, t); hg.gain.exponentialRampToValueAtTime(0.0001, t + 0.03); noise(t, 0.04, hb); hb.connect(hg); hg.connect(lp);
    lp.connect(g); g.connect(p); p.connect(pianoBus);
  }
  const padLP = filt('lowpass', 700, 0.6); const padG = ctx.createGain(); padLP.connect(padG); padG.connect(master); send(padG, rev, 0.6);
  { const f = padLP.frequency; f.setValueAtTime(380, 0); f.exponentialRampToValueAtTime(900, B(8)); f.setValueAtTime(900, B(CUT.safety)); f.exponentialRampToValueAtTime(520, B(CUT.safety + 3)); f.exponentialRampToValueAtTime(1100, B(CUT.stat)); f.setValueAtTime(1100, B(76)); f.exponentialRampToValueAtTime(700, 60); }
  function pad(t, notes, dur) {
    for (const m of notes) for (const [type, det, pan, a] of [['sawtooth', -7, -0.5, 0.010], ['sawtooth', 7, 0.5, 0.010], ['triangle', 0, 0, 0.022]]) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = mtof(m); o.detune.value = det;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + 1.0); g.gain.setValueAtTime(a, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + 1.2);
      const p = ctx.createStereoPanner(); p.pan.value = pan; o.connect(g); g.connect(p); p.connect(padLP); o.start(t); o.stop(t + dur + 1.3);
    }
  }
  function sub(t, m, dur) { const o = ctx.createOscillator(); o.frequency.value = mtof(m); const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.075, t + 0.3); g.gain.setValueAtTime(0.075, t + dur - 0.2); g.gain.linearRampToValueAtTime(0, t + dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05); }
  function kick(t, v = 1) { const o = ctx.createOscillator(); o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.14); const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.2 * v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34); const lp = filt('lowpass', 220); o.connect(g); g.connect(lp); lp.connect(master); o.start(t); o.stop(t + 0.4); }
  function rim(t, v = 1) {
    const bp = filt('bandpass', 2400, 4), g = ctx.createGain(); g.gain.setValueAtTime(0.1 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); noise(t, 0.06, bp); bp.connect(g); g.connect(master); send(g, rev, 0.4);
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 820; const og = ctx.createGain(); og.gain.setValueAtTime(0.035 * v, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.04); o.connect(og); og.connect(master); o.start(t); o.stop(t + 0.06);
  }
  function tick(t, v = 1) { const hp = filt('bandpass', 6500, 3), g = ctx.createGain(); g.gain.setValueAtTime(0.045 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.018); const p = ctx.createStereoPanner(); p.pan.value = 0.3; noise(t, 0.03, hp); hp.connect(g); g.connect(p); p.connect(master); }
  function shaker(t, v = 1) { const hp = filt('highpass', 7000), g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.016 * v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06); const p = ctx.createStereoPanner(); p.pan.value = -0.35; noise(t, 0.08, hp); hp.connect(g); g.connect(p); p.connect(master); }
  function pencil(t, dur = 0.5, v = 1) {
    const bp = filt('bandpass', 3200, 0.9); bp.frequency.setValueAtTime(2600, t); bp.frequency.linearRampToValueAtTime(4200, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.03 * v, t + 0.05); g.gain.setValueAtTime(0.03 * v, t + dur - 0.1); g.gain.linearRampToValueAtTime(0, t + dur);
    const am = ctx.createOscillator(); am.frequency.value = 23; const amg = ctx.createGain(); amg.gain.value = 0.012 * v; am.connect(amg); amg.connect(g.gain); am.start(t); am.stop(t + dur);
    noise(t, dur, bp); bp.connect(g); g.connect(master); send(g, rev, 0.2);
  }
  function airWhoosh(tc, v = 1) {
    const bp = filt('bandpass', 500, 0.8); bp.frequency.setValueAtTime(400, tc - 0.45); bp.frequency.exponentialRampToValueAtTime(2200, tc); bp.frequency.exponentialRampToValueAtTime(700, tc + 0.4);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, tc - 0.45); g.gain.exponentialRampToValueAtTime(0.04 * v, tc); g.gain.exponentialRampToValueAtTime(0.0001, tc + 0.45);
    const p = ctx.createStereoPanner(); p.pan.setValueAtTime(-0.6, tc - 0.45); p.pan.linearRampToValueAtTime(0.6, tc + 0.45);
    noise(tc - 0.45, 0.95, bp); bp.connect(g); g.connect(p); p.connect(master); send(g, rev, 0.4);
  }
  function thud(t, v = 1) { const o = ctx.createOscillator(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.1); const g = ctx.createGain(); g.gain.setValueAtTime(0.14 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.25); tick(t, 0.8); }
  function click(t, v = 1) { for (const [dt, f] of [[0, 3200], [0.014, 1900]]) { const bp = filt('bandpass', f, 3), g = ctx.createGain(); g.gain.setValueAtTime(0.11 * v, t + dt); g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.02); noise(t + dt, 0.03, bp); bp.connect(g); g.connect(master); send(g, rev, 0.3); } }
  function slide(t0, t1) { const bp = filt('bandpass', 900, 0.7); bp.frequency.setValueAtTime(700, t0); bp.frequency.linearRampToValueAtTime(1500, t1); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.02, t0 + (t1 - t0) * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t1); noise(t0, t1 - t0, bp); bp.connect(g); g.connect(master); }
  function powerDown(t) { const o = ctx.createOscillator(); o.frequency.setValueAtTime(330, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.9); const g = ctx.createGain(); g.gain.setValueAtTime(0.055, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0); o.connect(g); g.connect(master); send(g, rev, 0.5); o.start(t); o.stop(t + 1.05); }
  function swell(t0, t1, v = 1) { const lp = filt('lowpass', 400); lp.frequency.setValueAtTime(400, t0); lp.frequency.exponentialRampToValueAtTime(5000, t1); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.045 * v, t1); g.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.3); noise(t0, t1 - t0 + 0.3, lp); lp.connect(g); g.connect(master); send(g, rev, 0.6); }
  function bell(t, m, v = 1) { for (const [h, a, d] of [[1, 1, 3.5], [2.76, 0.35, 1.6], [5.4, 0.12, 0.8]]) { const o = ctx.createOscillator(); o.frequency.value = mtof(m) * h; const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.035 * v * a, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(pianoBus); o.start(t); o.stop(t + d + 0.05); } }

  // ---------- arrangement
  for (let bar = 0; bar < 20; bar++) {
    const t = bar * BAR, c = CH[barChord(bar)], last = bar === 19;
    pad(t, c.v.slice(0, 4), last ? 1.4 : BAR);
    if (bar >= 2) sub(t, c.r + 12, last ? 2.6 : BAR);
    if (!last) piano(t, c.r + 24, 0.42, 3.2);
  }
  for (let b = 0; b < 76; b++) {
    const c = CH[barChord(Math.floor(b / 4))], k = b % 4;
    if (inR(b, [0, 8])) { piano(B(b), c.v[[2, 3, 4, 1][k]] + 12, [0.45, 0.6, 0.5, 0.55][k], 2.8, (k - 1.5) * 0.15); continue; }
    if (inR(b, [CUT.safety + 1, CUT.stat])) { continue; }
    const seq = [0, 2, 4, 3, 1, 3, 4, 2];
    for (const h of [0, 1]) { const i = k * 2 + h; piano(B(b + h / 2), c.v[seq[i]] + 12, h ? 0.32 : 0.46, 2.0, (seq[i] - 2) * 0.12); }
    if (inR(b, [CUT.stat, 76])) piano(B(b), c.v[[4, 3, 4, 2][k]] + 24, 0.28, 2.4, 0.25);
  }
  // rain: sparse high drops during the fail-safe section
  [[53, 4], [53.75, 2], [54.5, 3], [55.25, 1], [55.5, 4], [56.5, 3], [57.25, 2], [58, 4], [58.75, 1], [59.25, 3]].map(([b, i]) => [at('safety', b), i]).forEach(([b, i], n) => piano(B(b), CH[barChord(Math.floor(b / 4))].v[i] + 24, 0.3 - n * 0.008, 1.9, 0.4 - i * 0.15));
  SYNC.kicks.forEach(t => kick(t, t >= B(76) ? 0.8 : 1));
  SYNC.rims.forEach(t => rim(t, 0.8));
  SYNC.ticks.forEach((t, i) => tick(t, i % 2 ? 0.45 : 0.7));
  for (let e = 0; e < 320; e++) { const b = e / 4; if (inR(b, [CUT.physics, CUT.safety], [CUT.stat, 76])) shaker(B(b), e % 2 ? 0.6 : 1); }
  [[0.05, 1.4], [B(CUT.limits), 0.6], [B(CUT.physics), 0.8], [B(CUT.rig), 1.2], [B(CUT.device), 1.6], [B(CUT.safety), 0.8], [B(CUT.end), 1.0]].forEach(([t, d]) => pencil(t, d));
  Object.values(CUT).forEach(b => airWhoosh(B(b), 0.9));
  // device (authored beats, placed through its clock): plates land, cartridge + dust box click in, scan shimmer, pull-out
  const dv = b => B(at('device', b)), sf = b => B(at('safety', b));
  [38.5, 39, 39.5, 40].forEach(b => thud(dv(b), 0.8));
  slide(dv(40.75), dv(41.5)); click(dv(41.5), 1); slide(dv(41.8), dv(42.5)); click(dv(42.5), 0.9);
  swell(dv(42.8), dv(43.5), 0.7);
  slide(dv(48), dv(49)); slide(dv(50), dv(51)); click(dv(51), 0.8);
  // safety: relay opens
  click(sf(56), 1.3); powerDown(sf(56) + 0.01); swell(sf(58.5), sf(60), 1);
  // finale
  [41, 48, 53, 57, 60, 64, 67, 72].forEach((m, i) => piano(B(76) + i * 0.045, m, 0.55, 3.4, (i - 4) * 0.08));
  bell(B(76), 76, 1); bell(B(77), 79, 0.6); bell(B(78), 84, 0.45);
  return await ctx.startRendering();
}
