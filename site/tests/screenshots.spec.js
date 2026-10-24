import { test, expect } from '@playwright/test';
import { gotoLab } from './helpers.js';

const OUT = '../screenshots';
test('capture screenshots', async ({ page }, info) => {
  const tag = info.project.name;
  await page.goto('/');
  await page.waitForTimeout(1500);
  if (tag === 'desktop') { await page.mouse.move(980, 260); await page.mouse.move(960, 300, { steps: 10 }); }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/hero-${tag}.png` });
  for (const id of ['pendulum', 'arm', 'quad', 'motor']) {
    const lab = await gotoLab(page, id);
    if (id === 'pendulum') { await page.getByTestId('pend-noise').fill('2.5'); await page.getByTestId('pend-kick').click(); }
    if (id === 'motor') { await page.getByTestId('motor-cpr').selectOption('16'); }
    await page.waitForTimeout(2500);
    await lab.screenshot({ path: `${OUT}/lab-${id}-${tag}.png` });
  }
  await page.locator('#map').evaluate((el) => window.scrollTo(0, el.offsetTop - 10));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/phase-map-${tag}.png` });
  const p14 = page.locator('[data-phase="p14"]');
  await p14.getByTestId('phase-btn').click();
  await page.locator('#lesson-p14-l12 .lesson-title').click();
  await p14.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 70));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/phase-expanded-${tag}.png` });
  await p14.getByTestId('phase-btn').click();
  await page.locator('#map').evaluate((el) => window.scrollTo(0, el.offsetTop - 10));
  await page.getByTestId('search').fill('quaternion');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/search-${tag}.png` });
  expect(true).toBe(true);
});
