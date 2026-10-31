// Phase 21 (cable robot build-along) widgets. "cablebot" embeds Lab 05 inline in a lesson; the 3D view loads on demand.
import { Plot, frame, slider, select, toggle, h, C } from './plot.js';
import { cableLab } from '../labs/cableLab.js';

const W = {};
let n = 0;
W.cablebot = (el, args) => { el.classList.add('widget'); cableLab(el, { embedded: true, id: `cable-w${++n}`, preset: args.preset || 'room' }); };
// Lab 06 inline: the take-apart viewer. Loaded on demand so lessons without it don't pay for three.js.
W.cableparts = (el) => { el.classList.add('widget'); const id = `teardown-w${++n}`; import('../labs/cableTeardown.js').then(({ cableTeardown }) => cableTeardown(el, { embedded: true, id })).catch((e) => console.warn('take-apart failed to load', e)); };
// p21-l05: line piling up on a spool. Diameter grows linearly with the line wound on, as in Stringman's SpiralCalculator,
// so wound length is exponential in shaft angle. Compares that with a constant-diameter assumption.
const LINES = { fishing: [72, 73.1, 7.5, 'fishing line'], power: [72, 86.1, 7.5, 'power line'] };
export function spoolModel(D0mm, Dfmm, Lf) {
  const D0 = D0mm / 1000, dD = (Dfmm - D0mm) / 1000;
  const k1 = dD > 0 ? (D0 * Lf) / dD : Infinity, k2 = (Math.PI * dD) / Lf;
  const wound = (rev) => (dD > 0 ? k1 * (Math.exp(k2 * rev) - 1) : Math.PI * D0 * rev);
  const revs = (len) => (dD > 0 ? Math.log(len / k1 + 1) / k2 : len / (Math.PI * D0));
  const diam = (len) => D0 + (dD * len) / Lf;
  return { wound, revs, diam, D0 };
}
W.spool = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { line: 'power', len: 7.5, torque: 1.0, bits: 12 };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 34], y: [0, 8], label: 'Line wound on a spool against motor revolutions, with and without the growing diameter' });
  p.draw = (P) => {
    const [D0, Df, Lf, name] = LINES[s.line], m = spoolModel(D0, Df, Lf);
    P.axes({ xl: 'motor revolutions from empty', yl: 'line on the spool (m)' });
    P.fn((r) => Math.PI * m.D0 * r, C.dim, 1.5, [5, 4]);
    P.fn((r) => m.wound(r), C.lime, 2.5);
    const r = m.revs(s.len); P.dot(r, s.len, C.warn, 5); P.dot(r, Math.PI * m.D0 * r, C.dim, 4);
    const D = m.diam(s.len), mpr = Math.PI * D, T = s.torque / (D / 2), rpm = (0.4 / mpr) * 60, res = (mpr / 2 ** s.bits) * 1000, err = (s.len - Math.PI * m.D0 * r) * 100;
    read.innerHTML = `${name}, ${s.len.toFixed(1)} m on the spool · diameter <b>${(D * 1000).toFixed(1)} mm</b> · ${(mpr * 1000).toFixed(0)} mm of line per rev · ${s.torque.toFixed(2)} N·m pulls <b>${T.toFixed(1)} N</b> · 0.4 m/s needs ${rpm.toFixed(0)} rpm · one count of a ${s.bits}-bit encoder is ${res.toFixed(3)} mm · assuming the empty diameter is off by <b>${err.toFixed(1)} cm</b>`;
  };
  ctrls.append(
    select('Line', [['power', 'Power line (72 → 86.1 mm over 7.5 m)'], ['fishing', 'Fishing line (72 → 73.1 mm over 7.5 m)']], s.line, (v) => { s.line = v; p.redraw(); }, 'spool-line'),
    slider('Line on the spool', { min: 0, max: 7.5, step: 0.1, value: s.len, fmt: (v) => v.toFixed(1) + ' m', id: 'spool-len' }, (v) => { s.len = v; p.redraw(); }),
    slider('Motor torque', { min: 0.05, max: 1, step: 0.05, value: s.torque, fmt: (v) => v.toFixed(2) + ' N·m', id: 'spool-torque' }, (v) => { s.torque = v; p.redraw(); }),
    slider('Encoder resolution', { min: 8, max: 16, step: 1, value: s.bits, fmt: (v) => v + ' bits', id: 'spool-bits' }, (v) => { s.bits = v; p.redraw(); }),
  );
  p.redraw();
};

