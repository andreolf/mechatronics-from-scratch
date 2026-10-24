// Minimal 2D plotting for lesson widgets: world-to-screen mapping, axes, lines, arrows. Capped DPR, resizes with its box.
import { h, slider, select, toggle } from '../ui.js';
export { h, slider, select, toggle };
export const C = { lime: '#c6ff1a', signal: '#6fd3ff', warn: '#ffb547', bad: '#ff6b5b', bone: '#eceee6', fog: '#a4a89c', dim: '#767b6e', rule: '#24271f', rule2: '#353a2d', bg: '#0d0e0c' };
const MONO = '500 12px "JetBrains Mono Variable", ui-monospace, monospace';

export class Plot {
  constructor(parent, { aspect = 0.62, maxH = 420, x = [-1, 1], y = [-1, 1], equal = false, logx = false, logy = false, label = 'Interactive figure' } = {}) {
    this.cv = h('canvas', { role: 'img', 'aria-label': label });
    parent.append(this.cv);
    Object.assign(this, { aspect, maxH, xr: x, yr: y, equal, logx, logy });
    this.ctx = this.cv.getContext('2d'); this.draw = () => {};
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(parent);
    this.resize();
  }
  resize() {
    const w = Math.max(200, this.cv.parentElement.clientWidth), hh = Math.min(this.maxH, Math.round(w * this.aspect));
    const d = Math.min(2, window.devicePixelRatio || 1);
    this.cv.width = Math.round(w * d); this.cv.height = Math.round(hh * d); this.cv.style.height = hh + 'px';
    this.W = w; this.H = hh; this.ctx.setTransform(d, 0, 0, d, 0, 0); this.layout(); this.redraw();
  }
  layout() {
    const pad = { l: 44, r: 12, t: 12, b: 28 }; this.pad = pad;
    let [x0, x1] = this.xr, [y0, y1] = this.yr;
    const fx = (v) => (this.logx ? Math.log10(v) : v), fy = (v) => (this.logy ? Math.log10(v) : v);
    const pw = this.W - pad.l - pad.r, ph = this.H - pad.t - pad.b;
    if (this.equal) { const s = Math.min(pw / (x1 - x0), ph / (y1 - y0)); const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; x0 = cx - pw / s / 2; x1 = cx + pw / s / 2; y0 = cy - ph / s / 2; y1 = cy + ph / s / 2; }
    this.view = { x0, x1, y0, y1 };
    const X0 = fx(x0), X1 = fx(x1), Y0 = fy(y0), Y1 = fy(y1);
    this.sx = (v) => pad.l + ((fx(v) - X0) / (X1 - X0)) * pw;
    this.sy = (v) => pad.t + (1 - (fy(v) - Y0) / (Y1 - Y0)) * ph;
    this.wx = (px) => { const t = X0 + ((px - pad.l) / pw) * (X1 - X0); return this.logx ? 10 ** t : t; };
    this.wy = (py) => { const t = Y0 + (1 - (py - pad.t) / ph) * (Y1 - Y0); return this.logy ? 10 ** t : t; };
  }
  setRange(x, y) { this.xr = x; this.yr = y; this.layout(); }
  redraw() { const c = this.ctx; c.clearRect(0, 0, this.W, this.H); c.fillStyle = C.bg; c.fillRect(0, 0, this.W, this.H); this.draw(this); }
  ticks(lo, hi, log) {
    if (log) { const out = []; for (let e = Math.ceil(Math.log10(lo)); e <= Math.floor(Math.log10(hi)); e++) out.push(10 ** e); const step = Math.ceil(out.length / 6); return out.filter((_, i) => i % step === 0); }
    const span = hi - lo, raw = span / 6, m = 10 ** Math.floor(Math.log10(raw)), s = [1, 2, 5, 10].map((k) => k * m).find((k) => k >= raw);
    const out = []; for (let v = Math.ceil(lo / s) * s; v <= hi + 1e-9; v += s) out.push(Math.abs(v) < 1e-12 ? 0 : v); return out;
  }
  axes({ xl = '', yl = '' } = {}) {
    const c = this.ctx, { x0, x1, y0, y1 } = this.view; c.font = MONO; c.lineWidth = 1;
    const fmt = (v, log) => (log ? `1e${Math.round(Math.log10(v))}` : +v.toPrecision(3) + '');
    for (const v of this.ticks(x0, x1, this.logx)) { const X = Math.round(this.sx(v)) + 0.5; c.strokeStyle = C.rule; c.beginPath(); c.moveTo(X, this.pad.t); c.lineTo(X, this.H - this.pad.b); c.stroke(); c.fillStyle = C.dim; c.textAlign = 'center'; c.fillText(fmt(v, this.logx), X, this.H - 10); }
    for (const v of this.ticks(y0, y1, this.logy)) { const Y = Math.round(this.sy(v)) + 0.5; c.strokeStyle = C.rule; c.beginPath(); c.moveTo(this.pad.l, Y); c.lineTo(this.W - this.pad.r, Y); c.stroke(); c.fillStyle = C.dim; c.textAlign = 'right'; c.fillText(fmt(v, this.logy), this.pad.l - 6, Y + 4); }
    c.strokeStyle = C.rule2;
    if (!this.logx && x0 < 0 && x1 > 0) { c.beginPath(); c.moveTo(this.sx(0), this.pad.t); c.lineTo(this.sx(0), this.H - this.pad.b); c.stroke(); }
    if (!this.logy && y0 < 0 && y1 > 0) { c.beginPath(); c.moveTo(this.pad.l, this.sy(0)); c.lineTo(this.W - this.pad.r, this.sy(0)); c.stroke(); }
    c.fillStyle = C.fog; c.textAlign = 'right'; if (xl) c.fillText(xl, this.W - this.pad.r - 2, this.H - this.pad.b - 6);
    c.textAlign = 'left'; if (yl) c.fillText(yl, this.pad.l + 6, this.pad.t + 12);
  }
  line(xs, ys, color = C.lime, w = 2, dash) {
    const c = this.ctx; c.strokeStyle = color; c.lineWidth = w; c.setLineDash(dash || []); c.beginPath();
    let pen = false; for (let i = 0; i < xs.length; i++) { const X = this.sx(xs[i]), Y = this.sy(ys[i]); if (!Number.isFinite(X) || !Number.isFinite(Y) || Math.abs(Y) > 1e5) { pen = false; continue; } pen ? c.lineTo(X, Y) : c.moveTo(X, Y); pen = true; }
    c.stroke(); c.setLineDash([]);
  }
  fn(f, color, w, dash, n = 300) { const { x0, x1 } = this.view; const xs = [], ys = []; for (let i = 0; i <= n; i++) { const x = this.logx ? 10 ** (Math.log10(x0) + (i / n) * (Math.log10(x1) - Math.log10(x0))) : x0 + ((x1 - x0) * i) / n; xs.push(x); ys.push(f(x)); } this.line(xs, ys, color, w, dash); }
  arrow(x0, y0, x1, y1, color = C.lime, w = 2.5) {
    const c = this.ctx, X0 = this.sx(x0), Y0 = this.sy(y0), X1 = this.sx(x1), Y1 = this.sy(y1), a = Math.atan2(Y1 - Y0, X1 - X0), L = Math.hypot(X1 - X0, Y1 - Y0), hd = Math.min(12, L * 0.4);
    c.strokeStyle = color; c.fillStyle = color; c.lineWidth = w; c.beginPath(); c.moveTo(X0, Y0); c.lineTo(X1 - Math.cos(a) * hd * 0.6, Y1 - Math.sin(a) * hd * 0.6); c.stroke();
    c.beginPath(); c.moveTo(X1, Y1); c.lineTo(X1 - hd * Math.cos(a - 0.4), Y1 - hd * Math.sin(a - 0.4)); c.lineTo(X1 - hd * Math.cos(a + 0.4), Y1 - hd * Math.sin(a + 0.4)); c.closePath(); c.fill();
  }
  dot(x, y, color = C.lime, r = 4) { const c = this.ctx; c.fillStyle = color; c.beginPath(); c.arc(this.sx(x), this.sy(y), r, 0, 7); c.fill(); }
  handle(x, y, color = C.lime) { const c = this.ctx; c.strokeStyle = color; c.lineWidth = 2; c.fillStyle = C.bg; c.beginPath(); c.arc(this.sx(x), this.sy(y), 9, 0, 7); c.fill(); c.stroke(); }
  poly(pts, fill, stroke) { const c = this.ctx; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(this.sx(x), this.sy(y)) : c.moveTo(this.sx(x), this.sy(y)))); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.5; c.stroke(); } }
  text(s, x, y, color = C.bone, align = 'left') { const c = this.ctx; c.font = MONO; c.fillStyle = color; c.textAlign = align; c.fillText(s, this.sx(x), this.sy(y)); }
  // Drag handles. Mouse and pen drag directly. Touch: a tap moves the nearest handle; dragging needs interact mode so page scroll still works.
  handles(getPts, onMove, root) {
    let active = -1;
    const pt = (e) => { const r = this.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const nearest = (X, Y, max = 1e9) => { let best = -1, bd = max; getPts().forEach(([x, y], i) => { const d = Math.hypot(this.sx(x) - X, this.sy(y) - Y); if (d < bd) { bd = d; best = i; } }); return best; };
    let down = null;
    this.cv.addEventListener('pointerdown', (e) => {
      const [X, Y] = pt(e); down = [X, Y, e.pointerType];
      if (e.pointerType !== 'touch' || root.classList.contains('interacting')) { active = nearest(X, Y, e.pointerType === 'touch' ? 80 : 30); if (active >= 0) { this.cv.setPointerCapture(e.pointerId); e.preventDefault(); } }
    });
    this.cv.addEventListener('pointermove', (e) => { if (active < 0) return; const [X, Y] = pt(e); onMove(active, this.wx(X), this.wy(Y)); });
    const up = (e) => {
      if (down && active < 0 && e.type === 'pointerup') { const [X, Y] = pt(e); if (Math.hypot(X - down[0], Y - down[1]) < 8) { const i = nearest(X, Y); if (i >= 0) onMove(i, this.wx(X), this.wy(Y)); } }
      active = -1; down = null;
    };
    this.cv.addEventListener('pointerup', up); this.cv.addEventListener('pointercancel', up);
  }
}
export function frame(el, { interact = false, readout = true } = {}) {
  el.classList.add('widget');
  const tools = h('div', { class: 'widget-tools' });
  const body = h('div', {}); el.append(body);
  let ib = null;
  if (interact) {
    ib = h('button', { class: 'icon-btn', type: 'button', 'aria-pressed': 'false', 'data-testid': 'widget-interact' }, 'Drag');
    ib.title = 'Touch: turn on to drag points; turn off to scroll';
    ib.addEventListener('click', () => { const on = !el.classList.contains('interacting'); el.classList.toggle('interacting', on); ib.setAttribute('aria-pressed', String(on)); ib.textContent = on ? 'Done' : 'Drag'; });
    tools.append(ib); el.append(tools);
  }
  const read = readout ? h('div', { class: 'widget-read', 'aria-live': 'polite' }) : null;
  if (read) el.append(read);
  const ctrls = h('div', { class: 'widget-ctrls' }); el.append(ctrls);
  return { body, read, ctrls };
}
export const f3 = (v, d = 3) => (Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(2) : v.toFixed(d));
