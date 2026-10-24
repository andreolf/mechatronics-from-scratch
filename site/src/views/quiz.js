// Quiz question renderer used by lessons (instant feedback) and phase tests (graded at the end).
import { esc } from '../util-dom.js';

export function parseNumber(s) {
  const t = String(s).trim().replace(/\s+/g, '').replace(/,/g, '.').replace(/[×x]10\^?/i, 'e').replace(/−/g, '-');
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t)) return NaN;
  return parseFloat(t);
}
export function grade(q, value) {
  if (q.type === 'mc') return value === q.answer;
  const x = parseNumber(value); if (!Number.isFinite(x)) return null;
  const bound = q.answer === 0 ? q.tol : Math.abs(q.answer) * q.tol;
  return Math.abs(x - q.answer) <= bound + 1e-15;
}
export function questionEl(q, n, { instant = true, onAnswer } = {}) {
  const el = document.createElement('div');
  el.className = 'q'; el.dataset.qid = q.id; el.dataset.testid = 'question'; el.setAttribute('data-testid', 'question');
  const name = `${q.id}-in`;
  let body = '';
  if (q.type === 'mc') {
    body = `<fieldset class="q-opts" style="border:0;margin:0;padding:0"><legend class="sr">Choose one answer</legend>${q.options.map((o, i) => `<label class="q-opt"><input type="radio" name="${name}" value="${i}" /><span>${o}</span></label>`).join('')}</fieldset>`;
  } else {
    body = `<div class="q-numrow"><label class="sr" for="${name}">Your answer</label><input id="${name}" name="${name}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="e.g. 0.25 or 2.2e-16…" data-testid="num-input" />${q.unit ? `<span class="q-unit">${esc(q.unit)}</span>` : ''}</div>`;
  }
  el.innerHTML = `<div class="q-stem"><span class="q-num">Question ${n}</span>${q.q}</div>${body}
    ${instant ? '<div class="q-actions"><button class="btn btn-small" type="button" data-check>Check answer</button></div>' : ''}
    <div class="q-feedback" hidden aria-live="polite"></div>`;
  const fb = el.querySelector('.q-feedback');
  const value = () => {
    if (q.type === 'mc') { const r = el.querySelector('input:checked'); return r ? +r.value : null; }
    return el.querySelector('input').value;
  };
  const show = (ok) => {
    fb.hidden = false;
    if (ok === null) { fb.className = 'q-feedback no'; fb.innerHTML = '<strong>Enter a number</strong><p>Use digits, a decimal point and optional scientific notation, for example 2.2e-16.</p>'; return; }
    fb.className = 'q-feedback ' + (ok ? 'ok' : 'no');
    const ans = q.type === 'num' ? `<p>Expected ${esc(String(q.answer))}${q.unit ? ' ' + esc(q.unit) : ''} (within ${q.answer === 0 ? '±' + q.tol : (q.tol * 100).toPrecision(2) + ' %'}).</p>` : '';
    fb.innerHTML = `<strong>${ok ? 'Correct' : 'Not quite'}</strong>${ans}${q.explain}`;
    if (q.type === 'mc') el.querySelectorAll('.q-opt').forEach((lab, i) => { lab.classList.toggle('correct', i === q.answer); lab.classList.toggle('wrong', !ok && i === value()); });
    el.dataset.result = ok ? 'correct' : 'wrong';
  };
  el.check = () => { const v = value(); if (v === null || v === '') { show(null); return null; } const ok = grade(q, v); show(ok); if (ok !== null && onAnswer) onAnswer(q, ok); return ok; };
  el.answered = () => { const v = value(); return v !== null && v !== ''; };
  el.correct = () => { const v = value(); return v === null || v === '' ? false : !!grade(q, v); };
  el.reveal = () => show(el.correct());
  if (instant) {
    el.querySelector('[data-check]').addEventListener('click', () => el.check());
    const inp = el.querySelector('input[type=text]');
    if (inp) inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); el.check(); } });
  }
  return el;
}
