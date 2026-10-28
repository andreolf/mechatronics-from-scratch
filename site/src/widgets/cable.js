// Phase 21 (cable robot build-along) widgets. "cablebot" embeds Lab 05 inline in a lesson; the 3D view loads on demand.
import { Plot, frame, slider, select, toggle, h, C } from './plot.js';
import { cableLab } from '../labs/cableLab.js';

const W = {};
let n = 0;
W.cablebot = (el, args) => { el.classList.add('widget'); cableLab(el, { embedded: true, id: `cable-w${++n}`, preset: args.preset || 'room' }); };
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

export default W;
void Plot; void frame; void slider; void toggle; void h; void C;
