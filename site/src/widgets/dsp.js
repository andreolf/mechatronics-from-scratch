// Widgets for Phase 08 (signal processing). Sliders, selects, toggles and buttons only.
import { Plot, frame, slider, select, toggle, h, C } from './plot.js';

const W = {};
const TAU = 2 * Math.PI;
function mulberry(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function randn(r) { const u = r() || 1e-9, v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); }
const btn = (t, f, id) => { const b = h('button', { class: 'btn btn-small', type: 'button', 'data-testid': id }, t); b.addEventListener('click', f); return b; };
const db = (x) => 20 * Math.log10(Math.max(x, 1e-12));

// ---------- helpers ----------
export function freqz(b, a, f) { // f in cycles/sample; returns [re, im]
  let br = 0, bi = 0, ar = 0, ai = 0;
  b.forEach((c, k) => { br += c * Math.cos(TAU * f * k); bi -= c * Math.sin(TAU * f * k); });
  a.forEach((c, k) => { ar += c * Math.cos(TAU * f * k); ai -= c * Math.sin(TAU * f * k); });
  const d = ar * ar + ai * ai; return [(br * ar + bi * ai) / d, (bi * ar - br * ai) / d];
}
export const mag = (b, a, f) => { const [r, i] = freqz(b, a, f); return Math.hypot(r, i); };
export function lfilter(b, a, x) { const y = new Float64Array(x.length); for (let n = 0; n < x.length; n++) { let v = 0; for (let k = 0; k < b.length; k++) if (n - k >= 0) v += b[k] * x[n - k]; for (let k = 1; k < a.length; k++) if (n - k >= 0) v -= a[k] * y[n - k]; y[n] = v / a[0]; } return y; }
export function fft(re, im) { const n = re.length; for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } } for (let len = 2; len <= n; len <<= 1) { const ang = -TAU / len; for (let i = 0; i < n; i += len) for (let k = 0; k < len / 2; k++) { const wr = Math.cos(ang * k), wi = Math.sin(ang * k); const ur = re[i + k], ui = im[i + k]; const vr = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi, vi = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr; re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi; } } }
function polyFromRoots(roots) { let p = [[1, 0]]; for (const [rr, ri] of roots) { const q = new Array(p.length + 1).fill(0).map(() => [0, 0]); for (let k = 0; k < p.length; k++) { q[k][0] += p[k][0]; q[k][1] += p[k][1]; q[k + 1][0] -= p[k][0] * rr - p[k][1] * ri; q[k + 1][1] -= p[k][0] * ri + p[k][1] * rr; } p = q; } return p.map((c) => c[0]); }
export function butter(n, fc, fs, prewarp = true) { // digital Butterworth low-pass by the bilinear transform
  const wc = prewarp ? 2 * fs * Math.tan(Math.PI * fc / fs) : TAU * fc; const zs = [];
  for (let k = 1; k <= n; k++) { const th = Math.PI * (2 * k + n - 1) / (2 * n); const pr = wc * Math.cos(th), pi = wc * Math.sin(th); const nr = 1 + pr / (2 * fs), ni = pi / (2 * fs), dr = 1 - pr / (2 * fs), di = -pi / (2 * fs); const d = dr * dr + di * di; zs.push([(nr * dr + ni * di) / d, (ni * dr - nr * di) / d]); }
  const a = polyFromRoots(zs); let b = polyFromRoots(zs.map(() => [-1, 0])); const g = a.reduce((s, v) => s + v, 0) / b.reduce((s, v) => s + v, 0); b = b.map((v) => v * g); return { b, a };
}
function winFn(kind, N) { const w = []; for (let n = 0; n < N; n++) { const x = n / (N - 1); w.push(kind === 'rect' ? 1 : kind === 'hann' ? 0.5 - 0.5 * Math.cos(TAU * x) : kind === 'hamming' ? 0.54 - 0.46 * Math.cos(TAU * x) : kind === 'blackman' ? 0.42 - 0.5 * Math.cos(TAU * x) + 0.08 * Math.cos(2 * TAU * x) : kind === 'flattop' ? 0.21557895 - 0.41663158 * Math.cos(TAU * x) + 0.277263158 * Math.cos(2 * TAU * x) - 0.083578947 * Math.cos(3 * TAU * x) + 0.006947368 * Math.cos(4 * TAU * x) : 1); } return w; }
function bessel0(x) { let s = 1, t = 1; for (let k = 1; k < 30; k++) { t *= (x / (2 * k)) ** 2; s += t; } return s; }

