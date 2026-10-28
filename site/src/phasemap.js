// Course map on the home page: expandable phases, lesson links, search, local progress.
import { phases, allLessons, isFull, phaseFullCount, phaseComplete } from './course.js';
import { store } from './store.js';
import { esc, pad2 } from './util-dom.js';

export function phaseMap(els) {
  const { grid, search, status, bar, label, reset } = els;
  const hl = (text, q) => { const t = esc(text); if (!q) return t; const re = new RegExp(`(${esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'); return t.replace(re, '<mark>$1</mark>'); };
  const lessonHTML = (l, q = '') => `
    <li class="lesson${store.isDone(l.id) ? ' done' : ''}" id="lesson-${l.id}" data-id="${l.id}" data-testid="lesson">
      <div class="lesson-row">
        <label class="check"><input type="checkbox" data-testid="lesson-check" ${store.isDone(l.id) ? 'checked' : ''} /><span class="sr">Mark “${esc(l.title)}” done</span></label>
        <a class="lesson-link" href="#/learn/${l.id}" data-testid="lesson-link">${hl(l.title, q)}<small>${l.id}${q ? ' · ' + hl(l.goal, q).slice(0, 400) : ''}</small></a>
        ${isFull(l.id) ? '<span class="chip full">Full lesson</span>' : ''}
      </div></li>`;
  const pDone = (p) => store.doneCount(p.lessons.map((l) => l.id));
  function renderGrid() {
    grid.innerHTML = phases.map((p) => { const f = phaseFullCount(p); return `
      <div class="phase" data-phase="${p.id}" data-testid="phase">
        <button class="phase-btn" type="button" aria-expanded="false" data-testid="phase-btn">
          <span class="phase-num">${pad2(p.number)}</span>
          <span class="phase-title">${esc(p.title)}</span>
          <span class="phase-chev" aria-hidden="true">›</span>
          <span class="phase-meta"><span data-count>${pDone(p)}</span> of ${p.lessons.length} done${f ? ` · <span class="full">${f === p.lessons.length ? 'all lessons written' : `${f} written`}</span>` : ''}${p.track ? ' · optional build-along track' : ''}</span>
        </button>
        <div class="phase-bar"><i style="width:${(100 * pDone(p)) / p.lessons.length}%"></i></div>
        <div class="phase-body" hidden></div>
      </div>`; }).join('');
  }
  function openPhase(div, open) {
    const p = phases.find((x) => x.id === div.dataset.phase);
    const body = div.querySelector('.phase-body'), btn = div.querySelector('.phase-btn');
    if (open && !body.dataset.built) {
      body.innerHTML = `<p class="tagline2">${esc(p.tagline)}</p>
        <div class="phase-links"><a class="btn btn-quiet btn-small" href="#/phase/${p.id}">Phase overview</a>${phaseComplete(p) ? `<a class="btn btn-quiet btn-small" href="#/test/${p.id}">Phase test</a>` : ''}${p.course.eth ? `<span class="chip eth">${esc(p.course.title)}</span>` : ''}</div>
        <ul class="lessons">${p.lessons.map((l) => lessonHTML(l)).join('')}</ul>`;
      body.dataset.built = '1';
    }
    body.hidden = !open; div.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open));
  }
  function updateProgress() {
    const n = allLessons.filter((l) => store.isDone(l.id)).length, tot = allLessons.length;
    bar.style.width = `${(100 * n) / tot}%`; label.textContent = `${n} of ${tot} lessons done`; label.dataset.done = String(n);
    for (const div of grid.querySelectorAll('.phase')) {
      const p = phases.find((x) => x.id === div.dataset.phase); if (!p) continue;
      const k = pDone(p); div.querySelector('[data-count]').textContent = k;
      div.querySelector('.phase-bar i').style.width = `${(100 * k) / p.lessons.length}%`;
      div.querySelectorAll('.lesson').forEach((li) => { const d = store.isDone(li.dataset.id); li.classList.toggle('done', d); li.querySelector('input').checked = d; });
    }
  }
  function runSearch() {
    const q = search.value.trim();
    if (!q) { status.textContent = ''; renderGrid(); updateProgress(); return; }
    const words = q.toLowerCase().split(/\s+/);
    const hits = allLessons.filter((l) => { const hay = [l.id, l.title, l.goal, l.math, l.code.task, l.lab, l.test, l.tool, l.phase.title].join(' ').toLowerCase(); return words.every((w) => hay.includes(w)); });
    status.textContent = `${hits.length} lesson${hits.length === 1 ? '' : 's'} match “${q}”`; status.dataset.count = String(hits.length);
    let html = '<div class="results" data-testid="search-results">', cur = null;
    for (const l of hits) {
      if (l.phase !== cur) { if (cur) html += '</ul>'; cur = l.phase; html += `<div class="result-phase">Phase ${pad2(cur.number)} · ${esc(cur.title)}</div><ul class="lessons">`; }
      html += lessonHTML(l, words[0]);
    }
    if (cur) html += '</ul>';
    grid.innerHTML = html + '</div>';
  }
  grid.addEventListener('click', (e) => { const pb = e.target.closest('.phase-btn'); if (pb) { const div = pb.closest('.phase'); openPhase(div, !div.classList.contains('open')); } });
  grid.addEventListener('change', (e) => {
    if (!e.target.matches('input[type=checkbox]')) return;
    const li = e.target.closest('.lesson'); store.setDone(li.dataset.id, e.target.checked); li.classList.toggle('done', e.target.checked);
  });
  let tmr; search.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(runSearch, 120); });
  let armed = false;
  reset.addEventListener('click', () => {
    if (!armed) { armed = true; reset.textContent = 'Tap again to erase all progress'; setTimeout(() => { armed = false; reset.textContent = 'Reset progress'; }, 4000); return; }
    armed = false; reset.textContent = 'Reset progress'; store.reset();
  });
  store.on(updateProgress);
  renderGrid(); updateProgress();
  return { refresh: () => { if (!search.value) { renderGrid(); } updateProgress(); } };
}
