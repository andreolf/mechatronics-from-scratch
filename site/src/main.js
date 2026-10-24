import './style.css';
import data from '../../curriculum/curriculum.json';
import { hero } from './hero.js';
import { phaseMap } from './phasemap.js';
import { pendulumLab } from './labs/pendulumLab.js';
import { armLab } from './labs/armLab.js';
import { quadLab } from './labs/quadLab.js';
import { motorLab } from './labs/motorLab.js';

const $ = (id) => document.getElementById(id);
const t = data.totals;
$('stats').innerHTML = `<span><b>${t.phases}</b>phases</span><span><b>${t.lessons}</b>lessons</span><span><b>4</b>live 3D labs</span><span><b>0</b>signups</span>`;
$('loop').querySelector('h2').textContent = `One loop, ${t.lessons} times`;
$('build-info').textContent = `curriculum v${data.version} · ${t.phases} phases · ${t.lessons} lessons`;

$('copy-cmd').addEventListener('click', async () => {
  const b = $('copy-cmd');
  try { await navigator.clipboard.writeText($('tutor-cmd').textContent); b.textContent = 'copied'; }
  catch { b.textContent = 'select & copy'; }
  setTimeout(() => (b.textContent = 'copy'), 1500);
});

phaseMap(data, { grid: $('phase-grid'), search: $('search'), status: $('search-status'), bar: $('progress-bar'), label: $('progress-label'), reset: $('reset-progress') });

hero($('hero-canvas'), $('hero-readout'));
const root = $('lab-root');
window.__mfs = Object.assign(window.__mfs || {}, { labs: {} });
window.__mfs.labs.pendulum = pendulumLab(root);
window.__mfs.labs.arm = armLab(root);
window.__mfs.labs.quad = quadLab(root);
window.__mfs.labs.motor = motorLab(root);
