// Widgets for Phases 03-05: transforms, probability, circuits. Same touch rules as index.js: sliders and taps everywhere, drag only in Drag mode.
import { Plot, frame, slider, select, toggle, h, C, f3 } from './plot.js';

const W = {};
const TAU = 2 * Math.PI;
function mulberry(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function randn(r) { const u = r() || 1e-12, v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); }
const linspace = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
const db = (m) => 20 * Math.log10(m);
// complex helpers: [re, im]
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cabs = (a) => Math.hypot(a[0], a[1]), carg = (a) => Math.atan2(a[1], a[0]);
function fft(re, im) { // iterative radix-2, in place
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) { const a = -TAU / len; for (let i = 0; i < n; i += len) for (let k = 0; k < len / 2; k++) { const wr = Math.cos(a * k), wi = Math.sin(a * k), ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi, vi = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr; re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi; } }
}

// ---------- Phase 03 ----------
W.phasor = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { a1: 1, p1: 0, a2: 0.7, p2: 60, t: 0 };
  const ph = new Plot(body, { aspect: 0.55, maxH: 300, x: [-2, 2], y: [-1.9, 1.9], equal: true, label: 'Two phasors added tip to tail' });
  const tp = new Plot(body, { aspect: 0.4, maxH: 220, x: [0, 2], y: [-2, 2], label: 'The same sinusoids in time' });
  const w = TAU; // 1 Hz
  ph.draw = (P) => {
    P.axes(); const th = w * s.t;
    const z1 = [s.a1 * Math.cos(th + s.p1 * Math.PI / 180), s.a1 * Math.sin(th + s.p1 * Math.PI / 180)], z2 = [s.a2 * Math.cos(th + s.p2 * Math.PI / 180), s.a2 * Math.sin(th + s.p2 * Math.PI / 180)];
    P.arrow(0, 0, z1[0], z1[1], C.lime); P.arrow(z1[0], z1[1], z1[0] + z2[0], z1[1] + z2[1], C.signal); P.arrow(0, 0, z1[0] + z2[0], z1[1] + z2[1], C.warn, 3);
    P.line([z1[0] + z2[0], z1[0] + z2[0]], [z1[1] + z2[1], -1.9], C.dim, 1, [3, 4]);
    const S = [s.a1 * Math.cos(s.p1 * Math.PI / 180) + s.a2 * Math.cos(s.p2 * Math.PI / 180), s.a1 * Math.sin(s.p1 * Math.PI / 180) + s.a2 * Math.sin(s.p2 * Math.PI / 180)];
    read.innerHTML = `sum phasor = <b>${cabs(S).toFixed(3)}</b> ∠ <b>${(carg(S) * 180 / Math.PI).toFixed(1)}°</b> · its real part traces the amber sum in time`;
  };
  tp.draw = (P) => {
    P.axes({ xl: 't [s]' });
    const f1 = (t) => s.a1 * Math.cos(w * t + s.p1 * Math.PI / 180), f2 = (t) => s.a2 * Math.cos(w * t + s.p2 * Math.PI / 180);
    P.fn(f1, C.lime, 1.5); P.fn(f2, C.signal, 1.5); P.fn((t) => f1(t) + f2(t), C.warn, 2.5);
    P.line([s.t, s.t], [-2, 2], C.fog, 1, [3, 4]);
  };
  const r = () => { ph.redraw(); tp.redraw(); };
  ctrls.append(
    slider('Amplitude 1', { min: 0, max: 1.2, step: 0.05, value: s.a1, fmt: (v) => v.toFixed(2) }, (v) => { s.a1 = v; r(); }),
    slider('Phase 1', { min: -180, max: 180, step: 5, value: s.p1, fmt: (v) => v + '°' }, (v) => { s.p1 = v; r(); }),
    slider('Amplitude 2', { min: 0, max: 1.2, step: 0.05, value: s.a2, fmt: (v) => v.toFixed(2) }, (v) => { s.a2 = v; r(); }),
    slider('Phase 2', { min: -180, max: 180, step: 5, value: s.p2, fmt: (v) => v + '°' }, (v) => { s.p2 = v; r(); }),
    slider('Time t', { min: 0, max: 2, step: 0.01, value: 0, fmt: (v) => v.toFixed(2) + ' s' }, (v) => { s.t = v; r(); }),
  );
  r();
};

W.fourier = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { n: 5, duty: 50 };
  const p = new Plot(body, { aspect: 0.55, maxH: 340, x: [0, 2], y: [-0.4, 1.4], label: 'PWM wave rebuilt from harmonics' });
  // PWM between 0 and 1, period 1, duty d: a0 = d, a_k = sin(2πkd)/(πk), b_k = (1 - cos 2πkd)/(πk)
  const partial = (t, n, d) => { let y = d; for (let k = 1; k <= n; k++) y += (Math.sin(TAU * k * d) * Math.cos(TAU * k * t) + (1 - Math.cos(TAU * k * d)) * Math.sin(TAU * k * t)) / (Math.PI * k); return y; };
  p.draw = (P) => {
    P.axes({ xl: 't / period' }); const d = s.duty / 100;
    P.fn((t) => ((t % 1) < d ? 1 : 0), C.dim, 1.5, null, 800); P.fn((t) => partial(t, s.n, d), C.lime, 2, null, 1200);
    let mx = -9; for (let i = 0; i <= 4000; i++) mx = Math.max(mx, partial(i / 4000, s.n, d));
    read.innerHTML = `${s.n} harmonic${s.n > 1 ? 's' : ''} · duty ${s.duty} % · peak <b>${mx.toFixed(4)}</b> (overshoot ${((mx - 1) * 100).toFixed(1)} % of the step, tending to 8.9 % as harmonics grow: Gibbs)`;
  };
  ctrls.append(
    slider('Harmonics N', { min: 1, max: 99, step: 1, value: s.n }, (v) => { s.n = v; p.redraw(); }),
    slider('Duty cycle', { min: 5, max: 95, step: 5, value: s.duty, fmt: (v) => v + ' %' }, (v) => { s.duty = v; p.redraw(); }),
  );
  p.redraw();
};

