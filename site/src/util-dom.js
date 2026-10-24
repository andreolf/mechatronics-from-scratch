export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const pad2 = (n) => String(n).padStart(2, '0');
export const fmtDate = (iso, opts = { dateStyle: 'long' }) => new Intl.DateTimeFormat(navigator.language || 'en', opts).format(new Date(iso + 'T12:00:00'));
export const fmtNum = (n) => new Intl.NumberFormat(navigator.language || 'en').format(n);
let toastTimer;
export function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.append(t); window.addEventListener('hashchange', () => (t.hidden = true)); }
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2000);
}
export function download(name, blob) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
