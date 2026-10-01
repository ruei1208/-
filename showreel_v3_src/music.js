// TRWP showreel v3 — calm score. 80 BPM; length and section cuts come from the chosen edit (edit.js).
import { EDIT } from './edit.js';
export const BPM = 80, BEAT = 60 / BPM, BAR = BEAT * 4, SR = 48000;
export const BEATS = EDIT.BEATS, DUR = BEATS * BEAT, BARS = Math.ceil(BEATS / 4);
export const B = n => n * BEAT;
// section cuts (beats) shared with the picture
export const CUT = EDIT.CUT, CLOCK = EDIT.CLOCK;
function warp(K, x) {
  if (x <= K[0][0]) return K[0][1] + x - K[0][0];
  for (let i = 0; i < K.length - 1; i++) if (x <= K[i + 1][0]) return K[i][1] + (x - K[i][0]) * (K[i + 1][1] - K[i][1]) / (K[i + 1][0] - K[i][0]);
  const L = K[K.length - 1]; return L[1] + x - L[0];
}
export const clock = (scene, beat) => warp(CLOCK[scene], beat);                               // timeline -> authored
export const at = (scene, beat) => warp(CLOCK[scene].map(([a, b]) => [b, a]), beat);       // authored -> timeline
const END = CUT.end;

const CH = {
  Fmaj7: { r: 41, v: [53, 57, 60, 64, 67] }, Am7: { r: 45, v: [57, 60, 64, 67, 71] },
  Dm9: { r: 38, v: [53, 57, 60, 64, 69] }, Cmaj7: { r: 36, v: [52, 55, 59, 62, 67] },
};
const CYCLE = ['Fmaj7', 'Am7', 'Dm9', 'Cmaj7'];
const barChord = b => b === BARS - 1 ? 'Fmaj7' : CYCLE[b % 4];
const mtof = m => 440 * 2 ** ((m - 69) / 12);
const inR = (b, ...ranges) => ranges.some(([a, z]) => b >= a && b < z);

