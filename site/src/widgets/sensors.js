// Widgets for Phase 07 (sensors). Sliders, selects, toggles and buttons only: nothing needs hover or drag.
import { Plot, frame, slider, select, toggle, h, C } from './plot.js';

const W = {};
function mulberry(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function randn(r) { const u = r() || 1e-9, v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
const btn = (t, f, id) => { const b = h('button', { class: 'btn btn-small', type: 'button', 'data-testid': id }, t); b.addEventListener('click', f); return b; };
const deg = Math.PI / 180;

// p07-l01: static characteristics
W.sensorchar = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { gain: 3, off: 1, nl: 2, hys: 1.5 };
  const p = new Plot(body, { aspect: 0.62, maxH: 380, x: [0, 100], y: [-5, 110], label: 'Sensor output against the true input, rising and falling' });
  const out = (x, up) => (1 + s.gain / 100) * x + s.off + s.nl * 4 * (x / 100) * (1 - x / 100) + (up ? -1 : 1) * s.hys / 2;
  p.draw = (P) => {
    P.axes({ xl: 'true input [% FS]', yl: 'output [% FS]' }); P.fn((x) => x, C.dim, 1.5, [5, 5]);
    P.fn((x) => out(x, true), C.lime, 2); P.fn((x) => out(x, false), C.signal, 2);
    let worst = 0; for (let x = 0; x <= 100; x += 0.5) worst = Math.max(worst, Math.abs(out(x, true) - x), Math.abs(out(x, false) - x));
    read.innerHTML = `gain error ${s.gain} % · offset ${s.off} % FS · non-linearity ${s.nl} % FS (bow at mid-scale) · hysteresis ${s.hys} % FS · <b>worst total error ${worst.toFixed(2)} % FS</b> · lime: rising input, blue: falling, dashed: ideal`;
  };
  ctrls.append(slider('Gain error', { min: -5, max: 5, step: 0.1, value: s.gain, fmt: (v) => v.toFixed(1) + ' %' }, (v) => { s.gain = v; p.redraw(); }),
    slider('Offset', { min: -3, max: 3, step: 0.1, value: s.off, fmt: (v) => v.toFixed(1) + ' % FS' }, (v) => { s.off = v; p.redraw(); }),
    slider('Non-linearity', { min: -5, max: 5, step: 0.1, value: s.nl, fmt: (v) => v.toFixed(1) + ' % FS' }, (v) => { s.nl = v; p.redraw(); }),
    slider('Hysteresis', { min: 0, max: 5, step: 0.1, value: s.hys, fmt: (v) => v.toFixed(1) + ' % FS' }, (v) => { s.hys = v; p.redraw(); }));
  p.redraw();
};

// p07-l03: potentiometer loading
export const potLoaded = (x, k) => x / (1 + x * (1 - x) / k);   // k = R_L / R_p
W.potload = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { lk: 1 };
  const p = new Plot(body, { aspect: 0.62, maxH: 360, x: [0, 1], y: [0, 1], label: 'Wiper voltage against position, unloaded and loaded' });
  p.draw = (P) => {
    const k = 10 ** s.lk; P.axes({ xl: 'wiper position x', yl: 'V_out / V_s' });
    P.fn((x) => x, C.dim, 1.5, [5, 5]); P.fn((x) => potLoaded(x, k), C.lime, 2.5);
    let worst = 0, at = 0; for (let x = 0; x <= 1; x += 0.001) { const e = x - potLoaded(x, k); if (e > worst) { worst = e; at = x; } }
    P.dot(at, potLoaded(at, k), C.warn, 5);
    read.innerHTML = `R<sub>L</sub>/R<sub>p</sub> = <b>${k < 10 ? k.toFixed(2) : k.toFixed(0)}</b> · worst error <b>${(100 * worst).toFixed(2)} % of V<sub>s</sub></b> at x = ${at.toFixed(2)} (amber) · rule of thumb: error ≈ 15/(R<sub>L</sub>/R<sub>p</sub>) %`;
  };
  ctrls.append(slider('Load / pot resistance (log)', { min: -1, max: 3, step: 0.05, value: s.lk, fmt: (v) => '×' + (10 ** v < 10 ? (10 ** v).toFixed(2) : (10 ** v).toFixed(0)) }, (v) => { s.lk = v; p.redraw(); }));
  p.redraw();
};

