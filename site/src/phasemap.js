// Phase map rendered from curriculum.json: expandable phases, lesson details, search, localStorage progress.
const KEY = 'mfs-progress-v1';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function phaseMap(data, els) {
  const { grid, search, status, bar, label, reset } = els;
  let done = new Set();
  try { done = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { done = new Set(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify([...done])); } catch { /* private mode */ } };
  const all = data.phases.flatMap((p) => p.lessons.map((l) => ({ ...l, phase: p })));
  const byId = new Map(all.map((l) => [l.id, l]));

  const hl = (text, q) => {
    const t = esc(text);
    if (!q) return t;
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
    return t.replace(re, '<mark>$1</mark>');
  };
  const lessonHTML = (l, q = '') => `
    <li class="lesson${done.has(l.id) ? ' done' : ''}" id="lesson-${l.id}" data-id="${l.id}" data-testid="lesson">
      <div class="lesson-row">
        <input type="checkbox" aria-label="Mark ${esc(l.title)} done" data-testid="lesson-check" ${done.has(l.id) ? 'checked' : ''} />
        <span class="lesson-id">${l.id}</span>
        <button class="lesson-title" type="button" aria-expanded="false">${hl(l.title, q)}</button>
        ${l.live_lab ? `<a class="chip" href="#lab-${l.live_lab}">live lab</a>` : ''}
      </div>
      <div class="lesson-detail" hidden>
        <p>${hl(l.goal, q)}</p>
        <dl>
          <dt>Derive</dt><dd>${hl(l.math, q)}</dd>
          <dt>Code · ${esc(l.code.lang)}</dt><dd>${hl(l.code.task, q)}</dd>
          <dt>Lab / visual</dt><dd>${hl(l.lab, q)}</dd>
          <dt>Test</dt><dd>${hl(l.test, q)}</dd>
          <dt>Pro tool</dt><dd>${hl(l.tool, q)}</dd>
          <dt>Course</dt><dd>${esc(l.course.title)}${l.course.eth ? ' <span class="chip">ETH</span>' : ' <span class="small">(generic)</span>'}</dd>
        </dl>
      </div>
    </li>`;

  const phaseDone = (p) => p.lessons.filter((l) => done.has(l.id)).length;
  function renderGrid() {
    grid.innerHTML = data.phases.map((p) => `
      <div class="phase" data-phase="${p.id}" data-testid="phase">
        <button class="phase-btn" type="button" aria-expanded="false" data-testid="phase-btn">
          <span class="phase-num">${String(p.number).padStart(2, '0')}</span>
          <span class="phase-title">${esc(p.title)}</span>
          <span class="phase-chev" aria-hidden="true">›</span>
          <span class="phase-meta"><span data-count>${phaseDone(p)}</span>/${p.lessons.length} lessons · ${esc(p.course.title)}${p.course.eth ? ' · ETH' : ''}</span>
        </button>
        <div class="phase-bar"><i style="width:${(100 * phaseDone(p)) / p.lessons.length}%"></i></div>
        <div class="phase-body" hidden></div>
      </div>`).join('');
  }
  function openPhase(div, open) {
    const p = data.phases.find((x) => x.id === div.dataset.phase);
    const body = div.querySelector('.phase-body'), btn = div.querySelector('.phase-btn');
    if (open && !body.dataset.built) {
      body.innerHTML = `<p class="tagline2">${esc(p.tagline)}</p><ul class="lessons">${p.lessons.map((l) => lessonHTML(l)).join('')}</ul>`;
      body.dataset.built = '1';
    }
    body.hidden = !open; div.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open));
  }
  function updateProgress() {
    const n = done.size, tot = all.length;
    bar.style.width = `${(100 * n) / tot}%`; label.textContent = `${n} / ${tot} lessons`;
    label.dataset.done = String(n);
    for (const div of grid.querySelectorAll('.phase')) {
      const p = data.phases.find((x) => x.id === div.dataset.phase); if (!p) continue;
      const k = phaseDone(p); div.querySelector('[data-count]').textContent = k;
      div.querySelector('.phase-bar i').style.width = `${(100 * k) / p.lessons.length}%`;
    }
  }
  function runSearch() {
    const q = search.value.trim();
    if (!q) { status.textContent = ''; renderGrid(); updateProgress(); return; }
    const words = q.toLowerCase().split(/\s+/);
    const hits = all.filter((l) => {
      const hay = [l.id, l.title, l.goal, l.math, l.code.task, l.lab, l.test, l.tool, l.phase.title].join(' ').toLowerCase();
      return words.every((w) => hay.includes(w));
    });
    status.textContent = `${hits.length} lesson${hits.length === 1 ? '' : 's'} match “${q}”`;
    status.dataset.count = String(hits.length);
    let html = '<div class="results" data-testid="search-results">', cur = null;
    for (const l of hits) {
      if (l.phase !== cur) { if (cur) html += '</ul>'; cur = l.phase; html += `<div class="result-phase">PHASE ${String(cur.number).padStart(2, '0')} · ${esc(cur.title)}</div><ul class="lessons">`; }
      html += lessonHTML(l, words[0]);
    }
    if (cur) html += '</ul>';
    grid.innerHTML = html + '</div>';
  }

  grid.addEventListener('click', (e) => {
    const pb = e.target.closest('.phase-btn');
    if (pb) { const div = pb.closest('.phase'); openPhase(div, !div.classList.contains('open')); return; }
    const lt = e.target.closest('.lesson-title');
    if (lt) { const d = lt.closest('.lesson').querySelector('.lesson-detail'); d.hidden = !d.hidden; lt.setAttribute('aria-expanded', String(!d.hidden)); }
  });
  grid.addEventListener('change', (e) => {
    if (!e.target.matches('input[type=checkbox]')) return;
    const li = e.target.closest('.lesson'), id = li.dataset.id;
    if (e.target.checked) done.add(id); else done.delete(id);
    li.classList.toggle('done', e.target.checked); save(); updateProgress();
  });
  let tmr; search.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(runSearch, 120); });
  let armed = false;
  reset.addEventListener('click', () => {
    if (!armed) { armed = true; reset.textContent = 'Click again to confirm'; setTimeout(() => { armed = false; reset.textContent = 'Reset progress'; }, 3000); return; }
    armed = false; reset.textContent = 'Reset progress'; done.clear(); save();
    for (const cb of grid.querySelectorAll('input[type=checkbox]')) { cb.checked = false; cb.closest('.lesson').classList.remove('done'); }
    updateProgress();
  });
  // deep links like #lesson-p13-l07 open the right phase
  function openFromHash() {
    const m = location.hash.match(/^#lesson-(p\d+-l\d+)$/); if (!m || !byId.has(m[1])) return;
    if (search.value) { search.value = ''; runSearch(); }
    const l = byId.get(m[1]); const div = grid.querySelector(`[data-phase="${l.phase.id}"]`); openPhase(div, true);
    const li = document.getElementById(`lesson-${l.id}`); if (li) { li.querySelector('.lesson-detail').hidden = false; li.scrollIntoView({ block: 'center' }); }
  }
  window.addEventListener('hashchange', openFromHash);
  renderGrid(); updateProgress(); openFromHash();
}
