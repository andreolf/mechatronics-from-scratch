// Widgets for Phase 06 (digital logic). Taps, toggles, sliders and selects only.
import { Plot, frame, slider, select, toggle, h, C } from './plot.js';

const W = {};
function mulberry(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const btn = (t, f, id) => { const b = h('button', { class: 'btn btn-small', type: 'button', 'data-testid': id }, t); b.addEventListener('click', f); return b; };
// draw a digital trace: values[] sampled at xs[], drawn at baseline y0 with height hgt
function trace(P, xs, vals, y0, hgt, color) { const X = [], Y = []; for (let i = 0; i < xs.length; i++) { if (i) { X.push(xs[i]); Y.push(y0 + hgt * vals[i - 1]); } X.push(xs[i]); Y.push(y0 + hgt * vals[i]); } P.line(X, Y, color, 2); }

// p06-l01: eight bit toggles, unsigned and two's complement
W.bits = (el) => {
  const { body, read, ctrls } = frame(el);
  const bits = [0, 0, 0, 0, 0, 1, 0, 1];
  const p = new Plot(body, { aspect: 0.32, maxH: 160, x: [-0.5, 7.5], y: [0, 1.2], label: 'An 8-bit register' });
  const tg = [];
  p.draw = (P) => {
    for (let i = 0; i < 8; i++) { const on = bits[i]; P.poly([[i - 0.42, 0.15], [i - 0.42, 0.95], [i + 0.42, 0.95], [i + 0.42, 0.15]], on ? '#c6ff1a55' : '#24271f', on ? C.lime : C.dim); P.text(String(on), i, 0.45, on ? C.lime : C.fog, 'center'); P.text(`b${7 - i}`, i, 1.05, C.dim, 'center'); }
    const u = bits.reduce((a, b) => a * 2 + b, 0), s = u >= 128 ? u - 256 : u;
    read.innerHTML = `binary <b>${bits.join('')}</b> · hex 0x${u.toString(16).toUpperCase().padStart(2, '0')} · unsigned <b>${u}</b> · two's complement <b>${s}</b>${bits[0] ? ' · MSB set: negative, −128 + ' + (u - 128) : ''}`;
  };
  const grid = h('div', { class: 'bit-grid' });
  for (let i = 0; i < 8; i++) { const t = toggle(`b${7 - i}`, !!bits[i], (v) => { bits[i] = v ? 1 : 0; p.redraw(); }, { id: `bit-${7 - i}` }); tg.push(t); grid.append(t); }
  const row = h('div', { class: 'btn-row' }, btn('Negate (invert + 1)', () => { let u = bits.reduce((a, b) => a * 2 + b, 0); u = (256 - u) & 255; for (let i = 0; i < 8; i++) { bits[i] = (u >> (7 - i)) & 1; tg[i].setAttribute('aria-pressed', String(!!bits[i])); } p.redraw(); }, 'bits-negate'));
  ctrls.append(grid, row);
  p.redraw();
};

// p06-l02: Q15 multiply error histogram, rounding vs truncation
W.q15 = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { mode: 'round' };
  const p = new Plot(body, { aspect: 0.5, maxH: 280, x: [-1.2, 1.2], y: [0, 1.1], label: 'Histogram of Q15 multiply error in LSBs' });
  p.draw = (P) => {
    P.axes({ xl: 'error [LSB = 2^-15]' }); const r = mulberry(7), nb = 48, bins = new Float64Array(nb); let mx = 0, sum = 0; const N = 20000;
    for (let i = 0; i < N; i++) { const a = Math.floor(r() * 65536) - 32768, b = Math.floor(r() * 65536) - 32768; const prod = a * b; let q = s.mode === 'round' ? Math.floor((prod + 16384) / 32768) : Math.floor(prod / 32768); q = Math.max(-32768, Math.min(32767, q)); const e = q - prod / 32768; mx = Math.max(mx, Math.abs(e)); sum += e; const k = Math.floor((e + 1.2) / 2.4 * nb); if (k >= 0 && k < nb) bins[k]++; }
    const top = Math.max(...bins); for (let k = 0; k < nb; k++) { const x0 = -1.2 + k * 2.4 / nb, hh = bins[k] / top; P.poly([[x0, 0], [x0, hh], [x0 + 2.4 / nb, hh], [x0 + 2.4 / nb, 0]], '#c6ff1a44', '#c6ff1a99'); }
    read.innerHTML = `${N.toLocaleString('en')} random Q15 × Q15 products · ${s.mode === 'round' ? 'round to nearest' : 'truncate (shift right)'} · max |error| <b>${mx.toFixed(3)} LSB</b> · mean error <b>${(sum / N).toFixed(3)} LSB</b>${s.mode === 'round' ? '' : ' (biased)'}`;
  };
  ctrls.append(select('Rounding', [['round', 'Round to nearest'], ['trunc', 'Truncate']], 'round', (v) => { s.mode = v; p.redraw(); }, 'q15-mode'));
  p.redraw();
};