W.splane = (el) => {
  const { body, read } = frame(el, { interact: true });
  const pole = [[-1, 3]];
  const sp = new Plot(body, { aspect: 0.62, maxH: 320, x: [-6, 1.5], y: [-5, 5], equal: true, label: 'Pole pair on the s-plane; drag or tap to move it' });
  const st = new Plot(body, { aspect: 0.42, maxH: 240, x: [0, 8], y: [0, 2], label: 'Step response of the pole pair' });
  const y = (t) => { const [sg, w] = pole[0]; if (Math.abs(w) < 1e-6) return 1 - Math.exp(sg * t) * (1 - sg * t); return 1 - Math.exp(sg * t) * (Math.cos(w * t) - (sg / w) * Math.sin(w * t)); };
  sp.draw = (P) => {
    P.axes({ xl: 'σ', yl: 'jω' }); P.ctx.fillStyle = '#ff6b5b14'; P.ctx.fillRect(P.sx(0), P.pad.t, P.W - P.pad.r - P.sx(0), P.H - P.pad.t - P.pad.b);
    const [sg, w] = pole[0]; const wn = Math.hypot(sg, w); const ang = Math.atan2(Math.abs(w), -sg);
    P.line([0, sg], [0, w], C.dim, 1, [3, 4]); P.line([0, sg], [0, -w], C.dim, 1, [3, 4]);
    for (const yy of [w, -w]) { P.text('×', sg, yy - 0.25, C.lime, 'center'); }
    P.handle(sg, w, C.lime);
    const zeta = wn > 0 ? -sg / wn : 1;
    read.innerHTML = `poles <b>${sg.toFixed(2)} ± ${Math.abs(w).toFixed(2)}j</b> · ω<sub>n</sub> = <b>${wn.toFixed(2)}</b> rad/s · ζ = <b>${zeta.toFixed(3)}</b>${sg < 0 ? ` · settling ≈ 4/(ζω<sub>n</sub>) = <b>${(4 / -sg).toFixed(2)} s</b>` : ' · <b style="color:#ff6b5b">unstable</b>'}${sg < 0 && w !== 0 ? ` · overshoot ${(100 * Math.exp(-Math.PI * zeta / Math.sqrt(1 - zeta * zeta))).toFixed(1)} %` : ''}`;
    el.dataset.zeta = zeta.toFixed(3); void ang;
  };
  st.draw = (P) => { P.axes({ xl: 't [s]' }); P.line([0, 8], [1, 1], C.dim, 1, [4, 4]); P.fn(y, C.lime, 2, null, 500); };
  sp.handles(() => pole, (i, x, yy) => { pole[0] = [Math.min(1.2, Math.round(x * 10) / 10), Math.round(Math.abs(yy) * 10) / 10]; sp.redraw(); st.redraw(); }, el);
  sp.redraw(); st.redraw();
};

function bodeFrame(el, label, ranges) {
  const { body, read, ctrls } = frame(el);
  const mag = new Plot(body, { aspect: 0.42, maxH: 240, x: ranges.f, y: ranges.db, logx: true, label: label + ': magnitude' });
  const pha = new Plot(body, { aspect: 0.3, maxH: 180, x: ranges.f, y: ranges.ph, logx: true, label: label + ': phase' });
  return { read, ctrls, mag, pha };
}
W.bode = (el, args) => {
  const kind = args.kind || 'rc';
  if (kind === 'rc') {
    const s = { R: 3.3, C: 0.1 }; // kΩ, µF
    const { read, ctrls, mag, pha } = bodeFrame(el, 'RC low-pass', { f: [1, 1e5], db: [-60, 5], ph: [-95, 5] });
    const H = (f) => cdiv([1, 0], [1, TAU * f * s.R * 1e3 * s.C * 1e-6]);
    mag.draw = (P) => { const fc = 1 / (TAU * s.R * 1e3 * s.C * 1e-6); P.axes({ xl: 'f [Hz]', yl: 'dB' }); P.line([1, fc, 1e5], [0, 0, -20 * Math.log10(1e5 / fc)], C.dim, 1, [4, 4]); P.fn((f) => db(cabs(H(f))), C.lime, 2); P.line([fc, fc], [-60, 5], C.warn, 1, [3, 3]); P.dot(fc, -3.01, C.warn); read.innerHTML = `f<sub>c</sub> = 1/(2πRC) = <b>${f3(fc, 1)} Hz</b> · gain there −3.01 dB, phase −45° · slope −20 dB/decade above`; };
    pha.draw = (P) => { P.axes({ yl: 'phase °' }); P.fn((f) => carg(H(f)) * 180 / Math.PI, C.signal, 2); };
    const r = () => { mag.redraw(); pha.redraw(); };
    ctrls.append(slider('R', { min: 0.1, max: 100, step: 0.1, value: s.R, fmt: (v) => v.toFixed(1) + ' kΩ' }, (v) => { s.R = v; r(); }), slider('C', { min: 0.001, max: 1, step: 0.001, value: s.C, fmt: (v) => (v * 1000).toFixed(0) + ' nF' }, (v) => { s.C = v; r(); }));
    r(); return;
  }
  if (kind === 'second') {
    const s = { fn: args.fn || 500, zeta: args.zeta || 0.707 };
    const { read, ctrls, mag, pha } = bodeFrame(el, 'Second-order low-pass', { f: [10, 1e5], db: [-60, 20], ph: [-185, 5] });
    const H = (f) => { const u = f / s.fn; return cdiv([1, 0], [1 - u * u, 2 * s.zeta * u]); };
    mag.draw = (P) => { P.axes({ xl: 'f [Hz]', yl: 'dB' }); P.fn((f) => db(cabs(H(f))), C.lime, 2, null, 600); P.line([s.fn, s.fn], [-60, 20], C.warn, 1, [3, 3]); const Q = 1 / (2 * s.zeta); read.innerHTML = `f<sub>n</sub> = <b>${s.fn} Hz</b> · ζ = <b>${s.zeta.toFixed(3)}</b> · Q = 1/(2ζ) = <b>${Q.toFixed(3)}</b> · gain at f<sub>n</sub> = <b>${db(Q).toFixed(2)} dB</b>${s.zeta < 0.7071 ? ` · peak ${db(1 / (2 * s.zeta * Math.sqrt(1 - s.zeta * s.zeta))).toFixed(2)} dB` : ' · no peak (ζ ≥ 0.707)'} · −40 dB/decade above`; };
    pha.draw = (P) => { P.axes({ yl: 'phase °' }); P.fn((f) => carg(H(f)) * 180 / Math.PI, C.signal, 2, null, 600); };
    const r = () => { mag.redraw(); pha.redraw(); };
    ctrls.append(slider('Natural frequency', { min: 50, max: 5000, step: 10, value: s.fn, fmt: (v) => v + ' Hz' }, (v) => { s.fn = v; r(); }), slider('Damping ζ', { min: 0.05, max: 2, step: 0.005, value: s.zeta, fmt: (v) => v.toFixed(3) }, (v) => { s.zeta = v; r(); }));
    r(); return;
  }
  if (kind === 'discrete') { // first-order low-pass a/(s+a) vs ZOH and Tustin at sample time T
    const s = { fc: 10, T: 10 };
    const { read, ctrls, mag, pha } = bodeFrame(el, 'Continuous versus discretised low-pass', { f: [0.1, 500], db: [-40, 5], ph: [-200, 5] });
    const resp = (f) => { const a = TAU * s.fc, T = s.T / 1000, w = TAU * f; const Hc = cdiv([a, 0], [a, w]); const z = [Math.cos(w * T), Math.sin(w * T)];
      const p = Math.exp(-a * T); const Hz = cdiv([1 - p, 0], [z[0] - p, z[1]]); // ZOH
      const k = 2 / T; const Ht = cdiv(cmul([a, 0], [z[0] + 1, z[1]]), [(k + a) * z[0] - (k - a), (k + a) * z[1]]); // Tustin
      return { Hc, Hz, Ht, ny: 1 / (2 * T) }; };
    mag.draw = (P) => { P.axes({ xl: 'f [Hz]', yl: 'dB' }); const ny = 500 / s.T; P.fn((f) => db(cabs(resp(f).Hc)), C.bone, 2.5, null, 500); P.fn((f) => (f < ny ? db(cabs(resp(f).Hz)) : NaN), C.warn, 2, [6, 3], 500); P.fn((f) => (f < ny ? db(cabs(resp(f).Ht)) : NaN), C.lime, 2, [2, 3], 500); P.line([ny, ny], [-40, 5], C.bad, 1, [3, 3]); read.innerHTML = `f<sub>c</sub> = ${s.fc} Hz · T = ${s.T} ms · Nyquist <b>${(ny).toFixed(1)} Hz</b> (red) · white continuous, amber ZOH, lime Tustin. Errors grow as f approaches Nyquist.`; };
    pha.draw = (P) => { P.axes({ yl: 'phase °' }); const ny = 500 / s.T; P.fn((f) => carg(resp(f).Hc) * 180 / Math.PI, C.bone, 2.5, null, 500); P.fn((f) => (f < ny ? carg(resp(f).Hz) * 180 / Math.PI : NaN), C.warn, 2, [6, 3], 500); P.fn((f) => (f < ny ? carg(resp(f).Ht) * 180 / Math.PI : NaN), C.lime, 2, [2, 3], 500); };
    const r = () => { mag.redraw(); pha.redraw(); };
    ctrls.append(slider('Sample time T', { min: 1, max: 40, step: 1, value: s.T, fmt: (v) => v + ' ms' }, (v) => { s.T = v; r(); }), slider('Corner frequency', { min: 1, max: 30, step: 1, value: s.fc, fmt: (v) => v + ' Hz' }, (v) => { s.fc = v; r(); }));
    r(); return;
  }
  if (kind === 'opamp') { // non-inverting amplifier with single-pole op-amp
    const s = { G: 10, gbw: 1 }; // MHz
    const { read, ctrls, mag, pha } = bodeFrame(el, 'Non-inverting amplifier', { f: [10, 1e7], db: [-10, 110], ph: [-95, 5] });
    const A0 = 1e5; const A = (f) => { const fp = s.gbw * 1e6 / A0; return cdiv([A0, 0], [1, f / fp]); };
    const Cl = (f) => { const a = A(f); return cdiv(a, [1 + a[0] / s.G, a[1] / s.G]); };
    mag.draw = (P) => { P.axes({ xl: 'f [Hz]', yl: 'dB' }); P.fn((f) => db(cabs(A(f))), C.dim, 1.5, [4, 4]); P.fn((f) => db(cabs(Cl(f))), C.lime, 2.5); const bw = s.gbw * 1e6 / s.G; P.line([bw, bw], [-10, 110], C.warn, 1, [3, 3]); read.innerHTML = `closed-loop gain <b>${s.G}</b> (${db(s.G).toFixed(1)} dB) · GBW ${s.gbw} MHz · bandwidth ≈ GBW/G = <b>${f3(bw, 0)} Hz</b> · dashed: open-loop gain A(f)`; };
    pha.draw = (P) => { P.axes({ yl: 'phase °' }); P.fn((f) => carg(Cl(f)) * 180 / Math.PI, C.signal, 2); };
    const r = () => { mag.redraw(); pha.redraw(); };
    ctrls.append(slider('Gain 1 + Rf/Rg', { min: 1, max: 1000, step: 1, value: s.G }, (v) => { s.G = v; r(); }), slider('Gain-bandwidth', { min: 0.1, max: 10, step: 0.1, value: s.gbw, fmt: (v) => v.toFixed(1) + ' MHz' }, (v) => { s.gbw = v; r(); }));
    r();
  }
};