// p08-l01: LTI property tests
const SYSTEMS = {
  gain: { name: 'y[n] = 2x[n]', f: (x, n) => 2 * x[n] },
  avg: { name: 'y[n] = (x[n] + x[n−1])/2', f: (x, n) => (x[n] + (x[n - 1] || 0)) / 2 },
  square: { name: 'y[n] = x[n]²', f: (x, n) => x[n] ** 2 },
  offset: { name: 'y[n] = x[n] + 1', f: (x, n) => x[n] + 1 },
  ramp: { name: 'y[n] = n·x[n]', f: (x, n) => n * x[n] / 10 },
  future: { name: 'y[n] = x[n+1]', f: (x, n) => x[n + 1] || 0 },
};
W.ltitest = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { sys: 'avg' }; const N = 40;
  const p = new Plot(body, { aspect: 0.5, maxH: 280, x: [0, N], y: [-3, 5], label: 'Response to a shifted input (lime) against the shifted response (dashed)' });
  p.draw = (P) => {
    const S = SYSTEMS[s.sys]; const run = (x) => x.map((_, n) => S.f(x, n));
    const x1 = Array.from({ length: N }, (_, n) => (n >= 5 && n < 12 ? 1 : 0)), x2 = Array.from({ length: N }, (_, n) => Math.sin(n / 3) * (n > 3 ? 1 : 0));
    const ya = run(x1.map((v, n) => 2 * v + 3 * x2[n])), yb = run(x1).map((v, n) => 2 * v + 3 * run(x2)[n]);
    const lin = Math.max(...ya.map((v, n) => Math.abs(v - yb[n])));
    const sh = 8, xs = x1.map((_, n) => (n - sh >= 0 ? x1[n - sh] : 0)); const y1 = run(x1), ys = run(xs);
    const ti = Math.max(...ys.map((v, n) => (n >= sh ? Math.abs(v - y1[n - sh]) : 0)));
    const imp = Array.from({ length: N }, (_, n) => (n === 10 ? 1 : 0)); const yi = run(imp); const causal = yi.slice(0, 10).every((v) => Math.abs(v - (s.sys === 'offset' ? 1 : 0)) < 1e-12);
    P.axes({ xl: 'n' }); const ns = ys.map((_, n) => n); P.line(ns, ys, C.lime, 2); P.line(ns.slice(sh), y1.slice(0, N - sh), C.warn, 2, [5, 4]);
    const ok = (b) => (b ? '<b>yes</b>' : '<b style="color:#ff6b5b">no</b>');
    read.innerHTML = `${S.name} · linear ${ok(lin < 1e-9)} (superposition error ${lin.toFixed(2)}) · time-invariant ${ok(ti < 1e-9)} (shift error ${ti.toFixed(2)}) · causal ${ok(causal)}`;
  };
  ctrls.append(select('System', Object.entries(SYSTEMS).map(([k, v]) => [k, v.name]), 'avg', (v) => { s.sys = v; p.redraw(); }, 'lti-sys'));
  p.redraw();
};

// p08-l02: moving average
W.movavg = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { N: 8 };
  const p = new Plot(body, { aspect: 0.5, maxH: 280, x: [0, 0.5], y: [-60, 3], label: 'Magnitude response of an N-point moving average' });
  p.draw = (P) => {
    P.axes({ xl: 'f / f_s', yl: '|H| [dB]' }); const b = new Array(s.N).fill(1 / s.N); P.fn((f) => db(mag(b, [1], f)), C.lime, 2.5, null, 600);
    let f3 = 0; for (let f = 0; f < 0.5; f += 1e-4) if (mag(b, [1], f) < Math.SQRT1_2) { f3 = f; break; }
    read.innerHTML = `N = ${s.N} · first null at f<sub>s</sub>/N = <b>${(1 / s.N).toFixed(4)} f<sub>s</sub></b> · −3 dB at ${f3.toFixed(4)} f<sub>s</sub> (≈ 0.443/N) · delay (N − 1)/2 = <b>${((s.N - 1) / 2).toFixed(1)} samples</b> · worst sidelobe ${db(Math.max(...Array.from({ length: 400 }, (_, i) => (i / 800 > 1.4 / s.N ? mag(b, [1], i / 800) : 0)))).toFixed(1)} dB`;
  };
  ctrls.append(slider('Length N', { min: 2, max: 32, step: 1, value: s.N, fmt: (v) => String(v) }, (v) => { s.N = v; p.redraw(); }));
  p.redraw();
};

// p08-l03: first-order IIR from an RC
W.iir1 = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { tau: 20, ts: 5 };
  const p = new Plot(body, { aspect: 0.5, maxH: 280, x: [0, 100], y: [0, 1.1], label: 'Step response: continuous RC (dashed) and the discrete filter (dots)' });
  p.draw = (P) => {
    P.axes({ xl: 't [ms]' }); P.fn((t) => 1 - Math.exp(-t / s.tau), C.dim, 1.5, [5, 4]);
    const a = Math.exp(-s.ts / s.tau), a2 = s.tau / (s.tau + s.ts); let y = 0, y2 = 0;
    for (let k = 0; k * s.ts <= 100; k++) { P.dot(k * s.ts, y, C.lime, 3.5); P.dot(k * s.ts, y2, C.warn, 2.5); y = a * y + (1 - a); y2 = a2 * y2 + (1 - a2); }
    read.innerHTML = `τ = ${s.tau} ms, T<sub>s</sub> = ${s.ts} ms · exact a = e<sup>−T<sub>s</sub>/τ</sup> = <b>${a.toFixed(4)}</b> (lime, on the curve at every sample) · approximation τ/(τ + T<sub>s</sub>) = ${a2.toFixed(4)} (amber) · y[k] = a·y[k−1] + (1 − a)·x[k]`;
  };
  ctrls.append(slider('Time constant τ', { min: 2, max: 50, step: 1, value: s.tau, fmt: (v) => v + ' ms' }, (v) => { s.tau = v; p.redraw(); }),
    slider('Sample period T_s', { min: 0.5, max: 25, step: 0.5, value: s.ts, fmt: (v) => v + ' ms' }, (v) => { s.ts = v; p.redraw(); }));
  p.redraw();
};

