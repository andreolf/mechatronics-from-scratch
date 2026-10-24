import '@fontsource-variable/schibsted-grotesk';
import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import '@fontsource-variable/jetbrains-mono';
import 'katex/dist/katex.min.css';
import './style.css';
import { course, allLessons, full } from './course.js';
import { store } from './store.js';
import { fmtNum } from './util-dom.js';
import { phaseMap } from './phasemap.js';

const $ = (id) => document.getElementById(id);
const t = course.totals;
const nFull = Object.keys(full).length;
window.__mfs = Object.assign(window.__mfs || {}, { labs: {}, store });

// ---------- static home content ----------
$('stats').innerHTML = `<div><dt>Phases</dt><dd>${t.phases}</dd></div><div><dt>Lessons</dt><dd>${t.lessons}</dd></div><div><dt>Fully written</dt><dd data-testid="full-count">${nFull}</dd></div><div><dt>Live 3D labs</dt><dd>4</dd></div>`;
$('build-info').textContent = `v${course.version} · ${t.phases} phases · ${t.lessons} lessons · ${nFull} fully written`;
$('copy-cmd').addEventListener('click', async () => {
  const b = $('copy-cmd');
  try { await navigator.clipboard.writeText($('tutor-cmd').textContent); b.textContent = 'Copied'; } catch { b.textContent = 'Select to copy'; }
  setTimeout(() => (b.textContent = 'Copy'), 1600);
});
const xpPill = $('xp-pill');
const updXP = () => { xpPill.textContent = `${fmtNum(store.get().xp)} XP`; xpPill.setAttribute('aria-label', `${store.get().xp} XP, ${store.streak()} day streak`); };
store.on(updXP); updXP();

const map = phaseMap({ grid: $('phase-grid'), search: $('search'), status: $('search-status'), bar: $('progress-bar'), label: $('progress-label'), reset: $('reset-progress') });

// ---------- 3D: hero now, labs when first near the viewport ----------
let heroStarted = false, labsStarted = false;
async function startHero() {
  if (heroStarted) return; heroStarted = true;
  const { hero } = await import('./hero.js');
  hero($('hero-canvas'), $('hero-readout'), $('hero-pause'));
}
async function startLabs() {
  if (labsStarted) return; labsStarted = true;
  const [{ pendulumLab }, { armLab }, { quadLab }, { motorLab }] = await Promise.all([import('./labs/pendulumLab.js'), import('./labs/armLab.js'), import('./labs/quadLab.js'), import('./labs/motorLab.js')]);
  const root = $('lab-root');
  window.__mfs.labs.pendulum = pendulumLab(root);
  window.__mfs.labs.arm = armLab(root);
  window.__mfs.labs.quad = quadLab(root);
  window.__mfs.labs.motor = motorLab(root);
  document.documentElement.dataset.labs = 'ready';
}
const labIO = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { labIO.disconnect(); startLabs(); } }, { rootMargin: '600px 0px' });

// ---------- router ----------
const home = $('view-home'), page = $('view-page'), app = $('app');
let pageMods = null;
const loadPages = () => (pageMods ||= Promise.all([import('./views/lesson.js'), import('./views/pages.js')]));
const HOME_ANCHORS = { '#/course': 'course', '#/labs': 'labs', '#/tutor': 'tutor', '#/loop': 'loop' };

function setNav(key) { document.querySelectorAll('.site-nav a').forEach((a) => (a.dataset.nav === key ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'))); }
function showHome(anchor) {
  page.hidden = true; page.innerHTML = ''; home.hidden = false;
  document.title = 'Mechatronics from Scratch: learn robotics by building it';
  setNav(anchor === 'course' ? 'course' : anchor === 'labs' ? 'labs' : '');
  startHero(); labIO.observe($('labs'));
  map.refresh();
  if (anchor) { if (anchor.startsWith('lab-')) startLabs(); requestAnimationFrame(() => { const el = document.getElementById(anchor); if (el) el.scrollIntoView({ block: 'start' }); }); }
  else window.scrollTo({ top: 0, behavior: 'instant' });
}
let routeSeq = 0;
async function route() {
  const seq = ++routeSeq;
  let hash = location.hash || '#/';
  // legacy and in-page anchors
  const legacy = hash.match(/^#lesson-(p\d\d-l\d\d)$/);
  if (legacy) { history.replaceState(null, '', `#/learn/${legacy[1]}`); hash = location.hash; }
  if (!hash.startsWith('#/')) { showHome(hash.slice(1)); return; }
  const path = hash.slice(2).split('?')[0].replace(/\/$/, '');
  if (path === '' || HOME_ANCHORS['#/' + path]) { showHome(HOME_ANCHORS['#/' + path]); return; }
  const [seg, arg] = path.split('/');
  const [{ renderLesson }, P] = await loadPages();
  if (seq !== routeSeq) return;
  home.hidden = true; page.hidden = false;
  window.scrollTo({ top: 0, behavior: 'instant' });
  let title;
  if (seg === 'learn') { setNav('course'); title = await renderLesson(page, arg); }
  else if (seg === 'phase') { setNav('course'); title = P.renderPhase(page, arg); }
  else if (seg === 'test') { setNav('course'); title = await P.renderTest(page, arg); }
  else if (seg === 'progress') { setNav('progress'); title = P.renderDashboard(page); }
  else if (seg === 'certificate') { setNav('progress'); title = await P.renderCert(page, arg || 'course'); }
  else if (seg === 'verify') { setNav('progress'); title = P.renderVerify(page); }
  else { page.innerHTML = '<div class="page"><div class="page-head"><h1>Page not found</h1><p><a href="#/">Go to the home page</a></p></div></div>'; title = 'Page not found'; }
  if (seq !== routeSeq) return;
  document.title = `${title} · Mechatronics from Scratch`;
  const h1 = page.querySelector('h1'); if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); } else app.focus({ preventScroll: true });
  document.documentElement.dataset.route = seg;
}
window.addEventListener('hashchange', route);
route();
window.__mfs.lessonsTotal = allLessons.length;
