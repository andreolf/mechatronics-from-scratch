// Widgets for Phase 11 (communication buses). Sliders, selects, toggles and buttons only.
import { Plot, frame, slider, select, toggle, h, C } from './plot.js';

const W = {};
const btn = (t, f, id) => { const b = h('button', { class: 'btn btn-small', type: 'button', 'data-testid': id }, t); b.addEventListener('click', f); return b; };
const row = (...k) => h('div', { class: 'btn-row' }, ...k);
const hx = (v, n = 2) => (v >>> 0).toString(16).toUpperCase().padStart(n, '0');
function rect(P, x0, y0, x1, y1, fill, stroke) { P.poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], fill, stroke); }
function box(P, x0, y0, x1, y1, label, on, sub) {
  rect(P, x0, y0, x1, y1, on ? 'rgba(198,255,26,.16)' : '#15170f', on ? C.lime : C.rule2);
  const mid = (y0 + y1) / 2, dy = (y1 - y0) * 0.22;
  P.text(label, (x0 + x1) / 2, sub ? mid + dy * 0.3 : mid - dy * 0.35, on ? C.bone : C.fog, 'center');
  if (sub) P.text(sub, (x0 + x1) / 2, mid - dy * 1.25, C.dim, 'center');
}
// draw a digital level sequence as a step line: edges at xs (ascending), levels ls (same length), until xEnd
function steps(P, xs, ls, xEnd, y0, amp, color, w = 2) {
  const X = [], Y = [];
  for (let i = 0; i < xs.length; i++) { const x1 = i + 1 < xs.length ? xs[i + 1] : xEnd; X.push(xs[i], x1); Y.push(y0 + ls[i] * amp, y0 + ls[i] * amp); }
  P.line(X, Y, color, w);
}
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// p11-l01: UART frame and mid-bit sampling
function uartBits(byte, par) {
  const b = [0]; let ones = 0;
  for (let i = 0; i < 8; i++) { const v = (byte >> i) & 1; b.push(v); ones += v; }
  if (par !== 'N') b.push(par === 'E' ? ones & 1 : 1 - (ones & 1));
  b.push(1); return b;
}
W.uarttrace = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { byte: 0x4b, par: 'E', err: 0 };
  const p = new Plot(body, { aspect: 0.5, maxH: 280, x: [-0.6, 12.2], y: [-0.7, 1.9], label: 'UART frame with sampling points' });
  p.draw = (P) => {
    const bits = uartBits(s.byte, s.par), n = bits.length, bw = 1 + s.err / 100;
    const xs = [-0.6], ls = [1]; bits.forEach((v, i) => { xs.push(i * bw); ls.push(v); });
    for (let i = 0; i <= n; i++) P.line([i * bw, i * bw], [-0.05, 1.25], C.rule2, 1, [2, 4]);
    steps(P, xs, ls, 12.2, 0, 1, C.signal, 2.5);
    const names = ['S', '0', '1', '2', '3', '4', '5', '6', '7'].concat(s.par !== 'N' ? ['P'] : []).concat(['T']);
    names.forEach((t, i) => P.text(t, (i + 0.5) * bw, 1.45, C.fog, 'center'));
    let v = 0, ok = true, ones = 0;
    for (let k = 1; k < n; k++) {
      const x = k + 0.5, idx = Math.floor(x / bw), lvl = idx < n ? bits[idx] : 1, right = idx === k;
      if (!right) ok = false;
      P.dot(x, lvl, right ? C.lime : C.bad, 4.5);
      if (k <= 8) { v |= lvl << (k - 1); ones += lvl; }
    }
    P.text('samples at 1.5, 2.5, … bits', -0.5, -0.45, C.dim);
    const stopIdx = Math.floor((n - 0.5) / bw), stopOk = (stopIdx < n ? bits[stopIdx] : 1) === 1;
    read.innerHTML = `0x${hx(s.byte)} sent LSB first as 8${s.par}1, ${n} bit times · decoded <b>0x${hx(v)}</b> · ${ok ? '<b style="color:#c6ff1a">every sample inside its bit</b>' : `<b style="color:#ff6b5b">${stopOk && v === s.byte ? 'samples drifted into neighbouring bits' : 'wrong byte or framing error'}</b>`} · stop-bit sample drift ${((n - 0.5) * Math.abs(s.err)).toFixed(0)} % of a bit`;
  };
  ctrls.append(slider('Byte', { min: 0, max: 255, step: 1, value: s.byte, fmt: (v) => '0x' + hx(v) }, (v) => { s.byte = v; p.redraw(); }),
    select('Parity', [['N', 'None (8N1)'], ['E', 'Even (8E1)'], ['O', 'Odd (8O1)']], s.par, (v) => { s.par = v; p.redraw(); }, 'uart-par'),
    slider('Transmitter clock error', { min: -8, max: 8, step: 0.5, value: 0, fmt: (v) => v.toFixed(1) + ' %' }, (v) => { s.err = v; p.redraw(); }));
  p.redraw();
};

// p11-l02: 16x oversampling receiver with majority vote
W.uartrx = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { err: 3, spikes: true, byte: 0x5a };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [-4, 164], y: [-0.9, 1.8], label: 'Oversampled UART trace with voting samples' });
  p.draw = (P) => {
    const bits = uartBits(s.byte, 'N'), bl = 16 * (1 + s.err / 100), R = rng(7);
    const N = 164, line = [];
    for (let j = 0; j < N; j++) { const k = Math.floor(j / bl); line.push(k < bits.length ? bits[k] : 1); }
    const spk = [];
    if (s.spikes) for (let j = 6; j < N - 2; j += 9 + Math.floor(R() * 14)) { line[j] ^= 1; spk.push(j); }
    const xs = [-4], ls = [1]; for (let j = 0; j < N; j++) { xs.push(j); ls.push(line[j]); }
    steps(P, xs, ls, 164, 0, 1, C.signal, 1.8);
    for (let k = 0; k <= 10; k++) P.line([k * 16, k * 16], [-0.1, 1.2], C.rule2, 1, [2, 4]);
    spk.forEach((j) => P.dot(j + 0.5, 1.35, C.warn, 2.5));
    let v = 0, frameErr = false;
    for (let k = 0; k < 10; k++) {
      const base = 16 * k; let votes = 0;
      [7, 8, 9].forEach((o) => { const j = base + o; const lv = j < N ? line[j] : 1; votes += lv; P.dot(j, lv, Math.floor(j / bl) === k ? C.lime : C.bad, 3); });
      const b = votes >= 2 ? 1 : 0;
      P.text(String(b), base + 8, -0.55, b === bits[k] ? C.fog : C.bad, 'center');
      if (k >= 1 && k <= 8) v |= b << (k - 1);
      if (k === 9 && !b) frameErr = true;
    }
    const ok = v === s.byte && !frameErr;
    read.innerHTML = `sent 0x${hx(s.byte)} with the transmitter ${s.err >= 0 ? '+' : ''}${s.err.toFixed(1)} % ${s.err >= 0 ? 'slow' : 'fast'}${s.spikes ? `, ${spk.length} one-sample spikes (orange)` : ''} · votes at samples 7, 8, 9 of each bit · received <b>0x${hx(v)}</b>${frameErr ? ' with a <b>framing error</b>' : ''} · <b style="color:${ok ? C.lime : C.bad}">${ok ? 'ok' : 'corrupted'}</b>`;
  };
  ctrls.append(slider('Baud error', { min: -8, max: 8, step: 0.5, value: s.err, fmt: (v) => v.toFixed(1) + ' %' }, (v) => { s.err = v; p.redraw(); }),
    slider('Byte', { min: 0, max: 255, step: 1, value: s.byte, fmt: (v) => '0x' + hx(v) }, (v) => { s.byte = v; p.redraw(); }),
    row(toggle('Noise spikes', true, (v) => { s.spikes = v; p.redraw(); }, { id: 'rx-spk' })));
  p.redraw();
};