// p08-l04: FIR by windowing
export function firLowpass(N, fc, kind, beta = 6) { const M = (N - 1) / 2; const w = kind === 'kaiser' ? Array.from({ length: N }, (_, n) => bessel0(beta * Math.sqrt(1 - ((n - M) / M) ** 2)) / bessel0(beta)) : winFn(kind, N); const h0 = Array.from({ length: N }, (_, n) => { const k = n - M; return (k === 0 ? 2 * fc : Math.sin(TAU * fc * k) / (Math.PI * k)) * w[n]; }); const g = h0.reduce((a, b) => a + b, 0); return h0.map((v) => v / g); }
W.firwin = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { N: 51, kind: 'hamming' }; const fc = 0.1;
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 0.5], y: [-120, 5], label: 'Windowed-sinc low-pass FIR, cutoff 0.1 f_s' });
  p.draw = (P) => {
    P.axes({ xl: 'f / f_s', yl: '|H| [dB]' }); const hh = firLowpass(s.N, fc, s.kind); P.fn((f) => db(mag(hh, [1], f)), C.lime, 2, null, 800);
    let worst = -300; for (let f = 0.15; f <= 0.5; f += 0.0005) worst = Math.max(worst, db(mag(hh, [1], f)));
    P.line([0.15, 0.15], [-120, 5], C.warn, 1, [4, 3]);
    read.innerHTML = `${s.N} taps, ${s.kind} window · worst stopband level beyond 0.15 f<sub>s</sub> (amber): <b>${worst.toFixed(1)} dB</b> · linear phase, delay ${(s.N - 1) / 2} samples`;
  };
  ctrls.append(slider('Taps', { min: 11, max: 151, step: 2, value: s.N, fmt: (v) => String(v) }, (v) => { s.N = v; p.redraw(); }),
    select('Window', [['rect', 'Rectangular (truncated sinc)'], ['hamming', 'Hamming'], ['blackman', 'Blackman'], ['kaiser', 'Kaiser β = 6']], 'hamming', (v) => { s.kind = v; p.redraw(); }, 'fir-window'));
  p.redraw();
};

// p08-l05: biquad coefficient quantisation
W.biquad = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { bits: 12, fc: 0.01 };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0.001, 0.5], y: [-60, 10], logx: true, label: 'Low-pass biquad: exact (dashed) and with quantised coefficients (lime)' });
  p.draw = (P) => {
    const { b, a } = butter(2, s.fc, 1); const q = 2 ** (s.bits - 2); const qa = [1, Math.round(a[1] * q) / q, Math.round(a[2] * q) / q]; const qb = b.map((v) => Math.round(v * q) / q);
    P.axes({ xl: 'f / f_s', yl: '|H| [dB]' }); P.fn((f) => db(mag(b, a, f)), C.dim, 1.5, [5, 4], 500); P.fn((f) => db(mag(qb, qa, f)), C.lime, 2.5, null, 500);
    const disc = qa[1] * qa[1] - 4 * qa[2]; const r = Math.sqrt(Math.abs(qa[2])); const r0 = Math.sqrt(a[2]);
    const dc = (qb[0] + qb[1] + qb[2]) / (1 + qa[1] + qa[2]);
    read.innerHTML = `2nd-order Butterworth at ${s.fc} f<sub>s</sub>, coefficients rounded to ${s.bits} bits (2 integer bits) · pole radius ${r0.toFixed(5)} → <b>${r.toFixed(5)}</b>${disc > 0 ? ' (poles became real)' : ''}${r >= 1 ? ' · <b style="color:#ff6b5b">unstable</b>' : ''} · DC gain <b>${isFinite(dc) ? dc.toFixed(3) : '∞'}</b> (should be 1)`;
  };
  ctrls.append(slider('Coefficient bits', { min: 6, max: 24, step: 1, value: s.bits, fmt: (v) => v + ' bits' }, (v) => { s.bits = v; p.redraw(); }),
    slider('Cutoff', { min: 0.002, max: 0.2, step: 0.001, value: s.fc, fmt: (v) => v.toFixed(3) + ' f_s' }, (v) => { s.fc = v; p.redraw(); }));
  p.redraw();
};