// p07-l04: load cell chain
W.loadcell = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { m: 2, G: 200, bits: 16 }; const cap = 5, sens = 2e-3, vex = 3.3, vref = 3.3;
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0, 5], y: [0, 1], label: 'ADC reading against mass' });
  p.draw = (P) => {
    const full = (1 << s.bits) - 1; P.setRange([0, 5], [0, full]); P.axes({ xl: 'mass [kg]', yl: 'ADC code' });
    const code = (m) => Math.max(0, Math.min(full, Math.floor((vref / 2 + s.G * vex * sens * m / cap) / vref * (1 << s.bits))));
    const xs = [], ys = []; for (let m = 0; m <= 5; m += 0.01) { xs.push(m); ys.push(code(m)); } P.line(xs, ys, C.lime, 2); P.dot(s.m, code(s.m), C.warn, 5);
    const vb = vex * sens * s.m / cap, vo = vref / 2 + s.G * vb, clip = vref / 2 + s.G * vex * sens > vref;
    const gramsPerCount = cap / (s.G * vex * sens / vref * (1 << s.bits)) * 1000;
    read.innerHTML = `bridge ${(vb * 1000).toFixed(3)} mV (2 mV/V × 3.3 V at 5 kg) → INA gain ${s.G} → ${vo.toFixed(3)} V (mid-rail reference) → code <b>${code(s.m)}</b> · one count = <b>${gramsPerCount.toFixed(2)} g</b>${clip ? ' · <b>clips before full load</b>: lower the gain' : ''}`;
  };
  ctrls.append(slider('Mass', { min: 0, max: 5, step: 0.01, value: s.m, fmt: (v) => v.toFixed(2) + ' kg' }, (v) => { s.m = v; p.redraw(); }),
    slider('INA gain', { min: 1, max: 400, step: 1, value: s.G, fmt: (v) => String(v) }, (v) => { s.G = v; p.redraw(); }),
    select('ADC', [['12', '12 bits'], ['16', '16 bits'], ['24', '24 bits']], '16', (v) => { s.bits = +v; p.redraw(); }, 'loadcell-bits'));
  p.redraw();
};

// p07-l05: thermistor models
const T25 = 298.15; export const ntcLnR = (T) => { const u = 1 / T - 1 / T25; return Math.log(1e4) + 3950 * u + 3e5 * u * u; };
function solve3(A, b) { const M = A.map((r, i) => [...r, b[i]]); for (let i = 0; i < 3; i++) { let piv = i; for (let j = i + 1; j < 3; j++) if (Math.abs(M[j][i]) > Math.abs(M[piv][i])) piv = j; [M[i], M[piv]] = [M[piv], M[i]]; for (let j = i + 1; j < 3; j++) { const f = M[j][i] / M[i][i]; for (let k = i; k < 4; k++) M[j][k] -= f * M[i][k]; } } const x = [0, 0, 0]; for (let i = 2; i >= 0; i--) { let v = M[i][3]; for (let k = i + 1; k < 3; k++) v -= M[i][k] * x[k]; x[i] = v / M[i][i]; } return x; }
W.thermistor = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { model: 'beta' };
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0, 80], y: [-2, 2], label: 'Temperature error of a thermistor model over 0 to 80 °C' });
  const Ta = 298.15, Tb = 358.15, B = (ntcLnR(Ta) - ntcLnR(Tb)) / (1 / Ta - 1 / Tb);
  const pts = [273.15, 313.15, 353.15], abc = solve3(pts.map((T) => { const L = ntcLnR(T); return [1, L, L ** 3]; }), pts.map((T) => 1 / T));
  const model = (L) => s.model === 'beta' ? 1 / (1 / T25 + (L - Math.log(1e4)) / B) : 1 / (abc[0] + abc[1] * L + abc[2] * L ** 3);
  p.draw = (P) => {
    const xs = [], ys = []; let worst = 0; for (let t = 0; t <= 80; t += 0.25) { const e = model(ntcLnR(t + 273.15)) - (t + 273.15); xs.push(t); ys.push(e); worst = Math.max(worst, Math.abs(e)); }
    const span = s.model === 'beta' ? 2 : 0.1; P.setRange([0, 80], [-span, span]); P.axes({ xl: 'T [°C]', yl: 'error [K]' });
    P.line([0, 80], [0.2, 0.2], C.dim, 1, [4, 3]); P.line([0, 80], [-0.2, -0.2], C.dim, 1, [4, 3]); P.line(xs, ys, C.lime, 2.5);
    read.innerHTML = s.model === 'beta' ? `β model from the 25/85 °C datasheet points: β = ${B.toFixed(0)} K · worst error <b>${worst.toFixed(2)} K</b> · dashed: ±0.2 K target` : `Steinhart-Hart fitted at 0, 40 and 80 °C · worst error <b>${worst.toFixed(3)} K</b> ✓ inside ±0.2 K (dashed lines off-scale)`;
  };
  ctrls.append(select('Model', [['beta', 'β equation (2 points)'], ['sh', 'Steinhart-Hart (3 points)']], 'beta', (v) => { s.model = v; p.redraw(); }, 'ntc-model'));
  p.redraw();
};