// p11-l03: which errors each check misses (computed live on a 16-byte message)
const T8 = [], T16 = [];
for (let b = 0; b < 256; b++) { let c = b; for (let i = 0; i < 8; i++) c = c & 0x80 ? ((c << 1) ^ 0x07) & 0xff : (c << 1) & 0xff; T8.push(c); let d = b << 8; for (let i = 0; i < 8; i++) d = d & 0x8000 ? ((d << 1) ^ 0x1021) & 0xffff : (d << 1) & 0xffff; T16.push(d); }
const crc8 = (a, n) => { let c = 0; for (let i = 0; i < n; i++) c = T8[c ^ a[i]]; return c; };
const crc16 = (a, n) => { let c = 0xffff; for (let i = 0; i < n; i++) c = ((c << 8) & 0xffff) ^ T16[(c >> 8) ^ a[i]]; return c; };
const CHECKS = [
  ['sum-8', 1, (a, n) => { let s = 0; for (let i = 0; i < n; i++) s += a[i]; return [s & 0xff]; }],
  ['xor-8', 1, (a, n) => { let s = 0; for (let i = 0; i < n; i++) s ^= a[i]; return [s]; }],
  ['CRC-8', 1, (a, n) => [crc8(a, n)]],
  ['CRC-16', 2, (a, n) => { const c = crc16(a, n); return [c >> 8, c & 0xff]; }],
];
const ERRS = { single: 'Single-bit', double: 'Two-bit', triple: 'Three-bit', burst8: 'Burst (up to 8 bits)', burst16: '16-bit burst', burst17: '17-bit burst', rand4: 'Four-bit random' };
function census(kind) {
  const R = rng(11), msg = []; for (let i = 0; i < 16; i++) msg.push(Math.floor(R() * 256));
  return CHECKS.map(([name, nc, f]) => {
    const cw = msg.concat(f(msg, 16)), L = cw.length * 8; let miss = 0, tot = 0;
    const test = (flips) => { const e = cw.slice(); flips.forEach((b) => { e[b >> 3] ^= 0x80 >> (b & 7); }); const got = f(e, 16); tot++; if (got.every((v, i) => v === e[16 + i])) miss++; };
    if (kind === 'single') for (let i = 0; i < L; i++) test([i]);
    else if (kind === 'double') for (let i = 0; i < L; i++) for (let j = i + 1; j < L; j++) test([i, j]);
    else if (kind === 'burst8') for (let len = 2; len <= 8; len++) for (let st = 0; st + len <= L; st++) for (let m = 0; m < 1 << (len - 2); m++) { const fl = [st, st + len - 1]; for (let k = 0; k < len - 2; k++) if ((m >> k) & 1) fl.push(st + 1 + k); test(fl); }
    else { const R2 = rng(5 + nc); const n = kind === 'burst17' ? 60000 : 20000; for (let t = 0; t < n; t++) {
      let fl = [];
      if (kind === 'triple' || kind === 'rand4') { const k = kind === 'triple' ? 3 : 4; const set = new Set(); while (set.size < k) set.add(Math.floor(R2() * L)); fl = [...set]; }
      else { const len = kind === 'burst16' ? 16 : 17, st = Math.floor(R2() * (L - len + 1)); fl = [st, st + len - 1]; for (let k = 1; k < len - 1; k++) if (R2() < 0.5) fl.push(st + k); }
      test(fl); } }
    return { name, miss, tot };
  });
}
W.crcdetect = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { kind: 'double' }; let res = census(s.kind);
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 4], y: [1e-6, 1], logy: true, label: 'Fraction of error patterns each check misses' });
  p.draw = (P) => {
    [1e-6, 1e-4, 1e-2, 1].forEach((v) => { P.line([0, 4], [v, v], C.rule, 1); P.text(v === 1 ? '1' : '1e' + Math.log10(v), 0, v * 1.25, C.dim, 'right'); });
    res.forEach((r, i) => {
      const f = r.miss / r.tot, top = Math.max(f, 1.2e-6), c = r.miss ? (i === 3 ? C.warn : C.bad) : C.lime;
      rect(P, i + 0.15, 1e-6, i + 0.85, top, c + '66', c);
      P.text(r.name, i + 0.5, 2.2e-6, C.bone, 'center');
      P.text(r.miss ? (f >= 1e-3 ? (f * 100).toFixed(2) + '%' : '1 in ' + Math.round(1 / f)) : 'none', i + 0.5, Math.max(top * 2.2, 8e-6), c, 'center');
    });
    read.innerHTML = `${ERRS[s.kind]} errors on a 16-byte message${['single', 'double', 'burst8'].includes(s.kind) ? ' (every pattern)' : ' (random sample)'}; sum-8 depends on the data, the CRCs don\'t: ` + res.map((r) => `${r.name} misses <b>${r.miss}</b> of ${r.tot}`).join(' · ');
  };
  ctrls.append(select('Error type', Object.entries(ERRS), s.kind, (v) => { s.kind = v; res = census(v); p.redraw(); }, 'crc-kind'));
  p.redraw();
};