// p08-l06: bilinear transform and prewarping
W.bilinear = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { fc: 0.3, warp: true, n: 2 }; const fs = 1;
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 0.5], y: [-40, 3], label: 'Analogue Butterworth (dashed) and its bilinear-transform digital version (lime)' });
  p.draw = (P) => {
    const { b, a } = butter(s.n, s.fc, fs, s.warp); P.axes({ xl: 'f / f_s', yl: '|H| [dB]' });
    P.fn((f) => -10 * Math.log10(1 + (f / s.fc) ** (2 * s.n)), C.dim, 1.5, [5, 4], 500); P.fn((f) => db(mag(b, a, f)), C.lime, 2.5, null, 500);
    let f3 = 0; for (let f = 0; f < 0.5; f += 1e-4) if (mag(b, a, f) < Math.SQRT1_2) { f3 = f; break; }
    P.line([s.fc, s.fc], [-40, 3], C.warn, 1, [4, 3]);
    read.innerHTML = `order ${s.n}, design cutoff ${s.fc.toFixed(3)} f<sub>s</sub> (amber) · digital −3 dB at <b>${f3.toFixed(4)} f<sub>s</sub></b> ${s.warp ? '✓ prewarped: Ω<sub>c</sub> = 2f<sub>s</sub> tan(πf<sub>c</sub>/f<sub>s</sub>)' : '· no prewarping: the frequency axis is compressed near Nyquist'}`;
  };
  ctrls.append(slider('Cutoff', { min: 0.01, max: 0.45, step: 0.005, value: s.fc, fmt: (v) => v.toFixed(3) + ' f_s' }, (v) => { s.fc = v; p.redraw(); }),
    slider('Order', { min: 1, max: 8, step: 1, value: s.n, fmt: (v) => String(v) }, (v) => { s.n = v; p.redraw(); }),
    h('div', { class: 'btn-row' }, toggle('Prewarp', true, (v) => { s.warp = v; p.redraw(); }, { id: 'bl-warp' })));
  p.redraw();
};

// p08-l07: group delay
function phaseAt(b, a, f) { const [r, i] = freqz(b, a, f); return Math.atan2(i, r); }
function groupDelay(b, a, f) { const d = 1e-5; let dp = phaseAt(b, a, f + d) - phaseAt(b, a, f - d); while (dp > Math.PI) dp -= TAU; while (dp < -Math.PI) dp += TAU; return -dp / (TAU * 2 * d); }
W.groupdelay = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { kind: 'butter', fbw: 20 }; const fs = 1000;
  const filters = { ma: () => ({ b: new Array(10).fill(0.1), a: [1], name: '10-point moving average' }), iir: () => { const a = Math.exp(-1 / (fs * 0.005)); return { b: [1 - a], a: [1, -a], name: 'first-order IIR, τ = 5 ms' }; }, butter: () => ({ ...butter(4, 50, fs), name: '4th-order Butterworth, 50 Hz' }), fir: () => ({ b: firLowpass(31, 0.05, 'hamming'), a: [1], name: '31-tap FIR, 50 Hz' }) };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 100], y: [0, 25], label: 'Group delay against frequency, f_s = 1 kHz' });
  p.draw = (P) => {
    const F = filters[s.kind](); P.axes({ xl: 'f [Hz]', yl: 'delay [ms]' }); P.fn((f) => 1000 * groupDelay(F.b, F.a, f / fs) / fs, C.lime, 2.5, null, 300);
    P.line([s.fbw, s.fbw], [0, 25], C.warn, 1, [4, 3]); let ph = -phaseAt(F.b, F.a, s.fbw / fs) * 180 / Math.PI; if (ph < 0) ph += 360;
    read.innerHTML = `${F.name} · group delay at ${s.fbw} Hz: <b>${(1000 * groupDelay(F.b, F.a, s.fbw / fs) / fs).toFixed(2)} ms</b> · phase lag there: <b>${ph.toFixed(1)}°</b> taken out of a control loop's phase margin at that crossover`;
  };
  ctrls.append(select('Filter', [['butter', '4th-order Butterworth 50 Hz'], ['fir', '31-tap FIR 50 Hz'], ['ma', '10-point moving average'], ['iir', 'First-order IIR τ = 5 ms']], 'butter', (v) => { s.kind = v; p.redraw(); }, 'gd-filter'),
    slider('Control bandwidth', { min: 1, max: 100, step: 1, value: s.fbw, fmt: (v) => v + ' Hz' }, (v) => { s.fbw = v; p.redraw(); }));
  p.redraw();
};

// p08-l08: notch
export function notchCoeffs(f0, fs, r) { const w = TAU * f0 / fs; const b = [1, -2 * Math.cos(w), 1], a = [1, -2 * r * Math.cos(w), r * r]; const g = (1 - 2 * r * Math.cos(w) + r * r) / (2 - 2 * Math.cos(w)); return { b: b.map((v) => v * g), a }; }
W.notch = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { r: 0.95 }; const fs = 1000, f0 = 120;
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 500], y: [-60, 5], label: 'Notch filter for a 120 Hz resonance, f_s = 1 kHz' });
  p.draw = (P) => {
    const { b, a } = notchCoeffs(f0, fs, s.r); P.axes({ xl: 'f [Hz]', yl: '|H| [dB]' }); P.fn((f) => db(mag(b, a, f / fs)), C.lime, 2.5, null, 1500);
    const bw = (1 - s.r) * fs / Math.PI; const d = db(mag(b, a, (f0 + 1) / fs));
    read.innerHTML = `zeros on the unit circle at ±120 Hz, poles at radius r = ${s.r.toFixed(3)} · −3 dB width ≈ (1 − r)f<sub>s</sub>/π = <b>${bw.toFixed(1)} Hz</b> · attenuation 1 Hz off centre ${d.toFixed(1)} dB · at 100 Hz: ${db(mag(b, a, 0.1)).toFixed(2)} dB`;
  };
  ctrls.append(slider('Pole radius r', { min: 0.8, max: 0.995, step: 0.001, value: s.r, fmt: (v) => v.toFixed(3) }, (v) => { s.r = v; p.redraw(); }));
  p.redraw();
};