W.alias = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { f: 9, fs: 10 };
  const p = new Plot(body, { aspect: 0.5, maxH: 300, x: [0, 1], y: [-1.3, 1.3], label: 'A sinusoid, its samples and the alias they imply' });
  const alias = () => { const r = ((s.f % s.fs) + s.fs) % s.fs; return Math.min(r, s.fs - r); };
  p.draw = (P) => {
    P.axes({ xl: 't [s]' }); P.fn((t) => Math.cos(TAU * s.f * t), C.dim, 1.2, null, 1500);
    const fa = alias(); const r = ((s.f % s.fs) + s.fs) % s.fs; const sign = r <= s.fs / 2 ? 1 : -1;
    P.fn((t) => Math.cos(TAU * fa * t * sign), C.warn, 2, [6, 4], 600);
    for (let k = 0; k * (1 / s.fs) <= 1 + 1e-9; k++) { const t = k / s.fs; P.line([t, t], [0, Math.cos(TAU * s.f * t)], C.lime, 1.5); P.dot(t, Math.cos(TAU * s.f * t), C.lime, 4); }
    read.innerHTML = `signal ${s.f} Hz sampled at ${s.fs} Hz (Nyquist ${s.fs / 2} Hz) · samples look like <b>${fa.toFixed(2)} Hz</b>${s.f > s.fs / 2 ? ' · <b style="color:#ff6b5b">aliased</b>' : ' · faithful'}`;
    el.dataset.alias = fa.toFixed(3);
  };
  ctrls.append(slider('Signal frequency', { min: 0, max: 60, step: 0.5, value: s.f, fmt: (v) => v + ' Hz' }, (v) => { s.f = v; p.redraw(); }), slider('Sample rate', { min: 2, max: 100, step: 1, value: s.fs, fmt: (v) => v + ' Hz' }, (v) => { s.fs = v; p.redraw(); }));
  p.redraw();
};

W.zplane = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { r: 0.9, th: 30 };
  const zp = new Plot(body, { aspect: 0.6, maxH: 300, x: [-1.5, 1.5], y: [-1.3, 1.3], equal: true, label: 'Pole pair in the z-plane with the unit circle' });
  const ir = new Plot(body, { aspect: 0.4, maxH: 220, x: [0, 40], y: [-3, 3], label: 'Impulse response of the difference equation' });
  const resp = () => { const a1 = 2 * s.r * Math.cos(s.th * Math.PI / 180), a2 = -s.r * s.r; const y = []; for (let k = 0; k <= 40; k++) y.push((k === 0 ? 1 : 0) + a1 * (y[k - 1] || 0) + a2 * (y[k - 2] || 0)); return { y, a1, a2 }; };
  zp.draw = (P) => { P.axes(); const xs = [], ys = []; for (let i = 0; i <= 120; i++) { xs.push(Math.cos(TAU * i / 120)); ys.push(Math.sin(TAU * i / 120)); } P.line(xs, ys, C.fog, 1.2); const th = s.th * Math.PI / 180; for (const sg of [1, -1]) P.text('×', s.r * Math.cos(th), sg * s.r * Math.sin(th) - 0.05, s.r < 1 ? C.lime : C.bad, 'center'); const { a1, a2 } = resp(); read.innerHTML = `poles r = <b>${s.r.toFixed(3)}</b>, θ = <b>${s.th}°</b> · y[k] = ${a1.toFixed(3)}·y[k−1] ${a2 < 0 ? '−' : '+'} ${Math.abs(a2).toFixed(3)}·y[k−2] + u[k] · ${s.r < 1 ? 'inside the unit circle: <b>stable</b>' : s.r === 1 ? 'on the circle: <b>marginal</b>' : '<b style="color:#ff6b5b">outside: unstable</b>'} · oscillates every ${(360 / s.th).toFixed(1)} samples`; };
  ir.draw = (P) => { P.axes({ xl: 'k' }); const { y } = resp(); y.forEach((v, k) => { const c = Math.max(-3, Math.min(3, v)); P.line([k, k], [0, c], C.lime, 1.5); P.dot(k, c, C.lime, 2.5); }); };
  const r = () => { zp.redraw(); ir.redraw(); };
  ctrls.append(slider('Pole radius r', { min: 0, max: 1.1, step: 0.01, value: s.r, fmt: (v) => v.toFixed(2) }, (v) => { s.r = v; r(); }), slider('Pole angle θ', { min: 0, max: 180, step: 1, value: s.th, fmt: (v) => v + '°' }, (v) => { s.th = v; r(); }));
  r();
};

