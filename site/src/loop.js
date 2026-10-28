// Shared animation loop and environment checks, with no three.js import so 2D-only modules can use them.
let glOk = null;
export function webglAvailable() {
  if (glOk !== null) return glOk;
  if (new URLSearchParams(location.search).has('nowebgl')) return (glOk = false);
  try {
    const c = document.createElement('canvas');
    glOk = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { glOk = false; }
  return glOk;
}
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isNarrow = () => matchMedia('(max-width: 760px)').matches;

const items = new Set();
let last = 0, running = false;
function frame(now) {
  const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
  last = now;
  if (!document.hidden) for (const it of items) if (it.visible && !it.paused) {
    try { it.tick(dt); } catch (e) { console.warn('tick failed', e); items.delete(it); }
  }
  requestAnimationFrame(frame);
}
export function register(item) {
  items.add(item);
  if (!running) { running = true; requestAnimationFrame(frame); }
  const io = new IntersectionObserver((es) => { for (const e of es) item.visible = e.isIntersecting; }, { rootMargin: '60px' });
  io.observe(item.el);
  item.unregister = () => { io.disconnect(); items.delete(item); };
  return item;
}

export function fallback(el, what) {
  const d = document.createElement('div');
  d.className = 'nogl';
  d.innerHTML = `<div><b>3D view unavailable</b>WebGL is turned off or unsupported in this browser.<br/>${what}</div>`;
  el.appendChild(d);
  el.dataset.webgl = 'off';
}