// p07-l06: thermocouple and cold-junction compensation (type K, linearised 41 µV/K)
W.thermocouple = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { th: 400, tc: 35, cjc: true }; const S = 41e-6;
  const p = new Plot(body, { aspect: 0.5, maxH: 280, x: [0, 1000], y: [0, 1000], label: 'Indicated against true hot-junction temperature' });
  p.draw = (P) => {
    P.axes({ xl: 'true hot junction [°C]', yl: 'indicated [°C]' }); P.fn((x) => x, C.dim, 1.5, [5, 5]);
    const ind = (th) => S * (th - s.tc) / S + (s.cjc ? s.tc : 0);
    P.fn(ind, C.lime, 2.5); P.dot(s.th, ind(s.th), C.warn, 5);
    read.innerHTML = `thermocouple voltage S(T<sub>hot</sub> − T<sub>cold</sub>) = <b>${(S * (s.th - s.tc) * 1000).toFixed(3)} mV</b> · cold junction ${s.tc} °C · ${s.cjc ? 'with CJC' : 'without CJC'}: indicated <b>${ind(s.th).toFixed(1)} °C</b> (error ${(ind(s.th) - s.th).toFixed(1)} K)`;
  };
  ctrls.append(slider('Hot junction', { min: 0, max: 1000, step: 1, value: s.th, fmt: (v) => v + ' °C' }, (v) => { s.th = v; p.redraw(); }),
    slider('Cold junction (terminals)', { min: -10, max: 70, step: 1, value: s.tc, fmt: (v) => v + ' °C' }, (v) => { s.tc = v; p.redraw(); }),
    h('div', { class: 'btn-row' }, toggle('Cold-junction compensation', true, (v) => { s.cjc = v; p.redraw(); }, { id: 'tc-cjc' })));
  p.redraw();
};

// p07-l07: encoder speed methods
W.encspeed = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { lw: 0 }; const cpr = 2000, Ts = 1e-3, ft = 10e6;
  const p = new Plot(body, { aspect: 0.6, maxH: 340, x: [0.01, 100], y: [1e-4, 100], logx: true, logy: true, label: 'Speed resolution of the frequency and period methods' });
  const fq = (w) => 100 / (cpr * Ts * w), pe = (w) => 100 * w * cpr / ft;
  p.draw = (P) => {
    P.axes({ xl: 'speed [rev/s]', yl: 'resolution [% of speed]' }); P.fn(fq, C.signal, 2.5); P.fn(pe, C.warn, 2.5);
    const w = 10 ** s.lw; P.dot(w, fq(w), C.signal, 5); P.dot(w, pe(w), C.warn, 5); P.line([Math.sqrt(ft / (cpr * cpr * Ts)), Math.sqrt(ft / (cpr * cpr * Ts))], [1e-4, 100], C.dim, 1, [4, 3]);
    read.innerHTML = `2000 counts/rev, 1 ms window, 10 MHz timer · at <b>${w < 1 ? w.toFixed(3) : w.toFixed(2)} rev/s</b>: frequency method (blue, counts per window) ±<b>${fq(w) > 100 ? '>100' : fq(w).toPrecision(2)} %</b> · period method (amber, timer ticks per count) ±<b>${pe(w).toPrecision(2)} %</b> · crossover (dashed) ${Math.sqrt(ft / (cpr * cpr * Ts)).toFixed(2)} rev/s`;
  };
  ctrls.append(slider('Speed (log)', { min: -2, max: 2, step: 0.02, value: s.lw, fmt: (v) => (10 ** v).toPrecision(3) + ' rev/s' }, (v) => { s.lw = v; p.redraw(); }));
  p.redraw();
};