// p21-l06: what a calibration error does. Winches set lengths from a model of the anchors; the real gripper comes to rest at
// the lowest point no further from each real anchor than its line length (some lines taut, the rest slack).
const v3 = { sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], len: (a) => Math.hypot(a[0], a[1], a[2]) };
const corners = (w, d, hh) => [[-w / 2, -d / 2, hh], [w / 2, -d / 2, hh], [w / 2, d / 2, hh], [-w / 2, d / 2, hh]];
export function hang(A, L) {
  const ok = (p) => A.every((a, i) => v3.len(v3.sub(a, p)) <= L[i] + 1e-9);
  let best = null, tight = null;
  const consider = (p, t) => { if (p && ok(p) && (!best || p[2] < best[2])) { best = p; tight = t; } };
  for (let i = 0; i < 4; i++) consider([A[i][0], A[i][1], A[i][2] - L[i]], [i]);
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
    const c = v3.sub(A[j], A[i]), dd = v3.len(c), e = v3.mul(c, 1 / dd), a = (L[i] ** 2 - L[j] ** 2 + dd * dd) / (2 * dd), r2 = L[i] ** 2 - a * a;
    if (r2 < 0) continue;
    const down = v3.sub([0, 0, -1], v3.mul(e, -e[2])), dl = v3.len(down); if (dl < 1e-12) continue;
    consider(v3.add(v3.add(A[i], v3.mul(e, a)), v3.mul(down, Math.sqrt(r2) / dl)), [i, j]);
  }
  for (const tri of [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]]) {
    const [P0, P1, P2] = tri.map((k) => A[k]), [r0, r1, r2] = tri.map((k) => L[k]);
    const d = v3.len(v3.sub(P1, P0)), ex = v3.mul(v3.sub(P1, P0), 1 / d), i = v3.dot(ex, v3.sub(P2, P0));
    let ey = v3.sub(v3.sub(P2, P0), v3.mul(ex, i)); const ny = v3.len(ey); if (ny < 1e-12) continue; ey = v3.mul(ey, 1 / ny);
    const ez = v3.cross(ex, ey), j = v3.dot(ey, v3.sub(P2, P0)), x = (r0 * r0 - r1 * r1 + d * d) / (2 * d), y = (r0 * r0 - r2 * r2 + i * i + j * j) / (2 * j) - (i / j) * x, z2 = r0 * r0 - x * x - y * y;
    if (z2 < 0) continue;
    const base = v3.add(P0, v3.add(v3.mul(ex, x), v3.mul(ey, y))), z = Math.sqrt(z2), pa = v3.add(base, v3.mul(ez, z)), pb = v3.sub(base, v3.mul(ez, z));
    consider(pa[2] < pb[2] ? pa : pb, tri);
  }
  return { p: best, tight };
}
const ERRS = { wider: 'Every anchor further out than measured', narrower: 'Every anchor further in than measured', higher: 'Ceiling higher than measured', onelow: 'One anchor lower than measured' };
export function trueAnchors(kind, e) {
  if (kind === 'wider') return corners(7 + 2 * e, 7 + 2 * e, 3);
  if (kind === 'narrower') return corners(7 - 2 * e, 7 - 2 * e, 3);
  if (kind === 'higher') return corners(7, 7, 3 + e);
  const A = corners(7, 7, 3); A[2] = [A[2][0], A[2][1], 3 - e]; return A;
}
W.anchorcal = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { kind: 'wider', e: 0.05, z: 1.0 };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [-2.5, 2.5], y: [-25, 25], label: 'Height error of the gripper along a commanded straight line' });
  p.draw = (P) => {
    const Am = corners(7, 7, 3), At = trueAnchors(s.kind, s.e), xs = [], dz = [], dx = [], slack = new Set();
    for (let k = 0; k <= 60; k++) {
      const x = -2.5 + (5 * k) / 60, cmd = [x, 0, s.z], L = Am.map((a) => v3.len(v3.sub(a, cmd))), r = hang(At, L);
      if (!r.p) continue; xs.push(x); dz.push((r.p[2] - s.z) * 100); dx.push((r.p[0] - x) * 100);
      for (let i = 0; i < 4; i++) if (!r.tight.includes(i)) slack.add(i + 1);
    }
    const m = Math.max(5, ...dz.map(Math.abs), ...dx.map(Math.abs)) * 1.15; P.setRange([-2.5, 2.5], [-m, m]);
    P.axes({ xl: 'commanded x (m), y = 0', yl: 'error (cm)' });
    P.line([-2.5, 2.5], [0, 0], C.dim, 1, [5, 4]); P.line(xs, dx, C.signal, 1.5); P.line(xs, dz, C.lime, 2.5);
    const peak = dz.reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a), 0);
    read.innerHTML = `<span style="color:${C.lime}">height error</span> up to <b>${peak.toFixed(1)} cm</b>, <span style="color:${C.signal}">sideways</span> up to ${Math.max(...dx.map(Math.abs)).toFixed(1)} cm, from a ${(s.e * 100).toFixed(0)} cm mistake · ${s.e > 0 ? `${(Math.abs(peak) / (s.e * 100)).toFixed(1)}× amplification · ` : ''}lines that go slack somewhere on the path: ${slack.size ? [...slack].join(', ') : 'none'}`;
  };
  ctrls.append(
    select('Calibration mistake', Object.entries(ERRS), s.kind, (v) => { s.kind = v; p.redraw(); }, 'cal-kind'),
    slider('Size of the mistake', { min: 0, max: 0.1, step: 0.005, value: s.e, fmt: (v) => (v * 100).toFixed(1) + ' cm', id: 'cal-err' }, (v) => { s.e = v; p.redraw(); }),
    slider('Height of the path', { min: 0.5, max: 2.5, step: 0.1, value: s.z, fmt: (v) => v.toFixed(1) + ' m', id: 'cal-z' }, (v) => { s.z = v; p.redraw(); }),
  );
  p.redraw();
};