// p06-l03: 4-variable K-map with prime-implicant cover
export function minimise(ones, nvar = 4) {
  const N = 1 << nvar, on = new Set(ones); if (!on.size) return []; if (on.size === N) return [{ mask: 0, val: 0 }];
  const cubes = [];
  for (let mask = 0; mask < N; mask++) for (let val = 0; val < N; val++) { if (val & ~mask & (N - 1)) continue; const cov = []; for (let m = 0; m < N; m++) if ((m & mask) === val) cov.push(m); if (cov.every((m) => on.has(m))) cubes.push({ mask, val, cov }); }
  const primes = cubes.filter((c) => !cubes.some((d) => d !== c && d.cov.length > c.cov.length && c.cov.every((m) => d.cov.includes(m))));
  const left = new Set(ones), pick = [];
  for (const m of [...left]) { const cs = primes.filter((c) => c.cov.includes(m)); if (cs.length === 1 && !pick.includes(cs[0])) pick.push(cs[0]); }
  pick.forEach((c) => c.cov.forEach((m) => left.delete(m)));
  while (left.size) { let best = null, bn = 0; for (const c of primes) { const n = c.cov.filter((m) => left.has(m)).length; if (n > bn) { bn = n; best = c; } } pick.push(best); best.cov.forEach((m) => left.delete(m)); }
  return pick;
}
const termStr = (c, names = 'ABCD') => { if (!c.mask) return '1'; let s = ''; for (let i = 0; i < 4; i++) { const bit = 1 << (3 - i); if (c.mask & bit) s += names[i] + (c.val & bit ? '' : '′'); } return s; };
W.kmap = (el) => {
  const { body, read, ctrls } = frame(el);
  const on = new Set([1, 3, 5, 7, 13, 15]);
  const gray = [0, 1, 3, 2];
  const p = new Plot(body, { aspect: 0.62, maxH: 300, x: [-0.8, 4.2], y: [-0.2, 4.6], label: 'Karnaugh map: rows AB, columns CD' });
  const cellOf = (m) => { const ab = m >> 2, cd = m & 3; return [gray.indexOf(cd), 3 - gray.indexOf(ab)]; };
  p.draw = (P) => {
    const cover = minimise([...on]); const cols = ['#c6ff1a', '#6fd3ff', '#ffb547', '#ff6b5b', '#eceee6', '#a4a89c'];
    for (let m = 0; m < 16; m++) { const [cx, cy] = cellOf(m); P.poly([[cx + 0.05, cy + 0.05], [cx + 0.95, cy + 0.05], [cx + 0.95, cy + 0.95], [cx + 0.05, cy + 0.95]], on.has(m) ? '#c6ff1a22' : '#0d0e0c', C.rule2); P.text(on.has(m) ? '1' : '0', cx + 0.5, cy + 0.42, on.has(m) ? C.lime : C.dim, 'center'); P.text(String(m), cx + 0.86, cy + 0.12, C.dim, 'right'); }
    cover.forEach((c, k) => c.cov.forEach((m) => { const [cx, cy] = cellOf(m); const d = 0.1 + 0.04 * k; P.poly([[cx + d, cy + d], [cx + 1 - d, cy + d], [cx + 1 - d, cy + 1 - d], [cx + d, cy + 1 - d]], null, cols[k % cols.length]); }));
    ['00', '01', '11', '10'].forEach((t, i) => { P.text(t, i + 0.5, 4.15, C.fog, 'center'); P.text(t, -0.15, 3 - i + 0.42, C.fog, 'right'); });
    P.text('CD →', 4.15, 4.42, C.dim, 'right'); P.text('AB', -0.15, 4.42, C.dim, 'right');
    read.innerHTML = `minterms {${[...on].sort((a, b) => a - b).join(', ')}} · minimal sum of products: <b>F = ${cover.map((c) => termStr(c)).join(' + ') || '0'}</b> · ${cover.length} term${cover.length === 1 ? '' : 's'}`;
  };
  const grid = h('div', { class: 'bit-grid' });
  for (let m = 0; m < 16; m++) grid.append(toggle(`m${m}`, on.has(m), (v) => { v ? on.add(m) : on.delete(m); p.redraw(); }, { id: `kmap-${m}` }));
  ctrls.append(grid);
  p.redraw();
};

