// Tiny DOM helpers for lab control panels.
export const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'html') e.innerHTML = v; else e.setAttribute(k, v);
  }
  for (const k of kids) if (k != null) e.append(k);
  return e;
};
export function toggle(label, on, onChange, { id, danger = false } = {}) {
  const b = h('button', { class: 'tog' + (danger ? ' danger' : ''), type: 'button', 'aria-pressed': String(on), 'data-testid': id });
  b.textContent = label;
  b.addEventListener('click', () => { const v = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(v)); onChange(v); });
  b.set = (v) => b.setAttribute('aria-pressed', String(v));
  return b;
}
export function slider(label, { min, max, step, value, fmt = (v) => v, id }, onInput) {
  const out = h('output'); out.textContent = fmt(value);
  const inp = h('input', { type: 'range', min, max, step, value, 'data-testid': id, 'aria-label': label });
  inp.addEventListener('input', () => { out.textContent = fmt(+inp.value); onInput(+inp.value); });
  return h('label', { class: 'slider' }, h('span', {}, label), out, inp);
}
export function select(label, options, value, onChange, id) {
  const s = h('select', { 'data-testid': id, 'aria-label': label });
  for (const [v, t] of options) { const o = h('option', { value: v }); o.textContent = t; if (v === value) o.selected = true; s.append(o); }
  s.addEventListener('change', () => onChange(s.value));
  return h('label', { class: 'slider' }, h('span', {}, label), h('span'), s);
}
export const group = (title, ...kids) => h('div', { class: 'ctrl-group' }, h('h4', {}, title), ...kids);
export const row = (...kids) => h('div', { class: 'toggles' }, ...kids);
export function button(label, onClick, id) { const b = h('button', { class: 'btn small', type: 'button', 'data-testid': id }); b.textContent = label; b.addEventListener('click', onClick); return b; }

// Build the standard lab shell and return handles.
export function labShell({ id, num, title, blurb, lessons }) {
  const view3d = h('div', { class: 'lab-3d', 'data-testid': `lab-${id}-3d` });
  const badge = h('div', { class: 'badge', 'data-testid': `lab-${id}-status` }, 'RUNNING');
  const note = h('div', { class: 'view-note' });
  const readouts = h('div', { class: 'readouts', 'data-testid': `lab-${id}-readouts` });
  view3d.append(badge, note, readouts);
  const scope = h('div', { class: 'scope' });
  const controls = h('div', { class: 'controls' });
  const links = h('div', { class: 'lesson-links' }, 'Lessons: ', ...lessons.map(([lid, t]) => h('a', { href: `#lesson-${lid}`, 'data-lesson': lid }, `${lid} ${t}`)));
  const sec = h('article', { class: `lab lab-${id}`, id: `lab-${id}`, 'data-testid': `lab-${id}` },
    h('div', { class: 'lab-head' }, h('div', {}, h('span', { class: 'lab-tag' }, `LAB ${num} · break the machine`), h('h3', {}, title), h('p', {}, blurb))),
    h('div', { class: 'lab-body' }, h('div', { class: 'lab-view' }, view3d, scope), h('div', { class: 'controls-wrap' }, controls)));
  controls.after(links);
  links.style.marginTop = '10px';
  return { sec, view3d, badge, note, readouts, scope, controls };
}
export function setBadge(badge, text, kind = '') { badge.textContent = text; badge.className = 'badge' + (kind ? ' ' + kind : ''); badge.dataset.state = text; }
