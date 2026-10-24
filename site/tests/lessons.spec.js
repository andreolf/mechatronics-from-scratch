// Lessons, quizzes, progress, phase tests, certificates and verification. Runs on every project.
import { test, expect } from '@playwright/test';
import { watchConsole, overflow, quizBank, lessonData, answer } from './helpers.js';

let errors;
test.beforeEach(async ({ page }) => { errors = watchConsole(page); });
test.afterEach(async ({ page }) => {
  expect(await overflow(page), 'horizontal overflow').toBeLessThanOrEqual(0);
  expect(errors, 'console errors').toEqual([]);
});

test('a full lesson renders math, code, exercises and widgets', async ({ page }) => {
  await page.goto('./#/learn/p01-l14');
  await expect(page.getByTestId('lesson-title')).toHaveText(/^Rotation matrices/);
  const body = page.getByTestId('lesson-body');
  expect(await body.locator('.katex').count()).toBeGreaterThan(10);
  await expect(body.locator('.katex-display').first()).toBeVisible();
  await expect(body.locator('pre code').first()).toContainText('def ');
  const ex = body.locator('.exercise details').first();
  await expect(ex.locator('.ex-s')).toBeHidden();
  await ex.locator('summary').click();
  await expect(ex.locator('.ex-s')).toBeVisible();
  await expect(body.locator('.widget canvas').first()).toBeVisible();
  // display maths scrolls inside its own box instead of widening the page
  const wide = await body.locator('.katex-display').evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().right > innerWidth + 1).length);
  expect(wide).toBe(0);
});

test('code can be copied and downloaded', async ({ page }) => {
  await page.goto('./#/learn/p02-l09');
  const dl = page.waitForEvent('download');
  await page.locator('[data-download]').first().click();
  const d = await dl;
  expect(d.suggestedFilename()).toMatch(/\.py$/);
});

test('quiz grades multiple choice and numeric answers with tolerance', async ({ page }) => {
  const id = 'p01-l02';
  await page.goto('./#/learn/' + id);
  const qs = lessonData(id).quiz;
  const mc = qs.findIndex((q) => q.type === 'mc'), num = qs.findIndex((q) => q.type === 'num');
  const els = page.getByTestId('quiz').getByTestId('question');
  await expect(els).toHaveCount(qs.length);
  // wrong first, then right
  await answer(qs[mc], els.nth(mc), false); await els.nth(mc).locator('[data-check]').click();
  await expect(els.nth(mc)).toHaveAttribute('data-result', 'wrong');
  await answer(qs[mc], els.nth(mc), true); await els.nth(mc).locator('[data-check]').click();
  await expect(els.nth(mc)).toHaveAttribute('data-result', 'correct');
  const n = els.nth(num);
  await n.getByTestId('num-input').fill('abc'); await n.locator('[data-check]').click();
  await expect(n.locator('.q-feedback')).toContainText('Enter a number');
  await answer(qs[num], n, false); await n.locator('[data-check]').click();
  await expect(n).toHaveAttribute('data-result', 'wrong');
  await answer(qs[num], n, true); await n.locator('[data-check]').click();
  await expect(n).toHaveAttribute('data-result', 'correct');
  await expect(n.locator('.q-feedback')).toContainText('Expected');
});

test('lesson progress and XP persist across reloads; prev/next navigation works', async ({ page }) => {
  await page.goto('./#/learn/p01-l03');
  await page.getByTestId('mark-complete').click();
  await expect(page.getByTestId('mark-complete')).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.getByTestId('mark-complete')).toHaveAttribute('aria-pressed', 'true');
  await page.goto('./#/progress');
  await expect(page.getByTestId('dash-lessons')).toContainText('1');
  await expect(page.getByTestId('xp')).toContainText('50');
  await expect(page.getByTestId('streak')).toContainText('1');
  await page.goto('./#/learn/p01-l03');
  await page.getByTestId('bar-next').click();
  await expect(page).toHaveURL(/p01-l04$/);
  await expect(page.getByTestId('lesson-title')).toHaveText(/Matrices/);
  await page.getByTestId('bar-prev').click();
  await expect(page).toHaveURL(/p01-l03$/);
});

test('unwritten lessons show an honest outline', async ({ page }) => {
  await page.goto('./#/learn/p05-l01');
  await expect(page.getByTestId('coming-soon')).toContainText('Full lesson coming soon');
  await page.goto('./#/test/p05');
  await expect(page.locator('h1:visible').first()).toBeVisible();
  await expect(page.getByTestId('phase-test')).toHaveCount(0);
});