// p06-l04: CMOS NAND / NOR as switches
W.cmos = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { gate: 'nand', A: 1, B: 0 };
  const p = new Plot(body, { aspect: 0.62, maxH: 320, x: [0, 10], y: [0, 10], label: 'CMOS gate: PMOS pull-up network above, NMOS pull-down below' });
  p.draw = (P) => {
    const { A, B } = s, nand = s.gate === 'nand';
    const pA = !A, pB = !B, nA = !!A, nB = !!B; // PMOS conducts on 0, NMOS on 1
    const up = nand ? pA || pB : pA && pB, down = nand ? nA && nB : nA || nB, out = up ? 1 : 0;
    const sw = (x, y, onv, label, col) => { P.poly([[x - 0.9, y - 0.6], [x + 0.9, y - 0.6], [x + 0.9, y + 0.6], [x - 0.9, y + 0.6]], onv ? col + '55' : '#24271f', onv ? col : C.dim); P.text(label + (onv ? ' on' : ' off'), x, y - 0.15, onv ? C.bone : C.dim, 'center'); };
    P.line([1, 9], [9.4, 9.4], C.warn, 2); P.text('VDD', 9.6, 9.3, C.warn); P.line([1, 9], [0.6, 0.6], C.fog, 2); P.text('GND', 9.6, 0.5, C.fog);
    if (nand) { sw(3, 7.6, pA, 'P_A', '#6fd3ff'); sw(7, 7.6, pB, 'P_B', '#6fd3ff'); P.line([3, 3], [9.4, 8.2], C.dim, 1.5); P.line([7, 7], [9.4, 8.2], C.dim, 1.5); P.line([3, 3, 7, 7], [7, 5.6, 5.6, 7], C.dim, 1.5); sw(5, 4, nA, 'N_A', '#c6ff1a'); sw(5, 2, nB, 'N_B', '#c6ff1a'); P.line([5, 5], [5.6, 4.6], C.dim, 1.5); P.line([5, 5], [3.4, 2.6], C.dim, 1.5); P.line([5, 5], [1.4, 0.6], C.dim, 1.5); }
    else { sw(5, 8, pA, 'P_A', '#6fd3ff'); sw(5, 6.2, pB, 'P_B', '#6fd3ff'); P.line([5, 5], [9.4, 8.6], C.dim, 1.5); P.line([5, 5], [7.4, 6.8], C.dim, 1.5); P.line([5, 5], [5.6, 4.6], C.dim, 1.5); P.line([3, 3, 7, 7], [3.4, 4.6, 4.6, 3.4], C.dim, 1.5); sw(3, 2.8, nA, 'N_A', '#c6ff1a'); sw(7, 2.8, nB, 'N_B', '#c6ff1a'); P.line([3, 3], [2.2, 0.6], C.dim, 1.5); P.line([7, 7], [2.2, 0.6], C.dim, 1.5); }
    P.dot(5, nand ? 5.6 : 4.6, out ? C.lime : C.fog, 6); P.line([5, 8.6], [nand ? 5.6 : 4.6, nand ? 5.6 : 4.6], out ? C.lime : C.fog, 2); P.text(`Y = ${out}`, 8.7, (nand ? 5.6 : 4.6) - 0.15, out ? C.lime : C.fog);
    read.innerHTML = `${nand ? 'NAND: PMOS in parallel, NMOS in series' : 'NOR: PMOS in series, NMOS in parallel'} · A = ${A}, B = ${B} · pull-up ${up ? '<b>conducts</b>' : 'open'}, pull-down ${down ? '<b>conducts</b>' : 'open'} · <b>Y = ${out}</b> · never both: no static current`;
  };
  ctrls.append(select('Gate', [['nand', 'NAND'], ['nor', 'NOR']], 'nand', (v) => { s.gate = v; p.redraw(); }, 'cmos-gate'),
    h('div', { class: 'btn-row' }, toggle('A', true, (v) => { s.A = v ? 1 : 0; p.redraw(); }, { id: 'cmos-a' }), toggle('B', false, (v) => { s.B = v ? 1 : 0; p.redraw(); }, { id: 'cmos-b' })));
  p.redraw();
};

// p06-l05: ripple-carry adder timing
W.adder = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { a: 15, b: 1, kind: 'ripple' };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 10], y: [-0.5, 4.5], label: 'When each sum bit settles, in gate delays' });
  p.draw = (P) => {
    P.axes({ xl: 'time [gate delays]' }); let c = 0; const bits = []; const settle = [];
    for (let i = 0; i < 4; i++) { const ai = (s.a >> i) & 1, bi = (s.b >> i) & 1; const sum = ai ^ bi ^ c; const cout = (ai & bi) | (c & (ai ^ bi)); bits.push(sum); settle.push(s.kind === 'ripple' ? 2 * i + 2 : i ? 4 : 2); c = cout; }
    for (let i = 0; i < 4; i++) { const y = i; P.poly([[0, y + 0.15], [settle[i], y + 0.15], [settle[i], y + 0.75], [0, y + 0.75]], '#ffb54744', C.warn); P.text(`S${i} = ${bits[i]}`, settle[i] + 0.2, y + 0.3, C.lime); }
    const total = Math.max(...settle) + (s.kind === 'ripple' ? 0 : 0);
    read.innerHTML = `${s.a} + ${s.b} = <b>${s.a + s.b}</b> (sum ${bits.slice().reverse().join('')}, carry out ${c}) · ${s.kind === 'ripple' ? 'ripple carry: S_i waits for carry i, about 2 gate delays per bit' : 'carry look-ahead: every carry from the generate/propagate terms in parallel'} · worst bit settles after <b>${total}</b> delays (amber = still changing)`;
  };
  ctrls.append(slider('A', { min: 0, max: 15, step: 1, value: s.a, fmt: (v) => `${v} (${v.toString(2).padStart(4, '0')})` }, (v) => { s.a = v; p.redraw(); }),
    slider('B', { min: 0, max: 15, step: 1, value: s.b, fmt: (v) => `${v} (${v.toString(2).padStart(4, '0')})` }, (v) => { s.b = v; p.redraw(); }),
    select('Adder', [['ripple', 'Ripple carry'], ['cla', 'Carry look-ahead']], 'ripple', (v) => { s.kind = v; p.redraw(); }, 'adder-kind'));
  p.redraw();
};