// p11-l04: COBS encoding with code-byte pointers
const PKTS = { ex: [0x45, 0, 0, 0x2c, 0x4c, 0x79, 0, 0x05], a: [0x11, 0x22, 0, 0x33], z: [0, 0, 0, 0], nz: [1, 2, 3, 4, 5, 6, 7, 8, 9], one: [0] };
function cobs(inp) { const out = [0]; let ci = 0, code = 1; inp.forEach((b) => { if (b === 0) { out[ci] = code; ci = out.length; out.push(0); code = 1; } else { out.push(b); code++; if (code === 0xff) { out[ci] = code; ci = out.length; out.push(0); code = 1; } } }); out[ci] = code; return out; }
W.cobs = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { pk: 'ex', k: 99 };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [-0.2, 11.4], y: [0, 4.2], label: 'COBS raw and encoded bytes' });
  p.draw = (P) => {
    const raw = PKTS[s.pk], enc = cobs(raw), cell = (x, y, t, c, on) => { rect(P, x + 0.05, y, x + 0.95, y + 0.7, on ? c + '33' : '#15170f', on ? c : C.rule2); P.text(t, x + 0.5, y + 0.23, on ? C.bone : C.dim, 'center'); };
    P.text('packet', -0.1, 3.95, C.fog); raw.forEach((b, i) => cell(i, 3.05, hx(b), b ? C.signal : C.warn, true));
    P.text('COBS + delimiter', -0.1, 2.35, C.fog);
    const codes = []; let i = 0; while (i < enc.length) { codes.push(i); i += enc[i]; }
    enc.forEach((b, j) => cell(j, 1.45, hx(b), codes.includes(j) ? C.lime : C.signal, true)); cell(enc.length, 1.45, '00', C.warn, true);
    codes.forEach((j, n) => { if (n > s.k) return; const t = j + enc[j]; P.arrow(j + 0.5, 1.35, Math.min(t, enc.length) + 0.5, 1.0 - 0.0, C.lime, 1.6); P.text(`+${enc[j]}`, (j + Math.min(t, enc.length)) / 2 + 0.5, 0.55, C.lime, 'center'); });
    read.innerHTML = `${raw.length} bytes → ${enc.length} encoded + 00 delimiter · code bytes (lime) give the distance to the next zero position; the last one points at the end · no 00 inside the frame, so a receiver can always resynchronise at the next 00`;
  };
  ctrls.append(select('Packet', [['ex', '45 00 00 2C 4C 79 00 05'], ['a', '11 22 00 33'], ['z', 'four zeros'], ['nz', 'no zeros'], ['one', 'a single 00']], s.pk, (v) => { s.pk = v; p.redraw(); }, 'cobs-pk'));
  p.redraw();
};

// p11-l05: Modbus RTU transaction on RS-485
W.modbus = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { baud: 19200, n: 2, crcerr: false };
  const p = new Plot(body, { aspect: 0.62, maxH: 330, x: [0, 10], y: [0, 6], label: 'Modbus RTU request and response timeline' });
  p.draw = (P) => {
    box(P, 0.1, 4.7, 2.3, 5.8, 'Master', true); box(P, 3.9, 4.7, 6.1, 5.8, 'Pump 0x11', true); box(P, 7.6, 4.7, 9.9, 5.8, 'Meter 0x12', false);
    P.line([0.1, 9.9], [4.3, 4.3], C.signal, 2); P.line([0.1, 9.9], [4.1, 4.1], C.signal, 2); P.text('A/B twisted pair, 120 Ω at both ends', 0.1, 3.7, C.dim);
    [1.2, 5.0, 8.75].forEach((x) => P.line([x, x], [4.7, 4.3], C.rule2, 1.5));
    const ch = 11 / s.baud, g = s.baud <= 19200 ? 3.5 * ch : 1.75e-3, req = 8 * ch, resp = (5 + 2 * s.n) * ch, turn = 1.2e-3, tout = 0.1;
    const segs = [['request', req, C.lime, 2.6], ['3.5 char', g, C.rule2, 2.6], ['turnaround', turn, C.dim, 1.7], ['response', resp, C.signal, 1.7], ['3.5 char', g, C.rule2, 1.7]];
    if (s.crcerr) segs.splice(2, 3, ['bad CRC: silent', tout, C.bad, 1.7], ['retry', req, C.lime, 2.6], ['3.5 char', g, C.rule2, 2.6], ['turnaround', turn, C.dim, 1.7], ['response', resp, C.signal, 1.7], ['3.5 char', g, C.rule2, 1.7]);
    const total = segs.reduce((a, x) => a + x[1], 0);
    let t = 0; segs.forEach(([nm, d, c, y]) => { const x0 = 0.2 + (t / total) * 9.6, x1 = 0.2 + ((t + d) / total) * 9.6; rect(P, x0, y, x1, y + 0.55, c + '55', c); t += d; });
    P.text('master', 0.2, 3.25, C.fog); P.text('slave', 0.2, 2.35, C.fog);
    P.text(`0 … ${(total * 1e3).toFixed(1)} ms`, 0.2, 1.1, C.dim);
    const ok = (11 * (13 + 2 * s.n)) / s.baud + 2 * g + turn;
    read.innerHTML = `read ${s.n} register${s.n > 1 ? 's' : ''} at ${s.baud} baud: request 8 bytes = ${(req * 1e3).toFixed(2)} ms, response ${5 + 2 * s.n} bytes = ${(resp * 1e3).toFixed(2)} ms, gaps ${(g * 1e3).toFixed(2)} ms each · transaction <b>${(ok * 1e3).toFixed(2)} ms</b>${s.crcerr ? ` · with a corrupted request the master waits its 100 ms timeout and retries: <b>${(total * 1e3).toFixed(1)} ms</b>` : ''}`;
  };
  ctrls.append(select('Baud rate', [['9600', '9600'], ['19200', '19 200'], ['38400', '38 400'], ['115200', '115 200']], '19200', (v) => { s.baud = +v; p.redraw(); }, 'mb-baud'),
    slider('Registers', { min: 1, max: 20, step: 1, value: s.n, fmt: (v) => String(v) }, (v) => { s.n = v; p.redraw(); }),
    row(toggle('Corrupt the request', false, (v) => { s.crcerr = v; p.redraw(); }, { id: 'mb-err' })));
  p.redraw();
};

