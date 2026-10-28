// Lesson route: #/learn/:id. Every lesson renders its compiled HTML.
import { byId, loadLesson, neighbours, phaseFullCount } from '../course.js';
import { store } from '../store.js';
import { esc, pad2, toast, download } from '../util-dom.js';
import { questionEl } from './quiz.js';
import { hydrateWidgets } from '../widgets/index.js';

function tocHTML(l) {
  const p = l.phase;
  return `<nav class="toc" aria-label="Lessons in phase ${p.number}"><h2>Phase ${pad2(p.number)} · ${esc(p.title)}</h2><ol>${p.lessons.map((x) => `
    <li><a href="#/learn/${x.id}"${x.id === l.id ? ' aria-current="page"' : ''}><span class="n">${pad2(x.n)}</span><span>${esc(x.title)}${store.isDone(x.id) ? ' <span class="ok" aria-label="done">✓</span>' : ''}</span></a></li>`).join('')}</ol>
    <p style="margin:14px 8px 0"><a class="btn btn-quiet btn-small" href="#/phase/${p.id}">Phase overview and test</a></p></nav>`;
}

function missingHTML(l) {
  return `<div class="panel" data-testid="lesson-missing"><p>This lesson’s content could not be loaded. Check your connection and reload the page.</p></div>`;
}