// p06-l06: static hazard: Y = A AND (NOT A) with inverter delay
W.glitch = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { d: 2 };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 20], y: [-0.3, 4.6], label: 'Waveforms: A, delayed NOT A, and Y = A·(NOT A)' });
  p.draw = (P) => {
    P.axes({ xl: 't [ns]' }); const xs = [], A = [], NA = [], Y = [];
    for (let t = 0; t <= 20; t += 0.05) { const a = t >= 5 && t < 14 ? 1 : 0; const ad = (t - s.d >= 5 && t - s.d < 14) ? 1 : 0; const na = 1 - ad; const td = t - 1; const ya = (td >= 5 && td < 14 ? 1 : 0) & (1 - ((td - s.d >= 5 && td - s.d < 14) ? 1 : 0)); xs.push(t); A.push(a); NA.push(na); Y.push(ya); }
    trace(P, xs, A, 3.2, 1, C.signal); trace(P, xs, NA, 1.7, 1, C.warn); trace(P, xs, Y, 0.1, 1, C.lime);
    P.text('A', 0.3, 3.5, C.signal); P.text('NOT A', 0.3, 2.0, C.warn); P.text('Y', 0.3, 0.4, C.lime);
    read.innerHTML = `inverter delay <b>${s.d.toFixed(1)} ns</b>, AND gate 1 ns · logically Y = A·A′ = 0 always, but Y pulses high for <b>${s.d.toFixed(1)} ns</b> after A rises: a glitch an event-driven simulator shows and a truth table hides`;
  };
  ctrls.append(slider('Inverter delay', { min: 0, max: 5, step: 0.1, value: s.d, fmt: (v) => v.toFixed(1) + ' ns' }, (v) => { s.d = v; p.redraw(); }));
  p.redraw();
};

// p06-l07: D latch vs D flip-flop
W.dff = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { seed: 3 };
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 16], y: [-0.3, 6.2], label: 'Clock, data, latch output and flip-flop output' });
  p.draw = (P) => {
    P.axes({ xl: 't [half clock periods]' }); const r = mulberry(s.seed); const xs = [], clk = [], D = [], L = [], F = []; let d = 0, l = 0, f = 0, pc = 0, changes = 0, fch = 0;
    const flips = new Set(Array.from({ length: 9 }, () => Math.round(r() * 300) / 20));
    for (let i = 0; i <= 320; i++) { const t = i / 20; const c = Math.floor(t) % 2 === 1 ? 1 : 0; if (flips.has(t)) d = 1 - d; if (c) { if (l !== d) changes++; l = d; } if (c && !pc) { if (f !== d) fch++; f = d; } pc = c; xs.push(t); clk.push(c); D.push(d); L.push(l); F.push(f); }
    trace(P, xs, clk, 4.8, 0.9, C.fog); trace(P, xs, D, 3.3, 0.9, C.signal); trace(P, xs, L, 1.8, 0.9, C.warn); trace(P, xs, F, 0.3, 0.9, C.lime);
    for (let t = 1; t < 16; t += 2) P.line([t, t], [-0.3, 6.2], '#c6ff1a33', 1, [2, 3]);
    P.text('CLK', 15.9, 5.85, C.fog, 'right'); P.text('D', 15.9, 4.35, C.signal, 'right'); P.text('latch Q', 15.9, 2.85, C.warn, 'right'); P.text('flip-flop Q', 15.9, 1.35, C.lime, 'right');
    read.innerHTML = `latch is transparent while CLK = 1 (output changed ${changes}×) · flip-flop samples D only on rising edges (dotted lines; changed ${fch}×) · flip-flop output never changes between edges`;
  };
  ctrls.append(h('div', { class: 'btn-row' }, btn('New data pattern', () => { s.seed++; p.redraw(); }, 'dff-new')));
  p.redraw();
};

