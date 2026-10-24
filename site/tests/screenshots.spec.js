// Writes ../screenshots/v2-*.png. Run with: npx playwright test screenshots --project=desktop --project=iphone-14 --project=landscape
import { test } from '@playwright/test';
import { gotoLab, quizBank, answer } from './helpers.js';

const OUT = '../screenshots';
const shot = (page, tag, name, opts = {}) => page.screenshot({ path: `${OUT}/v2-${name}-${tag}.png`, ...opts });
const top = (page, sel, off = 0) => page.locator(sel).first().evaluate((el, off) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - off), off);

test('capture v2 screenshots', async ({ page }, info) => {
  test.setTimeout(240_000);
  const tag = info.project.name;
  await page.goto('./'); await page.waitForTimeout(2000);
  if (tag === 'desktop') { await page.mouse.move(980, 260); await page.mouse.move(960, 300, { steps: 10 }); await page.waitForTimeout(800); }
  await shot(page, tag, 'hero');
  if (tag === 'landscape') return;
  for (const id of ['pendulum', 'arm']) { const lab = await gotoLab(page, id); await page.waitForTimeout(2000); await lab.screenshot({ path: `${OUT}/v2-lab-${id}-${tag}.png` }); }
  await top(page, '#course', 0); await page.locator('[data-phase="p01"]').getByTestId('phase-btn').click(); await page.waitForTimeout(400);
  await shot(page, tag, 'course-map');
  await top(page, '#colophon', 0); await page.waitForTimeout(300);
  await shot(page, tag, 'footer');

  await page.goto('./#/learn/p01-l14'); await page.waitForTimeout(1200);
  await shot(page, tag, 'lesson');
  await top(page, '.widget', 70); await page.waitForTimeout(500);
  await shot(page, tag, 'lesson-widget');
  await top(page, '.prose pre', 70);
  await shot(page, tag, 'lesson-code');
  await page.goto('./#/learn/p02-l09'); await page.waitForTimeout(800);
  await top(page, '[data-testid=quiz]', 70);
  const qs = page.getByTestId('quiz').getByTestId('question');
  const mc = qs.filter({ has: page.locator('.q-opt') }).first();
  await mc.locator('.q-opt').nth(0).click(); await mc.locator('[data-check]').click();
  await top(page, '[data-testid=quiz]', 70); await page.waitForTimeout(300);
  await shot(page, tag, 'quiz');

  await page.goto('./#/phase/p01'); await page.waitForTimeout(500); await shot(page, tag, 'phase');
  const bank = new Map(quizBank('p01').map((q) => [q.id, q]));
  await page.goto('./#/test/p01'); await page.waitForTimeout(500);
  const tq = page.getByTestId('phase-test').getByTestId('question');
  for (let i = 0; i < 15; i++) { const el = tq.nth(i); await answer(bank.get(await el.getAttribute('data-qid')), el, i !== 3); }
  await shot(page, tag, 'test');
  await page.getByTestId('submit-test').click(); await page.waitForTimeout(600);
  await shot(page, tag, 'test-result');
  await page.goto('./#/certificate/p01');
  await page.getByTestId('cert-name').fill('Ada Lovelace'); await page.waitForTimeout(800);
  await shot(page, tag, 'certificate', { fullPage: tag !== 'desktop' });
  await page.goto('./#/progress'); await page.waitForTimeout(500); await shot(page, tag, 'dashboard');
  await page.goto('./#/verify'); await page.waitForTimeout(300); await shot(page, tag, 'verify');
});