// p21-l09: swing damping through a delay. The controller sees the swing tau seconds late; optionally it rotates that old
// state forward by omega*tau (free-pendulum prediction, as Stringman's swing.py does) before applying the PD law.
export function delayedSwing({ tau, gain = 1, predict = false, l = 0.5, T = 10, dt = 0.002, d0 = 0.09 }) {
  const w = Math.sqrt(9.81 / l), kp = 0.5 * w * w * gain, kd = 0.9 * w * gain, lag = Math.round(tau / dt);
  let d = d0, v = 0; const hd = [d], hv = [v], out = [];
  const c = Math.cos(w * tau), sn = Math.sin(w * tau);
  for (let k = 0; k < Math.round(T / dt); k++) {
    const j = Math.max(0, hd.length - 1 - lag); let dm = hd[j], vm = hv[j];
    if (predict && lag > 0) { const d2 = dm * c + (vm / w) * sn; vm = -dm * w * sn + vm * c; dm = d2; }
    const a = kp * dm + kd * vm;
    v += (-w * w * d - a) * dt; d += v * dt;
    if (!Number.isFinite(d) || Math.abs(d) > 10) { d = Math.sign(d) * 10; v = 0; }
    hd.push(d); hv.push(v); out.push(d);
  }
  return out;
}
W.swingdelay = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { tau: 0.2, gain: 1, predict: false };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 10], y: [-12, 12], label: 'Swing against time with a delayed damping loop' });
  p.draw = (P) => {
    const dt = 0.002, out = delayedSwing({ ...s, dt });
    P.axes({ xl: 'time (s)', yl: 'swing (cm)' });
    const xs = [], ys = []; for (let k = 0; k < out.length; k += 5) { xs.push(k * dt); ys.push(Math.max(-13, Math.min(13, out[k] * 100))); }
    P.line(xs, ys, C.lime, 2);
    const tail = out.slice(-Math.round(2 / dt)).reduce((m, x) => Math.max(m, Math.abs(x)), 0) * 100;
    const verdict = tail > 9 ? `<b style="color:${C.bad}">growing</b>: the correction arrives so late that it pumps the swing` : tail > 0.5 ? `<b style="color:${C.warn}">still swinging</b> after 8 s` : '<b>damped</b>';
    read.innerHTML = `delay ${(s.tau * 1000).toFixed(0)} ms · gain ×${s.gain.toFixed(2)} · ${s.predict ? 'state projected forward by the delay' : 'acting on the old state'} · swing in the last 2 s: ${tail > 99 ? '>1 m' : tail.toFixed(2) + ' cm'} · ${verdict}`;
  };
  ctrls.append(
    slider('Loop delay', { min: 0, max: 0.7, step: 0.01, value: s.tau, fmt: (v) => (v * 1000).toFixed(0) + ' ms', id: 'sd-tau' }, (v) => { s.tau = v; p.redraw(); }),
    slider('Damping gain', { min: 0.1, max: 1, step: 0.05, value: s.gain, fmt: (v) => '×' + v.toFixed(2), id: 'sd-gain' }, (v) => { s.gain = v; p.redraw(); }),
    toggle('Project the swing forward by the delay', s.predict, (v) => { s.predict = v; p.redraw(); }, { id: 'sd-predict' }),
  );
  p.redraw();
};