// p06-l08: lift-gate FSM
export const GATE_FSM = {
  CLOSED: { open: 'OPENING' }, OPENING: { limit_open: 'OPEN', obstacle: 'OPENING', timeout: 'FAULT' },
  OPEN: { close: 'CLOSING', timer: 'CLOSING' }, CLOSING: { limit_closed: 'CLOSED', obstacle: 'OPENING', timeout: 'FAULT' }, FAULT: { reset: 'CLOSED' },
};
W.fsm = (el) => {
  const { body, read, ctrls } = frame(el);
  let st = 'CLOSED', last = '—';
  const pos = { CLOSED: [1.5, 3], OPENING: [5, 5], OPEN: [8.5, 3], CLOSING: [5, 1], FAULT: [5, 3] };
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 10], y: [0, 6], label: 'Lift-gate state machine' });
  p.draw = (P) => {
    const edges = [['CLOSED', 'OPENING'], ['OPENING', 'OPEN'], ['OPEN', 'CLOSING'], ['CLOSING', 'CLOSED'], ['CLOSING', 'OPENING'], ['OPENING', 'FAULT'], ['CLOSING', 'FAULT'], ['FAULT', 'CLOSED']];
    for (const [a, b] of edges) { const [x0, y0] = pos[a], [x1, y1] = pos[b]; const k = 0.72 / Math.hypot(x1 - x0, y1 - y0); P.arrow(x0 + (x1 - x0) * k * 1.4, y0 + (y1 - y0) * k, x1 - (x1 - x0) * k * 1.4, y1 - (y1 - y0) * k, C.dim, 1.5); }
    for (const [n, [x, y]] of Object.entries(pos)) { const a = n === st; P.poly([[x - 1.25, y - 0.45], [x + 1.25, y - 0.45], [x + 1.25, y + 0.45], [x - 1.25, y + 0.45]], a ? (n === 'FAULT' ? '#ff6b5b55' : '#c6ff1a44') : '#0d0e0c', a ? (n === 'FAULT' ? C.bad : C.lime) : C.rule2); P.text(n, x, y - 0.12, a ? C.bone : C.fog, 'center'); }
    read.innerHTML = `state <b>${st}</b> · last event: ${last} · motor ${st === 'OPENING' ? 'up' : st === 'CLOSING' ? 'down' : 'off'} · an obstacle while closing always reverses; events with no transition are ignored`;
  };
  const ev = (e) => () => { last = e; st = (GATE_FSM[st] && GATE_FSM[st][e]) || st; p.redraw(); };
  ctrls.append(h('div', { class: 'btn-row' }, ...['open', 'limit_open', 'close', 'limit_closed', 'obstacle', 'timeout', 'reset'].map((e) => btn(e.replace('_', ' '), ev(e), 'fsm-' + e))));
  p.redraw();
};

// p06-l09: quadrature encoder x4 decoding
W.quadrature = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { cpr: 8, rev: 1.5 };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 10], y: [-0.4, 3.4], label: 'Channels A and B and the decoded count' });
  p.draw = (P) => {
    P.axes({ xl: 't [s]' }); const xs = [], A = [], B = [], cnt = []; let c = 0, prev = null; const tbl = [0, -1, 1, 0, 1, 0, 0, -1, -1, 0, 0, 1, 0, 1, -1, 0];
    let mx = 1; const pts = [];
    for (let i = 0; i <= 2000; i++) { const t = i / 200; const ang = s.rev * Math.sin(Math.PI * t / 10 * 2) * 360; const ph = ang / 360 * s.cpr * 4; const k = ((Math.floor(ph) % 4) + 4) % 4; const a = k === 1 || k === 2 ? 1 : 0, b = k >= 2 ? 1 : 0; const st = (a << 1) | b; if (prev !== null) c += tbl[(prev << 2) | st]; prev = st; xs.push(t); A.push(a); B.push(b); pts.push([t, c, Math.floor(ph) - 0]); mx = Math.max(mx, Math.abs(c)); }
    trace(P, xs, A, 2.4, 0.8, C.signal); trace(P, xs, B, 1.3, 0.8, C.warn);
    const sc = 1 / (s.rev * s.cpr * 4 || 1); P.line(xs, pts.map((q) => 0.5 + 0.45 * q[1] * sc), C.lime, 2); P.line(xs, pts.map((q) => 0.5 + 0.45 * q[2] * sc), C.bone, 1, [3, 3]);
    P.text('A', 0.1, 3.0, C.signal); P.text('B', 0.1, 1.9, C.warn);
    const truth = Math.floor(s.rev * Math.sin(Math.PI * 2) * 360 / 360 * s.cpr * 4);
    read.innerHTML = `${s.cpr} lines/rev × 4 = ${s.cpr * 4} counts/rev · shaft swings ±${s.rev} rev and back · decoded count (lime) follows the true angle (dashed) through the reversal · final count <b>${c}</b>`;
  };
  ctrls.append(slider('Lines per revolution', { min: 1, max: 32, step: 1, value: s.cpr, fmt: (v) => String(v) }, (v) => { s.cpr = v; p.redraw(); }),
    slider('Swing', { min: 0.25, max: 3, step: 0.25, value: s.rev, fmt: (v) => '±' + v + ' rev' }, (v) => { s.rev = v; p.redraw(); }));
  p.redraw();
};