// p07-l08: Hall sensors and six-step commutation
export function hallState(thDeg) { const t = ((thDeg % 360) + 360) % 360; return [0, 120, 240].map((o) => (((t - o + 360) % 360) < 180 ? 1 : 0)); }
export const SIX_STEP = { '100': ['A+', 'B−'], '110': ['A+', 'C−'], '010': ['B+', 'C−'], '011': ['B+', 'A−'], '001': ['C+', 'A−'], '101': ['C+', 'B−'] };
W.hall = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { th: 30 };
  const p = new Plot(body, { aspect: 0.5, maxH: 280, x: [0, 360], y: [-0.2, 3.4], label: 'Hall sensor outputs against electrical angle' });
  p.draw = (P) => {
    P.axes({ xl: 'electrical angle [°]' }); const cols = [C.lime, C.signal, C.warn];
    for (let k = 0; k < 3; k++) { const X = [], Y = []; for (let a = 0; a <= 360; a += 1) { X.push(a); Y.push(2.3 - 1.1 * k + 0.8 * hallState(a)[k]); } P.line(X, Y, cols[k], 2); P.text(`H${'ABC'[k]}`, 2, 2.95 - 1.1 * k, cols[k]); }
    P.line([s.th, s.th], [-0.2, 3.4], C.bone, 1.5, [4, 3]); const st = hallState(s.th).join(''); const d = SIX_STEP[st];
    read.innerHTML = `angle ${s.th}° · Hall code <b>${st}</b> · sector ${Math.floor((((s.th % 360) + 360) % 360) / 60) + 1} of 6 · drive <b>${d[0]}</b> (high side) and <b>${d[1]}</b> (low side), third phase floating · the field leads the rotor by 60–120°`;
  };
  ctrls.append(slider('Rotor electrical angle', { min: 0, max: 359, step: 1, value: s.th, fmt: (v) => v + '°' }, (v) => { s.th = v; p.redraw(); }));
  p.redraw();
};

// p07-l09: tilt from an accelerometer
W.tilt = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { pitch: 20, acc: 0 };
  const p = new Plot(body, { aspect: 0.75, maxH: 340, x: [-1.5, 1.5], y: [-0.5, 1.5], equal: true, label: 'Sensor axes and the measured specific force' });
  p.draw = (P) => {
    const th = s.pitch * deg, ax = s.acc; // world frame: x forward, z up; at rest the accelerometer measures +1 g up
    const fx = Math.cos(th) * ax + Math.sin(th), fz = -Math.sin(th) * ax + Math.cos(th);
    const est = Math.atan2(fx, fz) / deg;
    P.line([-1.5, 1.5], [0, 0], C.rule2, 1);
    P.arrow(0, 0, Math.cos(th), Math.sin(th), C.dim, 2); P.text('sensor x', Math.cos(th) * 1.02, Math.sin(th) * 1.02 + 0.06, C.fog);
    P.arrow(0, 0, -Math.sin(th), Math.cos(th), C.dim, 2); P.text('sensor z', -Math.sin(th) * 1.02 - 0.1, Math.cos(th) * 1.02 + 0.08, C.fog);
    P.arrow(0, 0, ax, 1, C.lime, 3); P.text('specific force', ax + 0.05, 1.1, C.lime);
    read.innerHTML = `true pitch <b>${s.pitch}°</b> · accelerometer reads f<sub>x</sub> = ${fx.toFixed(3)} g, f<sub>z</sub> = ${fz.toFixed(3)} g · atan2 estimate <b>${est.toFixed(1)}°</b> (error ${(est - s.pitch).toFixed(1)}°)${ax ? ' · linear acceleration fools the tilt estimate' : ' · exact when the sensor isn\'t accelerating'}`;
  };
  ctrls.append(slider('Pitch', { min: -85, max: 85, step: 1, value: s.pitch, fmt: (v) => v + '°' }, (v) => { s.pitch = v; p.redraw(); }),
    slider('Forward acceleration', { min: -0.5, max: 0.5, step: 0.01, value: s.acc, fmt: (v) => v.toFixed(2) + ' g' }, (v) => { s.acc = v; p.redraw(); }));
  p.redraw();
};

