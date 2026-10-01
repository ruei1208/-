// Which cut to build: the 60 s showreel (default) or the long promo (?edit=long). Shared by picture and score.
// Beats are 0.75 s (80 BPM). CUT = timeline beat each scene starts on; ORDER = scene sequence.
// CLOCK knots map timeline beat -> the beat grid a scene was animated on (slope 1 beyond the outer knots).
const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();

const SHORT = {
  BEATS: 80,
  ORDER: ['intro', 'problemA', 'problemB', 'ppd', 'limits', 'physics', 'rig', 'device', 'safety', 'stat', 'dyn', 'spec', 'end'],
  CUT: { intro: 0, problemA: 8, problemB: 12, ppd: 16, limits: 20, physics: 27, rig: 36, device: 42, safety: 54, stat: 61, dyn: 66, spec: 71, end: 76 },
  CLOCK: {
    intro: [[0, 0]], problemA: [[8, 8]], problemB: [[12, 12]], ppd: [[16, 15]],
    limits: [[20, 18], [27, 26]], physics: [[27, 26], [36, 36]],
    rig: [[36, 36], [40.8, 38.8]],                       // longer look at the rig; the zoom keeps its pace
    device: [[42, 36], [47, 44], [54, 52]],               // assembly quicker, spec table close to its old pace
    safety: [[54, 52], [61, 60]], stat: [[61, 60]], dyn: [[66, 64]], spec: [[71, 68]], end: [[76, 76]],
  },
  RIG_HOLD: 0,
  SEC: [['problemA', '01', 'THE PROBLEM'], ['limits', '02', 'CURRENT SOLUTIONS'], ['physics', '03', 'HOW IT WORKS'], ['rig', '04', 'THE SYSTEM'], ['device', '04', 'THE DEVICE'], ['safety', '05', 'FAIL-SAFE'], ['stat', '06', 'RESULTS']],
  TOTAL: '06',
};

// long promo: every original scene at its authored pace plus the new chapters; new scenes run on their own clock from 0
// news opener, chapter cards between the big sections, and longer holds on the text-heavy pages
const LONG_LEN = [['intro', 8], ['lnews', 12], ['problemA', 5], ['problemB', 5], ['ppd', 5],
  ['ch2', 2], ['limits', 8], ['tyre', 6], ['approach', 8],
  ['ch3', 2], ['physics', 10], ['charge', 8],
  ['ch4', 2], ['rig', 7], ['device', 16], ['build', 9],
  ['ch5', 2], ['safety', 8],
  ['ch6', 2], ['method', 11], ['stat', 6], ['imaging', 8], ['envelope', 8], ['dynres', 6], ['spec', 6],
  ['ch7', 2], ['future', 8], ['apps', 12], ['team', 10], ['end', 8]];
export const CHAPTERS = { ch2: ['02', '現有方案與本專題'], ch3: ['03', '作動原理'], ch4: ['04', '系統與裝置'], ch5: ['05', '安全設計'], ch6: ['06', '實驗驗證'], ch7: ['07', '展望'] };
const AUTHORED = { intro: 0, problemA: 8, problemB: 12, ppd: 15, limits: 18, physics: 26, rig: 36, device: 36, safety: 52, stat: 60, spec: 68, end: 76 };
const LONG = (() => {
  const CUT = {}, CLOCK = {}; let b = 0;
  for (const [n, len] of LONG_LEN) { CUT[n] = b; CLOCK[n] = [[b, AUTHORED[n] ?? 0]]; b += len; }
  return {
    BEATS: b, ORDER: LONG_LEN.map(([n]) => n), CUT, CLOCK, RIG_HOLD: 3, LONG: true,
    SEC: [['intro', '01', 'THE PROBLEM'], ['limits', '02', 'OUR APPROACH'], ['physics', '03', 'HOW IT WORKS'], ['rig', '04', 'THE SYSTEM'], ['device', '04', 'THE DEVICE'],
      ['build', '04', 'BUILD & VERIFY'], ['safety', '05', 'FAIL-SAFE'], ['method', '06', 'VALIDATION'], ['future', '07', 'OUTLOOK'], ['team', '07', 'TEAM']],
    TOTAL: '07',
  };
})();

// trailer: news-led cold open, a turn, a montage of the device and results, then the title card. Every shot runs on its
// own clock from 0; cuts dip through black instead of the showreel's scan wipe.
const TRAILER_LEN = [['tOpen', 10], ['tNews1', 11], ['tSalmon', 8], ['tUrine', 8], ['tEU', 8], ['tTaiwan', 9], ['tTurn', 6], ['tMontage', 20], ['end', 12]];
const TRAILER = (() => {
  const CUT = {}, CLOCK = {}; let b = 0;
  for (const [n, len] of TRAILER_LEN) { CUT[n] = b; CLOCK[n] = [[b, 0]]; b += len; }
  return { BEATS: b, ORDER: TRAILER_LEN.map(([n]) => n), CUT, CLOCK, RIG_HOLD: 0, TRAILER: true, SEC: [], TOTAL: '' };
})();

const NAME = ['long', 'trailer'].includes(q.get('edit')) ? q.get('edit') : 'short';
export const EDIT = { short: SHORT, long: LONG, trailer: TRAILER }[NAME];
export const EDIT_NAME = NAME;
