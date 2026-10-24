// Local-only progress store: lessons, quiz answers, phase tests, XP, streak. Nothing leaves the browser.
const KEY = 'mfs-v2';
const XP = { lesson: 50, quiz: 10, test: 250 };
const listeners = new Set();
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { s = null; }
  if (!s || typeof s !== 'object') s = {};
  s.lessons ||= {}; s.quiz ||= {}; s.tests ||= {}; s.days ||= []; s.xp ||= 0; s.name ||= ''; s.certs ||= {};
  // migrate v1 checkbox progress
  try {
    const v1 = JSON.parse(localStorage.getItem('mfs-progress-v1') || '[]');
    if (Array.isArray(v1) && v1.length) { for (const id of v1) if (!s.lessons[id]) { s.lessons[id] = { done: true, at: today() }; s.xp += XP.lesson; } localStorage.removeItem('mfs-progress-v1'); }
  } catch { /* ignore */ }
  return s;
}
let state = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode: keep in memory */ }
  for (const f of listeners) f(state);
}
function touchDay() { const d = today(); if (!state.days.includes(d)) { state.days.push(d); state.days = state.days.slice(-400); } }

export const store = {
  get: () => state,
  on(f) { listeners.add(f); return () => listeners.delete(f); },
  isDone: (id) => !!state.lessons[id]?.done,
  doneCount: (ids) => ids.filter((id) => state.lessons[id]?.done).length,
  setDone(id, v) {
    const was = !!state.lessons[id]?.done;
    if (v && !was) { state.lessons[id] = { done: true, at: today() }; state.xp += XP.lesson; touchDay(); }
    if (!v && was) { state.lessons[id].done = false; }
    save(); return v && !was ? XP.lesson : 0;
  },
  visit(id) { state.last = id; touchDay(); save(); },
  // first answer to each question decides XP; later answers only update "correct"
  answer(qid, correct) {
    const prev = state.quiz[qid];
    let gained = 0;
    if (!prev) { state.quiz[qid] = { first: correct, correct }; if (correct) { state.xp += XP.quiz; gained = XP.quiz; } }
    else prev.correct = prev.correct || correct;
    touchDay(); save(); return gained;
  },
  quizState: (qid) => state.quiz[qid],
  testResult(pid, score, total) {
    const r = state.tests[pid] || { best: 0, attempts: 0, passed: false };
    r.attempts++; const frac = score / total; r.last = frac;
    let gained = 0;
    if (frac > r.best) r.best = frac;
    if (frac >= 0.8 && !r.passed) { r.passed = true; r.date = today(); state.xp += XP.test; gained = XP.test; }
    state.tests[pid] = r; touchDay(); save(); return gained;
  },
  setName(n) { state.name = n.slice(0, 80); save(); },
  saveCert(key, info) { state.certs[key] = info; save(); },
  streak() {
    const set = new Set(state.days); let n = 0; const d = new Date();
    if (!set.has(today())) d.setDate(d.getDate() - 1); // streak survives until the end of today
    for (;;) { const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; if (!set.has(k)) break; n++; d.setDate(d.getDate() - 1); }
    return n;
  },
  bestStreak() {
    const days = [...state.days].sort(); let best = 0, run = 0, prev = null;
    for (const k of days) { const t = Date.parse(k + 'T12:00:00'); run = prev !== null && Math.round((t - prev) / 864e5) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = t; }
    return best;
  },
  level: () => 1 + Math.floor(state.xp / 500),
  reset() { const name = state.name; state = load(); state.lessons = {}; state.quiz = {}; state.tests = {}; state.days = []; state.xp = 0; state.certs = {}; state.name = name; save(); },
  XP, today,
};