// p08-l09: median and Hampel
export function medfilt(x, k) { const h2 = (k - 1) / 2; return x.map((_, n) => { const w = []; for (let i = n - h2; i <= n + h2; i++) w.push(x[Math.min(x.length - 1, Math.max(0, i))]); w.sort((p, q) => p - q); return w[h2]; }); }
W.median = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { k: 7, seed: 3 };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 200], y: [-1, 4.5], label: 'A step with spikes: raw (blue), moving average (red), median (lime)' });
  p.draw = (P) => {
    const r = mulberry(s.seed); const x = Array.from({ length: 200 }, (_, n) => (n >= 100 ? 2 : 0) + 0.08 * randn(r) + (r() < 0.04 ? (r() < 0.5 ? 3 : -2) : 0));
    const ma = x.map((_, n) => { let a = 0; for (let i = 0; i < s.k; i++) a += x[Math.max(0, n - i)]; return a / s.k; }); const md = medfilt(x, s.k); const ns = x.map((_, n) => n);
    P.axes({ xl: 'n' }); P.line(ns, x, '#6fd3ff88', 1); P.line(ns, ma, C.bad, 1.5); P.line(ns, md, C.lime, 2.5);
    const truth = (n) => (n >= 100 ? 2 : 0); const err = (y) => Math.sqrt(y.reduce((a, v, n) => a + (v - truth(n)) ** 2, 0) / y.length);
    read.innerHTML = `window ${s.k} · rms error: raw ${err(x).toFixed(3)}, moving average <b>${err(ma).toFixed(3)}</b>, median <b>${err(md).toFixed(3)}</b> · the median keeps the step sharp and drops isolated spikes`;
  };
  ctrls.append(slider('Window', { min: 3, max: 21, step: 2, value: s.k, fmt: (v) => v + ' samples' }, (v) => { s.k = v; p.redraw(); }),
    h('div', { class: 'btn-row' }, btn('New noise', () => { s.seed++; p.redraw(); }, 'med-new')));
  p.redraw();
};

// p08-l10: Welch PSD
W.welch = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { K: 1, seed: 1 }; const fs = 1000, L = 256;
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 500], y: [1e-6, 1e-1], logy: true, label: 'PSD of white noise plus a 120 Hz tone' });
  p.draw = (P) => {
    const r = mulberry(s.seed); const n = L * (s.K + 1) / 2 + L; const x = Array.from({ length: n }, (_, i) => 0.05 * Math.sin(TAU * 120 * i / fs) + 0.1 * randn(r));
    const w = winFn('hann', L); const U = w.reduce((a, v) => a + v * v, 0); const psd = new Float64Array(L / 2 + 1); let cnt = 0;
    for (let st = 0; st + L <= n && cnt < s.K; st += L / 2, cnt++) { const re = new Float64Array(L), im = new Float64Array(L); for (let i = 0; i < L; i++) re[i] = x[st + i] * w[i]; fft(re, im); for (let k = 0; k <= L / 2; k++) psd[k] += (re[k] ** 2 + im[k] ** 2) / (fs * U) * (k && k < L / 2 ? 2 : 1); }
    const xs = [], ys = []; for (let k = 0; k <= L / 2; k++) { xs.push(k * fs / L); ys.push(Math.max(1e-6, psd[k] / cnt)); } P.axes({ xl: 'f [Hz]', yl: 'PSD [V²/Hz]' }); P.line(xs, ys, C.lime, 1.5);
    P.line([0, 500], [0.01 / (fs / 2), 0.01 / (fs / 2)], C.warn, 1, [4, 3]);
    const noiseBins = ys.filter((_, k) => Math.abs(xs[k] - 120) > 20 && k > 2); const m = noiseBins.reduce((a, v) => a + v, 0) / noiseBins.length; const sd = Math.sqrt(noiseBins.reduce((a, v) => a + (v - m) ** 2, 0) / noiseBins.length);
    read.innerHTML = `${cnt} Hann segment${cnt > 1 ? 's' : ''} of ${L} samples, 50 % overlap · noise floor mean ${m.toExponential(2)} (true 2.0e-5, amber) · scatter <b>${(100 * sd / m).toFixed(0)} %</b> of the mean (≈ 100 %/√K for independent segments)`;
  };
  ctrls.append(slider('Segments averaged', { min: 1, max: 64, step: 1, value: s.K, fmt: (v) => String(v) }, (v) => { s.K = v; p.redraw(); }),
    h('div', { class: 'btn-row' }, btn('New noise', () => { s.seed++; p.redraw(); }, 'welch-new')));
  p.redraw();
};

