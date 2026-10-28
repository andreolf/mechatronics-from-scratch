// Phase overview, phase test, progress dashboard, certificate and verify routes.
import { phases, corePhases, phaseById, isFull, loadQuizBank, phaseFullCount, phaseComplete, allLessons, byId, course } from '../course.js';
import { store } from '../store.js';
import { esc, pad2, toast, download, fmtDate, fmtNum } from '../util-dom.js';
import { questionEl } from './quiz.js';
import { certCode, drawCert, pdfFromCanvas, cleanCode, normName } from '../cert.js';

const PASS = 0.8, TEST_N = 15;
const notFound = (root, what) => { root.innerHTML = `<div class="page"><div class="page-head"><h1>${what} not found</h1><p><a href="#/course">Back to the course map</a></p></div></div>`; return what + ' not found'; };
const ids = (p) => p.lessons.map((l) => l.id);
const verifyUrl = () => location.href.split('#')[0] + '#/verify';

export function renderPhase(root, pid) {
  const p = phaseById.get(pid); if (!p) return notFound(root, 'Phase');
  const done = store.doneCount(ids(p)), fullN = phaseFullCount(p), t = store.get().tests[pid];
  const testReady = phaseComplete(p);
  root.innerHTML = `<div class="page"><header class="page-head">
      <p class="lesson-kicker"><a href="#/course">Course</a> · ${p.track ? `Phase ${pad2(p.number)} · optional build-along track` : `Phase ${pad2(p.number)} of ${corePhases.length}`}</p>
      <h1>${esc(p.title)}</h1><p>${esc(p.tagline)}</p>
      <div class="lesson-meta" style="margin-top:14px"><span class="chip">${p.lessons.length} lessons</span><span class="chip ${fullN ? 'full' : ''}">${fullN} fully written</span>${p.course.eth ? `<span class="chip eth">${esc(p.course.title)}</span>` : `<span class="chip">${esc(p.course.title)}</span>`}</div>
    </header>
    <section class="panel" aria-labelledby="ph-test"><h2 id="ph-test">Phase test</h2>
      ${testReady ? `<p class="lede" style="margin:0 0 14px">${TEST_N} questions drawn from this phase’s lessons. Score 80 % or more to pass and unlock the phase certificate.${t ? ` Best score so far: ${Math.round(t.best * 100)} %.` : ''}</p>
        <div class="hero-actions"><a class="btn btn-primary" href="#/test/${p.id}" data-testid="start-test">${t?.passed ? 'Retake the test' : 'Take the phase test'}</a>${t?.passed ? `<a class="btn btn-quiet" href="#/certificate/${p.id}">View certificate</a>` : ''}</div>`
      : `<p class="lede" style="margin:0">The test opens once every lesson in this phase is fully written (${fullN} of ${p.lessons.length} so far).</p>`}
    </section>
    <section class="panel" aria-labelledby="ph-lessons"><h2 id="ph-lessons">Lessons <small class="quiz-score">${done} of ${p.lessons.length} done</small></h2>
      <ol class="lessons">${p.lessons.map((l) => `<li class="lesson${store.isDone(l.id) ? ' done' : ''}"><div class="lesson-row" style="grid-template-columns:44px minmax(0,1fr) auto"><span class="check" aria-hidden="true">${store.isDone(l.id) ? '<span style="color:var(--lime)">✓</span>' : `<span class="tnum" style="color:var(--dim)">${pad2(l.n)}</span>`}</span><a class="lesson-link" href="#/learn/${l.id}">${esc(l.title)}<small>${l.id}</small></a>${isFull(l.id) ? '<span class="chip full">Full lesson</span>' : ''}</div></li>`).join('')}</ol>
    </section></div>`;
  return p.title;
}