W.spectrum = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { rpm: 3000, noise: 0.3 }; const fs = 2000, N = 2048;
  const p = new Plot(body, { aspect: 0.5, maxH: 300, x: [0, 1000], y: [0, 1.1], label: 'Amplitude spectrum of a motor vibration signal' });
  p.draw = (P) => {
    P.axes({ xl: 'f [Hz]', yl: 'amplitude' }); const r = mulberry(7), f1 = s.rpm / 60; const re = new Float64Array(N), im = new Float64Array(N);
    for (let n = 0; n < N; n++) { const t = n / fs; re[n] = 1.0 * Math.sin(TAU * f1 * t) + 0.4 * Math.sin(TAU * 2 * f1 * t + 1) + 0.25 * Math.sin(TAU * 5 * f1 * t) + s.noise * randn(r); }
    const win = (n) => 0.5 - 0.5 * Math.cos(TAU * n / N); for (let n = 0; n < N; n++) re[n] *= win(n) * 2; fft(re, im);
    const xs = [], ys = []; for (let k = 0; k <= N / 2; k++) { xs.push(k * fs / N); ys.push(2 * Math.hypot(re[k], im[k]) / N); } P.line(xs, ys, C.lime, 1.5);
    for (const [m, c] of [[1, '1×'], [2, '2×'], [5, '5×']]) if (m * f1 < 1000) P.text(c, m * f1, 1.02, C.fog, 'center');
    read.innerHTML = `shaft ${s.rpm} rpm = <b>${f1.toFixed(1)} Hz</b> · peaks at 1×, 2× and 5× (a 5-blade fan) · fs = ${fs} Hz, N = ${N}, Hann window, resolution ${(fs / N).toFixed(2)} Hz`;
  };
  ctrls.append(slider('Motor speed', { min: 600, max: 9000, step: 60, value: s.rpm, fmt: (v) => v + ' rpm' }, (v) => { s.rpm = v; p.redraw(); }), slider('Noise σ', { min: 0, max: 2, step: 0.05, value: s.noise, fmt: (v) => v.toFixed(2) }, (v) => { s.noise = v; p.redraw(); }));
  p.redraw();
};

W.convolve = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { t: 1.5, tau: 0.5 };
  const u = (t) => (t >= 0 && t < 1 ? 1 : 0), hh = (t) => (t >= 0 ? Math.exp(-t / s.tau) / s.tau : 0);
  const y = (t) => (t <= 0 ? 0 : t < 1 ? 1 - Math.exp(-t / s.tau) : (1 - Math.exp(-1 / s.tau)) * Math.exp(-(t - 1) / s.tau));
  const a = new Plot(body, { aspect: 0.4, maxH: 220, x: [-1, 4], y: [-0.1, 2.2], label: 'Input and the flipped, shifted impulse response' });
  const b = new Plot(body, { aspect: 0.32, maxH: 180, x: [-1, 4], y: [-0.1, 1.1], label: 'Output so far' });
  a.draw = (P) => { P.axes({ xl: 'τ [s]' }); const xs = linspace(-1, 4, 600); P.poly([[Math.max(0, s.t - 6), 0], ...xs.filter((x) => x >= 0 && x <= Math.min(1, s.t)).map((x) => [x, u(x) * hh(s.t - x)]), [Math.min(1, s.t), 0]], '#c6ff1a33'); P.fn(u, C.bone, 2, null, 600); P.fn((x) => hh(s.t - x), C.signal, 2, null, 600); P.line([s.t, s.t], [-0.1, 2.2], C.fog, 1, [3, 4]); };
  b.draw = (P) => { P.axes({ xl: 't [s]' }); const xs = linspace(-1, s.t, 300); P.line(xs, xs.map(y), C.lime, 2.5); P.dot(s.t, y(s.t), C.lime, 5); };
  const r = () => { a.redraw(); b.redraw(); read.innerHTML = `y(t) = ∫ u(τ) h(t − τ) dτ = shaded area = <b>${y(s.t).toFixed(4)}</b> at t = ${s.t.toFixed(2)} s · h(t) = e<sup>−t/τ</sup>/τ with τ = ${s.tau} s`; };
  ctrls.append(slider('Time t', { min: -0.5, max: 4, step: 0.01, value: s.t, fmt: (v) => v.toFixed(2) + ' s' }, (v) => { s.t = v; r(); }), slider('Time constant τ', { min: 0.1, max: 1.5, step: 0.05, value: s.tau, fmt: (v) => v.toFixed(2) + ' s' }, (v) => { s.tau = v; r(); }));
  r();
};

// ---------- Phase 04 ----------
W.clt = (el, args) => {
  const { body, read, ctrls } = frame(el);
  const s = { n: args.n || 1, m: 3 };
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [-4, 4], y: [0, 0.6], label: 'Histogram of standardised sums against the Gaussian' });
  p.draw = (P) => {
    P.axes({ xl: 'standardised sum z' }); const M = 10 ** s.m, r = mulberry(11 + s.n), bins = new Float64Array(40), bw = 8 / 40;
    let m1 = 0, m2 = 0;
    for (let i = 0; i < M; i++) { let x = 0; for (let k = 0; k < s.n; k++) x += r(); const z = (x - s.n / 2) / Math.sqrt(s.n / 12); m1 += z; m2 += z * z; const b = Math.floor((z + 4) / bw); if (b >= 0 && b < 40) bins[b]++; }
    for (let b = 0; b < 40; b++) { const x0 = -4 + b * bw, hgt = bins[b] / (M * bw); P.poly([[x0, 0], [x0, hgt], [x0 + bw, hgt], [x0 + bw, 0]], '#c6ff1a33', '#c6ff1a99'); }
    P.fn((z) => Math.exp(-z * z / 2) / Math.sqrt(TAU), C.bone, 2);
    read.innerHTML = `sum of <b>${s.n}</b> uniform variable${s.n > 1 ? 's' : ''}, ${M.toLocaleString('en')} samples · sample mean <b>${(m1 / M).toFixed(3)}</b> · sample variance <b>${(m2 / M - (m1 / M) ** 2).toFixed(3)}</b> (theory 0 and 1)`;
  };
  ctrls.append(slider('Variables per sum N', { min: 1, max: 30, step: 1, value: s.n }, (v) => { s.n = v; p.redraw(); }), slider('Samples', { min: 2, max: 5, step: 1, value: s.m, fmt: (v) => (10 ** v).toLocaleString('en') }, (v) => { s.m = v; p.redraw(); }));
  p.redraw();
};