// p08-l11: leakage
W.leakage = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { off: 0.5, kind: 'hann' }; const N = 64;
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 32], y: [-120, 5], label: 'Spectrum of a unit sine between FFT bins' });
  p.draw = (P) => {
    const w = winFn(s.kind, N + 1).slice(0, N); const cg = w.reduce((a, v) => a + v, 0) / N; const re = new Float64Array(N), im = new Float64Array(N);
    const f = 10 + s.off; for (let n = 0; n < N; n++) re[n] = Math.sin(TAU * f * n / N) * w[n]; fft(re, im);
    const xs = [], ys = []; let pk = 0; for (let k = 0; k <= N / 2; k++) { const a = 2 * Math.hypot(re[k], im[k]) / (N * cg); xs.push(k); ys.push(db(a)); pk = Math.max(pk, a); }
    P.axes({ xl: 'bin', yl: 'dB' }); xs.forEach((x, i) => { P.line([x, x], [-120, ys[i]], C.lime, 2); });
    read.innerHTML = `tone at bin ${f.toFixed(2)}, ${s.kind} window · peak bin reads <b>${db(pk).toFixed(2)} dB</b> (true 0 dB, error ${db(pk).toFixed(2)} dB) · leakage 10 bins away: ${ys[Math.min(32, Math.round(f) + 10)].toFixed(0)} dB`;
  };
  ctrls.append(slider('Offset from a bin', { min: 0, max: 0.5, step: 0.01, value: s.off, fmt: (v) => v.toFixed(2) + ' bin' }, (v) => { s.off = v; p.redraw(); }),
    select('Window', [['rect', 'Rectangular'], ['hann', 'Hann'], ['flattop', 'Flat-top']], 'hann', (v) => { s.kind = v; p.redraw(); }, 'leak-window'));
  p.redraw();
};

// p08-l12: decimation
W.decimate = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { M: 4, filt: true }; const fs = 1000, N = 4096;
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 500], y: [-100, 5], label: 'Spectrum after decimating 50 Hz + 420 Hz tones by M' });
  p.draw = (P) => {
    let x = Array.from({ length: N }, (_, n) => Math.sin(TAU * 50 * n / fs) + Math.sin(TAU * 420 * n / fs));
    if (s.filt && s.M > 1) x = Array.from(lfilter(firLowpass(127, 0.45 / s.M, 'kaiser', 8), [1], x));
    const y = x.filter((_, n) => n % s.M === 0).slice(-512); const L = 512, w = winFn('hann', L), re = new Float64Array(L), im = new Float64Array(L); y.forEach((v, i) => { re[i] = v * w[i]; }); fft(re, im);
    const fs2 = fs / s.M; P.setRange([0, fs2 / 2], [-100, 5]); P.axes({ xl: 'f [Hz]', yl: 'dB' }); const xs = [], ys = []; for (let k = 0; k <= L / 2; k++) { xs.push(k * fs2 / L); ys.push(db(4 * Math.hypot(re[k], im[k]) / L)); } P.line(xs, ys, C.lime, 1.5);
    const r = ((420 % fs2) + fs2) % fs2, al = Math.min(r, fs2 - r); const k = Math.round(al / fs2 * L); const lvl = Math.max(...ys.slice(Math.max(0, k - 2), k + 3));
    read.innerHTML = `M = ${s.M} → new rate ${fs2} Hz (Nyquist ${fs2 / 2} Hz) · 420 Hz ${420 < fs2 / 2 ? 'stays at 420 Hz' : `aliases to <b>${al.toFixed(0)} Hz</b> at <b>${lvl.toFixed(0)} dB</b>`} · ${s.filt ? 'anti-alias FIR before downsampling' : '<b>no filter</b>: aliases land in band'}`;
  };
  ctrls.append(slider('Decimation factor M', { min: 1, max: 8, step: 1, value: s.M, fmt: (v) => String(v) }, (v) => { s.M = v; p.redraw(); }),
    h('div', { class: 'btn-row' }, toggle('Anti-alias filter', true, (v) => { s.filt = v; p.redraw(); }, { id: 'dec-filt' })));
  p.redraw();
};

// p08-l13: fixed-point biquad
export function q15Biquad(b, a, x, fracBits = 14, errorFeedback = false) { // coefficients in Q2.fracBits, data in Q15, wide accumulator
  const S = 2 ** fracBits; const qb = b.map((v) => Math.round(v * S)), qa = a.map((v) => Math.round(v * S)); let x1 = 0, x2 = 0, y1 = 0, y2 = 0, err = 0; const out = [];
  for (const xv of x) { const xi = Math.max(-32768, Math.min(32767, Math.round(xv * 32768))); let acc = qb[0] * xi + qb[1] * x1 + qb[2] * x2 - qa[1] * y1 - qa[2] * y2; if (errorFeedback) acc += err; let y = Math.round(acc / S); if (errorFeedback) err = acc - y * S; y = Math.max(-32768, Math.min(32767, y)); x2 = x1; x1 = xi; y2 = y1; y1 = y; out.push(y); } return out;
}
W.fixedbiquad = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { bits: 14, fc: 0.05, ef: false };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 200], y: [-1.2, 1.2], label: 'Biquad output: floating point (dashed) and fixed point (lime); error ×100 (amber)' });
  p.draw = (P) => {
    const { b, a } = butter(2, s.fc, 1); const x = Array.from({ length: 200 }, (_, n) => 0.55 * Math.sin(TAU * 0.02 * n) * (n > 10 ? 1 : 0) + (n > 120 ? -0.35 : 0)); const yf = lfilter(b, a, x); const yq = q15Biquad(b, a, x, s.bits, s.ef).map((v) => v / 32768);
    const ns = x.map((_, n) => n); P.axes({ xl: 'n' }); P.line(ns, Array.from(yf), C.dim, 1.5, [5, 4]); P.line(ns, yq, C.lime, 2); P.line(ns, yq.map((v, n) => 100 * (v - yf[n])), C.warn, 1);
    const err = Math.max(...yq.map((v, n) => Math.abs(v - yf[n]))) * 32768;
    read.innerHTML = `2nd-order Butterworth at ${s.fc} f<sub>s</sub> · coefficients Q2.${s.bits}, data Q15, wide accumulator${s.ef ? ', error feedback' : ''} · worst error vs the unquantised floating-point design <b>${err.toFixed(2)} LSB</b>${err < 1 ? ' ✓ below 1 LSB' : ''}`;
  };
  ctrls.append(slider('Coefficient fraction bits', { min: 6, max: 14, step: 1, value: s.bits, fmt: (v) => String(v) }, (v) => { s.bits = v; p.redraw(); }),
    slider('Cutoff', { min: 0.005, max: 0.2, step: 0.005, value: s.fc, fmt: (v) => v.toFixed(3) + ' f_s' }, (v) => { s.fc = v; p.redraw(); }),
    h('div', { class: 'btn-row' }, toggle('Error feedback', false, (v) => { s.ef = v; p.redraw(); }, { id: 'fb-ef' })));
  p.redraw();
};

