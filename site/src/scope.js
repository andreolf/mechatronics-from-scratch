// Minimal oscilloscope: fixed-length ring buffers drawn on a 2D canvas.
export class Scope {
  constructor(el, channels, { seconds = 6, rate = 60 } = {}) {
    this.el = el; this.channels = channels; this.n = seconds * rate;
    this.data = channels.map(() => new Float32Array(this.n)); this.i = 0; this.count = 0;
    this.canvas = document.createElement('canvas'); el.appendChild(this.canvas);
    const leg = document.createElement('div'); leg.className = 'scope-legend';
    leg.innerHTML = channels.map((c) => `<span><i style="background:${c.color}"></i>${c.label}</span>`).join('');
    el.appendChild(leg);
    this.ctx = this.canvas.getContext('2d');
  }
  push(values) {
    values.forEach((v, k) => (this.data[k][this.i] = v));
    this.i = (this.i + 1) % this.n; this.count = Math.min(this.n, this.count + 1);
  }
  clear() { this.count = 0; this.i = 0; }
  draw() {
    const c = this.canvas, dpr = Math.min(2, devicePixelRatio || 1);
    const w = this.el.clientWidth, h = this.el.clientHeight;
    if (!w || !h) return;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = this.ctx; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    g.strokeStyle = '#1a1d16'; g.lineWidth = 1;
    for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(0, (h * k) / 4); g.lineTo(w, (h * k) / 4); g.stroke(); }
    for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo((w * k) / 6, 0); g.lineTo((w * k) / 6, h); g.stroke(); }
    g.strokeStyle = '#2b3220'; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
    this.channels.forEach((ch, k) => {
      const d = this.data[k], [lo, hi] = ch.range;
      g.strokeStyle = ch.color; g.lineWidth = ch.width || 1.6; g.beginPath();
      for (let j = 0; j < this.count; j++) {
        const idx = (this.i - this.count + j + this.n) % this.n;
        const x = (j / (this.n - 1)) * w;
        const y = h - ((Math.min(hi, Math.max(lo, d[idx])) - lo) / (hi - lo)) * (h - 8) - 4;
        j ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
    });
  }
}