// p11-l06: I2C address byte with RC rising edges
W.i2ctrace = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { R: 2.2, Cb: 120, fast: true };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [-0.6, 11.2], y: [-0.4, 3.3], label: 'SDA and SCL with pull-up rise times' });
  p.draw = (P) => {
    const T = s.fast ? 2.5e-6 : 10e-6, tau = (s.R * 1e3 * s.Cb * 1e-12) / T, tr = 0.8473 * s.R * 1e3 * s.Cb * 1e-12, lim = s.fast ? 300e-9 : 1000e-9;
    // ideal levels at half-bit resolution: start, 8 bits (0x48<<1|0 = 0x90), ack (slave pulls low), then stop
    const byte = 0x90, half = []; // [t, scl, sda]
    half.push([-0.6, 1, 1], [-0.25, 1, 0], [0, 0, 0]);
    for (let i = 0; i < 9; i++) { const b = i < 8 ? (byte >> (7 - i)) & 1 : 0; half.push([i + 0.1, 0, b], [i + 0.5, 1, b], [i + 1, 0, b]); }
    half.push([9.1, 0, 0], [9.5, 1, 0], [9.9, 1, 1]);
    const draw = (key, y0, col) => {
      const X = [], Y = []; let lvl = half[0][key], t0 = -1, from = lvl, cur = lvl;
      const N = 900;
      for (let k = 0; k <= N; k++) {
        const t = -0.6 + (11.8 * k) / N;
        for (let j = half.length - 1; j >= 0; j--) if (half[j][0] <= t) { const target = half[j][key]; if (target !== lvl) { from = cur; t0 = half[j][0]; lvl = target; } break; }
        const dt = t - t0; cur = lvl ? 1 - (1 - from) * Math.exp(-dt / Math.max(tau, 1e-4)) : from * Math.exp(-dt / 0.01);
        X.push(t); Y.push(y0 + cur * 0.9);
      }
      P.line(X, Y, col, 2); P.text(key === 1 ? 'SCL' : 'SDA', -0.55, y0 + 1.05, col);
    };
    draw(1, 1.9, C.signal); draw(2, 0.2, C.lime);
    P.text('S', -0.25, -0.3, C.warn, 'center'); ['1', '0', '0', '1', '0', '0', '0', 'W', 'A'].forEach((t, i) => P.text(t, i + 0.5, -0.3, i === 8 ? C.lime : C.fog, 'center')); P.text('P', 9.9, -0.3, C.warn, 'center');
    const ok = tr <= lim, rmin = (3.3 - 0.4) / 3e-3;
    read.innerHTML = `address 0x48 + W, ACK, STOP at ${s.fast ? '400' : '100'} kHz · t_r = 0.8473·R·C = <b>${(tr * 1e9).toFixed(0)} ns</b> (limit ${lim * 1e9} ns) · R must be between ${(rmin / 1e3).toFixed(2)} kΩ and ${((lim / (0.8473 * s.Cb * 1e-12)) / 1e3).toFixed(2)} kΩ · <b style="color:${ok && s.R * 1e3 >= rmin ? C.lime : C.bad}">${!ok ? 'edges too slow' : s.R * 1e3 < rmin ? 'pull-up too strong for 3 mA' : 'ok'}</b>`;
  };
  ctrls.append(slider('Pull-up R', { min: 0.5, max: 10, step: 0.1, value: s.R, fmt: (v) => v.toFixed(1) + ' kΩ' }, (v) => { s.R = v; p.redraw(); }),
    slider('Bus capacitance', { min: 20, max: 400, step: 10, value: s.Cb, fmt: (v) => v + ' pF' }, (v) => { s.Cb = v; p.redraw(); }),
    row(toggle('Fast mode (400 kHz)', true, (v) => { s.fast = v; p.redraw(); }, { id: 'i2c-fast' })));
  p.redraw();
};

// p11-l07: IMU tilt, raw counts and recovered roll/pitch
W.imuaxes = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { roll: 30, pitch: 0, fs: 8 };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [-2.3, 2.3], y: [-1.25, 1.25], equal: true, label: 'Board tilt and gravity in the roll and pitch planes' });
  p.draw = (P) => {
    const r = (s.roll * Math.PI) / 180, q = (s.pitch * Math.PI) / 180, S = 32768 / s.fs;
    const a = [-Math.sin(q), Math.sin(r) * Math.cos(q), Math.cos(r) * Math.cos(q)], raw = a.map((v) => Math.max(-32768, Math.min(32767, Math.round(v * S))));
    const view = (cx, ang, lab, ax1, ax2) => {
      const c = Math.cos(ang), sn = Math.sin(ang), R = (x, y) => [cx + x * c - y * sn, x * sn + y * c];
      P.poly([R(-0.8, -0.12), R(0.8, -0.12), R(0.8, 0.12), R(-0.8, 0.12)], 'rgba(198,255,26,.14)', C.lime);
      const [zx, zy] = R(0, 0.8); P.arrow(cx, 0, zx, zy, C.signal, 2); P.text(ax2, zx + 0.05, zy + 0.05, C.signal);
      const [hx2, hy2] = R(0.95, 0); P.arrow(cx, 0, hx2, hy2, C.fog, 1.5); P.text(ax1, hx2 + 0.03, hy2 - 0.12, C.fog);
      P.arrow(cx, 0, cx, -0.95, C.warn, 2); P.text('g', cx + 0.06, -1.05, C.warn);
      P.text(lab, cx, 1.1, C.bone, 'center');
    };
    view(-1.15, r, `roll ${s.roll}°`, 'y', 'z'); view(1.15, -q, `pitch ${s.pitch}°`, 'x', 'z');
    const g = raw.map((v) => v / S), roll2 = (Math.atan2(g[1], g[2]) * 180) / Math.PI, pitch2 = (Math.atan2(-g[0], Math.hypot(g[1], g[2])) * 180) / Math.PI;
    read.innerHTML = `±${s.fs} g, ${S} LSB/g · raw (x, y, z) = (${raw.join(', ')}) = 0x${raw.map((v) => hx(v & 0xffff, 4)).join(' 0x')} · a = (${g.map((v) => v.toFixed(3)).join(', ')}) g · recovered roll <b>${roll2.toFixed(1)}°</b>, pitch <b>${pitch2.toFixed(1)}°</b>`;
  };
  ctrls.append(slider('Roll', { min: -90, max: 90, step: 1, value: s.roll, fmt: (v) => v + '°' }, (v) => { s.roll = v; p.redraw(); }),
    slider('Pitch', { min: -89, max: 89, step: 1, value: s.pitch, fmt: (v) => v + '°' }, (v) => { s.pitch = v; p.redraw(); }),
    select('Accelerometer range', [['2', '±2 g'], ['4', '±4 g'], ['8', '±8 g'], ['16', '±16 g']], '8', (v) => { s.fs = +v; p.redraw(); }, 'imu-fs'));
  p.redraw();
};