W.covariance = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { sx: 1.5, sy: 0.8, rho: 0.6 };
  const p = new Plot(body, { aspect: 0.75, maxH: 420, x: [-5, 5], y: [-4, 4], equal: true, label: 'Correlated samples with 1σ and 2σ covariance ellipses' });
  p.draw = (P) => {
    P.axes({ xl: 'x', yl: 'y' }); const r = mulberry(5); const c = s.rho * s.sx * s.sy; const S = [[s.sx * s.sx, c], [c, s.sy * s.sy]];
    const L11 = s.sx, L21 = c / L11, L22 = Math.sqrt(Math.max(1e-12, S[1][1] - L21 * L21)); let inside = 0; const N = 600;
    const det = S[0][0] * S[1][1] - c * c, inv = [[S[1][1] / det, -c / det], [-c / det, S[0][0] / det]];
    for (let i = 0; i < N; i++) { const a = randn(r), b = randn(r); const x = L11 * a, y = L21 * a + L22 * b; const d2 = x * (inv[0][0] * x + inv[0][1] * y) + y * (inv[1][0] * x + inv[1][1] * y); if (d2 <= 4) inside++; P.dot(x, y, d2 <= 4 ? '#6fd3ffaa' : '#ff6b5bcc', 2); }
    const tr = S[0][0] + S[1][1], disc = Math.sqrt((S[0][0] - S[1][1]) ** 2 / 4 + c * c), l1 = tr / 2 + disc, l2 = tr / 2 - disc, ang = 0.5 * Math.atan2(2 * c, S[0][0] - S[1][1]);
    for (const k of [1, 2]) { const xs = [], ys = []; for (let i = 0; i <= 120; i++) { const t = TAU * i / 120, u = k * Math.sqrt(l1) * Math.cos(t), v = k * Math.sqrt(l2) * Math.sin(t); xs.push(u * Math.cos(ang) - v * Math.sin(ang)); ys.push(u * Math.sin(ang) + v * Math.cos(ang)); } P.line(xs, ys, k === 1 ? C.lime : C.warn, 2); }
    read.innerHTML = `Σ = [${S[0][0].toFixed(2)} ${c.toFixed(2)}; ${c.toFixed(2)} ${S[1][1].toFixed(2)}] · eigenvalues ${l1.toFixed(3)}, ${l2.toFixed(3)} · major axis at <b>${(ang * 180 / Math.PI).toFixed(1)}°</b> · inside 2σ: <b>${(100 * inside / N).toFixed(1)} %</b> (theory 86.5 %)`;
  };
  ctrls.append(slider('σx', { min: 0.2, max: 2.5, step: 0.05, value: s.sx, fmt: (v) => v.toFixed(2) }, (v) => { s.sx = v; p.redraw(); }), slider('σy', { min: 0.2, max: 2.5, step: 0.05, value: s.sy, fmt: (v) => v.toFixed(2) }, (v) => { s.sy = v; p.redraw(); }), slider('Correlation ρ', { min: -0.95, max: 0.95, step: 0.05, value: s.rho, fmt: (v) => v.toFixed(2) }, (v) => { s.rho = v; p.redraw(); }));
  p.redraw();
};

W.bayes = (el) => {
  const { body, read, ctrls } = frame(el);
  const N = 20, doors = new Set([2, 6, 13]); const pHit = 0.8, pFalse = 0.1;
  let bel = new Array(N).fill(1 / N), pos = 0, step = 0;
  const p = new Plot(body, { aspect: 0.5, maxH: 300, x: [-0.5, N - 0.5], y: [-0.25, 1], label: 'Belief over 20 corridor cells' });
  p.draw = (P) => {
    P.axes({ xl: 'cell' }); const mx = Math.max(...bel);
    for (let i = 0; i < N; i++) { if (doors.has(i)) P.poly([[i - 0.45, -0.22], [i - 0.45, -0.06], [i + 0.45, -0.06], [i + 0.45, -0.22]], '#6fd3ff55'); P.poly([[i - 0.4, 0], [i - 0.4, bel[i]], [i + 0.4, bel[i]], [i + 0.4, 0]], bel[i] === mx ? '#c6ff1acc' : '#c6ff1a55'); }
    P.text('▲ robot', pos, -0.17, C.warn, 'center');
    const sum = bel.reduce((a, b) => a + b, 0); const best = bel.indexOf(mx);
    read.innerHTML = `step ${step} · robot in cell <b>${pos}</b> · belief peak at cell <b>${best}</b> (p = ${mx.toFixed(3)}) · sum = ${sum.toFixed(6)} · blue = doors`;
    el.dataset.peak = String(best);
  };
  const sense = () => { const z = doors.has(pos); bel = bel.map((b, i) => b * (doors.has(i) === z ? (z ? pHit : 1 - pFalse) : (z ? pFalse : 1 - pHit))); const s = bel.reduce((a, b) => a + b, 0); bel = bel.map((b) => b / s); step++; p.redraw(); };
  const move = () => { pos = (pos + 1) % N; const nb = new Array(N).fill(0); for (let i = 0; i < N; i++) { nb[(i + 1) % N] += 0.8 * bel[i]; nb[i] += 0.1 * bel[i]; nb[(i + 2) % N] += 0.1 * bel[i]; } bel = nb; step++; p.redraw(); };
  const mk = (t, f, id) => { const b = h('button', { class: 'btn btn-small', type: 'button', 'data-testid': id }, t); b.addEventListener('click', f); return b; };
  ctrls.append(h('div', { class: 'hero-actions' }, mk('Sense', sense, 'bayes-sense'), mk('Move 1 cell', move, 'bayes-move'), mk('Reset', () => { bel = new Array(N).fill(1 / N); pos = 0; step = 0; p.redraw(); }, 'bayes-reset')));
  p.redraw();
};