// p07-l10: gyro bias estimation
W.gyrobias = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { bias: 0.5, est: 10, seed: 1 }; const fs = 100, arw = 0.01; // deg/s/sqrt(Hz) white noise density
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0, 60], y: [-5, 35], label: 'Integrated heading of a stationary gyro' });
  p.draw = (P) => {
    const r = mulberry(s.seed); const n = 70 * fs; const g = []; for (let i = 0; i < n; i++) g.push(s.bias + arw * Math.sqrt(fs) * randn(r));
    const m = s.est * fs; const b = g.slice(0, m).reduce((a, v) => a + v, 0) / m;
    let a1 = 0, a2 = 0; const X = [], Y1 = [], Y2 = []; for (let i = m; i < m + 60 * fs; i++) { a1 += g[i] / fs; a2 += (g[i] - b) / fs; if (i % 10 === 0) { X.push((i - m) / fs); Y1.push(a1); Y2.push(a2); } }
    const span = Math.max(5, Math.abs(a1) * 1.1); P.setRange([0, 60], [-span * 0.15, span]); P.axes({ xl: 't after the estimate [s]', yl: 'heading [°]' });
    P.line(X, Y1, C.bad, 2); P.line(X, Y2, C.lime, 2.5);
    read.innerHTML = `true bias ${s.bias} °/s · estimated from ${s.est} s at rest: <b>${b.toFixed(3)} °/s</b> (error ${(100 * (b - s.bias) / s.bias).toFixed(1)} %) · heading drift after 60 s: raw <b>${a1.toFixed(1)}°</b> (red), corrected <b>${a2.toFixed(2)}°</b> (lime)`;
  };
  ctrls.append(slider('Gyro bias', { min: 0.05, max: 2, step: 0.05, value: s.bias, fmt: (v) => v.toFixed(2) + ' °/s' }, (v) => { s.bias = v; p.redraw(); }),
    slider('Averaging time at rest', { min: 0.5, max: 30, step: 0.5, value: s.est, fmt: (v) => v + ' s' }, (v) => { s.est = v; p.redraw(); }),
    h('div', { class: 'btn-row' }, btn('New noise', () => { s.seed++; p.redraw(); }, 'gyro-new')));
  p.redraw();
};

// p07-l11: magnetometer calibration
W.magcal = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { hx: 15, hy: -8, soft: 1.3, cal: false };
  const p = new Plot(body, { aspect: 1, maxH: 360, x: [-80, 80], y: [-80, 80], equal: true, label: 'Magnetometer readings while turning a full circle' });
  p.draw = (P) => {
    P.axes({ xl: 'm_x [µT]', yl: 'm_y [µT]' }); const B = 40, rot = 25 * deg; let worst = 0;
    for (let a = 0; a < 360; a += 6) {
      const t = a * deg; const ux = B * Math.cos(t), uy = B * Math.sin(t);
      // soft iron: scale along a 25° axis
      const c = Math.cos(rot), sn = Math.sin(rot); const p1 = c * ux + sn * uy, p2 = -sn * ux + c * uy; const q1 = p1 * s.soft, q2 = p2;
      let mx = c * q1 - sn * q2 + s.hx, my = sn * q1 + c * q2 + s.hy;
      if (s.cal) { const x = mx - s.hx, y = my - s.hy; const r1 = (c * x + sn * y) / s.soft, r2 = -sn * x + c * y; mx = c * r1 - sn * r2; my = sn * r1 + c * r2; }
      const hd = Math.atan2(my, mx) / deg; let e = ((hd - a + 540) % 360) - 180; worst = Math.max(worst, Math.abs(e));
      P.dot(mx, my, s.cal ? C.lime : C.warn, 3);
    }
    P.dot(s.cal ? 0 : s.hx, s.cal ? 0 : s.hy, C.bone, 4);
    read.innerHTML = `hard iron (${s.hx}, ${s.hy}) µT · soft-iron stretch ×${s.soft.toFixed(2)} along 25° · ${s.cal ? 'calibrated: offset removed, ellipse mapped back to a circle' : 'raw'} · worst heading error <b>${worst.toFixed(1)}°</b>`;
  };
  ctrls.append(slider('Hard-iron x', { min: -30, max: 30, step: 1, value: s.hx, fmt: (v) => v + ' µT' }, (v) => { s.hx = v; p.redraw(); }),
    slider('Hard-iron y', { min: -30, max: 30, step: 1, value: s.hy, fmt: (v) => v + ' µT' }, (v) => { s.hy = v; p.redraw(); }),
    slider('Soft-iron stretch', { min: 1, max: 1.6, step: 0.01, value: s.soft, fmt: (v) => '×' + v.toFixed(2) }, (v) => { s.soft = v; p.redraw(); }),
    h('div', { class: 'btn-row' }, toggle('Apply calibration', false, (v) => { s.cal = v; p.redraw(); }, { id: 'mag-cal' })));
  p.redraw();
};