// p11-l08: SPI modes, master vs slave
function spiSim(mm, sm, tx, reply) {
  const mpol = mm >> 1, mpha = mm & 1, spol = sm >> 1, spha = sm & 1;
  const ev = []; // [t, sck level after]
  for (let i = 0; i < 8; i++) { ev.push([0.5 + i, 1 - mpol, i, 'lead']); ev.push([1 + i, mpol, i, 'trail']); }
  let miso = 0, sbit = 0, sin = 0, rx = 0, race = false; const misoT = [[-0.4, 0]], mosiT = [[-0.4, 0]], mSamp = [], sSamp = [];
  const put = (t) => { if (sbit < 8) { miso = (reply >> (7 - sbit)) & 1; misoT.push([t, miso]); } sbit++; };
  if (!spha) put(0.02);
  // master MOSI changes
  const mosiAt = []; for (let i = 0; i < 8; i++) mosiAt.push([mpha ? 0.5 + i : (i === 0 ? 0.02 : i), (tx >> (7 - i)) & 1]);
  let mosi = 0, mi = 0; const changedAt = new Set(mosiAt.map((x) => x[0])), slaveChanged = new Set(spha ? [] : [0.02]);
  ev.forEach(([t, lvl, i, kind]) => {
    while (mi < mosiAt.length && mosiAt[mi][0] < t) { mosi = mosiAt[mi][1]; mosiT.push([mosiAt[mi][0], mosi]); mi++; }
    const mSample = (mpha === 0) === (kind === 'lead');
    let pending = mi < mosiAt.length && mosiAt[mi][0] === t;
    if (mSample) { rx = (rx << 1) | miso; mSamp.push([t, miso]); }
    const sLead = lvl !== spol, sSample = spha ? !sLead : sLead;
    if (sSample) { sin = ((sin << 1) | mosi) & 0xff; sSamp.push([t, mosi]); if (changedAt.has(t)) race = true; }
    else { put(t); slaveChanged.add(t); if (mSample) race = true; }
    if (pending) { mosi = mosiAt[mi][1]; mosiT.push([t, mosi]); mi++; }
  });
  return { rx: rx & 0xff, sin, race, misoT, mosiT, mSamp, sSamp, ev };
}
W.spimodes = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { mm: 0, sm: 0 };
  const p = new Plot(body, { aspect: 0.62, maxH: 330, x: [-1.1, 9.4], y: [-0.3, 7.6], label: 'SPI CS, SCK, MOSI and MISO with sample points' });
  p.draw = (P) => {
    const r = spiSim(s.mm, s.sm, 0xa5, 0x3c), mpol = s.mm >> 1;
    const rowY = { cs: 6.2, sck: 4.4, mosi: 2.6, miso: 0.8 };
    P.text('CS', -1.05, rowY.cs + 0.35, C.fog); P.text('SCK', -1.05, rowY.sck + 0.35, C.fog); P.text('MOSI', -1.05, rowY.mosi + 0.35, C.fog); P.text('MISO', -1.05, rowY.miso + 0.35, C.fog);
    steps(P, [-0.4, 0, 9.0], [1, 0, 1], 9.4, rowY.cs, 0.9, C.dim);
    const sx = [-0.4], sl = [mpol]; r.ev.forEach(([t, l]) => { sx.push(t); sl.push(l); }); steps(P, sx, sl, 9.4, rowY.sck, 0.9, C.signal);
    steps(P, r.mosiT.map((x) => x[0]), r.mosiT.map((x) => x[1]), 9.4, rowY.mosi, 0.9, C.lime);
    steps(P, r.misoT.map((x) => x[0]), r.misoT.map((x) => x[1]), 9.4, rowY.miso, 0.9, C.warn);
    r.mSamp.forEach(([t, v]) => { P.line([t, t], [rowY.miso - 0.15, rowY.sck + 1.05], C.rule2, 1, [2, 3]); P.dot(t, rowY.miso + v * 0.9, C.bone, 3.5); });
    r.sSamp.forEach(([t, v]) => P.dot(t, rowY.mosi + v * 0.9, C.signal, 3.5));
    const ok = r.rx === 0x3c && r.sin === 0xa5 && !r.race;
    read.innerHTML = `master mode ${s.mm} (CPOL ${s.mm >> 1}, CPHA ${s.mm & 1}) sends 0xA5, slave mode ${s.sm} replies 0x3C · white dots: master samples MISO; blue: slave samples MOSI · master got <b>0x${hx(r.rx)}</b>, slave got <b>0x${hx(r.sin)}</b>${r.race ? ' · <b style="color:#ff6b5b">a side samples on the edge where the other changes: hold-time race</b>' : ''} · <b style="color:${ok ? C.lime : C.bad}">${ok ? 'modes match' : 'mismatch'}</b>`;
  };
  const opts = [0, 1, 2, 3].map((m) => [String(m), `Mode ${m} (CPOL ${m >> 1}, CPHA ${m & 1})`]);
  ctrls.append(select('Master mode', opts, '0', (v) => { s.mm = +v; p.redraw(); }, 'spi-m'), select('Slave mode', opts, '0', (v) => { s.sm = +v; p.redraw(); }, 'spi-s'));
  p.redraw();
};