// p06-l10: Fibonacci LFSR
export const TAPS = { 3: [3, 2], 4: [4, 3], 5: [5, 3], 6: [6, 5], 7: [7, 6], 8: [8, 6, 5, 4], 9: [9, 5], 10: [10, 7], 11: [11, 9], 12: [12, 11, 10, 4], 16: [16, 15, 13, 4] };
export function lfsrPeriod(n, taps, seed = 1) { let s = seed, k = 0; do { let b = 0; for (const t of taps) b ^= (s >> (n - t)) & 1; s = (s >> 1) | (b << (n - 1)); k++; } while (s !== seed && k < 1 << 17); return k; }
W.lfsr = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { n: 4, steps: 0, bad: false };
  const p = new Plot(body, { aspect: 0.4, maxH: 200, x: [-0.5, 11.5], y: [0, 1.6], label: 'LFSR register contents' });
  let reg = 1;
  p.draw = (P) => {
    const taps = s.bad ? [s.n, s.n - 2 > 0 ? s.n - 2 : 1] : TAPS[s.n];
    for (let i = 0; i < s.n; i++) { const bit = (reg >> (s.n - 1 - i)) & 1, tap = taps.includes(i + 1); P.poly([[i - 0.42, 0.3], [i - 0.42, 1.1], [i + 0.42, 1.1], [i + 0.42, 0.3]], bit ? '#c6ff1a55' : '#24271f', tap ? C.warn : C.dim); P.text(String(bit), i, 0.6, bit ? C.lime : C.fog, 'center'); if (tap) P.text('tap', i, 1.3, C.warn, 'center'); }
    const per = lfsrPeriod(s.n, taps);
    read.innerHTML = `${s.n}-bit LFSR, taps ${taps.join(', ')}${s.bad ? ' (not maximal)' : ' (maximal)'} · state ${reg.toString(2).padStart(s.n, '0')} after ${s.steps} shifts · period <b>${per}</b> ${per === (1 << s.n) - 1 ? `= 2^${s.n} − 1` : `< 2^${s.n} − 1 = ${(1 << s.n) - 1}`}`;
  };
  const step = () => { const taps = s.bad ? [s.n, s.n - 2 > 0 ? s.n - 2 : 1] : TAPS[s.n]; let b = 0; for (const t of taps) b ^= (reg >> (s.n - t)) & 1; reg = (reg >> 1) | (b << (s.n - 1)); s.steps++; p.redraw(); };
  ctrls.append(select('Length', Object.keys(TAPS).map((k) => [k, k + ' bits']), '4', (v) => { s.n = +v; reg = 1; s.steps = 0; p.redraw(); }, 'lfsr-n'),
    h('div', { class: 'btn-row' }, btn('Shift', step, 'lfsr-step'), btn('Shift ×10', () => { for (let i = 0; i < 10; i++) step(); }, 'lfsr-step10'), toggle('Wrong taps', false, (v) => { s.bad = v; reg = 1; s.steps = 0; p.redraw(); }, { id: 'lfsr-bad' })));
  p.redraw();
};

// p06-l11: synchroniser MTBF
W.mtbf = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { fclk: 100, fd: 1, tau: 20 };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0.5, 3.5], y: [1e-6, 1e30], logy: true, label: 'Mean time between failures against synchroniser depth' });
  const T0 = 100e-12;
  const mtbf = (n) => { const tr = (n - 1) / (s.fclk * 1e6) * 0.9; return Math.exp(tr / (s.tau * 1e-12)) / (T0 * s.fclk * 1e6 * s.fd * 1e6); };
  p.draw = (P) => {
    P.axes({ xl: 'flip-flops in synchroniser', yl: 'MTBF [s]' }); P.line([0.5, 3.5], [3.15e7, 3.15e7], C.dim, 1, [4, 4]); P.text('1 year', 0.6, 6e7, C.dim);
    P.line([0.5, 3.5], [4.4e17, 4.4e17], C.dim, 1, [4, 4]); P.text('age of the universe', 0.6, 9e17, C.dim);
    [1, 2, 3].forEach((n) => { const m = Math.min(1e30, mtbf(n)); P.poly([[n - 0.25, 1e-6], [n - 0.25, m], [n + 0.25, m], [n + 0.25, 1e-6]], '#c6ff1a55', C.lime); });
    const fmt = (v) => v > 3.15e7 ? (v / 3.15e7).toExponential(1) + ' years' : v.toExponential(1) + ' s';
    read.innerHTML = `f<sub>clk</sub> ${s.fclk} MHz, data ${s.fd} MHz, τ ${s.tau} ps, T<sub>0</sub> 100 ps · 1 flop (no settling time): <b>${fmt(mtbf(1))}</b> · 2 flops: <b>${fmt(mtbf(2))}</b> · 3 flops: ${fmt(mtbf(3))}`;
  };
  ctrls.append(slider('Clock', { min: 10, max: 500, step: 10, value: s.fclk, fmt: (v) => v + ' MHz' }, (v) => { s.fclk = v; p.redraw(); }),
    slider('Async event rate', { min: 0.01, max: 50, step: 0.01, value: s.fd, fmt: (v) => v + ' MHz' }, (v) => { s.fd = v; p.redraw(); }),
    slider('Resolution time constant τ', { min: 5, max: 60, step: 1, value: s.tau, fmt: (v) => v + ' ps' }, (v) => { s.tau = v; p.redraw(); }));
  p.redraw();
};