W.allan = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { arw: 0.3, rrw: 40 }; const fs = 100, N = 1 << 16;
  const p = new Plot(body, { aspect: 0.6, maxH: 360, x: [0.01, 300], y: [1e-3, 10], logx: true, logy: true, label: 'Allan deviation of a simulated gyro' });
  p.draw = (P) => {
    P.axes({ xl: 'τ [s]', yl: 'σ(τ) [°/s]' }); const r = mulberry(3), dt = 1 / fs; const w = new Float64Array(N); let b = 0;
    const N_ = s.arw / 60, K = s.rrw / 216000; // °/√h → °/√s ; °/h/√h → °/s/√s
    for (let i = 0; i < N; i++) { b += K * Math.sqrt(dt) * randn(r); w[i] = (N_ / Math.sqrt(dt)) * randn(r) + b; }
    const th = new Float64Array(N + 1); for (let i = 0; i < N; i++) th[i + 1] = th[i] + w[i] * dt;
    const xs = [], ys = []; for (let m = 1; m <= N / 8; m = Math.ceil(m * 1.4)) { const tau = m * dt; let acc = 0, cnt = 0; for (let k = 0; k + 2 * m <= N; k += Math.max(1, m >> 2)) { const d = th[k + 2 * m] - 2 * th[k + m] + th[k]; acc += d * d; cnt++; } xs.push(tau); ys.push(Math.sqrt(acc / (2 * tau * tau * cnt))); }
    P.fn((t) => N_ / Math.sqrt(t), C.dim, 1, [4, 4]); P.fn((t) => K * Math.sqrt(t / 3), C.dim, 1, [4, 4]); P.line(xs, ys, C.lime, 2.5);
    P.line([1, 1], [1e-3, 10], C.fog, 1, [2, 4]);
    read.innerHTML = `ARW ${s.arw.toFixed(2)} °/√h → σ(1 s) = N = <b>${N_.toExponential(2)} °/s</b> on the −½ slope · rate random walk ${s.rrw} °/h/√h → +½ slope · ${N.toLocaleString('en')} samples at ${fs} Hz`;
  };
  ctrls.append(slider('Angle random walk', { min: 0.05, max: 2, step: 0.05, value: s.arw, fmt: (v) => v.toFixed(2) + ' °/√h' }, (v) => { s.arw = v; p.redraw(); }), slider('Rate random walk', { min: 0, max: 200, step: 5, value: s.rrw, fmt: (v) => v + ' °/h/√h' }, (v) => { s.rrw = v; p.redraw(); }));
  p.redraw();
};

W.tolstack = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { tol: 5, m: 4 };
  const p = new Plot(body, { aspect: 0.5, maxH: 300, x: [2.2, 2.8], y: [0, 1.1], label: 'Monte Carlo histogram of a divider output' });
  p.draw = (P) => {
    P.axes({ xl: 'Vout [V]' }); const M = 10 ** s.m, r = mulberry(17), t = s.tol / 100, nb = 60, lo = 2.2, hi = 2.8, bw = (hi - lo) / nb, bins = new Float64Array(nb); let mn = 9, mx = 0, out = 0;
    const wc = [5 * 10 * (1 - t) / (10 * (1 - t) + 10 * (1 + t)), 5 * 10 * (1 + t) / (10 * (1 + t) + 10 * (1 - t))];
    for (let i = 0; i < M; i++) { const r1 = 10 * (1 + t * (2 * r() - 1)), r2 = 10 * (1 + t * (2 * r() - 1)), v = 5 * r2 / (r1 + r2); mn = Math.min(mn, v); mx = Math.max(mx, v); if (Math.abs(v - 2.5) > 0.05) out++; const b = Math.floor((v - lo) / bw); if (b >= 0 && b < nb) bins[b]++; }
    const top = Math.max(...bins); for (let b = 0; b < nb; b++) { const x0 = lo + b * bw, hgt = bins[b] / top; P.poly([[x0, 0], [x0, hgt], [x0 + bw, hgt], [x0 + bw, 0]], '#c6ff1a33', '#c6ff1a88'); }
    for (const v of wc) P.line([v, v], [0, 1.1], C.bad, 1.5, [4, 3]); for (const v of [2.45, 2.55]) P.line([v, v], [0, 1.1], C.signal, 1.5);
    read.innerHTML = `5 V, two 10 kΩ ±${s.tol} % (uniform) · ${M.toLocaleString('en')} trials · range ${mn.toFixed(4)}–${mx.toFixed(4)} V · worst case (red) ${wc[0].toFixed(4)}–${wc[1].toFixed(4)} V · outside ±50 mV spec (blue): <b>${(100 * out / M).toFixed(2)} %</b>`;
  };
  ctrls.append(slider('Resistor tolerance', { min: 0.1, max: 10, step: 0.1, value: s.tol, fmt: (v) => '±' + v.toFixed(1) + ' %' }, (v) => { s.tol = v; p.redraw(); }), slider('Trials', { min: 2, max: 5, step: 1, value: s.m, fmt: (v) => (10 ** v).toLocaleString('en') }, (v) => { s.m = v; p.redraw(); }));
  p.redraw();
};

W.noise = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { tau: 5 }; const N = 2000, dt = 0.01;
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0, N * dt], y: [-4, 4], label: 'White noise, a random walk and a Gauss-Markov process' });
  p.draw = (P) => {
    P.axes({ xl: 't [s]' }); const r = mulberry(21), xs = [], w = [], rw = [], gm = []; let a = 0, g = 0; const phi = Math.exp(-dt / s.tau), q = Math.sqrt(1 - phi * phi);
    for (let i = 0; i < N; i++) { const e = randn(r); xs.push(i * dt); w.push(e * 0.5); a += e * Math.sqrt(dt); rw.push(a); g = phi * g + q * randn(r); gm.push(g * 1.5); }
    P.line(xs, w, '#767b6e', 1); P.line(xs, rw, C.warn, 2); P.line(xs, gm, C.lime, 2);
    read.innerHTML = `grey: white noise · amber: random walk (variance grows ∝ t, final ${rw[N - 1].toFixed(2)}) · lime: Gauss-Markov with τ = <b>${s.tau} s</b>, φ = e<sup>−Δt/τ</sup> = ${phi.toFixed(5)}, stationary`;
  };
  ctrls.append(slider('Correlation time τ', { min: 0.05, max: 50, step: 0.05, value: s.tau, fmt: (v) => v.toFixed(2) + ' s' }, (v) => { s.tau = v; p.redraw(); }));
  p.redraw();
};

W.threshold = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { thr: 1.0, bias: 1.5 };
  const p = new Plot(body, { aspect: 0.5, maxH: 300, x: [-4, 6], y: [0, 0.45], label: 'Good and biased batches against an acceptance threshold' });
  const phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
  p.draw = (P) => {
    P.axes({ xl: 'measured error / σ' }); const g = (x, m) => Math.exp(-((x - m) ** 2) / 2) / Math.sqrt(TAU);
    const xs = linspace(s.thr, 6, 100); P.poly([[s.thr, 0], ...xs.map((x) => [x, g(x, 0)]), [6, 0]], '#ff6b5b44'); const xb = linspace(-4, s.thr, 100); P.poly([[-4, 0], ...xb.map((x) => [x, g(x, s.bias)]), [s.thr, 0]], '#ffb54744');
    P.fn((x) => g(x, 0), C.lime, 2); P.fn((x) => g(x, s.bias), C.warn, 2); P.line([s.thr, s.thr], [0, 0.45], C.bone, 1.5, [4, 3]);
    read.innerHTML = `reject above ${s.thr.toFixed(2)}σ · false reject of good parts <b>${(100 * (1 - phi(s.thr))).toFixed(2)} %</b> (red) · false accept of parts biased by ${s.bias.toFixed(1)}σ <b>${(100 * phi(s.thr - s.bias)).toFixed(2)} %</b> (amber)`;
  };
  ctrls.append(slider('Threshold', { min: -1, max: 4, step: 0.05, value: s.thr, fmt: (v) => v.toFixed(2) + 'σ' }, (v) => { s.thr = v; p.redraw(); }), slider('Bias of bad batch', { min: 0, max: 5, step: 0.1, value: s.bias, fmt: (v) => v.toFixed(1) + 'σ' }, (v) => { s.bias = v; p.redraw(); }));
  p.redraw();
};
function erf(x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }

W.particles = (el) => {
  const { body, read, ctrls } = frame(el);
  const N = 60; let ps = [], ws = [], it = 0; const r = mulberry(9);
  const like = (x) => Math.exp(-((x - 2) ** 2) / (2 * 0.3 ** 2)) + 0.6 * Math.exp(-((x + 1.5) ** 2) / (2 * 0.4 ** 2));
  const reset = () => { ps = Array.from({ length: N }, () => -4 + 8 * r()); ws = ps.map(like); it = 0; };
  const p = new Plot(body, { aspect: 0.5, maxH: 300, x: [-4, 4], y: [0, 1.7], label: 'Weighted particles before and after systematic resampling' });
  p.draw = (P) => {
    P.axes({ xl: 'x' }); P.fn(like, C.dim, 1.5, [4, 4]); const wmax = Math.max(...ws);
    ps.forEach((x, i) => { P.line([x, x], [0, 0.15 + 1.2 * ws[i] / wmax], '#6fd3ff88', 1.5); P.dot(x, 0.15 + 1.2 * ws[i] / wmax, C.lime, 3); });
    const sw = ws.reduce((a, b) => a + b, 0); const ess = sw * sw / ws.reduce((a, b) => a + b * b, 0);
    read.innerHTML = `${N} particles · resampled ${it} time${it === 1 ? '' : 's'} · effective sample size <b>${ess.toFixed(1)}</b> · dashed: likelihood`;
  };
  const resample = () => { const sw = ws.reduce((a, b) => a + b, 0); const c = []; let acc = 0; ws.forEach((w) => c.push((acc += w / sw))); const u0 = r() / N; const out = []; let j = 0; for (let i = 0; i < N; i++) { const u = u0 + i / N; while (j < N - 1 && c[j] < u) j++; out.push(ps[j] + 0.05 * randn(r)); } ps = out; ws = ps.map(like); it++; p.redraw(); };
  const mk = (t, f, id) => { const b = h('button', { class: 'btn btn-small', type: 'button', 'data-testid': id }, t); b.addEventListener('click', f); return b; };
  ctrls.append(h('div', { class: 'hero-actions' }, mk('Resample', resample, 'pf-resample'), mk('Reset', () => { reset(); p.redraw(); }, 'pf-reset')));
  reset(); p.redraw();
};

// ---------- Phase 05 ----------
W.rc = (el, args) => {
  const rl = args.kind === 'rl';
  const { body, read, ctrls } = frame(el);
  const s = rl ? { R: 10, L: 50 } : { R: 10, C: 10 }; // Ω, mH  |  kΩ, µF
  const p = new Plot(body, { aspect: 0.5, maxH: 300, x: [0, 1], y: [-0.05, 1.1], label: rl ? 'RL current after the switch closes' : 'RC capacitor voltage charging then discharging' });
  p.draw = (P) => {
    const tau = rl ? s.L / 1000 / s.R : s.R * 1e3 * s.C * 1e-6, T = 10 * tau; P.setRange([0, T * 1000], [-0.05, 1.1]); P.axes({ xl: 't [ms]', yl: rl ? 'i / (V/R)' : 'v / V' });
    const f = (tm) => { const t = tm / 1000; return t < T / 2 ? 1 - Math.exp(-t / tau) : (1 - Math.exp(-T / 2 / tau)) * Math.exp(-(t - T / 2) / tau); };
    P.fn(f, C.lime, 2.5, null, 500); P.line([tau * 1000, tau * 1000], [0, 1.1], C.warn, 1, [3, 3]); P.dot(tau * 1000, 1 - Math.exp(-1), C.warn);
    read.innerHTML = `τ = ${rl ? 'L/R' : 'RC'} = <b>${f3(tau * 1000, 3)} ms</b> · 63.2 % at t = τ · 99.3 % at 5τ = ${f3(5 * tau * 1000, 2)} ms · switch flips at ${f3(T / 2 * 1000, 2)} ms`;
  };
  if (rl) ctrls.append(slider('R', { min: 1, max: 100, step: 1, value: s.R, fmt: (v) => v + ' Ω' }, (v) => { s.R = v; p.redraw(); }), slider('L', { min: 1, max: 500, step: 1, value: s.L, fmt: (v) => v + ' mH' }, (v) => { s.L = v; p.redraw(); }));
  else ctrls.append(slider('R', { min: 1, max: 100, step: 1, value: s.R, fmt: (v) => v + ' kΩ' }, (v) => { s.R = v; p.redraw(); }), slider('C', { min: 0.1, max: 100, step: 0.1, value: s.C, fmt: (v) => v.toFixed(1) + ' µF' }, (v) => { s.C = v; p.redraw(); }));
  p.redraw();
};

W.diode = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { V: 5, R: 1000 }; const Is = 1e-14, nVt = 0.02585;
  const p = new Plot(body, { aspect: 0.6, maxH: 340, x: [0, 1.2], y: [0, 10], label: 'Diode I-V curve and the resistor load line' });
  const solve = () => { let v = 0.6; for (let k = 0; k < 60; k++) { const id = Is * (Math.exp(v / nVt) - 1), g = Is / nVt * Math.exp(v / nVt), f = (s.V - v) / s.R - id, df = -1 / s.R - g; const dv = -f / df; v += Math.max(-0.1, Math.min(0.1, dv)); if (Math.abs(dv) < 1e-12) break; } return v; };
  p.draw = (P) => {
    const imax = s.V / s.R * 1000 * 1.1; P.setRange([0, Math.max(1.2, s.V * 1.05)], [0, imax]); P.axes({ xl: 'V [V]', yl: 'I [mA]' });
    P.fn((v) => Is * (Math.exp(v / nVt) - 1) * 1000, C.signal, 2, null, 600); P.fn((v) => (s.V - v) / s.R * 1000, C.warn, 2);
    const v = solve(), i = (s.V - v) / s.R; P.dot(v, i * 1000, C.lime, 6);
    read.innerHTML = `operating point <b>V<sub>D</sub> = ${v.toFixed(4)} V</b>, <b>I = ${(i * 1000).toFixed(3)} mA</b> (Newton) · I<sub>s</sub> = 1e−14 A, nV<sub>T</sub> = 25.85 mV`;
  };
  ctrls.append(slider('Supply V', { min: 1, max: 12, step: 0.1, value: s.V, fmt: (v) => v.toFixed(1) + ' V' }, (v) => { s.V = v; p.redraw(); }), slider('Resistor R', { min: 100, max: 10000, step: 10, value: s.R, fmt: (v) => v + ' Ω' }, (v) => { s.R = v; p.redraw(); }));
  p.redraw();
};