// p07-l12: ultrasonic echo and correlation
W.echo = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { d: 1.2, noise: 1, seed: 1 }; const fs = 1e6, c = 343, f0 = 40e3;
  const p = new Plot(body, { aspect: 0.6, maxH: 340, x: [0, 12], y: [-1, 2.6], label: 'Received echo (top) and its correlation with the transmitted burst (bottom)' });
  p.draw = (P) => {
    P.axes({ xl: 't [ms]' }); const r = mulberry(s.seed); const n = 12000; const tx = []; for (let i = 0; i < 400; i++) tx.push(Math.sin(2 * Math.PI * f0 * i / fs) * Math.sin(Math.PI * i / 400) ** 2);
    const delay = Math.round(2 * s.d / c * fs); const rx = new Float64Array(n); for (let i = 0; i < n; i++) rx[i] = 0.25 * s.noise * randn(r) + (i >= delay && i < delay + 400 ? 0.3 * tx[i - delay] : 0);
    const X = [], Y = [], Z = []; let best = 0, bi = 0; const corr = new Float64Array(n);
    for (let k = 0; k < n - 400; k += 4) { let acc = 0; for (let i = 0; i < 400; i += 2) acc += rx[k + i] * tx[i]; corr[k] = acc; if (acc > best) { best = acc; bi = k; } }
    for (let k = 0; k < n; k += 8) { X.push(k / 1000); Y.push(1.8 + rx[k]); Z.push(corr[k - (k % 4)] / 30); }
    P.line(X, Y, C.signal, 1); P.line(X, Z, C.lime, 1.5); P.line([bi / 1000, bi / 1000], [-1, 2.6], C.warn, 1, [4, 3]);
    const est = bi / fs * c / 2;
    read.innerHTML = `target at ${s.d.toFixed(2)} m → round trip ${(2 * s.d / c * 1000).toFixed(2)} ms · correlation peak at ${(bi / 1000).toFixed(3)} ms → <b>${est.toFixed(3)} m</b> (error ${((est - s.d) * 100).toFixed(1)} cm) · c = 343 m/s at 20 °C`;
  };
  ctrls.append(slider('Target distance', { min: 0.2, max: 1.9, step: 0.01, value: s.d, fmt: (v) => v.toFixed(2) + ' m' }, (v) => { s.d = v; p.redraw(); }),
    slider('Noise', { min: 0, max: 4, step: 0.1, value: s.noise, fmt: (v) => '×' + v.toFixed(1) }, (v) => { s.noise = v; p.redraw(); }),
    h('div', { class: 'btn-row' }, btn('New noise', () => { s.seed++; p.redraw(); }, 'echo-new')));
  p.redraw();
};

// p07-l13: indirect time of flight, phase ambiguity
W.itof = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { f: 20, d: 9 }; const c = 299792458;
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0, 30], y: [0, 30], label: 'Reported against true distance for a phase-measuring ToF sensor' });
  p.draw = (P) => {
    const amb = c / (2 * s.f * 1e6); P.axes({ xl: 'true distance [m]', yl: 'reported [m]' }); P.fn((x) => x, C.dim, 1.5, [5, 5]);
    const X = [], Y = []; for (let x = 0; x <= 30; x += 0.02) { X.push(x); Y.push(x % amb); } P.line(X, Y, C.lime, 2); P.dot(s.d, s.d % amb, C.warn, 5);
    read.innerHTML = `modulation ${s.f} MHz → ambiguity distance c/(2f) = <b>${amb.toFixed(2)} m</b> · a target at ${s.d.toFixed(1)} m reads <b>${(s.d % amb).toFixed(2)} m</b>${s.d >= amb ? ' (wrapped)' : ''} · combine two frequencies to extend the range`;
  };
  ctrls.append(slider('Modulation frequency', { min: 5, max: 100, step: 1, value: s.f, fmt: (v) => v + ' MHz' }, (v) => { s.f = v; p.redraw(); }),
    slider('Target distance', { min: 0.1, max: 30, step: 0.1, value: s.d, fmt: (v) => v.toFixed(1) + ' m' }, (v) => { s.d = v; p.redraw(); }));
  p.redraw();
};