test('phase test: failing, then passing, unlocks a verifiable certificate', async ({ page }) => {
  const bank = new Map(quizBank('p01').map((q) => [q.id, q]));
  await page.goto('./#/certificate/p01');
  await expect(page.getByTestId('cert-locked')).toBeVisible();

  // attempt 1: everything wrong
  await page.goto('./#/test/p01');
  let qs = page.getByTestId('phase-test').getByTestId('question');
  await expect(qs).toHaveCount(15);
  for (let i = 0; i < 15; i++) { const el = qs.nth(i); await answer(bank.get(await el.getAttribute('data-qid')), el, false); }
  await page.getByTestId('submit-test').click();
  await expect(page.getByTestId('test-result')).toHaveAttribute('data-pass', 'false');

  // attempt 2: new questions, all right
  await page.getByTestId('retake').click();
  qs = page.getByTestId('phase-test').getByTestId('question');
  await expect(page.locator('h1:visible').first()).toHaveText('Phase test');
  await expect(qs).toHaveCount(15);
  for (let i = 0; i < 15; i++) { const el = qs.nth(i); await answer(bank.get(await el.getAttribute('data-qid')), el, true); }
  await page.getByTestId('submit-test').click();
  await expect(page.getByTestId('test-result')).toHaveAttribute('data-pass', 'true');
  await expect(page.getByTestId('test-result')).toContainText('15 of 15');

  await page.getByTestId('to-cert').click();
  await expect(page.getByTestId('cert-canvas')).toHaveAttribute('data-ready', '1');
  await page.getByTestId('cert-name').fill('Ada Lovelace');
  await expect.poll(() => page.evaluate(() => window.__mfs.store.get().certs.p01?.name)).toBe('Ada Lovelace');
  await expect(page.getByTestId('cert-canvas')).toHaveAttribute('data-ready', '1');
  const code = (await page.getByTestId('cert-code').textContent()).trim();
  expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$/);
  await expect(page.locator('.page')).toContainText('not accredited');
  await expect(page.locator('.page')).toContainText('not affiliated with or endorsed by ETH Zurich');

  let dl = page.waitForEvent('download'); await page.getByTestId('cert-png').click();
  expect((await dl).suggestedFilename()).toMatch(/\.png$/);
  dl = page.waitForEvent('download'); await page.getByTestId('cert-pdf').click();
  const pdf = await dl; expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);
  const head = (await (await import('node:fs')).promises.readFile(await pdf.path())).subarray(0, 5).toString();
  expect(head).toBe('%PDF-');

  // verification: right code passes, a tampered name fails
  const today = await page.evaluate(() => window.__mfs.store.today());
  await page.goto('./#/verify');
  await page.getByTestId('v-name').fill('Ada Lovelace');
  await page.getByTestId('v-key').selectOption('p01');
  await page.getByTestId('v-date').fill(today);
  await page.getByTestId('v-code').fill(code.toLowerCase());
  await page.getByTestId('v-submit').click();
  await expect(page.getByTestId('v-out')).toHaveAttribute('data-ok', 'true');
  await page.getByTestId('v-name').fill('Ada Byron');
  await page.getByTestId('v-submit').click();
  await expect(page.getByTestId('v-out')).toHaveAttribute('data-ok', 'false');

  await page.goto('./#/progress');
  await expect(page.getByTestId('xp')).toContainText(/\d/);
  await expect(page.getByTestId('dashboard')).toBeVisible();
});

const ROUTES = ['#/', '#/course', '#/labs', '#/learn/p01-l01', '#/learn/p01-l12', '#/learn/p02-l13', '#/learn/p02-l11', '#/learn/p20-l01', '#/phase/p01', '#/phase/p02', '#/test/p02', '#/progress', '#/certificate/p01', '#/certificate/course', '#/verify', '#/nope'];
test('every key route: no horizontal overflow, no console errors, touch targets ≥44px', async ({ page, isMobile }) => {
  for (const r of ROUTES) {
    await page.goto('./' + r); await page.waitForTimeout(500);
    await expect(page.locator('h1:visible').first()).toBeVisible();
    expect(await overflow(page), r).toBeLessThanOrEqual(0);
    if (isMobile) {
      const small = await page.evaluate(() => [...document.querySelectorAll('main button, main .btn, main input[type=checkbox], .lesson-bar a, .lesson-bar button')]
        .filter((e) => { const b = e.getBoundingClientRect(); if (!b.width) return false; const t = e.closest('label') || e; const r = t.getBoundingClientRect(); return Math.max(b.height, r.height) < 43.5 || Math.max(b.width, r.width) < 43.5; })
        .map((e) => e.outerHTML.slice(0, 80)));
      expect(small, r).toEqual([]);
    }
  }
});