function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export async function renderTest(root, pid) {
  const p = phaseById.get(pid); if (!p) return notFound(root, 'Phase');
  if (!phaseComplete(p)) { root.innerHTML = `<div class="page"><header class="page-head"><h1>Phase ${pad2(p.number)} test</h1><p>This test opens once every lesson in the phase is fully written. <a href="#/phase/${p.id}">Back to the phase</a></p></header></div>`; return 'Test locked'; }
  const quiz = await loadQuizBank(pid);
  const bank = p.lessons.flatMap((l) => (quiz[l.id] || []).map((q) => ({ ...q, lesson: l })));
  const attempts = store.get().tests[pid]?.attempts || 0;
  const r = rng(p.number * 7919 + attempts * 104729);
  const pool = [...bank]; for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const qs = pool.slice(0, Math.min(TEST_N, pool.length));
  root.innerHTML = `<div class="page" style="max-width:820px"><header class="page-head"><p class="lesson-kicker"><a href="#/phase/${p.id}">Phase ${pad2(p.number)}: ${esc(p.title)}</a></p><h1>Phase test</h1>
    <p>${qs.length} questions from a bank of ${bank.length}. Pass mark 80 % (${Math.ceil(qs.length * PASS)} correct). Answers are graded when you submit, with explanations for each one. Attempt ${attempts + 1}.</p></header>
    <div class="test-progress" aria-live="polite"><span data-answered>0 of ${qs.length} answered</span><span>Pass: ${Math.ceil(qs.length * PASS)}</span></div>
    <form class="quiz" data-testid="phase-test" novalidate></form>
    <div class="hero-actions" style="margin-top:16px"><button class="btn btn-primary" type="button" data-testid="submit-test">Submit answers</button></div>
    <div data-test-out aria-live="polite"></div></div>`;
  const form = root.querySelector('form'); const els = qs.map((q, i) => questionEl(q, i + 1, { instant: false }));
  els.forEach((e, i) => { const src = document.createElement('p'); src.className = 'quiz-score'; src.style.margin = '10px 0 0'; src.innerHTML = `From <a href="#/learn/${qs[i].lesson.id}">${esc(qs[i].lesson.title)}</a>`; e.append(src); form.append(e); });
  const counter = root.querySelector('[data-answered]');
  form.addEventListener('input', () => (counter.textContent = `${els.filter((e) => e.answered()).length} of ${qs.length} answered`));
  form.addEventListener('submit', (e) => e.preventDefault());
  const submit = root.querySelector('[data-testid=submit-test]'); let armed = false;
  submit.addEventListener('click', () => {
    const missing = els.filter((e) => !e.answered()).length;
    if (missing && !armed) { armed = true; submit.textContent = `${missing} unanswered. Submit anyway?`; return; }
    submit.disabled = true; submit.textContent = 'Submitted';
    els.forEach((e) => { e.reveal(); e.querySelectorAll('input').forEach((i) => (i.disabled = true)); });
    const score = els.filter((e) => e.correct()).length, frac = score / qs.length, pass = frac >= PASS;
    const gained = store.testResult(pid, score, qs.length);
    const out = root.querySelector("[data-test-out]");
    out.innerHTML = `<div class="complete-card" style="margin-top:20px" data-testid="test-result" data-pass="${pass}"><h2>${pass ? 'Passed' : 'Not passed yet'}: ${score} of ${qs.length} (${Math.round(frac * 100)} %)</h2>
      <p>${pass ? `You passed Phase ${pad2(p.number)}.${gained ? ` +${gained} points.` : ''} Your certificate is ready.` : 'You need 80 %. Review the explanations above, revisit the linked lessons, and retake the test. Each attempt draws a new set of questions.'}</p>
      <div class="hero-actions">${pass ? `<a class="btn btn-primary" href="#/certificate/${p.id}" data-testid="to-cert">Get your certificate</a>` : ''}<a class="btn btn-quiet" href="#/test/${p.id}?a=${attempts + 1}" data-testid="retake">Retake with new questions</a></div></div>`;
    if (gained) toast(`+${gained} points · phase test passed`);
    out.scrollIntoView({ block: 'center' });
  });
  return `Phase ${pad2(p.number)} test`;
}