// p08-l14: differentiating noisy signals
export function savgolDeriv(x, half, dt) { // quadratic/cubic SG first derivative = least-squares slope over 2*half+1 points
  const den = (2 * half + 1) * half * (half + 1) / 3 * dt; return x.map((_, n) => { let a = 0; for (let k = -half; k <= half; k++) a += k * x[Math.min(x.length - 1, Math.max(0, n + k))]; return a / den; });
}
W.deriv = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { noise: 0.01, kind: 'sg', seed: 2 }; const fs = 200, dt = 1 / fs, N = 400;
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 2], y: [-20, 20], label: 'Derivative of a noisy 1 Hz sine: truth (dashed) and estimate' });
  p.draw = (P) => {
    const r = mulberry(s.seed); const x = Array.from({ length: N }, (_, n) => Math.sin(TAU * n * dt) + s.noise * randn(r)); let d;
    if (s.kind === 'fd') d = x.map((v, n) => (n ? (v - x[n - 1]) / dt : 0));
    else if (s.kind === 'filt') { const a = Math.exp(-dt / 0.02); let y = 0; d = x.map((v, n) => { const raw = n ? (v - x[n - 1]) / dt : 0; y = a * y + (1 - a) * raw; return y; }); }
    else d = savgolDeriv(x, 7, dt);
    const tt = x.map((_, n) => n * dt); const truth = tt.map((t) => TAU * Math.cos(TAU * t)); const shift = s.kind === 'fd' ? 0.5 * dt : s.kind === 'filt' ? 0.02 + 0.5 * dt : 0;
    P.axes({ xl: 't [s]' }); P.line(tt, truth, C.dim, 1.5, [5, 4]); P.line(tt, d.map((v) => Math.max(-20, Math.min(20, v))), C.lime, 1.5);
    const e = Math.sqrt(d.slice(20, N - 20).reduce((a, v, i) => a + (v - TAU * Math.cos(TAU * ((i + 20) * dt - shift))) ** 2, 0) / (N - 40));
    read.innerHTML = `noise ${s.noise} rms at 200 Hz · ${{ fd: 'finite difference', filt: 'finite difference + 20 ms low-pass', sg: 'Savitzky-Golay, 15 points' }[s.kind]} · rms error <b>${e.toFixed(2)}</b> (signal amplitude 6.28)${shift ? ` · delay ${(shift * 1000).toFixed(1)} ms` : ' · no delay (centred, offline)'}`;
  };
  ctrls.append(slider('Noise', { min: 0, max: 0.05, step: 0.001, value: s.noise, fmt: (v) => v.toFixed(3) }, (v) => { s.noise = v; p.redraw(); }),
    select('Method', [['fd', 'Finite difference'], ['filt', 'Filtered derivative'], ['sg', 'Savitzky-Golay']], 'sg', (v) => { s.kind = v; p.redraw(); }, 'deriv-kind'));
  p.redraw();
};