W.schmitt = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { hyst: 0, noise: 0.15 };
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0, 2], y: [-1.6, 2.6], label: 'Noisy input and comparator output with hysteresis' });
  p.draw = (P) => {
    P.axes({ xl: 't [s]' }); const r = mulberry(4), N = 2000, xs = [], vin = [], vo = []; let out = 0, edges = 0;
    for (let i = 0; i < N; i++) { const t = (2 * i) / N; const v = Math.sin(TAU * 1.5 * t) + s.noise * randn(r); xs.push(t); vin.push(v); const hi = s.hyst / 2, lo = -s.hyst / 2; const nout = out ? (v < lo ? 0 : 1) : (v > hi ? 1 : 0); if (nout !== out) edges++; out = nout; vo.push(1.4 + out); }
    P.line(xs, vin, C.signal, 1); P.line(xs, vo, C.lime, 2); if (s.hyst > 0) { P.line([0, 2], [s.hyst / 2, s.hyst / 2], C.warn, 1, [4, 3]); P.line([0, 2], [-s.hyst / 2, -s.hyst / 2], C.warn, 1, [4, 3]); }
    read.innerHTML = `hysteresis band ±${(s.hyst / 2).toFixed(2)} · output edges <b>${edges}</b> · true zero crossings of the clean sine: <b>6</b>`;
    el.dataset.edges = String(edges);
  };
  ctrls.append(slider('Hysteresis width', { min: 0, max: 1.5, step: 0.05, value: s.hyst, fmt: (v) => v.toFixed(2) }, (v) => { s.hyst = v; p.redraw(); }), slider('Noise σ', { min: 0, max: 0.5, step: 0.01, value: s.noise, fmt: (v) => v.toFixed(2) }, (v) => { s.noise = v; p.redraw(); }));
  p.redraw();
};

W.bridge = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { mode: 'quarter', eps: 1000 }; const GF = 2, Vex = 5;
  const p = new Plot(body, { aspect: 0.5, maxH: 300, x: [0, 5000], y: [0, 26], label: 'Bridge output against strain' });
  const out = (e, m) => { const x = GF * e * 1e-6; if (m === 'quarter') return Vex * ((1 + x) / (2 + x) - 0.5); if (m === 'half') return Vex * x / 2; return Vex * x; };
  p.draw = (P) => {
    P.axes({ xl: 'strain [µε]', yl: 'mV' }); P.fn((e) => out(e, s.mode) * 1000, C.lime, 2.5); const lin = { quarter: Vex * GF / 4, half: Vex * GF / 2, full: Vex * GF }[s.mode]; P.fn((e) => lin * e * 1e-6 * 1000, C.dim, 1, [4, 4]);
    const v = out(s.eps, s.mode), vl = lin * s.eps * 1e-6; P.dot(s.eps, v * 1000, C.warn, 5);
    read.innerHTML = `${s.mode} bridge, GF = 2, 5 V excitation · ${s.eps} µε → <b>${(v * 1000).toFixed(4)} mV</b> · linear estimate ${(vl * 1000).toFixed(4)} mV · nonlinearity <b>${(100 * (vl - v) / vl).toFixed(3)} %</b>`;
  };
  ctrls.append(select('Configuration', [['quarter', 'Quarter bridge (1 active gauge)'], ['half', 'Half bridge (2 gauges, bending)'], ['full', 'Full bridge (4 gauges)']], 'quarter', (v) => { s.mode = v; p.redraw(); }, 'bridge-mode'), slider('Strain', { min: 0, max: 5000, step: 50, value: s.eps, fmt: (v) => v + ' µε' }, (v) => { s.eps = v; p.redraw(); }));
  p.redraw();
};

W.divider = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { R1: 10, R2: 10, RL: 100 }; const V = 5;
  const p = new Plot(body, { aspect: 0.45, maxH: 260, x: [0.1, 1000], y: [0, 5.2], logx: true, label: 'Divider output against load resistance' });
  p.draw = (P) => {
    P.axes({ xl: 'R_load [kΩ]', yl: 'Vout [V]' }); const vo = (RL) => { const par = s.R2 * RL / (s.R2 + RL); return V * par / (s.R1 + par); }; const vth = V * s.R2 / (s.R1 + s.R2), rth = s.R1 * s.R2 / (s.R1 + s.R2);
    P.line([0.1, 1000], [vth, vth], C.dim, 1, [4, 4]); P.fn(vo, C.lime, 2.5); P.dot(s.RL, vo(s.RL), C.warn, 5);
    read.innerHTML = `unloaded V<sub>th</sub> = <b>${vth.toFixed(3)} V</b> · R<sub>th</sub> = R1‖R2 = <b>${rth.toFixed(3)} kΩ</b> · with ${s.RL} kΩ load: <b>${vo(s.RL).toFixed(3)} V</b> (${(100 * (1 - vo(s.RL) / vth)).toFixed(2)} % low)`;
  };
  ctrls.append(slider('R1', { min: 0.1, max: 100, step: 0.1, value: s.R1, fmt: (v) => v.toFixed(1) + ' kΩ' }, (v) => { s.R1 = v; p.redraw(); }), slider('R2', { min: 0.1, max: 100, step: 0.1, value: s.R2, fmt: (v) => v.toFixed(1) + ' kΩ' }, (v) => { s.R2 = v; p.redraw(); }), slider('Load', { min: 0.1, max: 1000, step: 0.1, value: s.RL, fmt: (v) => v.toFixed(1) + ' kΩ' }, (v) => { s.RL = v; p.redraw(); }));
  p.redraw();
};

W.rectifier = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { C: 1000, I: 0.5 }; const Vp = 12 * Math.SQRT2 - 1.4, f = 50;
  const p = new Plot(body, { aspect: 0.5, maxH: 300, x: [0, 60], y: [0, 18], label: 'Full-wave rectified sine with a smoothing capacitor' });
  p.draw = (P) => {
    P.axes({ xl: 't [ms]', yl: 'V' }); const dt = 1e-5, xs = [], vr = [], vc = []; let v = Vp, mn = 99, mx = 0;
    for (let t = 0; t <= 0.06; t += dt) { const src = Math.max(0, Math.abs((12 * Math.SQRT2) * Math.sin(TAU * f * t)) - 1.4); v -= s.I / (s.C * 1e-6) * dt; if (src > v) v = src; xs.push(t * 1000); vr.push(src); vc.push(v); if (t > 0.02) { mn = Math.min(mn, v); mx = Math.max(mx, v); } }
    P.line(xs, vr, '#6fd3ff88', 1.2); P.line(xs, vc, C.lime, 2.2);
    read.innerHTML = `12 V<sub>rms</sub> bridge, 50 Hz, ${s.C} µF, ${s.I.toFixed(2)} A load · simulated ripple <b>${(mx - mn).toFixed(3)} V</b> · estimate I/(2fC) = <b>${(s.I / (2 * f * s.C * 1e-6)).toFixed(3)} V</b>`;
  };
  ctrls.append(slider('Capacitance', { min: 100, max: 10000, step: 100, value: s.C, fmt: (v) => v + ' µF' }, (v) => { s.C = v; p.redraw(); }), slider('Load current', { min: 0.05, max: 2, step: 0.05, value: s.I, fmt: (v) => v.toFixed(2) + ' A' }, (v) => { s.I = v; p.redraw(); }));
  p.redraw();
};

export default W;