// p11-l09: SPI + DMA throughput
W.spidma = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { fs: 250, br: 2, proc: 0.04 };
  const p = new Plot(body, { aspect: 0.6, maxH: 320, x: [0, 3], y: [0, 4], label: 'Sample slots, SPI words and the throughput gauge' });
  p.draw = (P) => {
    const sck = 84 / 2 ** (s.br + 1), tconv = 0.7, gap = 0.1, word = 16 / sck, tsamp = tconv + word + gap, T = 1000 / s.fs, fits = tsamp <= T;
    for (let k = 0; k < 3; k++) {
      const x0 = k; rect(P, x0 + 0.01, 2.4, x0 + 0.99, 3.4, '#15170f', C.rule2);
      const sc = (us) => x0 + 0.01 + (0.98 * us) / T;
      rect(P, sc(0), 2.9, sc(Math.min(T, tconv)), 3.3, C.warn + '66', C.warn); rect(P, sc(Math.min(T, tconv)), 2.9, sc(Math.min(T, tconv + word)), 3.3, C.lime + '66', C.lime);
      if (tconv + word > T) P.line([x0 + 0.99, x0 + 0.99], [2.4, 3.4], C.bad, 3);
      P.text(`${T.toFixed(2)} µs`, x0 + 0.5, 2.55, C.dim, 'center');
    }
    P.text('conversion', 0.02, 3.6, C.warn); P.text('16-bit word', 1.1, 3.6, C.lime);
    const util = tsamp / T; rect(P, 0.05, 1.2, 2.95, 1.7, '#15170f', C.rule2); rect(P, 0.05, 1.2, 0.05 + 2.9 * Math.min(1, util), 1.7, (fits ? C.lime : C.bad) + '66', fits ? C.lime : C.bad);
    P.text(`bus busy ${(util * 100).toFixed(0)} % of each slot`, 0.07, 1.85, C.fog);
    const halfMs = 512 / s.fs, procOk = s.proc + 0.0012 < halfMs; const load = (s.fs * 1000 / 512) * (s.proc + 0.0012) / 1000;
    rect(P, 0.05, 0.2, 0.05 + 2.9 * Math.min(1, (s.proc + 0.0012) / halfMs), 0.6, (procOk ? C.signal : C.bad) + '66', procOk ? C.signal : C.bad); rect(P, 0.05, 0.2, 2.95, 0.6, null, C.rule2);
    P.text(`processing vs ${halfMs.toFixed(2)} ms half-buffer`, 0.07, 0.75, C.fog);
    read.innerHTML = `SCK ${sck} MHz · sample ${tsamp.toFixed(3)} µs, slot ${T.toFixed(2)} µs → ${fits ? `<b style="color:#c6ff1a">${s.fs} kS/s fits</b> (max ${(1000 / tsamp).toFixed(0)} kS/s)` : `<b style="color:#ff6b5b">doesn't fit</b> (max ${(1000 / tsamp).toFixed(0)} kS/s)`} · ${(s.fs * 1000 / 512).toFixed(0)} DMA interrupts/s, CPU ${(load * 100).toFixed(1)} % · ${procOk ? 'halves processed in time' : '<b style="color:#ff6b5b">DMA overwrites a half still being read</b>'} · an interrupt per sample would cost ${(s.fs * 1.2 / 10).toFixed(0)} %`;
  };
  ctrls.append(slider('Target rate', { min: 50, max: 600, step: 10, value: s.fs, fmt: (v) => v + ' kS/s' }, (v) => { s.fs = v; p.redraw(); }),
    select('SCK', [['0', '42 MHz'], ['1', '21 MHz'], ['2', '10.5 MHz'], ['3', '5.25 MHz'], ['4', '2.625 MHz']], '2', (v) => { s.br = +v; p.redraw(); }, 'dma-sck'),
    slider('Processing per half', { min: 0.01, max: 4, step: 0.01, value: s.proc, fmt: (v) => v.toFixed(2) + ' ms' }, (v) => { s.proc = v; p.redraw(); }));
  p.redraw();
};

// p11-l10: CAN arbitration grid
W.canarb = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { ids: [0x65a, 0x658, 0x6f0] };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [-1.6, 12], y: [0, 4.6], label: 'CAN arbitration bit by bit' });
  p.draw = (P) => {
    const f = s.ids.map((id) => { const b = []; for (let k = 10; k >= 0; k--) b.push((id >> k) & 1); b.push(0); return b; });
    const active = [true, true, true], drop = [-1, -1, -1], bus = [];
    for (let k = 0; k < 12; k++) {
      const v = Math.min(...f.filter((_, n) => active[n]).map((b) => b[k])); bus.push(v);
      f.forEach((b, n) => { if (active[n] && b[k] === 1 && v === 0) { active[n] = false; drop[n] = k; } });
    }
    const names = ['A', 'B', 'C'], cols = [C.lime, C.signal, C.warn];
    for (let k = 0; k < 12; k++) P.text(k < 11 ? String(10 - k) : 'R', k + 0.5, 4.25, C.dim, 'center');
    f.forEach((b, n) => {
      P.text(names[n], -1.5, 3.25 - n + 0.1, cols[n]);
      for (let k = 0; k < 12; k++) {
        const out = drop[n] >= 0 && k > drop[n], lost = k === drop[n];
        rect(P, k + 0.06, 3.0 - n, k + 0.94, 3.75 - n, out ? '#0d0e0c' : b[k] ? '#15170f' : cols[n] + '55', lost ? C.bad : out ? C.rule : C.rule2);
        if (!out) P.text(String(b[k]), k + 0.5, 3.22 - n, lost ? C.bad : C.bone, 'center');
      }
    });
    P.text('bus', -1.5, 0.35, C.bone);
    bus.forEach((v, k) => { rect(P, k + 0.06, 0.1, k + 0.94, 0.85, v ? '#15170f' : C.bone + '44', C.rule2); P.text(String(v), k + 0.5, 0.32, C.bone, 'center'); });
    const w = active.findIndex((a) => a), dup = new Set(s.ids).size < 3;
    read.innerHTML = dup ? '<b style="color:#ff6b5b">two nodes share an ID: both win arbitration and collide in the data field</b>' : `${names.map((nm, n) => `${nm} = 0x${hx(s.ids[n], 3)}${drop[n] >= 0 ? ` drops at ID bit ${10 - drop[n]}` : ''}`).join(' · ')} · <b>${names[w]} wins with 0x${hx(s.ids[w], 3)}</b>, the lowest ID, and the bus carried its bits unchanged`;
  };
  ['A', 'B', 'C'].forEach((nm, n) => ctrls.append(slider(`Node ${nm} ID`, { min: 0, max: 2047, step: 1, value: s.ids[n], fmt: (v) => '0x' + hx(v, 3) }, (v) => { s.ids[n] = v; p.redraw(); })));
  p.redraw();
};