// p06-l12: counter debouncer
export function bouncy(seed = 4, n = 600) { const r = mulberry(seed); const out = []; for (let i = 0; i < n; i++) { const t = i; let v; if (t < 100) v = 0; else if (t < 100 + 25) v = r() < (t - 100) / 25 ? 1 : 0; else if (t < 330) v = 1; else if (t < 330 + 30) v = r() < 1 - (t - 330) / 30 ? 1 : 0; else v = 0; out.push(v); } return out; }
export function debounce(x, N) { let cnt = 0, st = x[0]; return x.map((v) => { if (v !== st) { cnt++; if (cnt >= N) { st = v; cnt = 0; } } else cnt = 0; return st; }); }
W.debounce = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { N: 8 };
  const p = new Plot(body, { aspect: 0.5, maxH: 280, x: [0, 600], y: [-0.3, 2.8], label: 'Raw contact (top) and debounced output (bottom), 1 ms samples' });
  p.draw = (P) => {
    P.axes({ xl: 't [ms]' }); const x = bouncy(), y = debounce(x, s.N), xs = x.map((_, i) => i);
    trace(P, xs, x, 1.6, 0.9, C.warn); trace(P, xs, y, 0.1, 0.9, C.lime);
    const raw = x.slice(1).filter((v, i) => v && !x[i]).length, clean = y.slice(1).filter((v, i) => v && !y[i]).length;
    read.innerHTML = `counter debouncer: accept a new level after <b>${s.N}</b> identical samples (${s.N} ms) · raw rising edges <b>${raw}</b> · debounced presses <b>${clean}</b>${clean === 1 ? ' ✓' : ''} · added delay ${s.N} ms`;
  };
  ctrls.append(slider('Samples required', { min: 1, max: 40, step: 1, value: s.N, fmt: (v) => v + ' (ms)' }, (v) => { s.N = v; p.redraw(); }));
  p.redraw();
};

// p06-l13: flash wear heat map
W.flash = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { writes: 20000, mode: 'level' };
  const pages = 64, endurance = 10000;
  const p = new Plot(body, { aspect: 0.5, maxH: 260, x: [0, 16], y: [0, 4], label: 'Erase count of 64 flash pages' });
  p.draw = (P) => {
    const wear = new Array(pages).fill(0); const pageWrites = 16; // records per page before erase
    const erases = Math.ceil(s.writes / pageWrites);
    if (s.mode === 'level') for (let e = 0; e < erases; e++) wear[e % pages]++; else wear[0] = erases;
    const mx = Math.max(...wear);
    wear.forEach((w, i) => { const x = i % 16, y = 3 - Math.floor(i / 16); const f = Math.min(1, w / endurance); const col = f >= 1 ? '#ff6b5b' : `rgba(198,255,26,${0.12 + 0.8 * f})`; P.poly([[x + 0.05, y + 0.05], [x + 0.95, y + 0.05], [x + 0.95, y + 0.95], [x + 0.05, y + 0.95]], col, C.rule2); });
    read.innerHTML = `${s.writes.toLocaleString('en')} parameter writes, 16 records per page, endurance ${endurance.toLocaleString('en')} erases · ${s.mode === 'level' ? 'wear-levelled ring of 64 pages' : 'one fixed page'} · worst page erased <b>${mx.toLocaleString('en')}×</b> (${(100 * mx / endurance).toFixed(1)} % of life)${mx > endurance ? ' · <b>worn out</b>' : ''}`;
  };
  ctrls.append(slider('Writes', { min: 1000, max: 10000000, step: 1000, value: s.writes, fmt: (v) => v.toLocaleString('en') }, (v) => { s.writes = v; p.redraw(); }),
    select('Strategy', [['level', 'Wear levelling (ring)'], ['fixed', 'Same page every time']], 'level', (v) => { s.mode = v; p.redraw(); }, 'flash-mode'));
  p.redraw();
};

// p06-l14: SAR binary search
W.sar = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { vin: 2.137, n: 8 }; const vref = 3.3;
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0.5, 12.5], y: [0, 3.3], label: 'SAR trial voltages converging on the input' });
  p.draw = (P) => {
    P.axes({ xl: 'bit trial', yl: 'V' }); let code = 0; const xs = [], ys = [];
    for (let k = s.n - 1; k >= 0; k--) { const trial = code | (1 << k); const vd = trial * vref / (1 << s.n); const keep = s.vin >= vd; if (keep) code = trial; xs.push(s.n - k); ys.push(vd); P.dot(s.n - k, vd, keep ? C.lime : C.bad, 5); }
    P.line([0.5, 12.5], [s.vin, s.vin], C.signal, 1.5, [4, 3]); P.line(xs, ys, C.dim, 1);
    const lsb = vref / (1 << s.n);
    read.innerHTML = `V<sub>in</sub> ${s.vin.toFixed(3)} V, V<sub>ref</sub> 3.3 V, ${s.n} bits · code <b>${code}</b> (${code.toString(2).padStart(s.n, '0')}) · LSB ${(lsb * 1000).toFixed(2)} mV · error ${((s.vin - code * lsb) / lsb).toFixed(2)} LSB (0 to 1: SAR truncates) · lime = bit kept, red = bit cleared`;
  };
  ctrls.append(slider('Input voltage', { min: 0, max: 3.29, step: 0.001, value: s.vin, fmt: (v) => v.toFixed(3) + ' V' }, (v) => { s.vin = v; p.redraw(); }),
    slider('Resolution', { min: 2, max: 12, step: 1, value: s.n, fmt: (v) => v + ' bits' }, (v) => { s.n = v; p.redraw(); }));
  p.redraw();
};