function arrangement() {
  const kicks = [], rims = [], ticks = [];
  // the long cut keeps a softer pulse: a kick on each bar, no rim or hi ticks
  const D0 = EDIT.LONG ? CUT.problemA : 8;
  for (let b = 0; b < BEATS; b++) {
    if (inR(b, [D0, END]) && b % (EDIT.LONG ? 4 : 2) === 0) kicks.push(B(b));
    if (!EDIT.LONG && inR(b, [CUT.limits, END]) && b % 2 === 1) rims.push(B(b));
  }
  if (!EDIT.LONG) for (let e = 0; e < BEATS * 2; e++) { const b = e / 2; if (inR(b, [8, END])) ticks.push(B(b)); }
  kicks.push(B(END));
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

  const out = ctx.createGain(); out.gain.setValueAtTime(0, 0); out.gain.linearRampToValueAtTime(1, 0.3); out.gain.setValueAtTime(1, DUR - 1.2); out.gain.linearRampToValueAtTime(0, DUR);
  const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -6; lim.knee.value = 2; lim.ratio.value = 12; lim.attack.value = 0.002; lim.release.value = 0.12;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -22; comp.knee.value = 12; comp.ratio.value = 1.8; comp.attack.value = 0.02; comp.release.value = 0.3;
  const master = ctx.createGain(); master.gain.value = EDIT.LONG ? 0.6 : 0.75;
  for (const nd of [master, comp, lim, out]) { nd.channelCountMode = 'explicit'; nd.channelCount = 2; }
  master.connect(comp); comp.connect(lim); lim.connect(out); out.connect(ctx.destination);
  const rev = ctx.createConvolver(); rev.buffer = ir; const revRet = ctx.createGain(); revRet.gain.value = 0.45; rev.connect(revRet); revRet.connect(master);
  const dIn = ctx.createGain(), dl = ctx.createDelay(2), dfb = ctx.createGain(), dlp = ctx.createBiquadFilter(), dRet = ctx.createGain();
  dl.delayTime.value = BEAT * 0.75; dfb.gain.value = 0.3; dlp.type = 'lowpass'; dlp.frequency.value = 2400; dRet.gain.value = 0.2;
  dIn.connect(dl); dl.connect(dlp); dlp.connect(dfb); dfb.connect(dl); dlp.connect(dRet); dRet.connect(master); dRet.connect(rev);

  // filters and the master chain stay stereo: if a node's channel count flips as stereo noise sources start/stop, Chrome resets
  // the filter state and each flip is an audible click
  const filt = (type, f, q = 0.7) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; b.channelCountMode = 'explicit'; b.channelCount = 2; return b; };
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
  if (!EDIT.TRAILER) { const f = padLP.frequency; f.setValueAtTime(380, 0); f.exponentialRampToValueAtTime(900, B(8)); f.setValueAtTime(900, B(CUT.safety)); f.exponentialRampToValueAtTime(1100, B(CUT.stat)); f.setValueAtTime(1100, B(END)); f.exponentialRampToValueAtTime(700, DUR); }
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

  if (EDIT.TRAILER) { trailerScore(); return await ctx.startRendering(); }
  if (EDIT.LONG) { docScore(); return await ctx.startRendering(); }

  // ---------- long-promo score: documentary pacing, no drums. Each chapter keeps its own chord loop (two bars per chord)
  // and piano density; chapter cards breathe with a single low note. Foley stays only where the picture shows it.
  function docScore() {
    master.gain.value = 0.62;
    const C2 = {
      Dm9: [38, [50, 53, 57, 60, 64, 69]], Bbmaj7: [34, [50, 53, 57, 58, 62, 65]], Fmaj7: [41, [53, 57, 60, 64, 67, 72]],
      Csus: [36, [53, 55, 60, 62, 67, 72]], Am7: [45, [52, 57, 60, 64, 67, 71]], Gm9: [43, [53, 57, 58, 62, 65, 69]],
    };
    const LOW = ['Dm9', 'Bbmaj7', 'Fmaj7', 'Csus'], MAIN = ['Fmaj7', 'Am7', 'Bbmaj7', 'Csus'], BRIGHT = ['Bbmaj7', 'Fmaj7', 'Gm9', 'Csus'];
    // piano figures over two bars: [beat, voice, velocity]
    const PAT = {
      single: [[0, 3, 0.4], [4, 4, 0.32]],
      sparse: [[0, 2, 0.42], [3, 4, 0.32], [6, 3, 0.36]],
      flow: [0, 2, 4, 3, 1, 3, 4, 2].map((v, b) => [b, v, b % 4 ? 0.3 : 0.42]),
      move: [0, 2, 4, 3, 1, 3, 4, 2, 0, 2, 5, 3, 1, 4, 3, 2].map((v, i) => [i / 2, v, i % 2 ? 0.2 : i % 8 ? 0.3 : 0.4]),
    };
    const MEL = { Bbmaj7: [[0, 74], [3, 72], [4, 69]], Fmaj7: [[0, 72], [3, 69], [4, 67]], Gm9: [[0, 70], [3, 69], [4, 65]], Csus: [[0, 67], [2, 65], [4, 67]] };
    const T = n => B(CUT[n]);
    // [from, to, chords, figure, sub, card at start, melody, high answer]
    const G = [
      [0, CUT.lnews, LOW, 'single', false, false],
      [CUT.lnews, CUT.ch2, LOW, 'sparse', true, false],
      [CUT.ch2, CUT.ch4, MAIN, 'flow', true, true],
      [CUT.ch4, CUT.ch5, MAIN, 'move', true, true],
      [CUT.ch5, CUT.ch6, LOW, 'sparse', true, true],
      [CUT.ch6, CUT.ch7, MAIN, 'flow', true, true, false, CUT.stat],
      [CUT.ch7, CUT.end, BRIGHT, 'flow', true, true, true],
    ];
    const padBus = filt('lowpass', 1400, 0.5), padG = ctx.createGain(); padG.gain.value = 1; padBus.connect(padG); padG.connect(master); send(padG, rev, 0.7);
    const warmPad = (t, notes, dur, lvl) => {
      for (const m of notes) for (const [type, det, pan, a] of [['triangle', -5, -0.4, 0.016], ['triangle', 5, 0.4, 0.016], ['sine', 0, 0, 0.02]]) {
        const o = ctx.createOscillator(); o.type = type; o.frequency.value = mtof(m); o.detune.value = det;
        const g = ctx.createGain(), A = a * lvl; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(A, t + 1.6); g.gain.setValueAtTime(A, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + 1.8);
        const p = ctx.createStereoPanner(); p.pan.value = pan; o.connect(g); g.connect(p); p.connect(padBus); o.start(t); o.stop(t + dur + 1.9);
      }
    };
    const softSub = (t, m, dur) => { const o = ctx.createOscillator(); o.frequency.value = mtof(m); const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 1.2); g.gain.setValueAtTime(0.05, t + Math.max(1.2, dur - 0.6)); g.gain.linearRampToValueAtTime(0, t + dur + 0.6); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.7); };
    for (const [g0, g1, prog, fig, useSub, card, mel, hi] of G) {
      const p0 = card ? g0 + 2 : g0;
      if (card) { piano(B(g0), 38, 0.4, 4.5, 0); piano(B(g0) + 0.02, 50, 0.25, 4.5, 0); airWhoosh(B(g0), 0.45); }
      // two bars per chord; a short remainder at the end of a chapter stretches the last chord instead of a stub
      for (let c0 = g0, k = 0; c0 < g1; c0 += 8, k++) {
        if (k && g1 - c0 < 4) break;
        const [r, v] = C2[prog[k % prog.length]], len = g1 - c0 < 12 ? g1 - c0 : 8;
        warmPad(B(c0), v.slice(0, 4), B(len), g0 === 0 ? 0.6 : 1);
        if (useSub && c0 >= p0) softSub(B(c0), r + 12, B(len));
        if (c0 + 8 < g1 || g1 === END) piano(B(Math.max(c0, p0)), r + 24, 0.3, 4.5, 0);
        for (const [b, vi, vel] of PAT[fig]) {
          const tb = c0 + b; if (tb < p0 || tb >= g1 - 0.5) continue;
          piano(B(tb), v[vi] + 12, vel, fig === 'move' ? 2.2 : 3.4, (vi - 2.5) * 0.12);
        }
        if (hi !== undefined && hi && c0 >= hi) for (const [b, vi] of [[2, 5], [6, 4]]) if (c0 + b < g1 - 0.5) piano(B(c0 + b), v[vi] + 24, 0.18, 3, 0.3);
        if (mel && c0 >= p0) for (const [b, m] of MEL[prog[k % prog.length]]) if (c0 + b < g1 - 0.5) piano(B(c0 + b), m, 0.4, 4, 0.1);
      }
    }
    // device foley, placed through its clock and kept under the music
    const dv = b => B(at('device', b)), sf = b => B(at('safety', b));
    [38.5, 39, 39.5, 40].forEach(b => thud(dv(b), 0.5));
    slide(dv(40.75), dv(41.5)); click(dv(41.5), 0.6); slide(dv(41.8), dv(42.5)); click(dv(42.5), 0.55);
    slide(dv(48), dv(49)); slide(dv(50), dv(51)); click(dv(51), 0.5);
    click(sf(56), 0.6);
    // finale: open Fmaj9 that rings out under the title
    const e = B(END);
    warmPad(e, [53, 57, 60, 64, 67], DUR - e - 2, 1.1); softSub(e, 41, DUR - e - 2);
    [41, 48, 53, 57, 60, 64, 67, 72].forEach((m, i) => piano(e + i * 0.06, m, 0.45, 5, (i - 4) * 0.08));
    bell(e + B(2), 76, 0.6); bell(e + B(3), 79, 0.4);
  }

  // ---------- trailer score: rain and a low drone under the news, a riser into silence at the turn,
  // a hit on 輪胎, a driving montage, and one last hit under the title
  function trailerScore() {
    master.gain.value = 0.4;   // the trailer stacks more layers; leave the limiter headroom so it never clips into clicks
    const T = n => B(CUT[n]);
    const fade = (g, pts) => { g.gain.setValueAtTime(pts[0][1], pts[0][0]); for (const [t, v] of pts.slice(1)) g.gain.linearRampToValueAtTime(v, t); };
    // rain bed
    { const lp = filt('lowpass', 2600), hp = filt('highpass', 700), g = ctx.createGain(); fade(g, [[0, 0], [1.2, 0.03], [T('tNews1'), 0.016], [T('tTurn') - 0.3, 0.01], [T('tTurn'), 0]]);
      for (let k = 0; k < 14; k++) noise(k * 3, 3.1, hp); hp.connect(lp); lp.connect(g); g.connect(master); send(g, rev, 0.3); }
    // tyres passing in the opening
    [1.6, 4.4].forEach(t0 => { const bp = filt('bandpass', 300, 0.8), g = ctx.createGain(); bp.frequency.setValueAtTime(220, t0); bp.frequency.linearRampToValueAtTime(520, t0 + 1.2); bp.frequency.linearRampToValueAtTime(240, t0 + 2.6);
      fade(g, [[t0, 0], [t0 + 1.2, 0.06], [t0 + 2.6, 0]]); noise(t0, 2.7, bp); bp.connect(g); g.connect(master); });
    // low drone that slowly opens up until the turn
    { const lp = filt('lowpass', 200, 0.9), g = ctx.createGain(); lp.frequency.setValueAtTime(160, 0); lp.frequency.exponentialRampToValueAtTime(260, T('tNews1')); lp.frequency.exponentialRampToValueAtTime(1300, T('tTurn') - 0.2);
      fade(g, [[0, 0], [3, 0.045], [T('tTurn') - 0.25, 0.065], [T('tTurn'), 0]]);
      for (const [m, det] of [[38, -6], [38, 6], [45, 0], [50, -4]]) { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(m); o.detune.value = det; o.connect(lp); o.start(0); o.stop(T('tTurn') + 0.1); }
      lp.connect(g); g.connect(master); send(g, rev, 0.4); }
    // a sparse piano motif over the news cards
    [[T('tNews1'), 62], [T('tNews1') + B(4), 65], [T('tSalmon'), 60], [T('tSalmon') + B(4), 57], [T('tUrine'), 62], [T('tEU'), 65], [T('tTaiwan'), 64], [T('tTaiwan') + B(4), 69]].forEach(([t, m]) => { piano(t, m, 0.5, 3.6, -0.1); piano(t, m - 12, 0.35, 3.6, 0.1); });
    // a hit on each news card, ticking that tightens toward the turn
    const boom = (t, v = 1) => { const o = ctx.createOscillator(); o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(32, t + 0.9); const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.28 * v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6); o.connect(g); g.connect(master); send(g, rev, 0.5); o.start(t); o.stop(t + 1.7);
      const lp = filt('lowpass', 1800), ng = ctx.createGain(); ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(0.08 * v, t + 0.005); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); noise(t, 0.55, lp); lp.connect(ng); ng.connect(master); send(ng, rev, 0.6); };
    ['tNews1', 'tSalmon', 'tUrine', 'tEU', 'tTaiwan'].forEach((n, i) => boom(T(n), 0.45 + i * 0.03));
    // riser into silence, then the hit on 輪胎
    swell(T('tTurn') - 2.4, T('tTurn') - 0.05, 0.8);
    const braam = (t, v = 1, len = 3.2) => { const lp = filt('lowpass', 300, 1.2), g = ctx.createGain(); lp.frequency.setValueAtTime(300, t); lp.frequency.exponentialRampToValueAtTime(2400, t + 0.25); lp.frequency.exponentialRampToValueAtTime(400, t + len);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.11 * v, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      for (const [m, det] of [[26, -8], [26, 8], [38, 0], [45, -5], [50, 5]]) { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(m); o.detune.value = det; o.connect(lp); o.start(t); o.stop(t + len + 0.1); }
      lp.connect(g); g.connect(master); send(g, rev, 0.6); boom(t, v); };
    braam(T('tTurn') + B(3), 1);
    // montage: driving pulse, a hit on every cut
    const m0 = T('tMontage'), m1 = T('end');
    for (let t = m0; t < m1 - 0.01; t += 2 * BEAT) kick(t, 0.55);
    for (let k = 0; k < 5; k++) boom(m0 + k * B(4), 0.4);
    { const lp = filt('lowpass', 900, 0.7), g = ctx.createGain(); lp.frequency.setValueAtTime(700, m0); lp.frequency.exponentialRampToValueAtTime(2600, m1); fade(g, [[m0, 0], [m0 + 0.5, 0.03], [m1 - 0.2, 0.04], [m1, 0]]);
      for (const m of [50, 53, 57, 62]) { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(m); o.connect(lp); o.start(m0); o.stop(m1 + 0.1); } lp.connect(g); g.connect(master); send(g, rev, 0.5); }
    for (let b = 0; b < 20; b++) { const c = CH[CYCLE[Math.floor(b / 4) % 4]], seq = [0, 2, 4, 3]; for (const h of [0, 1]) piano(m0 + B(b + h / 2), c.v[seq[(b * 2 + h) % 4]] + 12, h ? 0.3 : 0.42, 1.6, 0); }
    swell(m1 - 1.6, m1 - 0.05, 0.6);
    // title
    braam(m1, 0.7, 5);
    [41, 48, 53, 57, 60, 64, 67, 72].forEach((m, i) => piano(m1 + 0.6 + i * 0.05, m, 0.5, 4, (i - 4) * 0.08));
    bell(m1 + B(4), 76, 0.8); bell(m1 + B(5), 79, 0.5);
  }

  // ---------- arrangement
  for (let bar = 0; bar < BARS; bar++) {
    const t = bar * BAR, c = CH[barChord(bar)], last = bar === BARS - 1;
    pad(t, c.v.slice(0, 4), last ? 1.4 : BAR);
    if (bar >= 2) sub(t, c.r + 12, last ? 2.6 : BAR);
    if (!last) piano(t, c.r + 24, 0.42, 3.2);
  }
  for (let b = 0; b < END; b++) {
    const c = CH[barChord(Math.floor(b / 4))], k = b % 4;
    if (inR(b, [0, 8])) { piano(B(b), c.v[[2, 3, 4, 1][k]] + 12, [0.45, 0.6, 0.5, 0.55][k], 2.8, (k - 1.5) * 0.15); continue; }
    const seq = [0, 2, 4, 3, 1, 3, 4, 2];
    for (const h of [0, 1]) { const i = k * 2 + h; piano(B(b + h / 2), c.v[seq[i]] + 12, h ? 0.32 : 0.46, 2.0, (seq[i] - 2) * 0.12); }
    if (inR(b, [CUT.stat, END])) piano(B(b), c.v[[4, 3, 4, 2][k]] + 24, 0.28, 2.4, 0.25);
  }
  SYNC.kicks.forEach(t => kick(t, t >= B(END) ? 0.8 : EDIT.LONG ? 0.6 : 1));
  SYNC.rims.forEach(t => rim(t, 0.8));
  SYNC.ticks.forEach((t, i) => tick(t, i % 2 ? 0.45 : 0.7));
  if (!EDIT.LONG) for (let e = 0; e < BEATS * 4; e++) { const b = e / 4; if (inR(b, [CUT.physics, END])) shaker(B(b), e % 2 ? 0.6 : 1); }
  [[0.05, 1.4], [B(CUT.limits), 0.6], [B(CUT.physics), 0.8], [B(CUT.rig), 1.2], [B(CUT.device), 1.6], [B(CUT.safety), 0.8], [B(CUT.end), 1.0]].forEach(([t, d]) => pencil(t, d));
  Object.values(CUT).filter(b => b > 0).forEach(b => airWhoosh(B(b), 0.9));
  // device (authored beats, placed through its clock): plates land, cartridge + dust box click in, scan shimmer, pull-out
  const dv = b => B(at('device', b)), sf = b => B(at('safety', b));
  [38.5, 39, 39.5, 40].forEach(b => thud(dv(b), 0.8));
  slide(dv(40.75), dv(41.5)); click(dv(41.5), 1); slide(dv(41.8), dv(42.5)); click(dv(42.5), 0.9);
  swell(dv(42.8), dv(43.5), 0.7);
  slide(dv(48), dv(49)); slide(dv(50), dv(51)); click(dv(51), 0.8);
  // safety: relay opens (the groove carries on underneath)
  click(sf(56), 0.9);
  // finale
  [41, 48, 53, 57, 60, 64, 67, 72].forEach((m, i) => piano(B(END) + i * 0.045, m, 0.55, 3.4, (i - 4) * 0.08));
  bell(B(END), 76, 1); bell(B(END + 1), 79, 0.6); bell(B(END + 2), 84, 0.45);
  return await ctx.startRendering();
}