export function renderDashboard(root) {
  const s = store.get(); const done = allLessons.filter((l) => store.isDone(l.id)).length;
  const days = new Set(s.days); const grid = [];
  for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; grid.push(`<i class="${days.has(k) ? 'on' : ''}" title="${k}"></i>`); }
  const passed = phases.filter((p) => s.tests[p.id]?.passed), passedCore = corePhases.filter((p) => s.tests[p.id]?.passed);
  const last = s.last && byId.get(s.last);
  const nextUp = last || allLessons.find((l) => !store.isDone(l.id));
  const xpInLevel = s.xp % 500;
  root.innerHTML = `<div class="page"><header class="page-head"><h1>Your progress</h1><p>Everything here lives in this browser’s local storage. There are no accounts and nothing is sent anywhere, so clearing site data resets it. Export a backup below.</p></header>
    <dl class="grid-cards" data-testid="dashboard">
      <div class="stat"><dt>Points</dt><dd data-testid="xp">${fmtNum(s.xp)} <small>points · level ${store.level()}</small></dd><div class="phase-bar" style="margin-top:12px"><i style="width:${xpInLevel / 5}%"></i></div></div>
      <div class="stat"><dt>Streak</dt><dd data-testid="streak">${store.streak()} <small>days · best ${store.bestStreak()}</small></dd><div class="week" aria-label="Activity in the last 14 days">${grid.join('')}</div></div>
      <div class="stat"><dt>Lessons done</dt><dd data-testid="dash-lessons">${done} <small>of ${allLessons.length}</small></dd></div>
      <div class="stat"><dt>Phase tests passed</dt><dd>${passedCore.length} <small>of ${corePhases.length} core${phases.length > corePhases.length ? ` · track ${phases.filter((p) => p.track && s.tests[p.id]?.passed).length} of ${phases.length - corePhases.length}` : ''}</small></dd></div>
    </dl>
    ${nextUp ? `<div class="panel"><h2>${last ? 'Pick up where you left off' : 'Start here'}</h2><p class="lede" style="margin:0 0 14px">Phase ${pad2(nextUp.phase.number)} · ${esc(nextUp.title)}</p><a class="btn btn-primary" href="#/learn/${nextUp.id}">Continue</a></div>` : ''}
    <section class="panel"><h2>Certificates</h2>
      <p class="lede" style="margin:0 0 12px">Pass a phase test for a phase certificate. Pass all ${corePhases.length} core phases for the full-course certificate; the optional build-along track has its own certificate. Free certificates of completion, not accredited, and not affiliated with or endorsed by ETH Zurich.</p>
      <div class="hero-actions">${passed.map((p) => `<a class="btn btn-quiet btn-small" href="#/certificate/${p.id}">Phase ${pad2(p.number)}</a>`).join('') || '<span class="quiz-score">None yet. Phase 01’s test is a good first target.</span>'}<a class="btn btn-quiet btn-small" href="#/certificate/course">Full course${passedCore.length === corePhases.length ? '' : ' (locked)'}</a><a class="btn btn-quiet btn-small" href="#/verify">Verify a certificate</a></div>
    </section>
    <section class="panel"><h2>Phases</h2><div class="phase-rows">${phases.map((p) => { const k = store.doneCount(ids(p)); const t = s.tests[p.id]; return `<a class="phase-row" href="#/phase/${p.id}"><span class="n">${pad2(p.number)}</span><span class="t">${esc(p.title)}</span><span class="chip ${t?.passed ? 'full' : ''}">${t?.passed ? 'Test passed' : t ? `Best ${Math.round(t.best * 100)} %` : phaseComplete(p) ? 'Test open' : `${phaseFullCount(p)} written`}</span><span class="s">${k} of ${p.lessons.length} lessons done</span><span class="bar"><i style="width:${(100 * k) / p.lessons.length}%"></i></span></a>`; }).join('')}</div></section>
    <section class="panel"><h2>Backup</h2><div class="hero-actions"><button class="btn btn-quiet btn-small" type="button" data-export>Export progress (JSON)</button><label class="btn btn-quiet btn-small">Import progress<input type="file" accept="application/json" data-import class="sr" /></label><button class="btn btn-quiet btn-small" type="button" data-reset>Reset all progress</button></div><p class="quiz-score" data-msg aria-live="polite"></p></section></div>`;
  root.querySelector('[data-export]').addEventListener('click', () => download(`mechatronics-progress-${store.today()}.json`, new Blob([JSON.stringify(store.get(), null, 2)], { type: 'application/json' })));
  root.querySelector('[data-import]').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { const j = JSON.parse(await f.text()); if (!j || typeof j.lessons !== 'object') throw new Error('bad'); localStorage.setItem('mfs-v2', JSON.stringify(j)); location.reload(); }
    catch { root.querySelector('[data-msg]').textContent = 'That file isn’t a progress export from this site.'; }
  });
  let armed = false; const rb = root.querySelector('[data-reset]');
  rb.addEventListener('click', () => { if (!armed) { armed = true; rb.textContent = 'Tap again to erase everything'; setTimeout(() => { armed = false; rb.textContent = 'Reset all progress'; }, 4000); return; } store.reset(); renderDashboard(root); });
  return 'Your progress';
}