// p06-l15: R-2R DAC DNL with tolerance
W.r2r = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { tol: 0.1, seed: 1 }; const n = 8;
  const p = new Plot(body, { aspect: 0.5, maxH: 280, x: [0, 255], y: [-1.5, 1.5], label: 'Differential non-linearity of an 8-bit R-2R DAC' });
  p.draw = (P) => {
    P.axes({ xl: 'code', yl: 'DNL [LSB]' }); const r = mulberry(s.seed); const t = s.tol / 100; const rnd = () => 1 + t * (2 * r() - 1);
    const R = Array.from({ length: n }, rnd), R2 = Array.from({ length: n + 1 }, () => 2 * rnd());
    // bit weights by superposition on the ladder (exact Thevenin reduction from the LSB end)
    const weight = (bit) => { // drive bit `bit` with 1 V, others at 0 V; output at MSB node, open circuit
      let rth = R2[0], vth = 0; // termination 2R at LSB end
      for (let k = 0; k < n; k++) { const rb = R2[k + 1]; const vin = k === bit ? 1 : 0; const v = (vth / rth + vin / rb) / (1 / rth + 1 / rb); const rp = 1 / (1 / rth + 1 / rb); if (k === n - 1) return v; vth = v; rth = rp + R[k]; }
    };
    const w = Array.from({ length: n }, (_, b) => weight(b)); const out = (c) => w.reduce((a, wb, b) => a + ((c >> b) & 1) * wb, 0);
    const lsb = (out(255) - out(0)) / 255; let worst = 0, mono = true; const xs = [], ys = [];
    for (let c = 1; c < 256; c++) { const d = (out(c) - out(c - 1)) / lsb - 1; worst = Math.max(worst, Math.abs(d)); if (out(c) < out(c - 1)) mono = false; xs.push(c); ys.push(d); }
    P.line(xs, ys, C.lime, 1.5); P.line([0, 255], [-1, -1], C.bad, 1, [4, 3]);
    read.innerHTML = `resistor tolerance ±${s.tol} % · worst |DNL| <b>${worst.toFixed(3)} LSB</b> (largest at the 127→128 major carry) · ${mono ? '<b>monotonic</b>' : '<b>not monotonic</b> (DNL < −1)'} · red: −1 LSB`;
  };
  ctrls.append(slider('Resistor tolerance', { min: 0.01, max: 2, step: 0.01, value: s.tol, fmt: (v) => '±' + v.toFixed(2) + ' %' }, (v) => { s.tol = v; p.redraw(); }),
    h('div', { class: 'btn-row' }, btn('New resistor set', () => { s.seed++; p.redraw(); }, 'r2r-new')));
  p.redraw();
};

// p06-l16: counter as clock divider
W.clockdiv = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { n: 3 };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 64], y: [-0.3, 5.4], label: 'Clock and counter bits q[0] to q[3]' });
  p.draw = (P) => {
    P.axes({ xl: 'clock cycles' }); const xs = [], clk = []; const q = [[], [], [], []];
    for (let i = 0; i <= 128; i++) { const t = i / 2; xs.push(t); clk.push(i % 2 === 0 ? 1 : 0); const c = Math.floor(t + 0.0001) ; for (let b = 0; b < 4; b++) q[b].push((c >> b) & 1); }
    trace(P, xs, clk, 4.3, 0.8, C.fog); for (let b = 0; b < 4; b++) trace(P, xs, q[b], 3.1 - 1.05 * b, 0.8, b === s.n - 1 ? C.lime : C.dim);
    read.innerHTML = `bit q[${s.n - 1}] (lime) toggles every 2^${s.n - 1} = ${1 << (s.n - 1)} cycles · its period is 2^${s.n} = <b>${1 << s.n}</b> clock cycles · f<sub>out</sub> = f<sub>clk</sub>/${1 << s.n} · at 12 MHz: <b>${(12e6 / (1 << s.n)).toLocaleString('en')} Hz</b>`;
  };
  ctrls.append(slider('Use bit', { min: 1, max: 4, step: 1, value: s.n, fmt: (v) => `q[${v - 1}] (÷${1 << v})` }, (v) => { s.n = v; p.redraw(); }));
  p.redraw();
};

export default W;