// p07-l14: shunt current sampling within a PWM period
export function phaseCurrent(t, duty, Iavg = 10, ripple = 4) { // t in PWM periods [0,1), centre-aligned: on in the middle
  const on0 = 0.5 - duty / 2, on1 = 0.5 + duty / 2; let i;
  const fall = (x) => Iavg + ripple / 2 - ripple * x; // falls over the off time
  if (t >= on0 && t < on1) i = Iavg - ripple / 2 + ripple * (t - on0) / duty; else { const x = t < on0 ? (t + 1 - on1) / (1 - duty) : (t - on1) / (1 - duty); i = fall(x); }
  const ring = (dt) => (dt >= 0 && dt < 0.04 ? 6 * Math.exp(-dt / 0.012) * Math.cos(2 * Math.PI * dt / 0.012) : 0);
  return i + ring(t - on0) + ring(t - on1);
}
W.shunt = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { duty: 0.4, ts: 0.5 };
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0, 1], y: [0, 20], label: 'Shunt current through one centre-aligned PWM period' });
  p.draw = (P) => {
    P.axes({ xl: 't / T_PWM', yl: 'I [A]' }); const X = [], Y = []; for (let t = 0; t < 1; t += 0.001) { X.push(t); Y.push(phaseCurrent(t, s.duty)); }
    P.line(X, Y, C.signal, 1.5); P.line([0, 1], [10, 10], C.dim, 1, [4, 3]); const v = phaseCurrent(s.ts, s.duty); P.dot(s.ts, v, C.warn, 6);
    read.innerHTML = `duty ${(100 * s.duty).toFixed(0)} % · sample at ${s.ts.toFixed(3)} T: <b>${v.toFixed(2)} A</b> against the 10.00 A average (error ${(v - 10).toFixed(2)} A) · sampling at the centre of the on-time sees the average, away from the switching ringing`;
  };
  ctrls.append(slider('Duty cycle', { min: 0.1, max: 0.9, step: 0.01, value: s.duty, fmt: (v) => (100 * v).toFixed(0) + ' %' }, (v) => { s.duty = v; p.redraw(); }),
    slider('Sample instant', { min: 0, max: 0.999, step: 0.001, value: s.ts, fmt: (v) => v.toFixed(3) + ' T' }, (v) => { s.ts = v; p.redraw(); }));
  p.redraw();
};

// p07-l15: orifice flow
W.orifice = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { dp: 2000 }; const Cd = 0.61, d = 0.01, rho = 1.2, dpMax = 5000, lsb = dpMax / 4096;
  const A = Math.PI * d * d / 4; const Q = (dp) => Cd * A * Math.sqrt(2 * Math.max(dp, 0) / rho);
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0, 5000], y: [0, 5], label: 'Air flow through a 10 mm orifice against differential pressure' });
  p.draw = (P) => {
    P.axes({ xl: 'Δp [Pa]', yl: 'Q [L/s]' }); P.fn((x) => Q(x) * 1000, C.lime, 2.5); P.dot(s.dp, Q(s.dp) * 1000, C.warn, 5);
    const dq = (Q(s.dp + lsb) - Q(s.dp)) * 1000;
    read.innerHTML = `Q = C<sub>d</sub>A√(2Δp/ρ), C<sub>d</sub> 0.61, ρ 1.2 kg/m³ · at ${s.dp.toFixed(0)} Pa: <b>${(Q(s.dp) * 1000).toFixed(2)} L/s</b> · one 12-bit pressure step (${lsb.toFixed(2)} Pa) changes Q by <b>${dq.toFixed(3)} L/s</b> (${(100 * dq / Math.max(Q(s.dp) * 1000, 1e-9)).toFixed(2)} %): resolution collapses at low flow`;
  };
  ctrls.append(slider('Δp', { min: 2, max: 5000, step: 1, value: s.dp, fmt: (v) => v + ' Pa' }, (v) => { s.dp = v; p.redraw(); }));
  p.redraw();
};

// p07-l16: anti-aliasing filter order
W.aaf = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { n: 4, fc: 100 }; const fs = 1000, need = 20 * Math.log10(2 ** 11);
  const p = new Plot(body, { aspect: 0.6, maxH: 340, x: [10, 10000], y: [-120, 5], logx: true, label: 'Butterworth anti-aliasing filter for 1 kHz sampling' });
  const mag = (f) => -10 * Math.log10(1 + (f / s.fc) ** (2 * s.n));
  p.draw = (P) => {
    P.axes({ xl: 'f [Hz]', yl: '|H| [dB]' }); P.fn(mag, C.lime, 2.5); P.line([500, 500], [-120, 5], C.warn, 1, [4, 3]); P.line([10, 10000], [-need, -need], C.bad, 1, [4, 3]);
    const fa = fs - s.fc; const a = -mag(fa);
    read.innerHTML = `order ${s.n}, cutoff ${s.fc} Hz · at f<sub>s</sub>/2 = 500 Hz: <b>${(-mag(500)).toFixed(1)} dB</b> · at ${fa} Hz (aliases onto the passband edge): <b>${a.toFixed(1)} dB</b> · below 1 LSB of 12 bits needs ${need.toFixed(1)} dB (red) ${a >= need ? '✓' : '✗'}`;
  };
  ctrls.append(slider('Order', { min: 1, max: 10, step: 1, value: s.n, fmt: (v) => String(v) }, (v) => { s.n = v; p.redraw(); }),
    slider('Cutoff', { min: 20, max: 400, step: 5, value: s.fc, fmt: (v) => v + ' Hz' }, (v) => { s.fc = v; p.redraw(); }));
  p.redraw();
};