// p11-l11: CAN frame bits with stuffing, and DBC signals
function crc15(bits) { let c = 0; bits.forEach((b) => { const n = b ^ ((c >> 14) & 1); c = (c << 1) & 0x7fff; if (n) c ^= 0x4599; }); return c; }
const tob = (v, n) => { const o = []; for (let i = n - 1; i >= 0; i--) o.push((v / 2 ** i) & 1 ? 1 : 0); return o; };
function stuffMark(bits) { const out = []; let run = 0, last = -1; bits.forEach((b) => { out.push([b, 0]); run = b === last ? run + 1 : 1; last = b; if (run === 5) { out.push([1 - b, 1]); last = 1 - b; run = 1; } }); return out; }
W.candbc = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { speed: 1500, cur: -12.5, temp: 65, st: 3 };
  const p = new Plot(body, { aspect: 0.62, maxH: 330, x: [-0.2, 27.2], y: [-0.2, 6.8], label: 'CAN frame bits with stuff bits highlighted' });
  p.draw = (P) => {
    const raw = [Math.round(s.speed / 0.125) & 0xffff, Math.round(s.cur / 0.1) & 0xfff, (s.temp + 40) & 0xff, s.st & 7];
    let lo = raw[0] + raw[1] * 65536, hi = raw[2] + raw[3] * 256; // bits 0..27 in lo, bits 28.. in hi
    const bytes = []; for (let i = 0; i < 8; i++) { const bit0 = i * 8; let v = 0; for (let k = 0; k < 8; k++) { const b = bit0 + k, bit = b < 28 ? Math.floor(lo / 2 ** b) & 1 : Math.floor(hi / 2 ** (b - 28)) & 1; v |= bit << k; } bytes.push(v); }
    const head = [0].concat(tob(0x123, 11), [0, 0, 0], tob(8, 4)); bytes.forEach((b) => head.push(...tob(b, 8)));
    const body2 = head.concat(tob(crc15(head), 15)), st = stuffMark(body2).concat([[1, 0], [0, 0], [1, 0]], Array(10).fill([1, 0]));
    const nStuff = st.filter((x) => x[1]).length;
    st.forEach(([b, isS], i) => { const r = Math.floor(i / 27), c = i % 27, y = 6.0 - r * 1.15; rect(P, c + 0.08, y, c + 0.92, y + 0.75, isS ? C.warn + 'aa' : b ? '#15170f' : C.signal + '66', isS ? C.warn : C.rule2); });
    P.text('filled = dominant 0 · orange = stuff bit', 0, -0.05, C.dim);
    read.innerHTML = `ID 0x123, data ${bytes.map((b) => hx(b)).join(' ')} · ${111} bits + <b>${nStuff} stuff bits</b> = ${st.length} bits (worst case 135) · decoded: Speed <b>${(raw[0] * 0.125).toFixed(3)} rpm</b>, Current <b>${(((raw[1] ^ 0x800) - 0x800) * 0.1).toFixed(1)} A</b>, Temp <b>${raw[2] - 40} °C</b>, State <b>${raw[3]}</b>`;
  };
  ctrls.append(slider('Speed', { min: 0, max: 8000, step: 12.5, value: s.speed, fmt: (v) => v + ' rpm' }, (v) => { s.speed = v; p.redraw(); }),
    slider('Current', { min: -204.8, max: 204.7, step: 0.1, value: s.cur, fmt: (v) => v.toFixed(1) + ' A' }, (v) => { s.cur = v; p.redraw(); }),
    slider('Temperature', { min: -40, max: 215, step: 1, value: s.temp, fmt: (v) => v + ' °C' }, (v) => { s.temp = v; p.redraw(); }));
  p.redraw();
};

// p11-l12: CiA 402 state machine
const ST = { SOD: ['Switch on disabled', 0x40, 1.0, 3.3], RTSO: ['Ready to switch on', 0x21, 1.0, 2.3], SO: ['Switched on', 0x23, 1.0, 1.3], OE: ['Operation enabled', 0x27, 1.0, 0.3], QSA: ['Quick stop active', 0x07, 3.0, 0.3], FRA: ['Fault reaction', 0x0f, 3.0, 3.3], FAULT: ['Fault', 0x08, 3.0, 2.3] };
function cmdOf(cw) { if ((cw & 0x8f) === 0x0f) return 'en'; if ((cw & 0x8f) === 0x07) return 'on'; if ((cw & 0x87) === 0x06) return 'sd'; if ((cw & 0x86) === 0x02) return 'qs'; if ((cw & 0x82) === 0) return 'dv'; return null; }
const NEXT = { SOD: { sd: 'RTSO' }, RTSO: { on: 'SO', en: 'OE', dv: 'SOD', qs: 'SOD' }, SO: { en: 'OE', sd: 'RTSO', dv: 'SOD', qs: 'SOD' }, OE: { on: 'SO', sd: 'RTSO', dv: 'SOD', qs: 'QSA' }, QSA: { dv: 'SOD', en: 'OE' } };
W.cia402 = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { st: 'SOD', cw: 0, msg: 'power-up: the drive initialises and goes to Switch on disabled' };
  const p = new Plot(body, { aspect: 0.72, maxH: 360, x: [0, 4], y: [0, 4], label: 'CiA 402 drive state machine' });
  p.draw = (P) => {
    P.line([1.0, 1.0], [3.05, 0.55], C.rule2, 1.5); P.line([1.75, 2.25], [0.3, 0.3], C.rule2, 1.5); P.line([3.0, 3.0], [3.05, 2.55], C.rule2, 1.5); P.line([2.25, 1.75], [2.3, 3.3], C.rule2, 1, [3, 3]);
    Object.entries(ST).forEach(([k, [nm, , x, y]]) => box(P, x - 0.95, y - 0.25, x + 0.95, y + 0.25, nm, s.st === k));
    const sw = ST[s.st][1] | 0x200 | (['RTSO', 'SO', 'OE', 'QSA'].includes(s.st) ? 0x10 : 0) | (['RTSO', 'SO', 'OE'].includes(s.st) ? 0x20 : 0);
    read.innerHTML = `${s.msg} · controlword <b>0x${hx(s.cw, 4)}</b> · statusword <b>0x${hx(sw, 4)}</b> · state <b>${ST[s.st][0]}</b>`;
  };
  const send = (cw, label) => {
    const prev = s.cw; s.cw = cw; const from = s.st;
    if (s.st === 'FAULT') { if (!(prev & 0x80) && cw & 0x80) s.st = 'SOD'; }
    else if (!(cw & 0x80) && s.st !== 'FRA') { const n = (NEXT[s.st] || {})[cmdOf(cw)]; if (n) s.st = n; }
    s.msg = s.st === from ? `${label} (0x${hx(cw, 2)}) is not a transition from ${ST[from][0]}: ignored` : `${label}: ${ST[from][0]} → ${ST[s.st][0]}`;
    p.redraw();
  };
  ctrls.append(row(btn('Shutdown 06', () => send(0x06, 'Shutdown'), 'cia-sd'), btn('Switch on 07', () => send(0x07, 'Switch on'), 'cia-on'), btn('Enable 0F', () => send(0x0f, 'Enable operation'), 'cia-en')),
    row(btn('Disable voltage 00', () => send(0x00, 'Disable voltage'), 'cia-dv'), btn('Quick stop 02', () => send(0x02, 'Quick stop'), 'cia-qs')),
    row(btn('Inject fault', () => { const f = s.st; s.st = 'FAULT'; s.msg = `fault in ${ST[f][0]} → Fault reaction active → Fault`; p.redraw(); }, 'cia-fault'), btn('Fault reset 80', () => send(0x80, 'Fault reset (bit 7)'), 'cia-rst')));
  p.redraw();
};