export async function renderCert(root, key) {
  const s = store.get(); const isCourse = key === 'course'; const p = !isCourse && phaseById.get(key);
  if (!isCourse && !p) return notFound(root, 'Certificate');
  const passed = isCourse ? corePhases.every((x) => s.tests[x.id]?.passed) : !!s.tests[key]?.passed;
  const title = isCourse ? 'Full-course certificate' : `Phase ${pad2(p.number)} certificate`;
  if (!passed) {
    const n = corePhases.filter((x) => s.tests[x.id]?.passed).length;
    root.innerHTML = `<div class="page" style="max-width:820px"><header class="page-head"><h1>${title}</h1><p data-testid="cert-locked">${isCourse ? `Locked. Pass all ${corePhases.length} core phase tests to unlock it (${n} passed so far).` : `Locked. Pass the Phase ${pad2(p.number)} test with 80 % or more to unlock it.`}</p>
      <div class="hero-actions" style="margin-top:16px"><a class="btn btn-primary" href="${isCourse ? '#/progress' : `#/phase/${key}`}">${isCourse ? 'See your progress' : 'Go to the phase'}</a></div></header></div>`;
    return title;
  }
  const date = isCourse ? corePhases.map((x) => s.tests[x.id].date).sort().pop() : s.tests[key].date;
  root.innerHTML = `<div class="page" style="max-width:980px"><header class="page-head"><h1>${title}</h1><p>Type your name as you want it printed. The certificate is drawn in your browser; nothing is uploaded. Free certificate of completion, not accredited, and not affiliated with or endorsed by ETH Zurich.</p></header>
    <div class="panel"><label class="field">Name on the certificate<input type="text" name="name" autocomplete="name" maxlength="80" value="${esc(s.name)}" placeholder="e.g. Ada Lovelace…" data-testid="cert-name" /></label>
      <div class="hero-actions"><button class="btn btn-primary" type="button" data-png data-testid="cert-png">Download PNG</button><button class="btn btn-quiet" type="button" data-pdf data-testid="cert-pdf">Download PDF</button></div>
      <p class="quiz-score" aria-live="polite">Verification code: <b class="tnum" data-testid="cert-code" translate="no">…</b> · Anyone can check it at <a href="#/verify">the verify page</a> with your name and date.</p>
      <div class="cert-preview"><canvas data-testid="cert-canvas" role="img" aria-label="Certificate preview"></canvas></div></div></div>`;
  const cv = root.querySelector('canvas'), inp = root.querySelector('[data-testid=cert-name]'), codeEl = root.querySelector('[data-testid=cert-code]');
  let seq = 0; // only the latest draw may mark the preview ready
  const draw = async () => {
    const my = ++seq; const name = normName(inp.value); const code = await certCode(name, key, date);
    if (my !== seq) return;
    codeEl.textContent = code;
    await drawCert(cv, { name, key, date, dateLabel: fmtDate(date), code, verifyUrl: verifyUrl() });
    if (my !== seq) return;
    cv.dataset.ready = '1'; store.setName(name); store.saveCert(key, { name, date, code });
  };
  let t; inp.addEventListener('input', () => { seq++; cv.dataset.ready = '0'; codeEl.textContent = '…'; clearTimeout(t); t = setTimeout(draw, 200); });
  const fname = (ext) => `mechatronics-from-scratch-${key}-certificate.${ext}`;
  root.querySelector('[data-png]').addEventListener('click', async () => { await draw(); cv.toBlob((b) => download(fname('png'), b), 'image/png'); });
  root.querySelector('[data-pdf]').addEventListener('click', async () => { await draw(); download(fname('pdf'), pdfFromCanvas(cv)); });
  await draw();
  return title;
}

export function renderVerify(root) {
  const today = store.today();
  root.innerHTML = `<div class="page" style="max-width:720px"><header class="page-head"><h1>Verify a certificate</h1><p>Each certificate carries a code derived with SHA-256 from the name, the credential and the date. Enter them exactly as printed to check that they match. This proves the certificate wasn’t edited after it was made; it isn’t an accreditation.</p></header>
    <form class="panel" data-testid="verify-form" novalidate>
      <label class="field">Name as printed<input name="name" autocomplete="off" required data-testid="v-name" /></label>
      <label class="field">Credential<select name="key" data-testid="v-key" style="min-height:48px;border-radius:10px;background:var(--ink);color:var(--bone);border:1px solid var(--rule-2);padding:0 12px;font-size:16px">${phases.map((p) => `<option value="${p.id}">Phase ${pad2(p.number)}: ${esc(p.title)}</option>`).join('')}<option value="course">Full course</option></select></label>
      <label class="field">Date on the certificate<input name="date" type="date" value="${today}" required data-testid="v-date" /></label>
      <label class="field">Verification code<input name="code" autocomplete="off" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX" data-testid="v-code" style="font-family:var(--mono)" /></label>
      <button class="btn btn-primary" type="submit" data-testid="v-submit">Check certificate</button>
      <div class="verify-out" hidden aria-live="polite" data-testid="v-out"></div></form></div>`;
  const f = root.querySelector('form'), out = root.querySelector('[data-testid=v-out]');
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); const d = new FormData(f);
    const want = await certCode(d.get('name'), d.get('key'), d.get('date'));
    const ok = cleanCode(want) === cleanCode(d.get('code'));
    out.hidden = false; out.className = 'verify-out ' + (ok ? 'ok' : 'no'); out.dataset.ok = String(ok);
    out.textContent = ok ? 'Match. This code belongs to this name, credential and date.' : 'No match. Check the spelling of the name, the date and the credential.';
  });
  return 'Verify a certificate';
}
export { course };