export async function renderLesson(root, id) {
  const l = byId.get(id);
  if (!l) { root.innerHTML = `<div class="page"><div class="page-head"><h1>Lesson not found</h1><p>No lesson has the id “${esc(id)}”. <a href="#/course">Browse the course map</a>.</p></div></div>`; return 'Lesson not found'; }
  const p = l.phase, { prev, next } = neighbours(id);
  const data = await loadLesson(id);
  store.visit(id);
  const phaseDone = store.doneCount(p.lessons.map((x) => x.id));
  root.innerHTML = `<div class="page lesson-page" data-lesson="${l.id}" data-full="${data ? 1 : 0}">
    <div class="lesson-bar" data-testid="lesson-bar">
      <button class="icon-btn" type="button" data-toc aria-label="Lessons in this phase" aria-haspopup="dialog">☰</button>
      <span class="crumb">Phase ${pad2(p.number)} · <b>Lesson ${l.n} of ${p.lessons.length}</b></span>
      <span class="meter" role="img" aria-label="${phaseDone} of ${p.lessons.length} lessons in this phase done"><i style="width:${(100 * phaseDone) / p.lessons.length}%"></i></span>
      ${prev ? `<a class="icon-btn" href="#/learn/${prev.id}" aria-label="Previous lesson: ${esc(prev.title)}" data-testid="bar-prev">‹</a>` : ''}
      ${next ? `<a class="icon-btn" href="#/learn/${next.id}" aria-label="Next lesson: ${esc(next.title)}" data-testid="bar-next">›</a>` : ''}
    </div>
    <div class="lesson-layout">
      ${tocHTML(l)}
      <article class="lesson-article">
        <p class="lesson-kicker"><a href="#/phase/${p.id}">Phase ${pad2(p.number)}: ${esc(p.title)}</a></p>
        <h1 data-testid="lesson-title">${esc(l.title)}</h1>
        <div class="lesson-meta">
          ${data ? `<span class="chip full">Full lesson</span><span class="chip">${data.minutes} min</span>` : ''}
          <span class="chip">${esc(l.code.lang)}</span>
          ${l.course.eth ? `<span class="chip eth" title="${esc(l.course.title)}">ETH syllabus</span>` : ''}
          ${l.live_lab ? `<a class="chip" href="#lab-${l.live_lab}">Live lab</a>` : ''}
        </div>
        ${data ? `<p class="tldr">${data.summary}</p><div class="prose" data-testid="lesson-body">${data.html}</div>` : missingHTML(l)}
        <div class="lesson-end">
          <div class="complete-card" data-testid="complete-card">
            <h2>${store.isDone(id) ? 'Lesson complete' : 'Finished this lesson?'}</h2>
            <p>Mark it complete to earn 50 points and keep your streak. Progress stays in this browser.</p>
            <div><button class="btn ${store.isDone(id) ? 'btn-quiet' : 'btn-primary'}" type="button" data-testid="mark-complete" aria-pressed="${store.isDone(id)}">${store.isDone(id) ? 'Completed ✓ (undo)' : 'Mark lesson complete'}</button></div>
          </div>
          <nav class="pn" aria-label="Lesson navigation">
            ${prev ? `<a class="prev" href="#/learn/${prev.id}" data-testid="prev"><span>Previous</span><b>${esc(prev.title)}</b></a>` : '<span></span>'}
            ${next ? `<a class="next" href="#/learn/${next.id}" data-testid="next"><span>Next</span><b>${esc(next.title)}</b></a>` : ''}
          </nav>
        </div>
      </article>
    </div></div>`;

  // contents drawer (mobile)
  root.querySelector('[data-toc]').addEventListener('click', () => openDrawer(tocHTML(l)));

  const btn = root.querySelector('[data-testid=mark-complete]');
  btn.addEventListener('click', () => {
    const now = !store.isDone(id);
    const gained = store.setDone(id, now);
    btn.textContent = now ? 'Completed ✓ (undo)' : 'Mark lesson complete';
    btn.className = 'btn ' + (now ? 'btn-quiet' : 'btn-primary'); btn.setAttribute('aria-pressed', String(now));
    root.querySelector('.complete-card h2').textContent = now ? 'Lesson complete' : 'Finished this lesson?';
    if (gained) toast(`+${gained} points · lesson complete`);
    const k = store.doneCount(p.lessons.map((x) => x.id));
    root.querySelector('.lesson-bar .meter i').style.width = `${(100 * k) / p.lessons.length}%`;
    if (now && k === p.lessons.length && phaseFullCount(p) === p.lessons.length) toast('Phase finished. The phase test is unlocked.');
  });

  if (!data) return l.title;
  // code cards
  root.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    const c = data.code[+b.dataset.copy];
    try { await navigator.clipboard.writeText(c.src); b.textContent = 'Copied'; } catch { b.textContent = 'Select to copy'; }
    setTimeout(() => (b.textContent = 'Copy'), 1600);
  }));
  root.querySelectorAll('[data-download]').forEach((b) => b.addEventListener('click', () => {
    const c = data.code[+b.dataset.download];
    download(c.file, new Blob([c.src], { type: 'text/plain' }));
  }));
  // quizzes
  root.querySelectorAll('.quiz[data-quiz]').forEach((box) => {
    const qs = data.quiz.filter((q) => q.id.startsWith(box.dataset.quiz + '-'));
    box.setAttribute('data-testid', 'quiz');
    const score = document.createElement('p'); score.className = 'quiz-score'; score.setAttribute('aria-live', 'polite');
    const results = new Map();
    const upd = () => { const c = [...results.values()].filter(Boolean).length; score.textContent = `${c} of ${qs.length} correct`; score.dataset.correct = String(c); };
    qs.forEach((q, i) => {
      const prevState = store.quizState(q.id);
      box.append(questionEl(q, i + 1, { onAnswer: (qq, ok) => { results.set(qq.id, ok); upd(); const g = store.answer(qq.id, ok); if (g) toast(`+${g} points`); } }));
      if (prevState?.correct) results.set(q.id, true);
    });
    box.append(score); upd();
  });
  hydrateWidgets(root);
  return l.title;
}

export function openDrawer(inner) {
  const d = document.createElement('div');
  d.className = 'drawer'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Lessons in this phase');
  d.innerHTML = `<div class="drawer-panel"><div class="drawer-head"><strong>Contents</strong><button class="icon-btn" type="button" data-close aria-label="Close contents">✕</button></div>${inner}</div>`;
  const prevFocus = document.activeElement;
  const close = () => { d.remove(); document.removeEventListener('keydown', onKey); document.documentElement.style.overflow = ''; prevFocus?.focus?.(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-close]') || e.target.closest('a')) close(); });
  document.addEventListener('keydown', onKey);
  document.body.append(d); document.documentElement.style.overflow = 'hidden';
  d.querySelector('[data-close]').focus();
}