// p11-l13: EtherCAT chain and cycle time
W.ethercat = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { n: 10, b: 2, L: 1 };
  const p = new Plot(body, { aspect: 0.55, maxH: 300, x: [0, 10], y: [0, 5], label: 'EtherCAT frame through a chain of slaves' });
  p.draw = (P) => {
    const show = Math.min(s.n, 7);
    box(P, 0.05, 3.2, 1.1, 4.6, 'M', true);
    for (let i = 0; i < show; i++) { const x = 1.5 + i * 1.18; box(P, x, 3.4, x + 0.95, 4.4, i === show - 1 && s.n > 7 ? String(s.n) : i === show - 2 && s.n > 7 ? '…' : String(i + 1), true); }
    P.arrow(1.1, 4.1, 9.7, 4.1, C.lime, 1.4); P.arrow(9.7, 3.7, 1.1, 3.7, C.signal, 1.4);
    P.text('out, on the fly', 1.2, 4.7, C.lime); P.text('back', 1.2, 2.95, C.signal);
    const payload = 2 + 10 + s.n * s.b + 2, fb = Math.max(46, payload) + 38, tf = fb * 0.08, td = s.n * 0.6 + (s.n - 1) * 0.1, tc = (2 * s.n * s.L * 5) / 1000, tot = tf + td + tc;
    const sc = 9.6 / tot; let x = 0.2;
    [['frame', tf, C.lime], ['slaves', td, C.signal], ['cable', tc, C.warn]].forEach(([nm, v, c]) => { rect(P, x, 1.2, x + v * sc, 2.0, c + '66', c); if (v * sc > 1.3) P.text(nm, x + 0.08, 1.45, C.bone); x += v * sc; });
    P.text(`cycle ≥ ${tot.toFixed(2)} µs`, 0.2, 0.5, C.bone);
    read.innerHTML = `${s.n} slaves × ${s.b} bytes, ${s.L} m cables · frame ${fb} bytes = ${tf.toFixed(2)} µs · slave delays ${s.n}×0.6 + ${s.n - 1}×0.1 = ${td.toFixed(1)} µs (illustrative) · cable ${tc.toFixed(2)} µs · <b>minimum cycle ${tot.toFixed(2)} µs</b> · expected WKC ${3 * s.n}${payload > 1500 ? ' · <b style="color:#ff6b5b">over 1500 bytes: needs a second frame</b>' : ''}`;
  };
  ctrls.append(slider('Slaves', { min: 1, max: 100, step: 1, value: s.n, fmt: (v) => String(v) }, (v) => { s.n = v; p.redraw(); }),
    slider('Bytes per slave', { min: 1, max: 32, step: 1, value: s.b, fmt: (v) => String(v) }, (v) => { s.b = v; p.redraw(); }),
    slider('Cable per hop', { min: 0.3, max: 50, step: 0.1, value: s.L, fmt: (v) => v.toFixed(1) + ' m' }, (v) => { s.L = v; p.redraw(); }));
  p.redraw();
};

// p11-l14: telemetry dashboard over a simulated lossy link
W.telemetry = (el) => {
  const { body, read, ctrls } = frame(el);
  const s = { loss: 2, rto: 100, qos: 1 };
  const p = new Plot(body, { aspect: 0.62, maxH: 330, x: [0, 12], y: [0, 260], label: 'Telemetry latency per sample with the 95th percentile' });
  p.draw = (P) => {
    P.axes({ xl: 't [s]', yl: 'ms' });
    const R = rng(21), lat = [], vals = []; let lost = 0;
    for (let k = 0; k < 600; k++) {
      let l = 8 - 4 * Math.log(1 - R()), tries = 0;
      while (R() < s.loss / 100) { if (!s.qos) { l = null; break; } l += s.rto; tries++; if (tries > 6) break; }
      if (l === null) { lost++; continue; }
      lat.push(l); vals.push([k / 50, l]);
    }
    const srt = lat.slice().sort((a, b) => a - b), q = (pp) => srt[Math.min(srt.length - 1, Math.floor((pp / 100) * srt.length))];
    P.fn((t) => 225 + 20 * Math.sin(2 * Math.PI * 0.25 * t), C.lime + '88', 1.5); P.text('temperature', 0.1, 247, C.lime);
    vals.forEach(([t, l]) => P.dot(t, Math.min(l, 200), l > 200 ? C.bad : C.signal, 1.8));
    P.line([0, 12], [30, 30], C.warn, 1.5, [5, 4]); P.text('target 30 ms', 9.0, 34, C.warn);
    const p95 = q(95); P.line([0, 12], [p95, p95], C.bone, 1.5); P.text('p95', 0.1, p95 + 4, C.bone);
    read.innerHTML = `QoS ${s.qos}, ${s.loss} % loss, resend after ${s.rto} ms · delivered <b>${(((600 - lost) / 600) * 100).toFixed(1)} %</b> · p50 ${q(50).toFixed(1)} ms · <b>p95 ${p95.toFixed(1)} ms</b> · p99 ${q(99).toFixed(1)} ms · <b style="color:${p95 < 30 ? C.lime : C.bad}">${p95 < 30 ? 'meets' : 'misses'} the 30 ms target</b>`;
  };
  ctrls.append(slider('Packet loss', { min: 0, max: 20, step: 0.5, value: s.loss, fmt: (v) => v.toFixed(1) + ' %' }, (v) => { s.loss = v; p.redraw(); }),
    slider('Resend timeout', { min: 20, max: 500, step: 10, value: s.rto, fmt: (v) => v + ' ms' }, (v) => { s.rto = v; p.redraw(); }),
    select('Quality of service', [['1', 'QoS 1 (at least once)'], ['0', 'QoS 0 (at most once)']], '1', (v) => { s.qos = +v; p.redraw(); }, 'mq-qos'));
  p.redraw();
};

export default W;