// p21-l10: behaviour cloning in a corridor. The expert steers back to the centre line; the clone is a k-nearest-neighbour
// regression on what the expert did. Clean demos never leave the centre, so the clone never learns to correct.
function mulberry(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(r) { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
const BC = { V: 0.4, DT: 0.1, STEPS: 100, WALL: 0.15 };
const expertAct = (y) => Math.max(-0.4, Math.min(0.4, -2 * y));
function knnPolicy(data, k = 5) {
  const pts = [...data].sort((a, b) => a[0] - b[0]), Y = pts.map((p) => p[0]);
  return (y) => {
    let lo = 0, hi = Y.length; while (lo < hi) { const m = (lo + hi) >> 1; if (Y[m] < y) lo = m + 1; else hi = m; }
    const cand = []; for (let i = Math.max(0, lo - k); i < Math.min(Y.length, lo + k); i++) cand.push(i);
    cand.sort((a, b) => Math.abs(Y[a] - y) - Math.abs(Y[b] - y));
    const use = cand.slice(0, k); return use.reduce((s, i) => s + pts[i][1], 0) / use.length;
  };
}
export function bcExperiment({ demos = 50, demoNoise = 0, dagger = 0, noise = 0.015, trials = 40, seed = 1 }) {
  const r = mulberry(seed), data = [];
  const roll = (pol, label) => { let y = 0; const ys = [0]; for (let k = 0; k < BC.STEPS; k++) { if (label) label.push([y, expertAct(y)]); y += pol(y) * BC.DT + gauss(r) * noise; ys.push(y); } return ys; };
  for (let d = 0; d < demos; d++) { let y = 0; for (let k = 0; k < BC.STEPS; k++) { data.push([y, expertAct(y)]); y += expertAct(y) * BC.DT + gauss(r) * demoNoise; } }
  for (let g = 0; g < dagger; g++) { const pol = knnPolicy(data); for (let j = 0; j < 5; j++) roll(pol, data); }
  const pol = knnPolicy(data), runs = []; let ok = 0;
  for (let t = 0; t < trials; t++) { const ys = roll(pol); runs.push(ys); if (Math.max(...ys.map(Math.abs)) < BC.WALL) ok++; }
  return { runs, ok, trials, spread: Math.sqrt(data.reduce((s, p) => s + p[0] * p[0], 0) / data.length) };
}
W.bc = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { demos: 50, demoNoise: 0, dagger: 0, noise: 0.015, seed: 1 };
  const p = new Plot(body, { aspect: 0.5, maxH: 280, x: [0, 4], y: [-0.3, 0.3], label: 'Clone rollouts along a corridor' });
  p.draw = (P) => {
    const res = bcExperiment(s);
    P.axes({ xl: 'distance along the corridor (m)', yl: 'sideways (m)' });
    P.poly([[0, 0.15], [4, 0.15], [4, 0.3], [0, 0.3]], 'rgba(255,107,91,0.12)'); P.poly([[0, -0.15], [4, -0.15], [4, -0.3], [0, -0.3]], 'rgba(255,107,91,0.12)');
    const xs = res.runs[0].map((_, k) => k * BC.V * BC.DT);
    for (const ys of res.runs) { const bad = Math.max(...ys.map(Math.abs)) >= BC.WALL; P.line(xs, ys.map((y) => Math.max(-0.3, Math.min(0.3, y))), bad ? 'rgba(255,107,91,0.7)' : 'rgba(198,255,26,0.55)', 1.2); }
    read.innerHTML = `<b>${res.ok} of ${res.trials}</b> clone runs stay inside the corridor · the training states spread ${(res.spread * 100).toFixed(1)} cm either side of the centre line · ${s.demos} demos, ${(s.demoNoise * 100).toFixed(1)} cm of disturbance while demonstrating, ${s.dagger} DAgger round${s.dagger === 1 ? '' : 's'}`;
  };
  const redo = () => p.redraw();
  ctrls.append(
    slider('Demonstrations', { min: 1, max: 50, step: 1, value: s.demos, fmt: (v) => String(v), id: 'bc-demos' }, (v) => { s.demos = v; redo(); }),
    slider('Disturb the demonstrations', { min: 0, max: 0.03, step: 0.0025, value: s.demoNoise, fmt: (v) => (v * 100).toFixed(1) + ' cm', id: 'bc-dart' }, (v) => { s.demoNoise = v; redo(); }),
    slider('DAgger rounds', { min: 0, max: 3, step: 1, value: s.dagger, fmt: (v) => String(v), id: 'bc-dagger' }, (v) => { s.dagger = v; redo(); }),
    slider('Disturbance while running', { min: 0, max: 0.03, step: 0.0025, value: s.noise, fmt: (v) => (v * 100).toFixed(1) + ' cm', id: 'bc-noise' }, (v) => { s.noise = v; redo(); }),
  );
  const seedBtn = h('button', { class: 'btn small', type: 'button', 'data-testid': 'bc-seed' }, 'New random seed');
  seedBtn.addEventListener('click', () => { s.seed++; redo(); });
  ctrls.append(seedBtn);
  p.redraw();
};

export default W;
void Plot; void frame; void slider; void toggle; void h; void C;