// p08-l15: time-delay estimation
W.tde = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { d: 3.3, snr: 10, seed: 4 }; const N = 1024;
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [-10, 10], y: [-0.4, 1.1], label: 'Normalised cross-correlation around the peak, with the parabola through the top three points' });
  p.draw = (P) => {
    const r = mulberry(s.seed); const src = []; let lp = 0; for (let i = 0; i < N + 40; i++) { lp = 0.7 * lp + randn(r); src.push(lp); }
    const sig = (t) => { const i = Math.floor(t), f = t - i; return src[i] * (1 - f) + src[i + 1] * f; }; const ns = 1 / Math.sqrt(10 ** (s.snr / 10)) * 1.4;
    const a = Array.from({ length: N }, (_, n) => sig(n + 20) + ns * randn(r)), b = Array.from({ length: N }, (_, n) => sig(n + 20 - s.d) + ns * randn(r));
    const cc = (k) => { let acc = 0; for (let n = 0; n < N; n++) { const m = n - k; if (m >= 0 && m < N) acc += b[n] * a[m]; } return acc; };
    const ks = [], vs = []; for (let k = -10; k <= 10; k++) { ks.push(k); vs.push(cc(k)); } const mx = Math.max(...vs); const vn = vs.map((v) => v / mx); const i = vn.indexOf(1);
    const y0 = vn[i - 1], y1 = vn[i], y2 = vn[i + 1]; const delta = 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2); const est = ks[i] + delta;
    P.axes({ xl: 'lag [samples]' }); ks.forEach((k, j) => { P.line([k, k], [0, vn[j]], C.signal, 1.5); P.dot(k, vn[j], C.signal, 3); });
    const A = (y0 - 2 * y1 + y2) / 2; P.fn((x) => (Math.abs(x - est) < 2 ? y1 - A * delta * delta + A * (x - est) ** 2 : NaN), C.lime, 2, null, 300); P.line([est, est], [-0.4, 1.1], C.warn, 1, [4, 3]);
    read.innerHTML = `true delay <b>${s.d.toFixed(2)}</b> samples, SNR ${s.snr} dB · peak at lag ${ks[i]} · parabolic estimate <b>${est.toFixed(3)}</b> (error ${(est - s.d).toFixed(3)} samples)`;
  };
  ctrls.append(slider('True delay', { min: -6, max: 6, step: 0.01, value: s.d, fmt: (v) => v.toFixed(2) + ' samples' }, (v) => { s.d = v; p.redraw(); }),
    slider('SNR', { min: -5, max: 30, step: 1, value: s.snr, fmt: (v) => v + ' dB' }, (v) => { s.snr = v; p.redraw(); }),
    h('div', { class: 'btn-row' }, btn('New noise', () => { s.seed++; p.redraw(); }, 'tde-new')));
  p.redraw();
};

// p08-l16: envelope analysis
W.envelope = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { bpfo: 87, env: true, seed: 5 }; const fs = 20000, N = 8192;
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 500], y: [0, 1.1], label: 'Spectrum of a bearing vibration signal' });
  p.draw = (P) => {
    const r = mulberry(s.seed); const x = new Float64Array(N); const T = fs / s.bpfo;
    for (let k = 0; k * T < N; k++) { const n0 = Math.round(k * T + 3 * randn(r)); for (let m = 0; m < 300 && n0 + m < N; m++) if (n0 + m >= 0) x[n0 + m] += Math.exp(-m / 40) * Math.sin(TAU * 3000 * m / fs); }
    for (let n = 0; n < N; n++) x[n] += 0.6 * Math.sin(TAU * 25 * n / fs) + 0.5 * randn(r);
    let sig = x;
    if (s.env) { const re = Float64Array.from(x), im = new Float64Array(N); fft(re, im); for (let k = 1; k < N; k++) { const f = k < N / 2 ? k : N - k; const keep = f * fs / N > 2000 && f * fs / N < 4000; const g = !keep ? 0 : k < N / 2 ? 2 : 0; re[k] *= g; im[k] *= g; } re[0] = 0; im[0] = 0; for (let k = 0; k < N; k++) im[k] = -im[k]; fft(re, im); sig = Float64Array.from({ length: N }, (_, n) => Math.hypot(re[n], im[n]) / N); const m = sig.reduce((a, v) => a + v, 0) / N; for (let n = 0; n < N; n++) sig[n] -= m; }
    const w = winFn('hann', N), re = new Float64Array(N), im = new Float64Array(N); for (let n = 0; n < N; n++) re[n] = sig[n] * w[n]; fft(re, im);
    const xs = [], ys = []; let mx = 0; for (let k = 1; k * fs / N <= 500; k++) { const a = Math.hypot(re[k], im[k]); xs.push(k * fs / N); ys.push(a); mx = Math.max(mx, a); }
    const yn = ys.map((v) => v / mx); P.axes({ xl: 'f [Hz]', yl: 'normalised' }); P.line(xs, yn, C.lime, 1.5); for (let k = 1; k * s.bpfo <= 500; k++) P.line([k * s.bpfo, k * s.bpfo], [0, 1.1], C.warn, 1, [3, 4]);
    const pk = xs[yn.indexOf(1)];
    read.innerHTML = `outer-race fault at BPFO = ${s.bpfo} Hz (amber lines) exciting a 3 kHz resonance, plus a 25 Hz shaft tone and noise · ${s.env ? 'envelope spectrum (band-pass 2–4 kHz, Hilbert magnitude)' : 'raw spectrum'} · largest peak below 500 Hz at <b>${pk.toFixed(1)} Hz</b>${Math.abs(pk - s.bpfo) < 3 ? ' ✓ fault found' : ''}`;
  };
  ctrls.append(slider('Fault frequency', { min: 50, max: 160, step: 1, value: s.bpfo, fmt: (v) => v + ' Hz' }, (v) => { s.bpfo = v; p.redraw(); }),
    h('div', { class: 'btn-row' }, toggle('Envelope analysis', true, (v) => { s.env = v; p.redraw(); }, { id: 'env-on' })));
  p.redraw();
};

export default W;
