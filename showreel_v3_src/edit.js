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
const LONG_LEN = [['intro', 8], ['problemA', 5], ['problemB', 5], ['ppd', 5], ['limits', 8], ['tyre', 6], ['approach', 8], ['physics', 10], ['charge', 8],
  ['rig', 7], ['device', 16], ['build', 9], ['safety', 8], ['method', 9], ['stat', 6], ['imaging', 8], ['envelope', 8], ['dynres', 6], ['spec', 6],
  ['future', 8], ['apps', 10], ['team', 8], ['end', 8]];
const AUTHORED = { intro: 0, problemA: 8, problemB: 12, ppd: 15, limits: 18, physics: 26, rig: 36, device: 36, safety: 52, stat: 60, spec: 68, end: 76 };
const LONG = (() => {
  const CUT = {}, CLOCK = {}; let b = 0;
  for (const [n, len] of LONG_LEN) { CUT[n] = b; CLOCK[n] = [[b, AUTHORED[n] ?? 0]]; b += len; }
  return {
    BEATS: b, ORDER: LONG_LEN.map(([n]) => n), CUT, CLOCK, RIG_HOLD: 3, LONG: true,
    SEC: [['problemA', '01', 'THE PROBLEM'], ['limits', '02', 'OUR APPROACH'], ['physics', '03', 'HOW IT WORKS'], ['rig', '04', 'THE SYSTEM'], ['device', '04', 'THE DEVICE'],
      ['build', '04', 'BUILD & VERIFY'], ['safety', '05', 'FAIL-SAFE'], ['method', '06', 'VALIDATION'], ['future', '07', 'OUTLOOK'], ['team', '07', 'TEAM']],
    TOTAL: '07',
  };
})();

export const EDIT = q.get('edit') === 'long' ? LONG : SHORT;
export const EDIT_NAME = q.get('edit') === 'long' ? 'long' : 'short';