// p07-l17: quantisation noise and ENOB
W.enob = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { bits: 8, noise: 0, seed: 1 };
  const p = new Plot(body, { aspect: 0.55, maxH: 320, x: [0, 1], y: [-1.1, 1.1], label: 'A full-scale sine, quantised, and its error (×20)' });
  p.draw = (P) => {
    P.axes({ xl: 't [periods]' }); const r = mulberry(s.seed); const q = 2 / (1 << s.bits); const N = 4096; let se = 0, ss = 0; const X = [], Y = [], E = [];
    for (let i = 0; i < N; i++) { const t = i / N, x = 0.999 * Math.sin(2 * Math.PI * 3.1 * t); const xn = x + s.noise * q * randn(r); const y = q * Math.round(xn / q); se += (y - x) ** 2; ss += x * x; if (i % 4 === 0) { X.push(t); Y.push(y); E.push(20 * (y - x)); } }
    P.line(X, Y, C.lime, 1.5); P.line(X, E, C.warn, 1);
    const snr = 10 * Math.log10(ss / se), enob = (snr - 1.76) / 6.02;
    read.innerHTML = `${s.bits} bits · extra noise ${s.noise.toFixed(2)} LSB rms · measured SNR <b>${snr.toFixed(1)} dB</b> (ideal 6.02N + 1.76 = ${(6.02 * s.bits + 1.76).toFixed(1)} dB) · ENOB <b>${enob.toFixed(2)} bits</b>`;
  };
  ctrls.append(slider('Resolution', { min: 2, max: 16, step: 1, value: s.bits, fmt: (v) => v + ' bits' }, (v) => { s.bits = v; p.redraw(); }),
    slider('Extra noise', { min: 0, max: 3, step: 0.05, value: s.noise, fmt: (v) => v.toFixed(2) + ' LSB' }, (v) => { s.noise = v; p.redraw(); }));
  p.redraw();
};

// p07-l18: complementary filter
W.compfilter = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { tau: 0.5, seed: 1 }; const fs = 200, dt = 1 / fs;
  const p = new Plot(body, { aspect: 0.6, maxH: 340, x: [0, 20], y: [-40, 50], label: 'Pitch from the gyro alone, the accelerometer alone and the complementary filter' });
  p.draw = (P) => {
    P.axes({ xl: 't [s]', yl: 'pitch [°]' }); const r = mulberry(s.seed); const a = s.tau / (s.tau + dt);
    let g = 0, f = 0; const X = [], T = [], G = [], A = [], F = []; let eg = 0, ea = 0, ef = 0; const n = 20 * fs;
    for (let i = 0; i < n; i++) { const t = i * dt; const th = 30 * Math.sin(2 * Math.PI * 0.2 * t) * (t > 2 ? 1 : 0); const thn = 30 * Math.sin(2 * Math.PI * 0.2 * (t + dt)) * (t + dt > 2 ? 1 : 0);
      const rate = (thn - th) / dt + 1.5 + 0.5 * randn(r); const acc = th + 4 * randn(r) + (t > 10 && t < 11 ? 15 : 0);
      g += rate * dt; f = a * (f + rate * dt) + (1 - a) * acc; eg += (g - thn) ** 2; ea += (acc - th) ** 2; ef += (f - thn) ** 2;
      if (i % 4 === 0) { X.push(t); T.push(th); G.push(g); A.push(acc); F.push(f); } }
    P.line(X, A, '#6fd3ff55', 1); P.line(X, G, C.bad, 1.5); P.line(X, T, C.dim, 1.5, [4, 3]); P.line(X, F, C.lime, 2.5);
    const rm = (e) => Math.sqrt(e / n).toFixed(2);
    read.innerHTML = `time constant τ = ${s.tau.toFixed(2)} s (α = ${a.toFixed(4)} at 200 Hz) · rms error: gyro only <b>${rm(eg)}°</b> (red, bias 1.5 °/s drifts) · accelerometer only <b>${rm(ea)}°</b> (blue, noisy, and fooled by a 1 s push at t = 10 s) · complementary <b>${rm(ef)}°</b> (lime)`;
  };
  ctrls.append(slider('Filter time constant τ', { min: 0.02, max: 5, step: 0.01, value: s.tau, fmt: (v) => v.toFixed(2) + ' s' }, (v) => { s.tau = v; p.redraw(); }),
    h('div', { class: 'btn-row' }, btn('New noise', () => { s.seed++; p.redraw(); }, 'cf-new')));
  p.redraw();
};

export default W;
